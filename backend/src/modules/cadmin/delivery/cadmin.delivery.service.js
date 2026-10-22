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
import {
  RiderPush,
  dismissRiderNotification,
} from "../../rider/push/rider.push.service.js";
import crypto from "crypto";

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
      fulfillment_type: true,
      tip: true,
      delivery_address_snapshot: true,
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

  // ── Guard: rider assignment only applies to instant delivery ────────
  if (order.fulfillment_type && order.fulfillment_type !== "INSTANT_DELIVERY") {
    throw new Error(
      `Rider assignment is not applicable for ${order.fulfillment_type} orders`,
    );
  }

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

  // ── Guard: rider assignment only applies to instant delivery ────────
  if (order.fulfillment_type && order.fulfillment_type !== "INSTANT_DELIVERY") {
    throw new Error(
      `Rider assignment is not applicable for ${order.fulfillment_type} orders`,
    );
  }

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
    select: {
      order_id: true,
      order_number: true,
      fulfillment_type: true,
      customer_id: true,
      delivery: true,
    },
  });

  if (!order) throw new Error("Order not found");

  // ── Guard: rider operations only apply to instant delivery ──────────
  if (order.fulfillment_type && order.fulfillment_type !== "INSTANT_DELIVERY") {
    throw new Error(
      `Rider unassignment is not applicable for ${order.fulfillment_type} orders`,
    );
  }

  const delivery = order.delivery;

  if (!delivery || !delivery.rider_id) {
    throw new Error("No rider is currently assigned to this order.");
  }

  // Prevent unassigning if order is already terminal or already picked up / en route
  const NON_UNASSIGNABLE = [
    "PICKED_UP",
    "EN_ROUTE",
    "ARRIVED_AT_CUSTOMER",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
  ];
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

// ── Same Day Batch Assignment ──────────────────────────────

/**
 * Assign multiple SAME_DAY orders to one team rider as a single batch.
 *
 * Validation:
 *  - All orders must be SAME_DAY, ACCEPTED, with no existing Delivery
 *  - Rider must be TEAM, ACTIVE, and not already on an active batch
 *
 * Creates one Delivery per order (null earnings — team salary).
 * Fires sticky push + SSE to the rider.
 */
