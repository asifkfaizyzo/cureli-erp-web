// backend/src/modules/marketplace-orders/marketplace.orders.events.js (do not remove this comment)

import prisma from "../../config/prisma.js";
import { sseService } from "../../services/sse.service.js";
import {
  notifyAsync,
  NOTIFICATION_EVENTS,
} from "../notifications/notification.service.js";
import { MobilePush } from "../mobile/push/mobile.push.service.js";
import { earnLoyaltyPoints } from "../loyalty/loyalty.service.js";

async function getActiveShopUserIds(shop_id) {
  const users = await prisma.user.findMany({
    where: { shop_id, is_active: true },
    select: { user_id: true },
  });
  return users.map((u) => u.user_id);
}

export async function fireOrderPlacedEvents(order) {
  const {
    order_id,
    order_number,
    shop_id,
    branch_id,
    customer_id,
    customer_name_snapshot,
    customer_phone_snapshot,
    total_amount,
    requires_prescription,
    placed_at,
    items,
    status,
    payment_method,
    payment_status,
  } = order;

  const item_count = items?.length ?? 0;

  notifyAsync({
    type: NOTIFICATION_EVENTS.MARKETPLACE_ORDER_PLACED,
    context: {
      shop_id,
      branch_id,
      order_id,
      order_number,
      customer_name: customer_name_snapshot,
      item_count,
      total_amount: Number(total_amount).toFixed(2),
    },
  });

  // ── Enriched SSE payload with full order data for CAdmin table patching ──
  let shopName = null;
  let branchName = null;
  try {
    const [shop, branch] = await Promise.all([
      prisma.shop.findUnique({
        where: { shop_id },
        select: { business_name: true },
      }),
      prisma.branch.findUnique({
        where: { branch_id },
        select: { branch_name: true },
      }),
    ]);
    shopName = shop?.business_name || null;
    branchName = branch?.branch_name || null;
  } catch {
    // Non-critical — proceed without names
  }

  const ssePayload = {
    order_id,
    order_number,
    customer_name: customer_name_snapshot,
    customer_phone: customer_phone_snapshot || null,
    total_amount: Number(total_amount).toFixed(2),
    item_count,
    requires_prescription,
    placed_at,
    status: status || "PLACED",
    payment_method: payment_method || "COD",
    payment_status: payment_status || "PENDING",
    shop_name: shopName,
    branch_name: branchName,
    has_rider: false,
    delivery_status: null,
  };

  // 1. Notify Shop ERP active operators
  try {
    const userIds = await getActiveShopUserIds(shop_id);
    for (const userId of userIds) {
      sseService.notifyUser(userId, "marketplace_new_order", ssePayload);
    }
    console.log(
      `[OrderEvents] Fired marketplace_new_order SSE to ${userIds.length} users for shop ${shop_id}`,
    );
  } catch (err) {
    console.error(
      "[OrderEvents] SSE dispatch failed (new order):",
      err.message,
    );
  }

  // 2. Broadcast to all active connected CAdmins globally
  try {
    sseService.notifyAllCAdmins("marketplace_new_order", ssePayload);
    console.log(
      `[OrderEvents] Broadcasted marketplace_new_order SSE to all connected CAdmins.`,
    );
  } catch (err) {
    console.error(
      "[OrderEvents] CAdmin SSE broadcast failed (new order):",
      err.message,
    );
  }

  MobilePush.orderPlacedConfirmation(customer_id, order_id, order_number).catch(
    (err) =>
      console.error("[OrderEvents] Push (order placed) failed:", err.message),
  );
}

export async function fireOrderStatusChangedEvents({
  order_id,
  order_number,
  shop_id,
  customer_id,
  new_status,
  customer_name,
}) {
  // ── Enrich payload with full order data for CAdmin optimistic patching ──
  let enrichedData = {};
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { order_id },
      select: {
        total_amount: true,
        payment_status: true,
        payment_method: true,
        customer_phone_snapshot: true,
        requires_prescription: true,
        _count: { select: { items: true } },
        shop: { select: { business_name: true } },
        branch: { select: { branch_name: true } },
        delivery: { select: { rider_id: true, status: true } },
      },
    });
    if (order) {
      enrichedData = {
        total_amount: Number(order.total_amount),
        item_count: order._count?.items ?? 0,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        customer_phone: order.customer_phone_snapshot,
        requires_prescription: order.requires_prescription,
        shop_name: order.shop?.business_name || null,
        branch_name: order.branch?.branch_name || null,
        has_rider: !!order.delivery?.rider_id,
        delivery_status: order.delivery?.status || null,
      };
    }
  } catch {
    // Non-critical — proceed with basic payload
  }

  const payload = {
    order_id,
    order_number,
    new_status,
    customer_name,
    ...enrichedData,
  };

  // 1. Notify Shop ERP active operators
  try {
    const userIds = await getActiveShopUserIds(shop_id);
    for (const userId of userIds) {
      sseService.notifyUser(
        userId,
        "marketplace_order_status_changed",
        payload,
      );
    }
    console.log(
      `[OrderEvents] Fired marketplace_order_status_changed (${new_status}) SSE to ${userIds.length} ERP users`,
    );
  } catch (err) {
    console.error(
      "[OrderEvents] ERP SSE dispatch failed (status change):",
      err.message,
    );
  }

  // 2. Broadcast status change to all active connected CAdmins globally
  try {
    sseService.notifyAllCAdmins("marketplace_order_status_changed", payload);
    console.log(
      `[OrderEvents] Broadcasted marketplace_order_status_changed to all connected CAdmins.`,
    );
  } catch (err) {
    console.error(
      "[OrderEvents] CAdmin SSE broadcast failed (status change):",
      err.message,
    );
  }

  // 3. Notify Mobile App client
  try {
    if (customer_id) {
      sseService.notifyMobile(customer_id, "order_status_changed", {
        order_id,
        order_number,
        new_status,
      });
      console.log(
        `[OrderEvents] Fired order_status_changed (${new_status}) SSE to mobile customer ${customer_id}`,
      );
    }
  } catch (err) {
    console.error(
      "[OrderEvents] Mobile SSE dispatch failed (status change):",
      err.message,
    );
  }

  const pushStatuses = [
    "ACCEPTED",
    "REJECTED",
    "READY_FOR_PICKUP",
    "COMPLETED",
    "CANCELLED",
  ];

  if (customer_id && pushStatuses.includes(new_status)) {
    MobilePush.orderStatusChanged(
      customer_id,
      order_id,
      order_number,
      new_status,
    ).catch((err) =>
      console.error(`[OrderEvents] Push (${new_status}) failed:`, err.message),
    );
  }

  if (new_status === "COMPLETED") {
    earnLoyaltyPoints(order_id).catch((err) =>
      console.error(
        `[OrderEvents] Loyalty point award failed for order ${order_id}:`,
        err.message,
      ),
    );
  }
}
