// backend/src/modules/cadmin/delivery/cadmin.delivery.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";
import { sseService } from "../../../services/sse.service.js";
import {
  getDrivingDistance,
  getBatchedDrivingDistances,
  estimateDrivingDistance,
} from "../../../services/distance.service.js";
import { registerActiveDelivery } from "../../rider/presence/rider.presence.service.js";
// ── NEW: Pricing engine for per-rider earning simulation ─────────────────
import { calculateDeliveryEarnings } from "../fleet-pricing/pricingEngine.service.js";
import { RiderPush, dismissRiderNotification } from "../../rider/push/rider.push.service.js";

const MAX_REAL_DISTANCE_RIDERS = 25;

export async function getAvailableRidersForOrder({
  order_id,
  rider_type,
  search,
}) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      order_number: true,
      status: true,
      tip: true, // ── NEW: needed for earning preview
      delivery_address_snapshot: true, // ── NEW: needed for Leg 2 distance
      shop: { select: { business_name: true } },
      branch: {
        select: {
          branch_name: true,
          marketplaceSettings: {
            select: { latitude: true, longitude: true },
          },
        },
      },
      delivery: {
        select: {
          delivery_id: true,
          rider_id: true,
          status: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  const pharmacyLat = order.branch?.marketplaceSettings?.latitude
    ? Number(order.branch.marketplaceSettings.latitude)
    : null;
  const pharmacyLng = order.branch?.marketplaceSettings?.longitude
    ? Number(order.branch.marketplaceSettings.longitude)
    : null;

  // ── NEW: Extract customer drop coordinates for Leg 2 distance ────────
  const dropSnapshot = order.delivery_address_snapshot || {};
  const dropLat = dropSnapshot.latitude ? Number(dropSnapshot.latitude) : null;
  const dropLng = dropSnapshot.longitude
    ? Number(dropSnapshot.longitude)
    : null;

  // ── NEW: Compute Leg 2 distance once (same for all riders) ───────────
  let leg2DistanceKm = 0;
  if (pharmacyLat && pharmacyLng && dropLat && dropLng) {
    const leg2 = await getDrivingDistance(
      pharmacyLat,
      pharmacyLng,
      dropLat,
      dropLng,
    );
    leg2DistanceKm = leg2.distanceKm;
  }

  const orderTip = Number(order.tip) || 0;

  const where = {
    status: "ACTIVE",
    deleted_at: null,
  };

  if (rider_type) {
    where.rider_type = rider_type;
  }

  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const riders = await prisma.rider.findMany({
    where,
    select: {
      rider_id: true,
      full_name: true,
      phone: true,
      rider_type: true,
      is_online: true,
      current_lat: true,
      current_lng: true,
      last_location_at: true,
      deliveries: {
        where: {
          status: { notIn: ["DELIVERED", "FAILED", "CANCELLED"] },
        },
        select: {
          delivery_id: true,
          status: true,
          order_id: true,
        },
      },
    },
  });

  // ── Step 1: Build initial list with Haversine estimates for sorting ──
  const formattedRiders = riders.map((rider) => {
    const activeDelivery = rider.deliveries[0] || null;
    const haversineKm =
      rider.current_lat && rider.current_lng && pharmacyLat && pharmacyLng
        ? estimateDrivingDistance(
            rider.current_lat,
            rider.current_lng,
            pharmacyLat,
            pharmacyLng,
          )
        : null;

    return {
      rider_id: rider.rider_id,
      full_name: rider.full_name || "Delivery Partner",
      phone: rider.phone,
      rider_type: rider.rider_type,
      is_online: rider.is_online,
      current_lat: rider.current_lat ? Number(rider.current_lat) : null,
      current_lng: rider.current_lng ? Number(rider.current_lng) : null,
      last_location_at: rider.last_location_at,
      distance_to_pharmacy_km: haversineKm,
      is_estimate: true,
      has_active_delivery: Boolean(activeDelivery),
      active_delivery_id: activeDelivery?.delivery_id || null,
      active_delivery_status: activeDelivery?.status || null,
      is_currently_assigned_to_this_order:
        order.delivery?.rider_id === rider.rider_id,
      estimated_earning: null, // ── NEW: populated below for INDEPENDENT riders
    };
  });

  // ── Step 2: Sort by online status first, then by Haversine distance ──
  formattedRiders.sort((a, b) => {
    if (a.is_online && !b.is_online) return -1;
    if (!a.is_online && b.is_online) return 1;
    if (
      a.distance_to_pharmacy_km !== null &&
      b.distance_to_pharmacy_km !== null
    ) {
      return a.distance_to_pharmacy_km - b.distance_to_pharmacy_km;
    }
    if (a.distance_to_pharmacy_km !== null) return -1;
    if (b.distance_to_pharmacy_km !== null) return 1;
    return 0;
  });

  // ── Step 3: Get real driving distances for top N riders ──
  if (pharmacyLat && pharmacyLng) {
    const topRiders = formattedRiders
      .filter((r) => r.current_lat !== null && r.current_lng !== null)
      .slice(0, MAX_REAL_DISTANCE_RIDERS);

    if (topRiders.length > 0) {
      const origins = topRiders.map((r) => ({
        lat: r.current_lat,
        lng: r.current_lng,
      }));

      const realDistances = await getBatchedDrivingDistances(
        origins,
        pharmacyLat,
        pharmacyLng,
      );

      for (let i = 0; i < topRiders.length; i++) {
        topRiders[i].distance_to_pharmacy_km = realDistances[i].distanceKm;
        topRiders[i].is_estimate = realDistances[i].isEstimate;
      }

      formattedRiders.sort((a, b) => {
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;
        if (
          a.distance_to_pharmacy_km !== null &&
          b.distance_to_pharmacy_km !== null
        ) {
          return a.distance_to_pharmacy_km - b.distance_to_pharmacy_km;
        }
        if (a.distance_to_pharmacy_km !== null) return -1;
        if (b.distance_to_pharmacy_km !== null) return 1;
        return 0;
      });
    }
  }

  // ── Step 4: NEW — Simulate earnings for INDEPENDENT riders ───────────
  // Only independent riders have per-order earnings. Team riders are salaried.
  for (const rider of formattedRiders) {
    if (rider.rider_type !== "INDEPENDENT") continue;
    if (rider.distance_to_pharmacy_km == null) continue;

    try {
      const earnings = await calculateDeliveryEarnings({
        pickup_distance_km: rider.distance_to_pharmacy_km,
        drop_distance_km: leg2DistanceKm,
        rider_type: "INDEPENDENT",
      });

      const baseEarning =
        earnings.pickup_fee + earnings.drop_fee + earnings.floor_topup_fee;

      rider.estimated_earning = {
        base_earning: Number(baseEarning.toFixed(2)),
        pickup_fee: earnings.pickup_fee,
        drop_fee: earnings.drop_fee,
        surge_fee: earnings.surge_fee,
        floor_topup_fee: earnings.floor_topup_fee,
        tip_amount: orderTip,
        total_earning: Number(
          (earnings.total_rider_earning + orderTip).toFixed(2),
        ),
      };
    } catch (err) {
      console.warn(
        `[CAdminDelivery] Earning simulation failed for rider ${rider.rider_id}:`,
        err.message,
      );
      // Non-fatal: rider still shows in the list, just without earning preview
    }
  }

  return {
    order: {
      order_id: order.order_id,
      order_number: order.order_number,
      status: order.status,
      current_assigned_rider_id: order.delivery?.rider_id || null,
      delivery_status: order.delivery?.status || null,
    },
    pharmacy: {
      shop_name: order.shop?.business_name,
      branch_name: order.branch?.branch_name,
      latitude: pharmacyLat,
      longitude: pharmacyLng,
    },
    riders: formattedRiders,
  };
}

export async function assignRiderToOrder({ order_id, rider_id, assigned_by }) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
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
      delivery: true,
    },
  });

  if (!order) throw new Error("Order not found");

  if (!["ACCEPTED", "READY_FOR_PICKUP"].includes(order.status)) {
    throw new Error(
      `Cannot assign rider — order is currently in '${order.status}' status.`,
    );
  }

  const rider = await prisma.rider.findUnique({
    where: { rider_id },
    include: {
      deliveries: {
        where: {
          status: { notIn: ["DELIVERED", "FAILED", "CANCELLED"] },
        },
      },
    },
  });

  if (!rider || rider.status !== "ACTIVE" || rider.deleted_at !== null) {
    throw new Error("Rider account is not active");
  }

  if (!rider.is_online) {
    throw new Error(
      "Rider is currently offline. Please choose an online partner.",
    );
  }

  if (
    rider.deliveries.length > 0 &&
    rider.deliveries[0].order_id !== order_id
  ) {
    throw new Error("Rider is already handling another active delivery.");
  }

  const now = new Date();
  const pharmacyLat = order.branch?.marketplaceSettings?.latitude ?? null;
  const pharmacyLng = order.branch?.marketplaceSettings?.longitude ?? null;
  const dropLat = order.delivery_address_snapshot?.latitude ?? null;
  const dropLng = order.delivery_address_snapshot?.longitude ?? null;

  // ── Calculate real driving distances (Leg 1 + Leg 2) ──────────────
  const [leg1, leg2] = await Promise.all([
    rider.current_lat && rider.current_lng && pharmacyLat && pharmacyLng
      ? getDrivingDistance(
          rider.current_lat,
          rider.current_lng,
          pharmacyLat,
          pharmacyLng,
        )
      : Promise.resolve({ distanceKm: 0, durationSecs: 0, isEstimate: true }),
    pharmacyLat && pharmacyLng && dropLat && dropLng
      ? getDrivingDistance(pharmacyLat, pharmacyLng, dropLat, dropLng)
      : Promise.resolve({ distanceKm: 0, durationSecs: 0, isEstimate: true }),
  ]);

  const pickupDistKm = leg1.distanceKm;
  const dropDistKm = leg2.distanceKm;
  const totalDistKm = parseFloat((pickupDistKm + dropDistKm).toFixed(2));

  // ── NEW: Calculate rider earnings using the pricing engine ─────────
  const earningsResult = await calculateDeliveryEarnings({
    pickup_distance_km: pickupDistKm,
    drop_distance_km: dropDistKm,
    rider_type: rider.rider_type,
  });

  const orderTip = Number(order.tip) || 0;

  // Track previous rider before updating DB
  const oldRiderId = order.delivery?.rider_id;

  const result = await prisma.$transaction(async (tx) => {
    let deliveryRecord = order.delivery;

    // ── NEW: Earning fields to write to the Delivery record ──────────
    const earningFields = {
      pickup_fee: earningsResult.pickup_fee,
      drop_fee: earningsResult.drop_fee,
      surge_fee: earningsResult.surge_fee,
      floor_topup_fee: earningsResult.floor_topup_fee,
      total_rider_earning: earningsResult.total_rider_earning,
      tip_amount: orderTip,
      pricing_config_id: earningsResult.pricing_config_id || null,
      surge_rule_id: earningsResult.surge_rule_id || null,
    };

    if (!deliveryRecord) {
      deliveryRecord = await tx.delivery.create({
        data: {
          order_id: order.order_id,
          rider_id: rider.rider_id,
          status: "RIDER_NOTIFIED",
          assigned_at: now,
          assignment_attempts: 1,
          pickup_lat: pharmacyLat,
          pickup_lng: pharmacyLng,
          drop_lat: dropLat,
          drop_lng: dropLng,
          pickup_distance_km: pickupDistKm,
          drop_distance_km: dropDistKm,
          total_distance_km: totalDistKm,
          ...earningFields, // ── NEW
        },
      });
    } else {
      deliveryRecord = await tx.delivery.update({
        where: { delivery_id: deliveryRecord.delivery_id },
        data: {
          rider_id: rider.rider_id,
          status: "RIDER_NOTIFIED",
          assigned_at: now,
          assignment_attempts: { increment: 1 },
          pickup_lat: pharmacyLat ?? deliveryRecord.pickup_lat,
          pickup_lng: pharmacyLng ?? deliveryRecord.pickup_lng,
          drop_lat: dropLat ?? deliveryRecord.drop_lat,
          drop_lng: dropLng ?? deliveryRecord.drop_lng,
          pickup_distance_km: pickupDistKm,
          drop_distance_km: dropDistKm,
          total_distance_km: totalDistKm,
          ...earningFields, // ── NEW: overwrites on reassignment
        },
      });
    }

    await tx.deliveryAssignmentLog.create({
      data: {
        delivery_id: deliveryRecord.delivery_id,
        rider_id: rider.rider_id,
        action: "NOTIFIED",
        reason: `Assigned by CAdmin (${assigned_by || "admin"})`,
      },
    });

    return deliveryRecord;
  });

  // ── Register active delivery for SSE location broadcasting ────────
  registerActiveDelivery(rider.rider_id, order.customer_id, order.order_id);

  const pharmacyAddress =
    order.branch?.marketplaceSettings?.formatted_address ||
    order.branch?.address_line_1 ||
    "Pharmacy Location";

  // ── NEW: Compute earning summary for SSE payload ──────────────────
  const baseEarning =
    earningsResult.pickup_fee +
    earningsResult.drop_fee +
    earningsResult.floor_topup_fee;
  const earningsPayload = {
    base_earning: Number(baseEarning.toFixed(2)),
    pickup_fee: earningsResult.pickup_fee,
    drop_fee: earningsResult.drop_fee,
    surge_fee: earningsResult.surge_fee,
    floor_topup_fee: earningsResult.floor_topup_fee,
    tip_amount: orderTip,
    total_earning: Number(
      (earningsResult.total_rider_earning + orderTip).toFixed(2),
    ),
  };

  // ── Fire SSE to Rider (instant, foreground) ──────────────────────────────
  sseService.notifyRider(rider.rider_id, "delivery_assigned", {
    delivery_id: result.delivery_id,
    order_id: order.order_id,
    order_number: order.order_number,
    shop_name: order.shop?.business_name || "Pharmacy",
    branch_name: order.branch?.branch_name,
    pharmacy_address: pharmacyAddress,
    pickup_lat: pharmacyLat ? Number(pharmacyLat) : null,
    pickup_lng: pharmacyLng ? Number(pharmacyLng) : null,
    estimated_distance_km: pickupDistKm,
    drop_distance_km: dropDistKm,
    total_distance_km: totalDistKm,
    is_estimate: leg1.isEstimate || leg2.isEstimate,
    rider_type: rider.rider_type,
    earnings: earningsPayload,
    timestamp: now.toISOString(),
  });

  // ── Fire Push to Rider (failsafe — background/locked/killed) ─────────────
  // This runs fire-and-forget. We do NOT await it because:
  //   1. Expo Push API latency (1-5s) should not block the assignment response
  //   2. SSE already delivered the instant foreground alert
  //   3. Push is the backup channel — failure is non-fatal
  RiderPush.incomingDelivery(
    rider.rider_id,
    result.delivery_id,
    order.order_id,
    order.order_number,
    order.shop?.business_name || "Pharmacy",
    earningsPayload,
  ).catch((err) => {
    console.error(
      `[CAdminDelivery] Push notification failed for rider ${rider.rider_id}:`,
      err.message,
    );
  });

  // ── Notify CAdmins ────────────────────────────────────────────────────────
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: order.order_id,
    delivery_id: result.delivery_id,
    rider_id: rider.rider_id,
    rider_name: rider.full_name,
    status: "RIDER_NOTIFIED",
    timestamp: now.toISOString(),
  });

  // ── Notify old rider they have been unassigned/replaced ───────────────────
  if (oldRiderId && oldRiderId !== rider.rider_id) {
    const { unregisterActiveDelivery } =
      await import("../../rider/presence/rider.presence.service.js");
    unregisterActiveDelivery(oldRiderId);

    // SSE cancellation
    sseService.notifyRider(oldRiderId, "delivery_cancelled", {
      delivery_id: result.delivery_id,
      order_id: order.order_id,
      order_number: order.order_number,
      reason: "Reassigned by admin to another delivery partner",
    });

    // Push cancellation — dismisses the sticky notification on old rider's device
    RiderPush.deliveryCancelled(
      oldRiderId,
      result.delivery_id,
      order.order_number,
      "Reassigned by admin to another delivery partner",
    ).catch((err) => {
      console.error(
        `[CAdminDelivery] Push dismissal failed for old rider ${oldRiderId}:`,
        err.message,
      );
    });
  }

  return {
    delivery_id: result.delivery_id,
    order_id: result.order_id,
    rider_id: result.rider_id,
    status: result.status,
    assigned_at: result.assigned_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNASSIGN RIDER FROM ORDER (CAdmin Override)
// ─────────────────────────────────────────────────────────────────────────────

export async function unassignRiderFromOrder({ order_id, unassigned_by }) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      delivery: true,
    },
  });

  if (!order) throw new Error("Order not found");

  const delivery = order.delivery;

  if (!delivery || !delivery.rider_id) {
    throw new Error("No rider is currently assigned to this order.");
  }

  // Prevent unassigning if order is already terminal or already picked up / en route
  const NON_UNASSIGNABLE = ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_CUSTOMER", "DELIVERED", "FAILED", "CANCELLED"];
  if (NON_UNASSIGNABLE.includes(delivery.status)) {
    throw new Error(
      `Cannot unassign — delivery is in '${delivery.status}' state.`,
    );
  }

  const oldRiderId = delivery.rider_id;
  const now = new Date();

  // 1. Reset ONLY the delivery record (Do NOT touch order.status)
  await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { delivery_id: delivery.delivery_id },
      data: {
        rider_id: null,
        status: "PENDING_ASSIGNMENT",
        assigned_at: null,
        accepted_at: null,
        arrived_at_pharmacy_at: null,
        pharmacy_confirmed_at: null,
        picked_up_at: null,
        arrived_at_customer_at: null,
      },
    });

    await tx.deliveryAssignmentLog.create({
      data: {
        delivery_id: delivery.delivery_id,
        rider_id: oldRiderId,
        action: "REJECTED",
        reason: `Unassigned by CAdmin (${unassigned_by || "admin"})`,
      },
    });
  });

  // 2. Clear rider presence lock
  const { unregisterActiveDelivery } =
    await import("../../rider/presence/rider.presence.service.js");
  unregisterActiveDelivery(oldRiderId);

    // 3. Notify the old rider that they were unassigned
  sseService.notifyRider(oldRiderId, "delivery_cancelled", {
    delivery_id: delivery.delivery_id,
    order_id,
    order_number: order.order_number,
    reason: `Unassigned by admin: ${unassigned_by || "CAdmin"}`,
  });

  // 3b. Push: Dismiss sticky notification on old rider's device
  dismissRiderNotification(oldRiderId, delivery.delivery_id).catch((err) => {
    console.error(
      `[CAdminDelivery] Push dismissal failed on unassign for rider ${oldRiderId}:`,
      err.message,
    );
  });

  // 4. Notify CAdmins to update their live delivery board
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id,
    delivery_id: delivery.delivery_id,
    rider_id: null,
    status: "PENDING_ASSIGNMENT",
    timestamp: now.toISOString(),
  });

  // 5. Notify Customer tracking screen via silent SSE (resets map/rider pin without sending push notification)
  if (order.customer_id && sseService.notifyCustomer) {
    sseService.notifyCustomer(order.customer_id, "delivery_status_changed", {
      order_id,
      delivery_id: delivery.delivery_id,
      status: "PENDING_ASSIGNMENT",
      rider: null,
      timestamp: now.toISOString(),
    });
  }

  return {
    delivery_id: delivery.delivery_id,
    order_id,
    previous_rider_id: oldRiderId,
    status: "PENDING_ASSIGNMENT",
  };
}
