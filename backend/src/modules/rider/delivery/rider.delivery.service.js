// backend/src/modules/rider/delivery/rider.delivery.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";
import { sseService } from "../../../services/sse.service.js";
import { fireOrderStatusChangedEvents } from "../../marketplace-orders/marketplace.orders.events.js";
import {
  registerActiveDelivery,
  unregisterActiveDelivery,
} from "../presence/rider.presence.service.js";

// ── Developer / Local Testing Configuration ──────────────────────────────────
const BYPASS_GEOFENCE_IN_DEV = true;

// ── Geofence helper ──────────────────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371;
const ARRIVAL_GEOFENCE_METERS = 200;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return (
    EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000
  );
}

export async function getActiveDelivery(rider_id) {
  const delivery = await prisma.delivery.findFirst({
    where: {
      rider_id,
      status: { notIn: ["DELIVERED", "FAILED", "CANCELLED"] },
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

export async function acceptDelivery(delivery_id, rider_id) {
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
    include: { order: true },
  });
  if (!delivery) throw new Error("Delivery assignment not found");
  if (delivery.rider_id !== rider_id)
    throw new Error("Unauthorized assignment");

  if (delivery.status === "ACCEPTED") {
    const alreadyAccepted = await prisma.delivery.findUnique({
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
    return formatDeliveryForRider(alreadyAccepted);
  }

  if (delivery.status !== "RIDER_NOTIFIED") {
    throw new Error(`Cannot accept delivery in '${delivery.status}' state`);
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.delivery.update({
      where: { delivery_id },
      data: { status: "ACCEPTED", accepted_at: now },
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

  registerActiveDelivery(rider_id, updated.order.customer_id, updated.order_id);

  sseService.notifyMobile(updated.order.customer_id, "delivery_update", {
    order_id: updated.order_id,
    order_number: updated.order.order_number,
    delivery_status: "ACCEPTED",
  });

  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: updated.order_id,
    delivery_id: updated.delivery_id,
    rider_id,
    status: "ACCEPTED",
    timestamp: now.toISOString(),
  });

  return formatDeliveryForRider(updated);
}

export async function declineDelivery(delivery_id, rider_id, { reason, note }) {
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
    include: { order: true },
  });

  if (!delivery) throw new Error("Delivery assignment not found");

  if (delivery.status === "PENDING_ASSIGNMENT" && delivery.rider_id === null) {
    return { success: true, message: "Delivery already declined" };
  }

  if (delivery.rider_id !== rider_id)
    throw new Error("Unauthorized assignment");
  if (delivery.status !== "RIDER_NOTIFIED") {
    throw new Error("Can only decline pending assignments");
  }

  await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { delivery_id },
      data: { rider_id: null, status: "PENDING_ASSIGNMENT" },
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

  unregisterActiveDelivery(rider_id);

  if (delivery.order?.customer_id) {
    sseService.notifyMobile(delivery.order.customer_id, "delivery_update", {
      order_id: delivery.order_id,
      order_number: delivery.order.order_number,
      delivery_status: "PENDING_ASSIGNMENT",
    });
  }

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

  const isDevBypassEnabled =
    BYPASS_GEOFENCE_IN_DEV && process.env.NODE_ENV !== "production";

  if (targetStatus === "ARRIVED_AT_PHARMACY") {
    if (currentStatus !== "ACCEPTED") {
      throw new Error(
        `Cannot mark arrived at pharmacy from status '${currentStatus}'`,
      );
    }

    const rider = await prisma.rider.findUnique({
      where: { rider_id },
      select: { current_lat: true, current_lng: true },
    });

    const pharmacyLat = delivery.pickup_lat
      ? Number(delivery.pickup_lat)
      : null;
    const pharmacyLng = delivery.pickup_lng
      ? Number(delivery.pickup_lng)
      : null;

    if (
      rider?.current_lat != null &&
      rider?.current_lng != null &&
      pharmacyLat != null &&
      pharmacyLng != null
    ) {
      const distM = haversineMeters(
        Number(rider.current_lat),
        Number(rider.current_lng),
        pharmacyLat,
        pharmacyLng,
      );
      if (distM > ARRIVAL_GEOFENCE_METERS) {
        if (isDevBypassEnabled) {
          console.log(
            `[DEV BYPASS] Bypassed Pharmacy Geofence. Actual distance: ${Math.round(distM)}m`,
          );
        } else {
          throw new Error(
            `You are too far from the pharmacy (${Math.round(distM)}m). Please get within ${ARRIVAL_GEOFENCE_METERS}m before confirming arrival.`,
          );
        }
      }
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
    if (currentStatus !== "PICKED_UP") {
      throw new Error(
        `Cannot mark en route from '${currentStatus}'. You must confirm pickup first.`,
      );
    }
  } else if (targetStatus === "ARRIVED_AT_CUSTOMER") {
    if (!["EN_ROUTE", "PICKED_UP"].includes(currentStatus)) {
      throw new Error(
        `Cannot mark arrived at customer from '${currentStatus}'`,
      );
    }

    const rider = await prisma.rider.findUnique({
      where: { rider_id },
      select: { current_lat: true, current_lng: true },
    });

    const dropLat = delivery.drop_lat ? Number(delivery.drop_lat) : null;
    const dropLng = delivery.drop_lng ? Number(delivery.drop_lng) : null;

    if (
      rider?.current_lat != null &&
      rider?.current_lng != null &&
      dropLat != null &&
      dropLng != null
    ) {
      const distM = haversineMeters(
        Number(rider.current_lat),
        Number(rider.current_lng),
        dropLat,
        dropLng,
      );
      if (distM > ARRIVAL_GEOFENCE_METERS) {
        if (isDevBypassEnabled) {
          console.log(
            `[DEV BYPASS] Bypassed Customer Geofence. Actual distance: ${Math.round(distM)}m`,
          );
        } else {
          throw new Error(
            `You are too far from the customer (${Math.round(distM)}m). Please get within ${ARRIVAL_GEOFENCE_METERS}m before confirming arrival.`,
          );
        }
      }
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

  // ── Notify CAdmin ──────────────────────────────────────────────────────
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: updated.order_id,
    delivery_id: updated.delivery_id,
    rider_id,
    status: targetStatus,
    timestamp: now.toISOString(),
  });

  // ── Notify Customer on Mobile ──────────────────────────────────────────
  if (delivery.order.customer_id) {
    sseService.notifyMobile(delivery.order.customer_id, "delivery_update", {
      order_id: delivery.order_id,
      order_number: delivery.order.order_number,
      delivery_status: targetStatus,
    });
  }

  // ── ★ NEW: Notify Pharmacy ERP via SSE on every rider milestone ────────
  // This triggers the existing `marketplace_order_status_changed` SSE event
  // that the pharmacy ERP already listens to, causing it to auto-refresh
  // the order detail panel with the latest delivery progress.
  try {
    await fireOrderStatusChangedEvents({
      order_id: updated.order_id,
      order_number: updated.order.order_number,
      shop_id: updated.order.shop_id,
      customer_id: updated.order.customer_id,
      new_status: updated.order.status, // Order status stays READY_FOR_PICKUP
      customer_name: updated.order.customer_name_snapshot,
    });
  } catch (err) {
    console.error(
      "[RiderDelivery] Failed to notify ERP of delivery milestone:",
      err.message,
    );
  }

  return formatDeliveryForRider(updated);
}

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

  if (!["ARRIVED_AT_CUSTOMER", "EN_ROUTE"].includes(delivery.status)) {
    throw new Error(
      `Cannot complete delivery in '${delivery.status}' status. You must arrive at the customer location first.`,
    );
  }

  if (delivery.order.delivery_otp !== delivery_otp.trim()) {
    throw new Error(
      "Invalid delivery OTP. Please ask the customer for their 4-digit delivery PIN.",
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { delivery_id },
      data: { status: "DELIVERED", delivered_at: now },
    });

    await tx.marketplaceOrder.update({
      where: { order_id: delivery.order_id },
      data: { status: "COMPLETED", completed_at: now },
    });

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

  unregisterActiveDelivery(rider_id);

  await fireOrderStatusChangedEvents({
    order_id: delivery.order_id,
    order_number: delivery.order.order_number,
    shop_id: delivery.order.shop_id,
    customer_id: delivery.order.customer_id,
    new_status: "COMPLETED",
    customer_name: delivery.order.customer_name_snapshot,
  });

  sseService.notifyMobile(delivery.order.customer_id, "delivery_update", {
    order_id: delivery.order_id,
    order_number: delivery.order.order_number,
    delivery_status: "DELIVERED",
  });

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

// ── Formatter ────────────────────────────────────────────────────────────────

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


// ── NEW: Delivery History Functions (append to rider.delivery.service.js) ────

/**
 * Get paginated delivery history for a rider.
 * Includes DELIVERED, FAILED, CANCELLED by default (terminal states only).
 */
export async function getDeliveryHistory(rider_id, filters) {
  const { page, limit, status, from_date, to_date } = filters;

  const statusFilter = status && status.length > 0
    ? status
    : ["DELIVERED", "FAILED", "CANCELLED"];

  const where = {
    rider_id,
    status: { in: statusFilter },
  };

  // Date range filter based on the terminal timestamp (delivered_at/failed_at/created_at fallback)
  if (from_date || to_date) {
    where.created_at = {};
    if (from_date) where.created_at.gte = new Date(from_date);
    if (to_date) where.created_at.lte = new Date(to_date);
  }

  const [total, deliveries] = await prisma.$transaction([
    prisma.delivery.count({ where }),
    prisma.delivery.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        order: {
          select: {
            order_number: true,
            customer_name_snapshot: true,
            total_amount: true,
            payment_method: true,
            shop: { select: { business_name: true } },
            branch: { select: { branch_name: true } },
            items: { select: { item_id: true } },
          },
        },
      },
    }),
  ]);

  return {
    deliveries: deliveries.map((d) => ({
      delivery_id: d.delivery_id,
      order_id: d.order_id,
      order_number: d.order?.order_number,
      status: d.status,
      pharmacy_name: d.order?.shop?.business_name || null,
      branch_name: d.order?.branch?.branch_name || null,
      customer_name: d.order?.customer_name_snapshot || null,
      total_amount: d.order?.total_amount ? Number(d.order.total_amount) : 0,
      payment_method: d.order?.payment_method || "COD",
      item_count: d.order?.items?.length || 0,
      total_rider_earning: d.total_rider_earning
        ? Number(d.total_rider_earning)
        : 0,
      tip_amount: d.tip_amount ? Number(d.tip_amount) : 0,
      total_distance_km: d.total_distance_km
        ? Number(d.total_distance_km)
        : 0,
      failure_reason: d.failure_reason || null,
      delivered_at: d.delivered_at,
      failed_at: d.failed_at,
      created_at: d.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get full delivery detail with earnings breakdown, timestamps, items, ratings.
 */
export async function getDeliveryHistoryDetail(delivery_id, rider_id) {
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
              brand_snapshot: true,
              quantity: true,
              unit_price_snapshot: true,
              line_total: true,
            },
          },
        },
      },
      riderRating: {
        select: { stars: true, created_at: true },
      },
    },
  });

  if (!delivery) throw new Error("Delivery not found");
  if (delivery.rider_id !== rider_id) throw new Error("Unauthorized");

  const order = delivery.order;
  const addressSnapshot = order?.delivery_address_snapshot || {};
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
    payment_method: order?.payment_method || "COD",
    order_total: order?.total_amount ? Number(order.total_amount) : 0,

    pharmacy: {
      shop_name: order?.shop?.business_name || null,
      branch_name: order?.branch?.branch_name || null,
      contact_number: pharmacyContact,
      address: pharmacyAddress,
      latitude: delivery.pickup_lat ? Number(delivery.pickup_lat) : null,
      longitude: delivery.pickup_lng ? Number(delivery.pickup_lng) : null,
    },
    customer: {
      name: order?.customer_name_snapshot || null,
      phone: order?.customer_phone_snapshot || null,
      address_line_1: addressSnapshot.address_line_1 || null,
      address_line_2: addressSnapshot.address_line_2 || null,
      landmark: addressSnapshot.landmark || null,
      city: addressSnapshot.city || null,
      latitude: delivery.drop_lat ? Number(delivery.drop_lat) : null,
      longitude: delivery.drop_lng ? Number(delivery.drop_lng) : null,
    },
    items: (order?.items || []).map((i) => ({
      item_id: i.item_id,
      medicine_name: i.medicine_name_snapshot,
      brand: i.brand_snapshot || null,
      pack_size: i.pack_size_snapshot || null,
      quantity: i.quantity,
      unit_price: i.unit_price_snapshot ? Number(i.unit_price_snapshot) : 0,
      line_total: i.line_total ? Number(i.line_total) : 0,
    })),
    earnings: {
      pickup_fee: delivery.pickup_fee ? Number(delivery.pickup_fee) : 0,
      drop_fee: delivery.drop_fee ? Number(delivery.drop_fee) : 0,
      surge_fee: delivery.surge_fee ? Number(delivery.surge_fee) : 0,
      floor_topup_fee: delivery.floor_topup_fee
        ? Number(delivery.floor_topup_fee)
        : 0,
      tip_amount: delivery.tip_amount ? Number(delivery.tip_amount) : 0,
      total_earning: delivery.total_rider_earning
        ? Number(delivery.total_rider_earning)
        : 0,
    },
    distances: {
      pickup_km: delivery.pickup_distance_km
        ? Number(delivery.pickup_distance_km)
        : 0,
      drop_km: delivery.drop_distance_km
        ? Number(delivery.drop_distance_km)
        : 0,
      total_km: delivery.total_distance_km
        ? Number(delivery.total_distance_km)
        : 0,
    },
    timestamps: {
      assigned_at: delivery.assigned_at,
      accepted_at: delivery.accepted_at,
      arrived_at_pharmacy_at: delivery.arrived_at_pharmacy_at,
      picked_up_at: delivery.picked_up_at,
      arrived_at_customer_at: delivery.arrived_at_customer_at,
      delivered_at: delivery.delivered_at,
      failed_at: delivery.failed_at,
    },
    failure_reason: delivery.failure_reason || null,
    failure_note: delivery.failure_note || null,
    rating: delivery.riderRating
      ? {
          stars: delivery.riderRating.stars,
          created_at: delivery.riderRating.created_at,
        }
      : null,
    created_at: delivery.created_at,
  };
}