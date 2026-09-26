// backend/src/modules/marketplace-orders/marketplace.orders.service.js (do not remove this comment)
import prisma from "../../config/prisma.js";
import {
  fireOrderPlacedEvents,
  fireOrderStatusChangedEvents,
} from "./marketplace.orders.events.js";
import { resolveAssetUrl } from "../../services/assetUrl.service.js";
import { deleteFile } from "../../services/fileStorage.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PRESCRIPTION_FOLDER = "order_prescriptions";

/**
 * Valid state transitions.
 * Key = current status, Value = statuses it can move to.
 */
const VALID_TRANSITIONS = {
  PLACED: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

/**
 * How many days until prescriptions expire after order resolution.
 * Key = terminal status, Value = days from resolution timestamp.
 */
const PRESCRIPTION_EXPIRY_DAYS = {
  COMPLETED: 10,
  REJECTED: 10,
  CANCELLED: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate next order number from Postgres sequence.
 * Format: MKT-000001
 */
async function generateOrderNumber() {
  const result =
    await prisma.$queryRaw`SELECT nextval('marketplace_order_seq') as seq`;
  const seq = result[0].seq;
  return `MKT-${String(seq).padStart(6, "0")}`;
}

/**
 * Assert that a state transition is valid.
 * Throws if the transition is not allowed.
 */
function assertValidTransition(currentStatus, targetStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Cannot transition order from ${currentStatus} to ${targetStatus}`,
    );
  }
}

/**
 * Compute the prescription expiry timestamp for a given terminal status.
 * Returns null for non-terminal statuses (should not be called).
 *
 * @param {string} status
 * @param {Date}   [now]
 * @returns {Date|null}
 */
function computePrescriptionExpiry(status, now = new Date()) {
  const days = PRESCRIPTION_EXPIRY_DAYS[status];
  if (!days) return null;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Generate two distinct 4-digit OTPs for pickup and delivery verification.
 * Guarantees pickup_otp !== delivery_otp.
 *
 * @returns {{ pickup_otp: string, delivery_otp: string }}
 */
export function generateDistinctOtps() {
  const pickup = String(Math.floor(1000 + Math.random() * 9000));
  let delivery = String(Math.floor(1000 + Math.random() * 9000));
  while (delivery === pickup) {
    delivery = String(Math.floor(1000 + Math.random() * 9000));
  }
  return { pickup_otp: pickup, delivery_otp: delivery };
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACE ORDER (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Place a new marketplace order.
 *
 * @param {Object} options
 * @param {string}   options.customer_id
 * @param {string}   options.branch_id
 * @param {Array}    options.items                - [{ variantId, quantity }]
 * @param {string}   options.delivery_address_id
 * @param {string}   [options.notes]
 * @param {Array}    [options.prescription_files]
 */
export async function placeOrder({
  customer_id,
  branch_id,
  items: cartItems,
  delivery_address_id,
  notes,
  prescription_files = [],
}) {
  // ── 1. Validate customer ──────────────────────────────────────────────────
  const customer = await prisma.cureliMobileUser.findUnique({
    where: { id: customer_id },
    select: { id: true, full_name: true, phone: true, status: true },
  });

  if (!customer || customer.status !== "active") {
    throw new Error("Customer account is not active");
  }

  // ── 2. Validate delivery address ──────────────────────────────────────────
  const address = await prisma.cureliMobileAddress.findFirst({
    where: { id: delivery_address_id, user_id: customer_id, deleted_at: null },
  });

  if (!address) {
    throw new Error("Delivery address not found");
  }

  // ── 3. Validate branch ────────────────────────────────────────────────────
  const branchSettings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id },
    select: {
      marketplace_enabled: true,
      branch: {
        select: { shop_id: true, branch_name: true, is_active: true },
      },
    },
  });

  if (!branchSettings || !branchSettings.branch.is_active) {
    throw new Error("Branch is not available");
  }

  if (!branchSettings.marketplace_enabled) {
    throw new Error("This branch is not accepting marketplace orders");
  }

  const shop_id = branchSettings.branch.shop_id;

  // ── 4. Validate and snapshot each cart item ───────────────────────────────
  const resolvedItems = [];
  let requiresPrescription = false;

  for (const cartItem of cartItems) {
    const { variantId, quantity } = cartItem;

    if (!quantity || quantity < 1) {
      throw new Error("Invalid quantity for item");
    }

    const listing = await prisma.marketplaceListing.findFirst({
      where: { linked_variant_id: variantId, branch_id },
      select: {
        listing_id: true,
        medicine_id: true,
        linked_variant_id: true,
        is_visible: true,
        stock_status: true,
        marketplace_price: true,
        requires_prescription: true,
        linkedVariant: {
          select: {
            name: true,
            sku_id: true,
            brand: true,
            pack_size: true,
            mrp: true,
          },
        },
      },
    });

    if (!listing) throw new Error("One or more items are no longer available");
    if (!listing.is_visible)
      throw new Error("One or more items are no longer listed");
    if (listing.stock_status !== "IN_STOCK")
      throw new Error("One or more items are out of stock");
    if (listing.marketplace_price === null)
      throw new Error("One or more items have no price set");

    if (listing.requires_prescription) requiresPrescription = true;

    const unitPrice = Number(listing.marketplace_price);
    const mrp = listing.linkedVariant?.mrp
      ? Number(listing.linkedVariant.mrp)
      : unitPrice;

    resolvedItems.push({
      listing_id: listing.listing_id,
      medicine_id: listing.medicine_id,
      variant_id: listing.linked_variant_id,
      medicine_name_snapshot: listing.linkedVariant?.name ?? "Unknown",
      variant_sku_snapshot: listing.linkedVariant?.sku_id ?? "",
      brand_snapshot: listing.linkedVariant?.brand ?? null,
      pack_size_snapshot: listing.linkedVariant?.pack_size ?? null,
      unit_price_snapshot: unitPrice,
      mrp_snapshot: mrp,
      requires_prescription_snapshot: listing.requires_prescription,
      quantity,
      line_total: unitPrice * quantity,
    });
  }

  // ── 5. Prescription gate ──────────────────────────────────────────────────
  if (requiresPrescription && prescription_files.length === 0) {
    throw new Error(
      "This order requires a prescription. Please upload at least one prescription file.",
    );
  }

  // ── 6. Calculate totals ───────────────────────────────────────────────────
  const subtotal = resolvedItems.reduce(
    (sum, item) => sum + item.line_total,
    0,
  );
  const total_amount = subtotal;

  // ── 7. Snapshot delivery address ──────────────────────────────────────────
  const delivery_address_snapshot = {
    label: address.label,
    address_line_1: address.address_line_1,
    address_line_2: address.address_line_2 ?? null,
    landmark: address.landmark ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    latitude: address.latitude ? Number(address.latitude) : null,
    longitude: address.longitude ? Number(address.longitude) : null,
    recipient_name: address.recipient_name ?? null,
    recipient_phone: address.recipient_phone ?? null,
  };

  // ── 8. Generate order number & distinct OTPs ──────────────────────────────
  const order_number = await generateOrderNumber();
  const { pickup_otp, delivery_otp } = generateDistinctOtps();

  // ── 9. Database transaction ───────────────────────────────────────────────
  const now = new Date();

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.marketplaceOrder.create({
      data: {
        order_number,
        shop_id,
        branch_id,
        customer_id,
        delivery_address_id,
        delivery_address_snapshot,
        customer_name_snapshot: customer.full_name ?? customer.phone,
        customer_phone_snapshot: customer.phone,
        status: "PLACED",
        payment_method: "COD",
        payment_status: "PENDING",
        subtotal,
        total_amount,
        requires_prescription: requiresPrescription,
        notes: notes ?? null,
        placed_at: now,
        pickup_otp,
        delivery_otp,
      },
    });

    await tx.marketplaceOrderItem.createMany({
      data: resolvedItems.map((item) => ({
        order_id: order.order_id,
        listing_id: item.listing_id,
        medicine_id: item.medicine_id,
        variant_id: item.variant_id,
        medicine_name_snapshot: item.medicine_name_snapshot,
        variant_sku_snapshot: item.variant_sku_snapshot,
        brand_snapshot: item.brand_snapshot,
        pack_size_snapshot: item.pack_size_snapshot,
        unit_price_snapshot: item.unit_price_snapshot,
        mrp_snapshot: item.mrp_snapshot,
        requires_prescription_snapshot: item.requires_prescription_snapshot,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
    });

    if (prescription_files.length > 0) {
      await tx.marketplaceOrderPrescription.createMany({
        data: prescription_files.map((file, index) => ({
          order_id: order.order_id,
          storage_key: file.prescription_key,
          original_name: file.original_name,
          mime_type: file.mime_type,
          file_size: file.file_size,
          sequence: index,
        })),
      });
    }

    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id: order.order_id,
        from_status: null,
        to_status: "PLACED",
        changed_by_type: "customer",
        changed_by_id: customer_id,
        reason: null,
      },
    });

    return order;
  });

  // ── 10. Fire events post-commit ───────────────────────────────────────────
  await fireOrderPlacedEvents({
    ...createdOrder,
    items: resolvedItems,
  });

  return {
    order_id: createdOrder.order_id,
    order_number: createdOrder.order_number,
    status: createdOrder.status,
    total_amount: Number(createdOrder.total_amount),
    placed_at: createdOrder.placed_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION ORDER STATUS — Single domain function for ALL transitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified state transition handler.
 * Used by ERP pharmacy actions, customer cancellation, and system cron.
 *
 * @param {Object} options
 * @param {string}      options.order_id
 * @param {string}      options.target_status
 * @param {string}      options.actor_type       - 'pharmacy' | 'customer' | 'system'
 * @param {string|null} options.actor_id         - null for system
 * @param {string|null} [options.shop_id]        - Required for pharmacy actor (scope check)
 * @param {string|null} [options.reason]         - Required for REJECTED
 * @param {string|null} [options.reason_other]   - Required when reason = OTHER
 */
export async function transitionOrderStatus({
  order_id,
  target_status,
  actor_type,
  actor_id,
  shop_id = null,
  reason = null,
  reason_other = null,
}) {
  // ── Fetch current order ───────────────────────────────────────────────────
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      order_number: true,
      shop_id: true,
      customer_id: true,
      status: true,
      customer_name_snapshot: true,
    },
  });

  if (!order) throw new Error("Order not found");

  // ── Scope check for pharmacy actor ───────────────────────────────────────
  if (actor_type === "pharmacy" && shop_id && order.shop_id !== shop_id) {
    throw new Error("Order not found");
  }

  // ── Scope check for customer actor ───────────────────────────────────────
  if (actor_type === "customer" && actor_id && order.customer_id !== actor_id) {
    throw new Error("Order not found");
  }

  // ── Validate transition ───────────────────────────────────────────────────
  assertValidTransition(order.status, target_status);

  // ── Rejection requires a reason ───────────────────────────────────────────
  if (target_status === "REJECTED" && !reason) {
    throw new Error("A rejection reason is required");
  }

  // ── Build update payload ──────────────────────────────────────────────────
  const now = new Date();
  const updateData = { status: target_status };

  if (target_status === "ACCEPTED") updateData.accepted_at = now;
  if (target_status === "READY_FOR_PICKUP") updateData.ready_at = now;
  if (target_status === "COMPLETED") updateData.completed_at = now;
  if (target_status === "CANCELLED") {
    updateData.cancelled_at = now;
    updateData.cancelled_by = actor_type === "system" ? "system" : actor_type;
  }
  if (target_status === "REJECTED") {
    updateData.rejected_at = now;
    updateData.rejection_reason = reason;
    updateData.rejection_reason_other = reason_other ?? null;
  }
  if (target_status === "COMPLETED" && actor_type === "system") {
    updateData.auto_completed = true;
  }

  // ── Atomic transaction: update order + history + delivery + prescription ──
  await prisma.$transaction(async (tx) => {
    // Re-fetch inside transaction with branch & delivery for delivery lifecycle
    const current = await tx.marketplaceOrder.findUnique({
      where: { order_id },
      include: {
        branch: {
          select: {
            marketplaceSettings: {
              select: { latitude: true, longitude: true },
            },
          },
        },
        delivery: true,
      },
    });

    if (current.status !== order.status) {
      throw new Error(
        "Order status changed by another request. Please refresh.",
      );
    }

    // 1. Update order status
    await tx.marketplaceOrder.update({
      where: { order_id },
      data: updateData,
    });

    // 2. Write status history
    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id,
        from_status: order.status,
        to_status: target_status,
        changed_by_type: actor_type,
        changed_by_id: actor_id,
        reason:
          target_status === "REJECTED"
            ? reason
            : target_status === "CANCELLED"
              ? actor_type
              : actor_type === "system"
                ? "auto_completed"
                : null,
      },
    });

    // 3. AUTO-CREATE DELIVERY on ACCEPTED
    if (target_status === "ACCEPTED" && !current.delivery) {
      const pickupLat = current.branch?.marketplaceSettings?.latitude ?? null;
      const pickupLng = current.branch?.marketplaceSettings?.longitude ?? null;
      const addressSnapshot = current.delivery_address_snapshot || {};
      const dropLat = addressSnapshot.latitude ?? null;
      const dropLng = addressSnapshot.longitude ?? null;

      await tx.delivery.create({
        data: {
          order_id: current.order_id,
          status: "PENDING_ASSIGNMENT",
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          drop_lat: dropLat,
          drop_lng: dropLng,
        },
      });
    }

    // 4. CANCEL DELIVERY IF ORDER IS CANCELLED
    if (target_status === "CANCELLED" && current.delivery) {
      await tx.delivery.update({
        where: { order_id },
        data: {
          status: "CANCELLED",
          failed_at: now,
          failure_note: `Order cancelled by ${actor_type}`,
        },
      });
    }

    // 5. Set prescription expiry timestamp on terminal status
    const expiresAt = computePrescriptionExpiry(target_status, now);
    if (expiresAt) {
      await tx.marketplaceOrderPrescription.updateMany({
        where: { order_id },
        data: { expires_at: expiresAt },
      });
    }
  });

  // ── Post-commit: If READY_FOR_PICKUP, notify assigned rider via SSE ──────
  if (target_status === "READY_FOR_PICKUP") {
    const delivery = await prisma.delivery.findUnique({
      where: { order_id },
      select: { delivery_id: true, rider_id: true },
    });

    if (delivery?.rider_id) {
      const { sseService } = await import("../../services/sse.service.js");
      sseService.notifyRider(delivery.rider_id, "order_ready_for_pickup", {
        delivery_id: delivery.delivery_id,
        order_id,
        order_number: order.order_number,
      });
    }
  }

  // ── Fire events post-commit ───────────────────────────────────────────────
  await fireOrderStatusChangedEvents({
    order_id,
    order_number: order.order_number,
    shop_id: order.shop_id,
    customer_id: order.customer_id,
    new_status: target_status,
    customer_name: order.customer_name_snapshot,
  });

  return {
    order_id,
    order_number: order.order_number,
    status: target_status,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL ORDER (Mobile Customer) — thin wrapper over transitionOrderStatus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Customer cancels their own order.
 * Only allowed when status = PLACED.
 *
 * @param {string} order_id
 * @param {string} customer_id
 */
export async function cancelOrder(order_id, customer_id) {
  return transitionOrderStatus({
    order_id,
    target_status: "CANCELLED",
    actor_type: "customer",
    actor_id: customer_id,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER LIST (ERP)
// ─────────────────────────────────────────────────────────────────────────────

export async function getErpOrders(shop_id, query = {}) {
  const { status, page = 1, limit = 20 } = query;

  const where = { shop_id };

  if (status) {
    const statuses = status.split(",").map((s) => s.trim());
    where.status = { in: statuses };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where,
      orderBy: { placed_at: "desc" },
      skip,
      take: Number(limit),
      select: {
        order_id: true,
        order_number: true,
        status: true,
        customer_name_snapshot: true,
        customer_phone_snapshot: true,
        total_amount: true,
        requires_prescription: true,
        placed_at: true,
        accepted_at: true,
        ready_at: true,
        completed_at: true,
        rejected_at: true,
        cancelled_at: true,
        rejection_reason: true,
        notes: true,
        patient_is_self: true,
        patient_name_snapshot: true,
        patient_age_snapshot: true,
        patient_sex_snapshot: true,
        items: {
          select: {
            item_id: true,
            medicine_name_snapshot: true,
            brand_snapshot: true,
            pack_size_snapshot: true,
            quantity: true,
            unit_price_snapshot: true,
            mrp_snapshot: true,
            line_total: true,
            requires_prescription_snapshot: true,
            variant_sku_snapshot: true,
            variant: {
              select: { sku_id: true, images: true },
            },
          },
        },
        _count: {
          select: { prescriptions: true },
        },
      },
    }),
    prisma.marketplaceOrder.count({ where }),
  ]);

  return {
    orders: orders.map(formatErpOrderSummary),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER DETAIL (ERP)
// ─────────────────────────────────────────────────────────────────────────────

export async function getErpOrderDetail(order_id, shop_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      items: {
        include: {
          variant: { select: { sku_id: true, images: true } },
        },
      },
      prescriptions: {
        orderBy: { sequence: "asc" },
      },
      statusHistory: {
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!order || order.shop_id !== shop_id) {
    throw new Error("Order not found");
  }

  return formatErpOrderDetail(order);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER LIST (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

export async function getMobileOrders(customer_id, query = {}) {
  const { page = 1, limit = 20 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where: { customer_id },
      orderBy: { placed_at: "desc" },
      skip,
      take: Number(limit),
      select: {
        order_id: true,
        order_number: true,
        status: true,
        total_amount: true,
        requires_prescription: true,
        placed_at: true,
        accepted_at: true,
        ready_at: true,
        completed_at: true,
        rejected_at: true,
        cancelled_at: true,
        rejection_reason: true,
        notes: true,
        shop: {
          select: { business_name: true },
        },
        delivery: {
          select: { status: true },
        },
        items: {
          select: {
            item_id: true,
            medicine_name_snapshot: true,
            brand_snapshot: true,
            pack_size_snapshot: true,
            quantity: true,
            unit_price_snapshot: true,
            mrp_snapshot: true,
            line_total: true,
            requires_prescription_snapshot: true,
            variant_sku_snapshot: true,
            variant: {
              select: { sku_id: true, images: true },
            },
          },
        },
      },
    }),
    prisma.marketplaceOrder.count({ where: { customer_id } }),
  ]);

  return {
    orders: orders.map(formatMobileOrderSummary),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ORDER DETAIL (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

export async function getMobileOrderDetail(order_id, customer_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      items: {
        include: {
          variant: { select: { sku_id: true, images: true } },
        },
      },
      prescriptions: {
        orderBy: { sequence: "asc" },
      },
      statusHistory: {
        orderBy: { created_at: "asc" },
      },
      shop: {
        select: {
          business_name: true,
        },
      },
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
      delivery: {
        select: {
          delivery_id: true,
          status: true,
          pickup_lat: true,
          pickup_lng: true,
          drop_lat: true,
          drop_lng: true,
          pickup_distance_km: true,
          drop_distance_km: true,
          total_distance_km: true,
          assigned_at: true,
          accepted_at: true,
          arrived_at_pharmacy_at: true,
          picked_up_at: true,
          arrived_at_customer_at: true,
          delivered_at: true,
          rider: {
            select: {
              rider_id: true,
              full_name: true,
              phone: true,
              profile_photo_key: true,
              vehicle_type: true,
              vehicle_number: true,
              vehicle_make_model: true,
              rating: true,
              total_ratings: true,
              current_lat: true,
              current_lng: true,
              last_location_at: true,
            },
          },
        },
      },
    },
  });

  if (!order || order.customer_id !== customer_id) {
    throw new Error("Order not found");
  }

  return formatMobileOrderDetail(order);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRESCRIPTION SIGNED URL
// ─────────────────────────────────────────────────────────────────────────────

export async function getPrescriptionSignedUrl(
  prescription_id,
  accessor_type,
  accessor_id,
) {
  const prescription = await prisma.marketplaceOrderPrescription.findUnique({
    where: { prescription_id },
    include: {
      order: {
        select: { shop_id: true, customer_id: true },
      },
    },
  });

  if (!prescription) throw new Error("Prescription not found");

  if (
    accessor_type === "pharmacy" &&
    prescription.order.shop_id !== accessor_id
  ) {
    throw new Error("Prescription not found");
  }

  if (
    accessor_type === "customer" &&
    prescription.order.customer_id !== accessor_id
  ) {
    throw new Error("Prescription not found");
  }

  if (prescription.deleted_at !== null) {
    throw new Error("Prescription expired");
  }

  const { getSignedUrl } =
    await import("../../services/fileStorage.service.js");

  const url = await getSignedUrl({
    folder: PRESCRIPTION_FOLDER,
    filename: prescription.storage_key,
    expiresIn: 900,
  });

  return { url, expires_in: 900 };
}

// ─────────────────────────────────────────────────────────────────────────────
// REORDER ITEMS VALIDATION (Mobile Customer)
// ─────────────────────────────────────────────────────────────────────────────

export async function getReorderItems(order_id, customer_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      customer_id: true,
      branch_id: true,
      shop_id: true,
      shop: { select: { business_name: true } },
      branch: {
        select: {
          branch_name: true,
          marketplaceSettings: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      },
      items: {
        select: {
          item_id: true,
          variant_id: true,
          medicine_name_snapshot: true,
          quantity: true,
        },
      },
    },
  });

  if (!order || order.customer_id !== customer_id) {
    throw new Error("Order not found");
  }

  const available = [];
  const unavailable = [];

  for (const item of order.items) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        linked_variant_id: item.variant_id,
        branch_id: order.branch_id,
      },
      select: {
        listing_id: true,
        is_visible: true,
        stock_status: true,
        marketplace_price: true,
        requires_prescription: true,
        linkedVariant: {
          select: {
            variant_id: true,
            sku_id: true,
            name: true,
            brand: true,
            manufacturer: true,
            images: true,
            master: {
              select: {
                primary_category: true,
              },
            },
          },
        },
      },
    });

    if (!listing || !listing.is_visible) {
      unavailable.push({
        medicine_name: item.medicine_name_snapshot,
        reason: "not_listed",
      });
      continue;
    }

    if (listing.stock_status !== "IN_STOCK") {
      unavailable.push({
        medicine_name: item.medicine_name_snapshot,
        reason: "out_of_stock",
      });
      continue;
    }

    if (listing.marketplace_price === null) {
      unavailable.push({
        medicine_name: item.medicine_name_snapshot,
        reason: "no_price",
      });
      continue;
    }

    const images = listing.linkedVariant?.images ?? [];
    const firstImage = Array.isArray(images) ? images[0] : null;
    let imageUrl = null;
    if (firstImage) {
      imageUrl = firstImage.startsWith("medicine_images/")
        ? resolveAssetUrl(firstImage)
        : resolveAssetUrl(
            `medicine_images/${listing.linkedVariant.sku_id}/${firstImage}`,
          );
    }

    available.push({
      variantId: item.variant_id,
      skuId: listing.linkedVariant.sku_id,
      name: listing.linkedVariant.name,
      manufacturer: listing.linkedVariant.manufacturer ?? null,
      image: imageUrl,
      pricePerUnit: Number(listing.marketplace_price),
      requiresPrescription: listing.requires_prescription,
      category: listing.linkedVariant.master?.primary_category ?? null,
      quantity: item.quantity,
      shopId: order.shop_id,
      shopName: order.shop?.business_name ?? "",
      branchId: order.branch_id,
      branchName: order.branch?.branch_name ?? "",
      branchLatitude: order.branch?.marketplaceSettings?.latitude
        ? Number(order.branch.marketplaceSettings.latitude)
        : null,
      branchLongitude: order.branch?.marketplaceSettings?.longitude
        ? Number(order.branch.marketplaceSettings.longitude)
        : null,
    });
  }

  return {
    branch_id: order.branch_id,
    branch_name: order.branch?.branch_name ?? null,
    shop_id: order.shop_id,
    shop_name: order.shop?.business_name ?? null,
    available,
    unavailable,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET BILLING DATA (ERP — for SalesBillingPage auto-population)
// ─────────────────────────────────────────────────────────────────────────────

export async function getMarketplaceBillingData(order_id, shop_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              medicine_id: true,
              name: true,
              manufacturer: true,
              pack_size: true,
              hsn_code: true,
              gst_percentage: true,
              cgst_percentage: true,
              sgst_percentage: true,
              rack_no: true,
            },
          },
        },
      },
    },
  });

  if (!order || order.shop_id !== shop_id) throw new Error("Order not found");
  if (order.sales_invoice_id) throw new Error("Order has already been billed");
  if (!["PLACED", "ACCEPTED"].includes(order.status))
    throw new Error("Only PLACED or ACCEPTED orders can be billed");

  const itemsWithBatches = await Promise.all(
    order.items.map(async (item) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const batches = await prisma.inventory.findMany({
        where: {
          medicine_id: item.medicine_id,
          branch_id: order.branch_id,
          is_active: true,
          is_expired: false,
          available_stock: { gt: 0 },
          expiry_date: { gte: today },
        },
        orderBy: { expiry_date: "asc" },
        select: {
          inventory_id: true,
          batch_number: true,
          expiry_date: true,
          available_stock: true,
          mrp: true,
          selling_rate: true,
          rack_no: true,
        },
      });

      return {
        item_id: item.item_id,
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name_snapshot,
        brand: item.brand_snapshot,
        pack_size: item.pack_size_snapshot,
        ordered_quantity: item.quantity,
        marketplace_price: Number(item.unit_price_snapshot),
        medicine: item.medicine
          ? {
              name: item.medicine.name,
              manufacturer: item.medicine.manufacturer,
              hsn_code: item.medicine.hsn_code,
              cgst_percentage: item.medicine.cgst_percentage
                ? Number(item.medicine.cgst_percentage)
                : 6,
              sgst_percentage: item.medicine.sgst_percentage
                ? Number(item.medicine.sgst_percentage)
                : 6,
              rack_no: item.medicine.rack_no,
            }
          : null,
        available_batches: batches.map((b) => ({
          inventory_id: b.inventory_id,
          batch_number: b.batch_number,
          expiry_date: b.expiry_date,
          available_stock: Number(b.available_stock),
          mrp: Number(b.mrp),
          selling_rate: b.selling_rate ? Number(b.selling_rate) : Number(b.mrp),
          rack_no: b.rack_no,
        })),
      };
    }),
  );

  return {
    order_id: order.order_id,
    order_number: order.order_number,
    branch_id: order.branch_id,
    customer_name: order.customer_name_snapshot,
    customer_phone: order.customer_phone_snapshot,
    delivery_address: order.delivery_address_snapshot,
    patient: {
      is_self: order.patient_is_self,
      name: order.patient_name_snapshot,
      age: order.patient_age_snapshot,
      sex: order.patient_sex_snapshot,
    },
    subtotal: Number(order.subtotal),
    total_amount: Number(order.total_amount),
    payment_method: order.payment_method,
    items: itemsWithBatches,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REGENERATE INVOICE PDF
// ─────────────────────────────────────────────────────────────────────────────

export async function regenerateInvoicePdf(order_id, shop_id) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      order_number: true,
      shop_id: true,
      sales_invoice_id: true,
      invoice_pdf_key: true,
      status: true,
    },
  });

  if (!order || order.shop_id !== shop_id) {
    throw new Error("Order not found");
  }

  if (!order.sales_invoice_id) {
    throw new Error("Order has not been billed yet");
  }

  if (order.invoice_pdf_key) {
    return { storageKey: order.invoice_pdf_key, already_exists: true };
  }

  const { generateMarketplaceInvoice } =
    await import("../mobile/invoice/invoice.service.js");

  const result = await generateMarketplaceInvoice(
    order.order_id,
    order.sales_invoice_id,
  );

  return { storageKey: result.storageKey, already_exists: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

function formatErpOrderSummary(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    customer_name: order.customer_name_snapshot,
    customer_phone: order.customer_phone_snapshot,
    total_amount: Number(order.total_amount),
    requires_prescription: order.requires_prescription,
    prescription_count: order._count?.prescriptions ?? 0,
    item_count: order.items?.length ?? 0,
    items: order.items?.map(formatOrderItem) ?? [],
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
    patient: {
      is_self: order.patient_is_self,
      name: order.patient_name_snapshot ?? null,
      age: order.patient_age_snapshot ?? null,
      sex: order.patient_sex_snapshot ?? null,
    },
  };
}

function formatErpOrderDetail(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    branch_id: order.branch_id,
    status: order.status,
    customer_name: order.customer_name_snapshot,
    customer_phone: order.customer_phone_snapshot,
    delivery_address: order.delivery_address_snapshot,
    total_amount: Number(order.total_amount),
    subtotal: Number(order.subtotal),
    service_charge: Number(order.service_charge ?? 0),
    delivery_fee: Number(order.delivery_fee ?? 0),
    km_surcharge: Number(order.km_surcharge ?? 0),
    tip: Number(order.tip ?? 0),
    requires_prescription: order.requires_prescription,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    notes: order.notes,
    pickup_otp: order.pickup_otp ?? null,
    rejection_reason: order.rejection_reason,
    rejection_reason_other: order.rejection_reason_other,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
    patient: {
      is_self: order.patient_is_self,
      name: order.patient_name_snapshot ?? null,
      age: order.patient_age_snapshot ?? null,
      sex: order.patient_sex_snapshot ?? null,
    },
    items: order.items.map(formatOrderItem),
    prescriptions: order.prescriptions.map((p) => ({
      prescription_id: p.prescription_id,
      original_name: p.original_name,
      mime_type: p.mime_type,
      file_size: p.file_size,
      sequence: p.sequence,
    })),
    status_history: order.statusHistory.map((h) => ({
      from_status: h.from_status,
      to_status: h.to_status,
      changed_by_type: h.changed_by_type,
      reason: h.reason,
      created_at: h.created_at,
    })),
  };
}

function formatMobileOrderSummary(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    delivery_status: order.delivery?.status ?? null,
    shop_name: order.shop?.business_name ?? null,
    total_amount: Number(order.total_amount),
    requires_prescription: order.requires_prescription,
    item_count: order.items?.length ?? 0,
    items: order.items?.map(formatOrderItem) ?? [],
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
  };
}

function formatMobileOrderDetail(order) {
  const delivery = order.delivery;
  const rider = delivery?.rider;

  // ── Resolve rider photo to a full accessible URL ──────────────────────
  let riderPhotoUrl = null;
  if (rider?.profile_photo_key) {
    riderPhotoUrl = resolveAssetUrl(rider.profile_photo_key);
  }

  // ── Build rich delivery object for live tracking ──────────────────────
  const deliveryData = delivery
    ? {
        delivery_id: delivery.delivery_id,
        status: delivery.status,
        pickup_location: {
          latitude: delivery.pickup_lat ? Number(delivery.pickup_lat) : null,
          longitude: delivery.pickup_lng ? Number(delivery.pickup_lng) : null,
        },
        drop_location: {
          latitude: delivery.drop_lat ? Number(delivery.drop_lat) : null,
          longitude: delivery.drop_lng ? Number(delivery.drop_lng) : null,
        },
        distances: {
          pickup_km: delivery.pickup_distance_km
            ? Number(delivery.pickup_distance_km)
            : null,
          drop_km: delivery.drop_distance_km
            ? Number(delivery.drop_distance_km)
            : null,
          total_km: delivery.total_distance_km
            ? Number(delivery.total_distance_km)
            : null,
        },
        timestamps: {
          assigned_at: delivery.assigned_at,
          accepted_at: delivery.accepted_at,
          arrived_at_pharmacy_at: delivery.arrived_at_pharmacy_at,
          picked_up_at: delivery.picked_up_at,
          arrived_at_customer_at: delivery.arrived_at_customer_at,
          delivered_at: delivery.delivered_at,
        },
        rider: rider
          ? {
              rider_id: rider.rider_id,
              name: rider.full_name,
              phone: rider.phone,
              photo_url: riderPhotoUrl,
              vehicle_type: rider.vehicle_type,
              vehicle_number: rider.vehicle_number,
              vehicle_make_model: rider.vehicle_make_model,
              rating: rider.rating,
              total_ratings: rider.total_ratings,
              current_location: {
                latitude: rider.current_lat ? Number(rider.current_lat) : null,
                longitude: rider.current_lng ? Number(rider.current_lng) : null,
                last_updated_at: rider.last_location_at,
              },
            }
          : null,
      }
    : null;

  // ── Resolve pharmacy contact & address ────────────────────────────────
  const pharmacyPhone =
    order.branch?.marketplaceSettings?.contact_override ||
    order.branch?.contact_number ||
    null;

  const pharmacyAddress =
    order.branch?.marketplaceSettings?.formatted_address ||
    [order.branch?.address_line_1, order.branch?.city]
      .filter(Boolean)
      .join(", ") ||
    null;

  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    shop_name: order.shop?.business_name ?? null,
    shop_phone: pharmacyPhone,
    branch_name: order.branch?.branch_name ?? null,
    branch_address: pharmacyAddress,
    // ── Expose branch coordinates for map fallback when delivery is null ──
    branch_latitude: order.branch?.marketplaceSettings?.latitude
      ? Number(order.branch.marketplaceSettings.latitude)
      : null,
    branch_longitude: order.branch?.marketplaceSettings?.longitude
      ? Number(order.branch.marketplaceSettings.longitude)
      : null,
    delivery_address: order.delivery_address_snapshot,
    total_amount: Number(order.total_amount),
    subtotal: Number(order.subtotal),
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    service_charge: Number(order.service_charge ?? 0),
    delivery_fee: Number(order.delivery_fee ?? 0),
    km_surcharge: Number(order.km_surcharge ?? 0),
    tip: Number(order.tip ?? 0),
    grand_total: Number(order.grand_total ?? order.total_amount),

    // ── Coupon & Loyalty breakdown for expanded tracking sheet ──
    coupon_code: order.coupon_code ?? null,
    coupon_discount_amount: Number(order.coupon_discount_amount ?? 0),
    loyalty_points_redeemed: order.loyalty_points_redeemed ?? 0,
    loyalty_discount_amount: Number(order.loyalty_discount_amount ?? 0),
    loyalty_points_earned: order.loyalty_points_earned ?? null,

    // ── Patient info (for "Ordering for Mom" tag) ───────────────
    patient_is_self: order.patient_is_self,
    patient_name_snapshot: order.patient_name_snapshot ?? null,

    // ── Delivery distance (km) ──────────────────────────────────
    distance_km: Number(order.distance_km ?? 0),

    invoice_generated_at: order.invoice_generated_at ?? null,
    requires_prescription: order.requires_prescription,
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    rejection_reason_other: order.rejection_reason_other,
    // ── OTP security: only expose when rider has arrived ────────────────
    delivery_otp:
      delivery?.status === "ARRIVED_AT_CUSTOMER"
        ? (order.delivery_otp ?? null)
        : null,
    // ── Full delivery + rider telemetry for live tracking ───────────────
    delivery: deliveryData,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
    items: order.items.map(formatOrderItem),
    prescriptions: order.prescriptions.map((p) => ({
      prescription_id: p.prescription_id,
      original_name: p.original_name,
      mime_type: p.mime_type,
      sequence: p.sequence,
      is_expired: p.deleted_at !== null,
    })),
    status_history: order.statusHistory.map((h) => ({
      from_status: h.from_status,
      to_status: h.to_status,
      changed_by_type: h.changed_by_type,
      reason: h.reason,
      created_at: h.created_at,
    })),
  };
}
function formatOrderItem(item) {
  return {
    item_id: item.item_id,
    medicine_name: item.medicine_name_snapshot,
    brand: item.brand_snapshot,
    pack_size: item.pack_size_snapshot,
    quantity: item.quantity,
    unit_price: Number(item.unit_price_snapshot),
    mrp: Number(item.mrp_snapshot),
    line_total: Number(item.line_total),
    requires_prescription: item.requires_prescription_snapshot,
    image_url: resolveOrderItemImageUrl(
      item.variant,
      item.variant_sku_snapshot,
    ),
  };
}

function resolveOrderItemImageUrl(variant, skuSnapshot) {
  const sku = variant?.sku_id ?? skuSnapshot ?? null;
  let imgs = variant?.images ?? null;

  if (!imgs) return null;

  if (typeof imgs === "string") {
    try {
      imgs = JSON.parse(imgs);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(imgs) || imgs.length === 0) return null;

  const first = imgs[0];
  if (!first) return null;

  if (first.startsWith("medicine_images/")) return resolveAssetUrl(first);
  if (sku) return resolveAssetUrl(`medicine_images/${sku}/${first}`);
  return resolveAssetUrl(first);
}
