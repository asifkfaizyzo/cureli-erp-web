// backend/src/modules/cadmin/delivery/cadmin.delivery.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";
import { sseService } from "../../../services/sse.service.js";
import { getDrivingDistance, estimateDrivingDistance } from "../../../services/distance.service.js";
import { registerActiveDelivery } from "../../rider/presence/rider.presence.service.js";

export async function getAvailableRidersForOrder({ order_id, rider_type, search }) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      order_number: true,
      status: true,
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

  const formattedRiders = riders.map((rider) => {
    const activeDelivery = rider.deliveries[0] || null;
    const distanceKm =
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
      distance_to_pharmacy_km: distanceKm,
      has_active_delivery: Boolean(activeDelivery),
      active_delivery_id: activeDelivery?.delivery_id || null,
      active_delivery_status: activeDelivery?.status || null,
      is_currently_assigned_to_this_order:
        order.delivery?.rider_id === rider.rider_id,
    };
  });

  formattedRiders.sort((a, b) => {
    if (a.is_online && !b.is_online) return -1;
    if (!a.is_online && b.is_online) return 1;
    if (a.distance_to_pharmacy_km !== null && b.distance_to_pharmacy_km !== null) {
      return a.distance_to_pharmacy_km - b.distance_to_pharmacy_km;
    }
    return 0;
  });

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
    throw new Error("Rider is currently offline. Please choose an online partner.");
  }

  if (rider.deliveries.length > 0 && rider.deliveries[0].order_id !== order_id) {
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
      ? getDrivingDistance(rider.current_lat, rider.current_lng, pharmacyLat, pharmacyLng)
      : Promise.resolve({ distanceKm: 0, durationSecs: 0, isEstimate: true }),
    pharmacyLat && pharmacyLng && dropLat && dropLng
      ? getDrivingDistance(pharmacyLat, pharmacyLng, dropLat, dropLng)
      : Promise.resolve({ distanceKm: 0, durationSecs: 0, isEstimate: true }),
  ]);

  const pickupDistKm = leg1.distanceKm;
  const dropDistKm = leg2.distanceKm;
  const totalDistKm = parseFloat((pickupDistKm + dropDistKm).toFixed(2));

  const result = await prisma.$transaction(async (tx) => {
    let deliveryRecord = order.delivery;

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

  // Fire SSE to Rider
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
    timestamp: now.toISOString(),
  });

  sseService.notifyAllCAdmins("delivery_status_changed", {
    order_id: order.order_id,
    delivery_id: result.delivery_id,
    rider_id: rider.rider_id,
    rider_name: rider.full_name,
    status: "RIDER_NOTIFIED",
    timestamp: now.toISOString(),
  });

  return {
    delivery_id: result.delivery_id,
    order_id: result.order_id,
    rider_id: result.rider_id,
    status: result.status,
    assigned_at: result.assigned_at,
  };
}