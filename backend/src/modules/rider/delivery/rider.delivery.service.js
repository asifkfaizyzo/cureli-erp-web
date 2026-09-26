// backend/src/modules/rider/delivery/rider.delivery.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";
import { sseService } from "../../../services/sse.service.js";
import { fireOrderStatusChangedEvents } from "../../marketplace-orders/marketplace.orders.events.js";
import {
  registerActiveDelivery,
  unregisterActiveDelivery,
} from "../presence/rider.presence.service.js";

/**
 * Fetch the active ongoing delivery task for a rider.
 */
export async function getActiveDelivery(rider_id) {
  const delivery = await prisma.delivery.findFirst({
    where: {
      rider_id,
      status: {
        notIn: ["DELIVERED", "FAILED", "CANCELLED"],
      },
    },
    include: {
      order: {
        include: {
          shop: { select: { business_name: true } },
          branch: {
            select: {
              branch_name: true,
              address_line_1: true,
              city: true,
              contact_number: true,
              marketplaceSettings: {
                select: {
                  latitude: true,
                  longitude: true,
                  formatted_address: true,
                  contact_override: true,
                },
              },
            },
          },
          items: {
            select: {
              item_id: true,
              medicine_name_snapshot: true,
              pack_size_snapshot: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (!delivery) return null;

  return formatDeliveryForRider(delivery);
}

/**
 * Rider accepts the incoming assigned order.
 */
export async function acceptDelivery(delivery_id, rider_id) {
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
    include: { order: true },
  });

  if (!delivery) throw new Error("Delivery assignment not found");
  if (delivery.rider_id !== rider_id)
    throw new Error("Unauthorized assignment");
  if (delivery.status !== "RIDER_NOTIFIED") {
    throw new Error(`Cannot accept delivery in '${delivery.status}' state`);
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.delivery.update({
      where: { delivery_id },
      data: {
        status: "ACCEPTED",
        accepted_at: now,
      },
      include: {
        order: {
          include: {
            shop: { select: { business_name: true } },
            branch: {
              select: {
                branch_name: true,
                address_line_1: true,
                city: true,
                contact_number: true,
                marketplaceSettings: {
                  select: {
                    latitude: true,
                    longitude: true,
                    formatted_address: true,
                    contact_override: true,
                  },
                },
              },
            },
            items: {
              select: {
                item_id: true,
                medicine_name_snapshot: true,
                pack_size_snapshot: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    await tx.deliveryAssignmentLog.create({
      data: {
        delivery_id,
        rider_id,
        action: "ACCEPTED",
        reason: "Accepted by rider",
      },
    });

    return res;
  });

  // ── Register SSE cache so rider GPS ticks broadcast to this customer ──
  registerActiveDelivery(rider_id, updated.order.customer_id, updated.order_id);

  // ── Notify Customer: rider accepted, delivery is live ─────────────────
  sseService.notifyMobile(updated.order.customer_id, "delivery_update", {
    order_id: updated.order_id,
    order_number: updated.order.order_number,
    delivery_status: "ACCEPTED",
  });

  // ── Notify CAdmin ─────────────────────────────────────────────────────
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: updated.order_id,
    delivery_id: updated.delivery_id,
    rider_id,
    status: "ACCEPTED",
    timestamp: now.toISOString(),
  });

  return formatDeliveryForRider(updated);
}

/**
 * Rider declines incoming order assignment.
 */
export async function declineDelivery(delivery_id, rider_id, { reason, note }) {
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
    include: { order: true },
  });

  if (!delivery) throw new Error("Delivery assignment not found");
  if (delivery.rider_id !== rider_id)
    throw new Error("Unauthorized assignment");
  if (delivery.status !== "RIDER_NOTIFIED") {
    throw new Error("Can only decline pending assignments");
  }

  await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { delivery_id },
      data: {
        rider_id: null,
        status: "PENDING_ASSIGNMENT",
      },
    });

    await tx.deliveryAssignmentLog.create({
      data: {
        delivery_id,
        rider_id,
        action: "REJECTED",
        reason: note ? `${reason}: ${note}` : reason,
      },
    });
  });

  // ── Safety cleanup: ensure SSE cache is cleared for this rider ────────
  unregisterActiveDelivery(rider_id);

  // ── Notify Customer: delivery declined, re-assignment in progress ─────
  if (delivery.order?.customer_id) {
    sseService.notifyMobile(delivery.order.customer_id, "delivery_update", {
      order_id: delivery.order_id,
      order_number: delivery.order.order_number,
      delivery_status: "PENDING_ASSIGNMENT",
    });
  }

  // ── Notify CAdmin to re-assign ────────────────────────────────────────
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: delivery.order_id,
    delivery_id: delivery.delivery_id,
    rider_id: null,
    status: "PENDING_ASSIGNMENT",
    reason: reason || "Rider declined",
    timestamp: new Date().toISOString(),
  });

  return { success: true, message: "Delivery declined successfully" };
}

/**
 * Advance delivery status with strict state guards.
 */
export async function updateDeliveryStatus(
  delivery_id,
  rider_id,
  { status: targetStatus, pickup_otp },
) {
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
    include: {
      order: {
        include: {
          shop: { select: { business_name: true } },
          branch: {
            select: {
              branch_name: true,
              address_line_1: true,
              city: true,
              contact_number: true,
              marketplaceSettings: {
                select: {
                  latitude: true,
                  longitude: true,
                  formatted_address: true,
                  contact_override: true,
                },
              },
            },
          },
          items: {
            select: {
              item_id: true,
              medicine_name_snapshot: true,
              pack_size_snapshot: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (!delivery) throw new Error("Delivery not found");
  if (delivery.rider_id !== rider_id)
    throw new Error("Unauthorized assignment");

  const now = new Date();
  const currentStatus = delivery.status;
  const updateData = { status: targetStatus };

  // ── State Machine Guards ──────────────────────────────────────────────────

  if (targetStatus === "ARRIVED_AT_PHARMACY") {
    if (currentStatus !== "ACCEPTED") {
      throw new Error(
        `Cannot mark arrived at pharmacy from status '${currentStatus}'`,
      );
    }
    updateData.arrived_at_pharmacy_at = now;
  } else if (targetStatus === "PICKED_UP") {
    if (currentStatus !== "ARRIVED_AT_PHARMACY") {
      throw new Error("You must mark 'Arrived at Pharmacy' first.");
    }
    if (delivery.order.status !== "READY_FOR_PICKUP") {
      throw new Error(
        "Pharmacy has not marked the order 'Ready for Pickup' yet.",
      );
    }
    if (!pickup_otp || pickup_otp.trim() !== delivery.order.pickup_otp) {
      throw new Error(
        "Invalid pickup PIN. Please check the 4-digit code with the pharmacy.",
      );
    }
    updateData.picked_up_at = now;
  } else if (targetStatus === "EN_ROUTE") {
    if (!["PICKED_UP", "ARRIVED_AT_PHARMACY"].includes(currentStatus)) {
      throw new Error(`Cannot mark en route from '${currentStatus}'`);
    }
  } else if (targetStatus === "ARRIVED_AT_CUSTOMER") {
    if (!["EN_ROUTE", "PICKED_UP"].includes(currentStatus)) {
      throw new Error(
        `Cannot mark arrived at customer from '${currentStatus}'`,
      );
    }
    updateData.arrived_at_customer_at = now;
  } else {
    throw new Error(`Invalid target status '${targetStatus}'`);
  }

  const updated = await prisma.delivery.update({
    where: { delivery_id },
    data: updateData,
    include: {
      order: {
        include: {
          shop: { select: { business_name: true } },
          branch: {
            select: {
              branch_name: true,
              address_line_1: true,
              city: true,
              contact_number: true,
              marketplaceSettings: {
                select: {
                  latitude: true,
                  longitude: true,
                  formatted_address: true,
                  contact_override: true,
                },
              },
            },
          },
          items: {
            select: {
              item_id: true,
              medicine_name_snapshot: true,
              pack_size_snapshot: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  // Notify CAdmin
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: updated.order_id,
    delivery_id: updated.delivery_id,
    rider_id,
    status: targetStatus,
    timestamp: now.toISOString(),
  });

  // Notify Customer on Mobile
  if (delivery.order.customer_id) {
    sseService.notifyMobile(delivery.order.customer_id, "delivery_update", {
      order_id: delivery.order_id,
      order_number: delivery.order.order_number,
      delivery_status: targetStatus,
    });
  }

  return formatDeliveryForRider(updated);
}

/**
 * Complete delivery with Customer's 4-digit Handover OTP.
 */
export async function completeDeliveryWithOtp(
  delivery_id,
  rider_id,
  { delivery_otp },
) {
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
    include: { order: true },
  });

  if (!delivery) throw new Error("Delivery not found");
  if (delivery.rider_id !== rider_id)
    throw new Error("Unauthorized assignment");

  if (
    !["ARRIVED_AT_CUSTOMER", "EN_ROUTE", "PICKED_UP"].includes(delivery.status)
  ) {
    throw new Error(`Cannot complete delivery in '${delivery.status}' status`);
  }

  if (delivery.order.delivery_otp !== delivery_otp.trim()) {
    throw new Error(
      "Invalid delivery OTP. Please ask the customer for their 4-digit delivery PIN.",
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 1. Mark Delivery as DELIVERED
    await tx.delivery.update({
      where: { delivery_id },
      data: {
        status: "DELIVERED",
        delivered_at: now,
      },
    });

    // 2. Mark Order as COMPLETED
    await tx.marketplaceOrder.update({
      where: { order_id: delivery.order_id },
      data: {
        status: "COMPLETED",
        completed_at: now,
      },
    });

    // 3. Status History
    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id: delivery.order_id,
        from_status: delivery.order.status,
        to_status: "COMPLETED",
        changed_by_type: "rider",
        changed_by_id: rider_id,
        reason: "Customer OTP verified successfully",
      },
    });
  });

  // ── Clear SSE tracking cache ──────────────────────────────────────────
  unregisterActiveDelivery(rider_id);

  // ── Fire loyalty, push notifications, and ERP status change ───────────
  await fireOrderStatusChangedEvents({
    order_id: delivery.order_id,
    order_number: delivery.order.order_number,
    shop_id: delivery.order.shop_id,
    customer_id: delivery.order.customer_id,
    new_status: "COMPLETED",
    customer_name: delivery.order.customer_name_snapshot,
  });

  // ── Notify Customer: delivery complete ────────────────────────────────
  sseService.notifyMobile(delivery.order.customer_id, "delivery_update", {
    order_id: delivery.order_id,
    order_number: delivery.order.order_number,
    delivery_status: "DELIVERED",
  });

  // ── Notify CAdmin ─────────────────────────────────────────────────────
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: delivery.order_id,
    delivery_id: delivery.delivery_id,
    rider_id,
    status: "DELIVERED",
    timestamp: now.toISOString(),
  });

  return {
    delivery_id,
    order_id: delivery.order_id,
    status: "DELIVERED",
    delivered_at: now,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTER: Protects customer privacy until medicines are picked up
// ─────────────────────────────────────────────────────────────────────────────

function formatDeliveryForRider(delivery) {
  const order = delivery.order;
  const addressSnapshot = order?.delivery_address_snapshot || {};
  const isPostPickup = [
    "PICKED_UP",
    "EN_ROUTE",
    "ARRIVED_AT_CUSTOMER",
    "DELIVERED",
  ].includes(delivery.status);

  const pharmacyContact =
    order?.branch?.marketplaceSettings?.contact_override ||
    order?.branch?.contact_number ||
    null;

  const pharmacyAddress =
    order?.branch?.marketplaceSettings?.formatted_address ||
    [order?.branch?.address_line_1, order?.branch?.city]
      .filter(Boolean)
      .join(", ") ||
    null;

  return {
    delivery_id: delivery.delivery_id,
    order_id: delivery.order_id,
    order_number: order?.order_number,
    status: delivery.status,
    order_status: order?.status,
    total_amount: order?.total_amount ? Number(order.total_amount) : 0,
    payment_method: order?.payment_method || "COD",
    item_count: order?.items?.length || 0,
    items: order?.items || [],
    pharmacy: {
      shop_name: order?.shop?.business_name,
      branch_name: order?.branch?.branch_name,
      contact_number: pharmacyContact,
      address: pharmacyAddress,
      latitude: delivery.pickup_lat ? Number(delivery.pickup_lat) : null,
      longitude: delivery.pickup_lng ? Number(delivery.pickup_lng) : null,
    },
    customer: isPostPickup
      ? {
          name: order?.customer_name_snapshot,
          phone: order?.customer_phone_snapshot,
          address_line_1: addressSnapshot.address_line_1,
          address_line_2: addressSnapshot.address_line_2,
          landmark: addressSnapshot.landmark,
          city: addressSnapshot.city,
          latitude: delivery.drop_lat ? Number(delivery.drop_lat) : null,
          longitude: delivery.drop_lng ? Number(delivery.drop_lng) : null,
        }
      : null,
    timestamps: {
      assigned_at: delivery.assigned_at,
      accepted_at: delivery.accepted_at,
      arrived_at_pharmacy_at: delivery.arrived_at_pharmacy_at,
      picked_up_at: delivery.picked_up_at,
      arrived_at_customer_at: delivery.arrived_at_customer_at,
      delivered_at: delivery.delivered_at,
    },
  };
}
