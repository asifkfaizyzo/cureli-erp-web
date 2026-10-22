// backend/src/cron/stalePickupWorker.js (do not remove this comment)
import prisma from "../config/prisma.js";
import cronLogger from "../utils/cronLogger.js";
import { transitionOrderStatus } from "../modules/marketplace-orders/marketplace.orders.service.js";

const STALE_THRESHOLD_HOURS = 24;

/**
 * Sweeps and cancels PICKUP orders that have been in READY_FOR_PICKUP status for > 24 hours.
 */
export async function processStalePickupOrders() {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);

  try {
    const staleOrders = await prisma.marketplaceOrder.findMany({
      where: {
        fulfillment_type: "PICKUP",
        status: "READY_FOR_PICKUP",
        ready_at: {
          lte: cutoff,
        },
      },
      select: {
        order_id: true,
        order_number: true,
        ready_at: true,
        shop_id: true,
        customer_id: true,
      },
      take: 50,
    });

    if (staleOrders.length === 0) {
      return { processed: 0 };
    }

    cronLogger.info(`[StalePickupWorker] Found ${staleOrders.length} stale pickup order(s) to auto-cancel.`);

    let cancelledCount = 0;

    for (const order of staleOrders) {
      try {
        await transitionOrderStatus({
          order_id: order.order_id,
          to_status: "CANCELLED",
          actor_type: "SYSTEM",
          actor_id: "cron-stale-pickup",
          reason: `Pickup not completed within ${STALE_THRESHOLD_HOURS} hours (auto-cancelled by system)`,
        });
        cancelledCount++;
        cronLogger.info(`[StalePickupWorker] Auto-cancelled order #${order.order_number} (${order.order_id})`);
      } catch (err) {
        cronLogger.error(`[StalePickupWorker] Failed to cancel order #${order.order_number} (${order.order_id}):`, err);
      }
    }

    return { processed: staleOrders.length, cancelled: cancelledCount };
  } catch (err) {
    cronLogger.error("[StalePickupWorker] Error during stale pickup sweep:", err);
    return { processed: 0, error: err.message };
  }
}