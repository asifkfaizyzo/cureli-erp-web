// backend/cron/riderAssignmentTimeoutWorker.js
//
// Auto-declines delivery assignments that have been stuck in
// RIDER_NOTIFIED for longer than 90 seconds.
//
// Why 90 seconds?
//   - Riders get a full-screen push notification with alarm audio
//   - 90s is enough time to notice, unlock, and accept/decline
//   - After 90s, the order needs to move to the next available rider
//
// Why setInterval (30s) instead of node-cron?
//   - node-cron minimum granularity is 1 minute
//   - We need to catch timeouts within ~30s of the 90s mark
//   - withCronLock prevents overlapping runs across instances
//
// Difference from staleAssignmentWorker.js:
//   - staleAssignmentWorker runs every 2 min and only ALERTS CAdmin
//   - This worker runs every 30s and actually AUTO-DECLINES the delivery
//   - staleAssignmentWorker threshold is 5 min; this is 90 seconds

import prisma from "../config/prisma.js";
import { sseService } from "../services/sse.service.js";
import { dismissRiderNotification } from "../modules/rider/push/rider.push.service.js";
import { unregisterActiveDelivery } from "../modules/rider/presence/rider.presence.service.js";
import cronLogger from "../utils/cronLogger.js";

const LOG_PREFIX = "[Cron:AssignmentTimeout]";
const TIMEOUT_SECONDS = 120;

/**
 * Finds deliveries stuck in RIDER_NOTIFIED for longer than 90 seconds.
 * Auto-declines each one: resets to PENDING_ASSIGNMENT, notifies all parties.
 */
export async function riderAssignmentTimeoutWorker() {
  try {
    const threshold = new Date(Date.now() - TIMEOUT_SECONDS * 1000);

    const staleAssignments = await prisma.delivery.findMany({
      where: {
        status: "RIDER_NOTIFIED",
        assigned_at: { lt: threshold },
        rider_id: { not: null },
      },
      select: {
        delivery_id: true,
        order_id: true,
        rider_id: true,
        assigned_at: true,
        assignment_attempts: true,
        order: {
          select: {
            order_number: true,
            customer_id: true,
          },
        },
        rider: {
          select: {
            full_name: true,
            is_online: true,
          },
        },
      },
    });

    if (staleAssignments.length === 0) return;

    const now = new Date();

    for (const assignment of staleAssignments) {
      try {
        // ── 1. Reset delivery to PENDING_ASSIGNMENT ──────────────────────
        await prisma.$transaction(async (tx) => {
          await tx.delivery.update({
            where: { delivery_id: assignment.delivery_id },
            data: {
              rider_id: null,
              status: "PENDING_ASSIGNMENT",
              assigned_at: null,
              accepted_at: null,
            },
          });

          await tx.deliveryAssignmentLog.create({
            data: {
              delivery_id: assignment.delivery_id,
              rider_id: assignment.rider_id,
              action: "REJECTED",
              reason: `Auto-declined: no response within ${TIMEOUT_SECONDS}s`,
            },
          });
        });

        // ── 2. Unregister rider presence lock ────────────────────────────
        unregisterActiveDelivery(assignment.rider_id);

        // ── 3. SSE: Notify old rider (foreground) ────────────────────────
        sseService.notifyRider(assignment.rider_id, "delivery_cancelled", {
          delivery_id: assignment.delivery_id,
          order_id: assignment.order_id,
          order_number: assignment.order?.order_number,
          reason: `Auto-declined: no response within ${TIMEOUT_SECONDS} seconds`,
        });

        // ── 4. Push: Dismiss sticky notification on old rider's device ───
        dismissRiderNotification(
          assignment.rider_id,
          assignment.delivery_id,
        ).catch((err) => {
          cronLogger.error(
            `${LOG_PREFIX} Push dismiss failed for rider ${assignment.rider_id}: ${err.message}`,
          );
        });

        // ── 5. SSE: Notify CAdmins ───────────────────────────────────────
        sseService.notifyAllCAdmins("delivery_status_changed", {
          order_id: assignment.order_id,
          delivery_id: assignment.delivery_id,
          rider_id: null,
          previous_rider_id: assignment.rider_id,
          status: "PENDING_ASSIGNMENT",
          reason: "auto_declined_timeout",
          timestamp: now.toISOString(),
        });

        // ── 6. SSE: Notify customer (if applicable) ──────────────────────
        if (assignment.order?.customer_id && sseService.notifyMobile) {
          sseService.notifyMobile(
            assignment.order.customer_id,
            "delivery_update",
            {
              order_id: assignment.order_id,
              order_number: assignment.order.order_number,
              delivery_status: "PENDING_ASSIGNMENT",
            },
          );
        }

        const elapsedSec = Math.round(
          (now.getTime() - new Date(assignment.assigned_at).getTime()) / 1000,
        );

        cronLogger.info(
          `${LOG_PREFIX} Auto-declined delivery ${assignment.delivery_id} ` +
            `(order #${assignment.order?.order_number}) from rider ` +
            `${assignment.rider?.full_name} after ${elapsedSec}s`,
        );
      } catch (err) {
        cronLogger.error(
          `${LOG_PREFIX} Failed to auto-decline delivery ${assignment.delivery_id}: ${err.message}`,
        );
      }
    }

    if (staleAssignments.length > 0) {
      cronLogger.info(
        `${LOG_PREFIX} Processed ${staleAssignments.length} timed-out assignment(s)`,
      );
    }
  } catch (err) {
    cronLogger.error(`${LOG_PREFIX} Error: ${err.message}`);
  }
}
