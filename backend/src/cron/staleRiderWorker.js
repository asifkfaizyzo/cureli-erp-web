import prisma from "../config/prisma.js";
import { sseService } from "../services/sse.service.js";
import { unregisterActiveDelivery } from "../modules/rider/presence/rider.presence.service.js";

const STALE_THRESHOLD_MINUTES = 5;
const LOG_PREFIX = "[Cron:StaleRider]";

const ACTIVE_DELIVERY_STATUSES = [
  "RIDER_NOTIFIED",
  "ACCEPTED",
  "ARRIVED_AT_PHARMACY",
  "PICKED_UP",
  "EN_ROUTE",
  "ARRIVED_AT_CUSTOMER",
];

/**
 * Finds riders who are marked online but haven't sent a location
 * update in the last 5 minutes. Sets them offline, closes their
 * open RiderOnlineSession records, and handles any active deliveries:
 *
 *   - RIDER_NOTIFIED  → reset to PENDING_ASSIGNMENT (auto-decline)
 *   - ACCEPTED+       → flag for CAdmin review (emit SSE alert)
 */
export async function staleRiderWorker() {
  try {
    const threshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

    // 1. Find stale riders
    const staleRiders = await prisma.rider.findMany({
      where: {
        is_online: true,
        OR: [
          { last_location_at: null },
          { last_location_at: { lt: threshold } },
        ],
      },
      select: { rider_id: true, last_location_at: true },
    });

    if (staleRiders.length === 0) return;

    const staleIds = staleRiders.map((r) => r.rider_id);

    // 2. Fetch active deliveries for stale riders BEFORE offlining
    const activeDeliveries = await prisma.delivery.findMany({
      where: {
        rider_id: { in: staleIds },
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
      select: {
        delivery_id: true,
        order_id: true,
        rider_id: true,
        status: true,
        order: {
          select: { order_number: true },
        },
      },
    });

    // 3. Set riders offline + close sessions + handle deliveries in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.rider.updateMany({
        where: { rider_id: { in: staleIds } },
        data: { is_online: false },
      });

      // Close all open sessions for stale riders
      const openSessions = await tx.riderOnlineSession.findMany({
        where: {
          rider_id: { in: staleIds },
          went_offline_at: null,
        },
        select: { session_id: true, went_online_at: true },
      });

      const now = new Date();
      for (const session of openSessions) {
        const durationMs = now.getTime() - new Date(session.went_online_at).getTime();
        const durationMinutes = Math.round((durationMs / 60_000) * 100) / 100;

        await tx.riderOnlineSession.update({
          where: { session_id: session.session_id },
          data: {
            went_offline_at: now,
            duration_minutes: durationMinutes,
            closed_by: "stale_cron",
          },
        });
      }

      // Handle active deliveries for stale riders
      for (const delivery of activeDeliveries) {
        if (delivery.status === "RIDER_NOTIFIED") {
          // Auto-decline: reset to PENDING_ASSIGNMENT so CAdmin can reassign
          await tx.delivery.update({
            where: { delivery_id: delivery.delivery_id },
            data: {
              rider_id: null,
              status: "PENDING_ASSIGNMENT",
            },
          });

          await tx.deliveryAssignmentLog.create({
            data: {
              delivery_id: delivery.delivery_id,
              rider_id: delivery.rider_id,
              action: "TIMEOUT",
              reason: "Rider went offline (stale GPS)",
            },
          });
        } else {
          // ACCEPTED or later: flag for CAdmin review
          // We do NOT auto-cancel mid-delivery — that's a CAdmin decision.
          // Instead, we add a failure note so the admin sees the issue.
          await tx.delivery.update({
            where: { delivery_id: delivery.delivery_id },
            data: {
              failure_note: `⚠️ Rider went offline (stale GPS) at ${now.toISOString()}. Delivery in '${delivery.status}' — manual review required.`,
            },
          });
        }
      }
    });

    // 4. Post-transaction: emit SSE events (outside transaction to avoid blocking)
    for (const delivery of activeDeliveries) {
      // Clear SSE cache for all stale riders with active deliveries
      unregisterActiveDelivery(delivery.rider_id);

      if (delivery.status === "RIDER_NOTIFIED") {
        // Notify CAdmin that assignment was auto-reset
        sseService.notifyAllCAdmins("delivery_status_changed", {
          order_id: delivery.order_id,
          delivery_id: delivery.delivery_id,
          rider_id: null,
          status: "PENDING_ASSIGNMENT",
          reason: "Rider went offline (stale GPS) — auto-declined",
          timestamp: new Date().toISOString(),
        });
      } else {
        // Alert CAdmin that an active delivery has a stale rider
        sseService.notifyAllCAdmins("delivery_rider_stale", {
          order_id: delivery.order_id,
          order_number: delivery.order?.order_number,
          delivery_id: delivery.delivery_id,
          rider_id: delivery.rider_id,
          delivery_status: delivery.status,
          message: `Rider went offline during active delivery (${delivery.status}). Manual intervention required.`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(
      `${LOG_PREFIX} Offlined ${staleIds.length} stale rider(s), handled ${activeDeliveries.length} active delivery(ies)`,
    );
  } catch (err) {
    console.error(`${LOG_PREFIX} Error:`, err.message);
  }
}