export async function batchAssignOrders({ order_ids, rider_id, assigned_by }) {
  if (!order_ids || order_ids.length === 0) {
    throw new Error("At least one order_id is required");
  }

  // ── 1. Validate rider ────────────────────────────────────
  const rider = await prisma.rider.findUnique({
    where: { rider_id },
  });

  if (!rider) throw new Error("Rider not found");
  if (rider.rider_type !== "TEAM") {
    throw new Error("Only TEAM riders can be assigned Same Day batches");
  }
  if (rider.status !== "ACTIVE") {
    throw new Error("Rider is not active");
  }

  const activeBatch = await prisma.delivery.findFirst({
    where: {
      rider_id,
      batch_group_id: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "FAILED"] },
    },
  });
  if (activeBatch) {
    throw new Error("Rider already has an active Same Day batch");
  }

  // ── 2. Validate all orders ───────────────────────────────
  const orders = await prisma.marketplaceOrder.findMany({
    where: { order_id: { in: order_ids } },
    include: {
      delivery: true,
      branch: {
        include: {
          marketplaceSettings: {
            select: { latitude: true, longitude: true },
          },
        },
      },
    },
  });

  if (orders.length !== order_ids.length) {
    throw new Error("One or more orders not found");
  }

  const STALE_STATUSES = ["CANCELLED", "FAILED", "PENDING_ASSIGNMENT"];

  for (const order of orders) {
    if (order.fulfillment_type !== "SAME_DAY") {
      throw new Error(`Order ${order.order_id} is not SAME_DAY`);
    }
    if (order.status !== "ACCEPTED") {
      throw new Error(
        `Order ${order.order_id} must be ACCEPTED (current: ${order.status})`,
      );
    }
    // A delivery is stale if it's terminal OR if it's an orphaned PENDING_ASSIGNMENT
    // with no rider (left behind by a failed/declined batch attempt)
    if (
      order.delivery &&
      !STALE_STATUSES.includes(order.delivery.status) &&
      order.delivery.rider_id
    ) {
      throw new Error(`Order ${order.order_id} already has an active Delivery record`);
    }
  }

  // Clean up any stale (cancelled/failed) delivery records before re-batching
  const staleDeliveryIds = orders
    .filter((o) => o.delivery && STALE_STATUSES.includes(o.delivery.status))
    .map((o) => o.delivery.delivery_id);

  if (staleDeliveryIds.length > 0) {
    await prisma.delivery.deleteMany({
      where: { delivery_id: { in: staleDeliveryIds } },
    });
  }

  // ── 3. Create deliveries in a transaction ────────────────
  const batchGroupId = crypto.randomBytes(15).toString("hex"); // 30 chars

  const now = new Date();

  const deliveries = await prisma.$transaction(
    orders.map((order) => {
      const pharmacyLat = order.branch?.marketplaceSettings?.latitude ?? null;
      const pharmacyLng = order.branch?.marketplaceSettings?.longitude ?? null;
      const dropSnapshot = order.delivery_address_snapshot || {};
      const dropLat = dropSnapshot.latitude ?? null;
      const dropLng = dropSnapshot.longitude ?? null;

      return prisma.delivery.create({
        data: {
          order_id: order.order_id,
          rider_id,
          batch_group_id: batchGroupId,
          status: "RIDER_NOTIFIED",
          assigned_at: now,
          assignment_attempts: 1,
          pickup_lat: pharmacyLat,
          pickup_lng: pharmacyLng,
          drop_lat: dropLat,
          drop_lng: dropLng,
          // Team riders: fixed salary — all earnings null
          pickup_fee: null,
          drop_fee: null,
          surge_fee: null,
          floor_topup_fee: null,
          total_rider_earning: null,
          tip_amount: null,
        },
      });
    }),
  );

  // ── 4. Push notification (sticky incoming alert) ─────────
  RiderPush.sameDayBatchAssigned(rider_id, {
    batch_group_id: batchGroupId,
    order_count: orders.length,
    pharmacy_name: orders[0].branch?.branch_name || "Pharmacy",
  }).catch((err) => {
    console.error("[batchAssign] Push failed:", err.message);
  });

  // ── 5. SSE to rider ──────────────────────────────────────
  sseService.notifyRider(rider_id, "batch_assigned", {
    batch_group_id: batchGroupId,
    order_count: orders.length,
    deliveries: deliveries.map((d) => ({
      delivery_id: d.delivery_id,
      order_id: d.order_id,
    })),
  });

  // ── 6. SSE to CAdmins (so SameDayTab auto-updates) ───────
  for (const d of deliveries) {
    sseService.notifyAllCAdmins("delivery_status_changed", {
      order_id: d.order_id,
      delivery_id: d.delivery_id,
      rider_id,
      rider_name: rider.full_name,
      status: "RIDER_NOTIFIED",
      batch_group_id: batchGroupId,
      timestamp: now.toISOString(),
    });
  }

  return {
    batch_group_id: batchGroupId,
    rider_id,
    order_count: orders.length,
    delivery_ids: deliveries.map((d) => d.delivery_id),
  };
}

/**
 * Get TEAM riders eligible for Same Day batch assignment.
 * Excludes riders who are offline or already on an active batch.
 */
export async function getAvailableTeamRidersForBatch() {
  const teamRiders = await prisma.rider.findMany({
    where: {
      rider_type: "TEAM",
      status: "ACTIVE",
      is_online: true,
    },
  });

  const busyRows = await prisma.delivery.findMany({
    where: {
      batch_group_id: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "FAILED"] },
      rider_id: { in: teamRiders.map((r) => r.rider_id) },
    },
    select: { rider_id: true },
  });

  const busyIds = new Set(busyRows.map((r) => r.rider_id));

  return teamRiders
    .filter((r) => !busyIds.has(r.rider_id))
    .map((r) => ({
      rider_id: r.rider_id,
      rider_name: r.full_name,
      phone: r.phone,
      is_online: r.is_online,
    }));
}

