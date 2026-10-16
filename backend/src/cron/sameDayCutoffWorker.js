// backend/src/cron/sameDayCutoffWorker.js (do not remove this comment)
//
// Same Day Delivery cron workers:
//   1. sameDayCutoffAlert — fires at cutoff time, notifies CAdmin of
//      pending Same Day orders that need batch assignment.
//   2. sameDayEndOfDayCleanup — auto-cancels unassigned Same Day orders
//      that were never batch-assigned by end of day.

import prisma from "../config/prisma.js";
import { sseService } from "../services/sse.service.js";
import cronLogger from "../utils/cronLogger.js";

/**
 * Returns the current IST date as a YYYY-MM-DD string.
 */
function getISTDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Returns the current IST hour (0-23).
 */
function getCurrentISTHour() {
  return parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10,
  );
}

/**
 * Cutoff Alert — runs shortly after the Same Day cutoff hour.
 *
 * Checks for ACCEPTED Same Day orders placed today that have no
 * Delivery record yet (i.e., not batch-assigned). Notifies all
 * connected CAdmins so they can perform batch assignment.
 */
export async function sameDayCutoffAlert() {
  try {
    // Load cutoff hour from SAME_DAY config
    const config = await prisma.deliveryPricingConfig.findUnique({
      where: { fulfillment_type: "SAME_DAY" },
      select: { same_day_cutoff_hour: true },
    });

    if (!config) return; // Same Day not configured

    const istHour = getCurrentISTHour();
    if (istHour < config.same_day_cutoff_hour) return; // Not past cutoff yet

    const todayIST = getISTDateString();
    const startOfDay = new Date(`${todayIST}T00:00:00+05:30`);

    const pendingOrders = await prisma.marketplaceOrder.findMany({
      where: {
        fulfillment_type: "SAME_DAY",
        status: "ACCEPTED",
        placed_at: { gte: startOfDay },
        delivery: null, // No Delivery record = not batch-assigned
      },
      select: {
        order_id: true,
        order_number: true,
        branch: { select: { branch_name: true } },
      },
    });

    if (pendingOrders.length === 0) {
      cronLogger.info("[SameDay] Cutoff alert: 0 pending orders — nothing to do");
      return;
    }

    cronLogger.info(
      `[SameDay] Cutoff alert: ${pendingOrders.length} unassigned Same Day order(s)`,
    );

    // Notify all connected CAdmins
    sseService.notifyAllCAdmins("same_day_cutoff_alert", {
      pending_count: pendingOrders.length,
      cutoff_hour: config.same_day_cutoff_hour,
      orders: pendingOrders.map((o) => ({
        order_id: o.order_id,
        order_number: o.order_number,
        branch_name: o.branch?.branch_name || null,
      })),
      timestamp: new Date().toISOString(),
    });

    cronLogger.success(
      `[SameDay] Cutoff alert sent to CAdmins (${pendingOrders.length} orders)`,
    );
  } catch (err) {
    cronLogger.error("[SameDay] Cutoff alert failed", err);
  }
}

/**
 * End-of-Day Cleanup — runs late at night IST.
 *
 * Auto-cancels Same Day orders from today that were ACCEPTED but
 * never batch-assigned (no Delivery record). These are orders the
 * pharmacy accepted but CAdmin never assigned a rider to.
 *
 * Orders that ARE in a batch (have a Delivery record) are untouched —
 * the rider may still be delivering them.
 */
export async function sameDayEndOfDayCleanup() {
  try {
    const todayIST = getISTDateString();
    const startOfDay = new Date(`${todayIST}T00:00:00+05:30`);

    const staleOrders = await prisma.marketplaceOrder.findMany({
      where: {
        fulfillment_type: "SAME_DAY",
        status: "ACCEPTED",
        placed_at: { gte: startOfDay },
        delivery: null,
      },
      select: {
        order_id: true,
        order_number: true,
        customer_id: true,
        shop_id: true,
        customer_name_snapshot: true,
      },
    });

    if (staleOrders.length === 0) {
      cronLogger.info("[SameDay] EOD cleanup: 0 stale orders");
      return;
    }

    cronLogger.info(
      `[SameDay] EOD cleanup: ${staleOrders.length} unassigned order(s) to cancel`,
    );

    const { transitionOrderStatus } = await import(
      "../modules/marketplace-orders/marketplace.orders.service.js"
    );

    let cancelled = 0;
    let failed = 0;

    for (const order of staleOrders) {
      try {
        await transitionOrderStatus({
          order_id: order.order_id,
          target_status: "CANCELLED",
          actor_type: "system",
          actor_id: null,
          reason: "Same Day order not assigned by end of day",
        });
        cancelled++;
      } catch (err) {
        cronLogger.error(
          `[SameDay] Failed to cancel ${order.order_number}: ${err.message}`,
        );
        failed++;
      }
    }

    cronLogger.info(
      `[SameDay] EOD cleanup done: ${cancelled} cancelled, ${failed} failed`,
    );
  } catch (err) {
    cronLogger.error("[SameDay] EOD cleanup failed", err);
  }
}