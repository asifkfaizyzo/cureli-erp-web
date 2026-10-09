//backend\src\cron\staleAssignmentWorker.js
import prisma from "../config/prisma.js";
import { sseService } from "../services/sse.service.js";
import cronLogger from "../utils/cronLogger.js";

const STALE_ASSIGNMENT_THRESHOLD_MINUTES = 5;
const LOG_PREFIX = "[Cron:StaleAssignment]";

/**
 * Finds deliveries stuck in RIDER_NOTIFIED for longer than 5 minutes.
 * Emits a `delivery_assignment_stale` SSE event to all connected CAdmins
 * so they can manually reassign or contact the rider.
 *
 * Does NOT auto-decline — per business decision, the alert stays on the
 * rider's phone until they act or the staleRiderWorker offlines them.
 */
export async function staleAssignmentWorker() {
  try {
    const threshold = new Date(
      Date.now() - STALE_ASSIGNMENT_THRESHOLD_MINUTES * 60 * 1000,
    );

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
            customer_name_snapshot: true,
          },
        },
        rider: {
          select: {
            full_name: true,
            phone: true,
            is_online: true,
          },
        },
      },
    });

    if (staleAssignments.length === 0) return;

    const now = Date.now();

    for (const assignment of staleAssignments) {
      const elapsedMs = now - new Date(assignment.assigned_at).getTime();
      const elapsedMinutes = Math.round(elapsedMs / 60_000);

      sseService.notifyAllCAdmins("delivery_assignment_stale", {
        order_id: assignment.order_id,
        order_number: assignment.order?.order_number,
        delivery_id: assignment.delivery_id,
        rider_id: assignment.rider_id,
        rider_name: assignment.rider?.full_name,
        rider_phone: assignment.rider?.phone,
        rider_is_online: assignment.rider?.is_online,
        assigned_at: assignment.assigned_at,
        elapsed_minutes: elapsedMinutes,
        assignment_attempts: assignment.assignment_attempts,
        customer_name: assignment.order?.customer_name_snapshot,
        timestamp: new Date().toISOString(),
      });
    }

    cronLogger.info(
      `${LOG_PREFIX} Alerted CAdmin about ${staleAssignments.length} stale assignment(s)`,
    );
  } catch (err) {
    cronLogger.error(`${LOG_PREFIX} Error: ${err.message}`);
  }
}