/**
 * Add a single SAME_DAY order to a rider's existing active batch.
 * Sends a simple notification (NOT a sticky incoming alert).
 */
export async function addOrderToBatch({ order_id, rider_id, assigned_by }) {
  // ── 1. Find rider's active batch ─────────────────────────
  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      rider_id,
      batch_group_id: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "FAILED"] },
    },
  });

  if (!activeDelivery) {
    throw new Error("Rider does not have an active Same Day batch");
  }

  // ── 2. Validate order ────────────────────────────────────
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: { delivery: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.fulfillment_type !== "SAME_DAY") {
    throw new Error("Only SAME_DAY orders can be added to a batch");
  }
  if (order.status !== "ACCEPTED") {
    throw new Error(`Order must be ACCEPTED (current: ${order.status})`);
  }
  const STALE = ["CANCELLED", "FAILED", "PENDING_ASSIGNMENT"];
  const isStale =
    order.delivery &&
    (STALE.includes(order.delivery.status) || !order.delivery.rider_id);
  if (order.delivery && !isStale) {
    throw new Error("Order already has an active Delivery record");
  }
  // Clean up stale delivery before re-adding
  if (order.delivery && isStale) {
    await prisma.delivery.delete({
      where: { delivery_id: order.delivery.delivery_id },
    });
  }

  // ── 2b. Resolve coordinates from order ────────────────────
  const orderWithCoords = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      branch: {
        include: {
          marketplaceSettings: {
            select: { latitude: true, longitude: true },
          },
        },
      },
    },
  });

  const pharmacyLat =
    orderWithCoords?.branch?.marketplaceSettings?.latitude ?? null;
  const pharmacyLng =
    orderWithCoords?.branch?.marketplaceSettings?.longitude ?? null;
  const dropSnapshot = orderWithCoords?.delivery_address_snapshot || {};
  const dropLat = dropSnapshot.latitude ?? null;
  const dropLng = dropSnapshot.longitude ?? null;

  // ── 3. Create delivery in same batch ─────────────────────
  // Status is ACCEPTED (not RIDER_NOTIFIED) because the rider
  // already accepted this batch. Skip the notification phase.
  const delivery = await prisma.delivery.create({
    data: {
      order_id,
      rider_id,
      batch_group_id: activeDelivery.batch_group_id,
      status: "ACCEPTED",
      accepted_at: new Date(),
      pickup_lat: pharmacyLat,
      pickup_lng: pharmacyLng,
      drop_lat: dropLat,
      drop_lng: dropLng,
      // Team riders: fixed salary — all earnings null
      pickup_fee: null,
      drop_fee: null,
      surge_fee: null,
      floor_topup_fee: null,
      total_rider_earning: null,
      tip_amount: null,
    },
  });

  // ── 4. Simple notification (no sticky alert) ─────────────
  RiderPush.orderAddedToBatch(rider_id, {
    batch_group_id: activeDelivery.batch_group_id,
    order_id,
  }).catch((err) => {
    console.error("[addOrderToBatch] Push failed:", err.message);
  });

  // ── 5. SSE to rider ──────────────────────────────────────
  sseService.notifyRider(rider_id, "order_added_to_batch", {
    batch_group_id: activeDelivery.batch_group_id,
    delivery_id: delivery.delivery_id,
    order_id,
  });

  // ── 6. SSE to CAdmins ────────────────────────────────────
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id,
    delivery_id: delivery.delivery_id,
    rider_id,
    status: "ACCEPTED",
    batch_group_id: activeDelivery.batch_group_id,
    timestamp: new Date().toISOString(),
  });

  return {
    delivery_id: delivery.delivery_id,
    batch_group_id: activeDelivery.batch_group_id,
  };
}

/**
 * Move a single order from one rider's batch to another rider.
 * Blocked once the order reaches PICKED_UP or beyond.
 */
export async function reassignBatchOrder({
  delivery_id,
  new_rider_id,
  reassigned_by,
}) {
  const REASSIGNABLE = [
    "PENDING_ASSIGNMENT",
    "RIDER_NOTIFIED",
    "ACCEPTED",
    "ARRIVED_AT_PHARMACY",
  ];

  // ── 1. Validate current delivery ─────────────────────────
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
    include: {
      order: {
        include: {
          branch: { select: { branch_name: true } },
        },
      },
    },
  });

  if (!delivery) throw new Error("Delivery not found");
  if (!delivery.batch_group_id) {
    throw new Error("Delivery is not part of a Same Day batch");
  }
  if (!REASSIGNABLE.includes(delivery.status)) {
    throw new Error(
      `Cannot reassign — status is ${delivery.status}. ` +
        "Reassignment only allowed before pickup.",
    );
  }

  // ── 2. Validate new rider ────────────────────────────────
  const newRider = await prisma.rider.findUnique({
    where: { rider_id: new_rider_id },
  });

  if (!newRider) throw new Error("New rider not found");
  if (newRider.rider_type !== "TEAM") {
    throw new Error("Only TEAM riders can receive Same Day orders");
  }
  if (newRider.status !== "ACTIVE") {
    throw new Error("New rider is not active");
  }
  if (!newRider.is_online) {
    throw new Error("New rider is currently offline");
  }

  const oldRiderId = delivery.rider_id;

  // ── 3. Determine target batch ────────────────────────────
  const newRiderBatch = await prisma.delivery.findFirst({
    where: {
      rider_id: new_rider_id,
      batch_group_id: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "FAILED"] },
    },
  });

  const targetBatchId = newRiderBatch
    ? newRiderBatch.batch_group_id
    : crypto.randomBytes(15).toString("hex");

  // ── 4. Determine path: new batch vs. existing batch ──────
  const isNewBatch = !newRiderBatch;
  const deliveryStatus = isNewBatch ? "RIDER_NOTIFIED" : "ACCEPTED";

  // Resolve coordinates from the order's branch + address snapshot
  const orderCoords = await prisma.marketplaceOrder.findUnique({
    where: { order_id: delivery.order_id },
    include: {
      branch: {
        include: {
          marketplaceSettings: {
            select: { latitude: true, longitude: true },
          },
        },
      },
    },
  });

  const pharmLat =
    orderCoords?.branch?.marketplaceSettings?.latitude ?? null;
  const pharmLng =
    orderCoords?.branch?.marketplaceSettings?.longitude ?? null;
  const dropSnap = orderCoords?.delivery_address_snapshot || {};

  await prisma.delivery.update({
    where: { delivery_id },
    data: {
      rider_id: new_rider_id,
      batch_group_id: targetBatchId,
      status: deliveryStatus,
      pickup_lat: pharmLat,
      pickup_lng: pharmLng,
      drop_lat: dropSnap.latitude ?? null,
      drop_lng: dropSnap.longitude ?? null,
      ...(isNewBatch ? {} : { accepted_at: new Date() }),
    },
  });

  // ── 5. Notify old rider (always the same) ────────────────
  sseService.notifyRider(oldRiderId, "order_removed_from_batch", {
    delivery_id,
    order_id: delivery.order_id,
  });

  // ── 6. Notify new rider + push ───────────────────────────
  if (isNewBatch) {
    // Path B: Brand-new batch → full incoming alert (overlay + alarm)
    const pharmacyName =
      delivery.order?.branch?.branch_name || "Pharmacy";

    sseService.notifyRider(new_rider_id, "batch_assigned", {
      batch_group_id: targetBatchId,
      order_count: 1,
      pharmacy_name: pharmacyName,
      deliveries: [{ delivery_id, order_id: delivery.order_id }],
      timestamp: new Date().toISOString(),
    });

    RiderPush.sameDayBatchAssigned(new_rider_id, {
      batch_group_id: targetBatchId,
      order_count: 1,
      pharmacy_name: pharmacyName,
    }).catch((err) => {
      console.error("[reassignBatchOrder] Push failed:", err.message);
    });
  } else {
    // Path A: Adding to existing batch → quiet notification only
    sseService.notifyRider(new_rider_id, "order_added_to_batch", {
      batch_group_id: targetBatchId,
      delivery_id,
      order_id: delivery.order_id,
    });

    RiderPush.orderAddedToBatch(new_rider_id, {
      batch_group_id: targetBatchId,
      order_id: delivery.order_id,
    }).catch((err) => {
      console.error("[reassignBatchOrder] Push failed:", err.message);
    });
  }

  // ── 7. SSE to CAdmins ────────────────────────────────────
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: delivery.order_id,
    delivery_id,
    rider_id: new_rider_id,
    rider_name: newRider.full_name,
    status: deliveryStatus,
    batch_group_id: targetBatchId,
    timestamp: new Date().toISOString(),
  });

  return {
    delivery_id,
    old_rider_id: oldRiderId,
    new_rider_id,
    batch_group_id: targetBatchId,
  };
}

/**
 * Get all active Same Day batches with rider info and order progress.
 * A batch is "active" if at least one delivery is non-terminal.
 * Returns full order lists (including delivered) for each active batch.
 */
export async function getActiveBatches() {
  // Step 1: Find batch_group_ids with at least one active delivery
  const activeBatchIds = await prisma.delivery.findMany({
    where: {
      batch_group_id: { not: null },
      status: { notIn: ["DELIVERED", "CANCELLED", "FAILED"] },
    },
    select: { batch_group_id: true },
    distinct: ["batch_group_id"],
  });

  const bgIds = activeBatchIds.map((d) => d.batch_group_id);
  if (bgIds.length === 0) return [];

  // Step 2: Fetch ALL deliveries for those batches (including completed)
  const deliveries = await prisma.delivery.findMany({
    where: { batch_group_id: { in: bgIds } },
    include: {
      order: {
        select: {
          order_id: true,
          order_number: true,
          status: true,
          customer_name_snapshot: true,
          customer_phone_snapshot: true,
          branch: { select: { branch_name: true } },
        },
      },
      rider: {
        select: {
          rider_id: true,
          full_name: true,
          phone: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  // Step 3: Group by batch_group_id
  const batchMap = new Map();
  for (const d of deliveries) {
    const bgId = d.batch_group_id;
    if (!batchMap.has(bgId)) {
      batchMap.set(bgId, {
        batch_group_id: bgId,
        rider_id: d.rider_id,
        rider_name: d.rider?.full_name || null,
        rider_phone: d.rider?.phone || null,
        orders: [],
        created_at: d.created_at,
      });
    }
    batchMap.get(bgId).orders.push({
      delivery_id: d.delivery_id,
      order_id: d.order_id,
      order_number: d.order.order_number,
      order_status: d.order.status,
      delivery_status: d.status,
      customer_name: d.order.customer_name_snapshot,
      customer_phone: d.order.customer_phone_snapshot,
      branch_name: d.order.branch?.branch_name || null,
    });
  }

  // Step 4: Compute progress stats
  const batches = Array.from(batchMap.values()).map((b) => {
    const total = b.orders.length;
    const delivered = b.orders.filter((o) => o.delivery_status === "DELIVERED").length;
    const inTransit = b.orders.filter((o) =>
      ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_CUSTOMER"].includes(o.delivery_status)
    ).length;
    return {
      ...b,
      order_count: total,
      delivered_count: delivered,
      in_transit_count: inTransit,
      pending_count: total - delivered - inTransit,
    };
  });

  batches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return batches;
}

/**
 * Remove a single order from its Same Day batch (deletes the Delivery record).
 * Order reverts to ACCEPTED with no rider — reappears in unassigned pool.
 * Blocked once delivery reaches PICKED_UP or beyond.
 */
export async function removeOrderFromBatch({ delivery_id }) {
  const delivery = await prisma.delivery.findUnique({
    where: { delivery_id },
  });

  if (!delivery) throw new Error("Delivery not found");
  if (!delivery.batch_group_id) throw new Error("Not a batch delivery");

  const REMOVABLE = ["PENDING_ASSIGNMENT", "RIDER_NOTIFIED", "ACCEPTED", "ARRIVED_AT_PHARMACY"];
  if (!REMOVABLE.includes(delivery.status)) {
    throw new Error(
      `Cannot remove — status is ${delivery.status}. Only allowed before pickup.`
    );
  }

  const oldRiderId = delivery.rider_id;
  const batchGroupId = delivery.batch_group_id;

  await prisma.delivery.delete({
    where: { delivery_id },
  });

  // Notify rider
  sseService.notifyRider(oldRiderId, "order_removed_from_batch", {
    delivery_id,
    order_id: delivery.order_id,
  });

  // Notify CAdmins
  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: delivery.order_id,
    delivery_id,
    rider_id: null,
    status: "PENDING_ASSIGNMENT",
    batch_group_id: batchGroupId,
    timestamp: new Date().toISOString(),
  });

  return {
    order_id: delivery.order_id,
    batch_group_id: batchGroupId,
  };
}

// ── IST Day-Boundary Helpers (Batch History) ────────────────
function getISTDateString(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

function getISTDayRangeUTC(dateStr) {
  const dayStartUTC = new Date(`${dateStr}T00:00:00+05:30`);
  const dayEndUTC = new Date(dayStartUTC.getTime() + 24 * 60 * 60 * 1000);
  return { dayStartUTC, dayEndUTC };
}

/**
 * Get paginated Same Day batch HISTORY for a given IST calendar date.
 * A batch counts as "history" only when every delivery in it is terminal
 * (DELIVERED / FAILED / CANCELLED). Mixed outcomes are flagged "Completed".
 *
 * Uses raw SQL for the group-level aggregate + pagination (bool_and / MAX
 * over a COALESCE'd completion timestamp cannot be expressed via
 * Prisma's groupBy), then a normal Prisma fetch for full order/rider detail
 * on just that page's batch_group_ids.
 */
export async function getBatchHistory({ date, page = 1, limit = 20 }) {
  const targetDate = date || getISTDateString();
  const { dayStartUTC, dayEndUTC } = getISTDayRangeUTC(targetDate);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;

  // Step 1: Count total matching batches for this day
  const countRows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT batch_group_id
      FROM deliveries
      WHERE batch_group_id IS NOT NULL
      GROUP BY batch_group_id
      HAVING bool_and(status IN ('DELIVERED', 'FAILED', 'CANCELLED'))
         AND MAX(COALESCE(delivered_at, failed_at, updated_at)) >= ${dayStartUTC}
         AND MAX(COALESCE(delivered_at, failed_at, updated_at)) <  ${dayEndUTC}
    ) sub
  `;
  const totalItems = Number(countRows[0]?.total || 0);

  if (totalItems === 0) {
    return {
      date: targetDate,
      batches: [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_items: 0,
        total_pages: 1,
      },
    };
  }

  // Step 2: Fetch the paginated window of candidate batch_group_ids
  const candidates = await prisma.$queryRaw`
    SELECT
      batch_group_id,
      MAX(COALESCE(delivered_at, failed_at, updated_at)) AS completion_time,
      MIN(assigned_at) AS first_assigned_at,
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE status = 'DELIVERED')::int AS delivered_count,
      COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed_count,
      COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled_count
    FROM deliveries
    WHERE batch_group_id IS NOT NULL
    GROUP BY batch_group_id
    HAVING bool_and(status IN ('DELIVERED', 'FAILED', 'CANCELLED'))
       AND MAX(COALESCE(delivered_at, failed_at, updated_at)) >= ${dayStartUTC}
       AND MAX(COALESCE(delivered_at, failed_at, updated_at)) <  ${dayEndUTC}
    ORDER BY completion_time DESC
    LIMIT ${limitNum} OFFSET ${offset}
  `;

  const bgIds = candidates.map((c) => c.batch_group_id);

  // Step 3: Fetch full order/rider details for this page's batches
  const deliveries = await prisma.delivery.findMany({
    where: { batch_group_id: { in: bgIds } },
    include: {
      order: {
        select: {
          order_id: true,
          order_number: true,
          status: true,
          customer_name_snapshot: true,
          customer_phone_snapshot: true,
          pickup_otp: true,
          delivery_otp: true,
          branch: { select: { branch_name: true } },
        },
      },
      rider: {
        select: {
          rider_id: true,
          full_name: true,
          phone: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  // Step 4: Group deliveries by batch_group_id
  const deliveryMap = new Map();
  for (const d of deliveries) {
    if (!deliveryMap.has(d.batch_group_id)) {
      deliveryMap.set(d.batch_group_id, []);
    }
    deliveryMap.get(d.batch_group_id).push(d);
  }

  // Step 5: Build final batch objects, preserving candidate (completion_time DESC) order
  const batches = candidates.map((c) => {
    const batchDeliveries = deliveryMap.get(c.batch_group_id) || [];
    const first = batchDeliveries[0];

    const totalOrders = Number(c.total_orders);
    const deliveredCount = Number(c.delivered_count);
    const failedCount = Number(c.failed_count);
    const cancelledCount = Number(c.cancelled_count);

    let badge;
    if (deliveredCount === totalOrders) {
      badge = "Delivered";
    } else if (deliveredCount === 0) {
      badge = "Cancelled";
    } else {
      badge = "Completed";
    }

    const completionTime = c.completion_time;
    const firstAssignedAt = c.first_assigned_at;
    const durationMinutes =
      firstAssignedAt && completionTime
        ? Math.round(
            (new Date(completionTime).getTime() -
              new Date(firstAssignedAt).getTime()) /
              60000,
          )
        : null;

    return {
      batch_group_id: c.batch_group_id,
      rider_id: first?.rider_id || null,
      rider_name: first?.rider?.full_name || null,
      rider_phone: first?.rider?.phone || null,
      order_count: totalOrders,
      delivered_count: deliveredCount,
      failed_count: failedCount,
      cancelled_count: cancelledCount,
      badge,
      completed_at: completionTime,
      duration_minutes: durationMinutes,
      orders: batchDeliveries.map((d) => ({
        delivery_id: d.delivery_id,
        order_id: d.order_id,
        order_number: d.order.order_number,
        order_status: d.order.status,
        delivery_status: d.status,
        customer_name: d.order.customer_name_snapshot,
        customer_phone: d.order.customer_phone_snapshot,
        branch_name: d.order.branch?.branch_name || null,
        pickup_otp: d.order.pickup_otp,
        delivery_otp: d.order.delivery_otp,
        delivered_at: d.delivered_at,
        failed_at: d.failed_at,
        pickup_fee: d.pickup_fee,
        drop_fee: d.drop_fee,
        surge_fee: d.surge_fee,
        floor_topup_fee: d.floor_topup_fee,
        total_rider_earning: d.total_rider_earning,
        tip_amount: d.tip_amount,
      })),
    };
  });

  return {
    date: targetDate,
    batches,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total_items: totalItems,
      total_pages: Math.max(1, Math.ceil(totalItems / limitNum)),
    },
  };
}

/**
 * Get all orders in a Same Day batch by batch_group_id.
 * Used by CAdmin to view and manage batch contents.
 */
export async function getBatchOrders(batch_group_id) {
  const deliveries = await prisma.delivery.findMany({
    where: { batch_group_id },
    include: {
      order: {
        select: {
          order_id: true,
          order_number: true,
          status: true,
          customer_name_snapshot: true,
          customer_phone_snapshot: true,
          branch: { select: { branch_name: true } },
        },
      },
      rider: {
        select: {
          rider_id: true,
          full_name: true,
          phone: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  if (deliveries.length === 0) {
    throw new Error("Batch not found");
  }

  return {
    batch_group_id,
    rider_id: deliveries[0].rider_id,
    rider_name: deliveries[0].rider?.full_name || null,
    rider_phone: deliveries[0].rider?.phone || null,
    order_count: deliveries.length,
    orders: deliveries.map((d) => ({
      delivery_id: d.delivery_id,
      order_id: d.order_id,
      order_number: d.order.order_number,
      order_status: d.order.status,
      delivery_status: d.status,
      customer_name: d.order.customer_name_snapshot,
      customer_phone: d.order.customer_phone_snapshot,
      branch_name: d.order.branch?.branch_name || null,
    })),
  };
}