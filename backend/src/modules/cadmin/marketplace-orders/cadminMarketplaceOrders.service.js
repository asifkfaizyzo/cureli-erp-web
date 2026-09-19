// backend/src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.service.js

import prisma from "../../../config/prisma.js";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const TERMINAL_STATES = ["COMPLETED", "REJECTED", "CANCELLED"];

const VALID_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

const VALID_PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

const REASON_REQUIRED_PAYMENT_STATUSES = ["REFUNDED", "PARTIALLY_REFUNDED"];

// ─────────────────────────────────────────────
// LIST ALL ORDERS (across all shops)
// ─────────────────────────────────────────────

export const listAllOrders = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
}) => {
  const skip = (page - 1) * limit;

  const where = {};

  // Status filter — supports comma-separated values
  if (status) {
    const statuses = status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      where.status = { in: statuses };
    }
  }

  // Search — by order_number or customer name/phone
  if (search) {
    where.OR = [
      { order_number: { contains: search, mode: "insensitive" } },
      { customer_name_snapshot: { contains: search, mode: "insensitive" } },
      { customer_phone_snapshot: { contains: search, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where,
      orderBy: { placed_at: "desc" },
      skip,
      take: limit,
      select: {
        order_id: true,
        order_number: true,
        status: true,
        customer_name_snapshot: true,
        customer_phone_snapshot: true,
        total_amount: true,
        subtotal: true,
        requires_prescription: true,
        payment_method: true,
        payment_status: true,
        notes: true,
        rejection_reason: true,
        rejection_reason_other: true,
        cancelled_by: true,
        placed_at: true,
        accepted_at: true,
        ready_at: true,
        completed_at: true,
        rejected_at: true,
        cancelled_at: true,
        shop: {
          select: {
            shop_id: true,
            business_name: true,
            city: true,
            state: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
            city: true,
          },
        },
        _count: {
          select: {
            items: true,
            prescriptions: true,
          },
        },
      },
    }),
    prisma.marketplaceOrder.count({ where }),
  ]);

  return {
    orders: orders.map(formatOrderSummary),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

// ─────────────────────────────────────────────
// GET ORDER DETAIL
// ─────────────────────────────────────────────

export const getOrderDetail = async (order_id) => {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    include: {
      shop: {
        select: {
          shop_id: true,
          business_name: true,
          city: true,
          state: true,
          address_line_1: true,
        },
      },
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
          branch_type: true,
          city: true,
          state: true,
          contact_number: true,
          marketplaceSettings: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          phone: true,
          full_name: true,
          email: true,
          status: true,
        },
      },
      items: {
        select: {
          item_id: true,
          medicine_name_snapshot: true,
          variant_sku_snapshot: true,
          brand_snapshot: true,
          pack_size_snapshot: true,
          unit_price_snapshot: true,
          mrp_snapshot: true,
          requires_prescription_snapshot: true,
          quantity: true,
          line_total: true,
        },
      },
      prescriptions: {
        orderBy: { sequence: "asc" },
        select: {
          prescription_id: true,
          original_name: true,
          mime_type: true,
          file_size: true,
          sequence: true,
          uploaded_at: true,
        },
      },
      statusHistory: {
        orderBy: { created_at: "asc" },
        select: {
          history_id: true,
          from_status: true,
          to_status: true,
          changed_by_type: true,
          changed_by_id: true,
          reason: true,
          created_at: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  return formatOrderDetail(order);
};

// ─────────────────────────────────────────────
// UPDATE ORDER STATUS  (CAdmin override)
// ─────────────────────────────────────────────

/**
 * CAdmin override: change order status.
 * Records history with changed_by_type = "cadmin".
 */
export const updateOrderStatus = async ({
  order_id,
  new_status,
  reason = "",
  cadmin_name = "CAdmin",
}) => {
  if (!VALID_STATUSES.includes(new_status)) {
    const err = new Error("Invalid status");
    err.code = "INVALID_STATUS";
    throw err;
  }

  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      status: true,
      cancelled_by: true,
    },
  });

  if (!order) {
    const err = new Error("Order not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (TERMINAL_STATES.includes(order.status)) {
    const err = new Error(
      `Cannot change status — order is already ${order.status}`
    );
    err.code = "TERMINAL_STATE";
    throw err;
  }

  if (order.status === new_status) {
    const err = new Error("Order is already in this status");
    err.code = "SAME_STATUS";
    throw err;
  }

  // Reason required for REJECTED / CANCELLED
  if (
    (new_status === "REJECTED" || new_status === "CANCELLED") &&
    !reason?.trim()
  ) {
    const err = new Error("Reason is required when rejecting or cancelling");
    err.code = "REASON_REQUIRED";
    throw err;
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // Update order
    const updated = await tx.marketplaceOrder.update({
      where: { order_id },
      data: {
        status: new_status,
        ...(new_status === "ACCEPTED" && { accepted_at: now }),
        ...(new_status === "READY_FOR_PICKUP" && { ready_at: now }),
        ...(new_status === "COMPLETED" && { completed_at: now }),
        ...(new_status === "REJECTED" && {
          rejected_at: now,
          rejection_reason: "other",
          rejection_reason_other: reason.trim(),
        }),
        ...(new_status === "CANCELLED" && {
          cancelled_at: now,
          cancelled_by: "cadmin",
          // NOTE: Make sure your schema has `cancellation_reason` field.
          // If it doesn't, remove the next line.
          ...(reason.trim() && { cancellation_reason: reason.trim() }),
        }),
        updated_at: now,
      },
    });

    // Status history entry
    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id,
        from_status: order.status,
        to_status: new_status,
        changed_by_type: "cadmin",
        // NOTE: If your schema doesn't have `changed_by_name`, remove next line
        // and rely on changed_by_type only.
        // changed_by_name: cadmin_name,
        reason: reason?.trim() || null,
      },
    });

    return updated;
  });
};

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────

function formatOrderSummary(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    customer_name: order.customer_name_snapshot,
    customer_phone: order.customer_phone_snapshot,
    total_amount: Number(order.total_amount),
    requires_prescription: order.requires_prescription,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    cancelled_by: order.cancelled_by,
    item_count: order._count?.items ?? 0,
    prescription_count: order._count?.prescriptions ?? 0,
    shop: order.shop
      ? {
          shop_id: order.shop.shop_id,
          business_name: order.shop.business_name,
          city: order.shop.city,
          state: order.shop.state,
        }
      : null,
    branch: order.branch
      ? {
          branch_id: order.branch.branch_id,
          branch_name: order.branch.branch_name,
          city: order.branch.city,
        }
      : null,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
  };
}

function formatOrderDetail(order) {
  return {
    order_id: order.order_id,
    order_number: order.order_number,
    status: order.status,
    customer_name: order.customer_name_snapshot,
    customer_phone: order.customer_phone_snapshot,
    delivery_address: order.delivery_address_snapshot,
    total_amount: Number(order.total_amount),
    subtotal: Number(order.subtotal),
    requires_prescription: order.requires_prescription,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    notes: order.notes,
    rejection_reason: order.rejection_reason,
    rejection_reason_other: order.rejection_reason_other,
    cancelled_by: order.cancelled_by,
    auto_completed: order.auto_completed,
    placed_at: order.placed_at,
    accepted_at: order.accepted_at,
    ready_at: order.ready_at,
    completed_at: order.completed_at,
    rejected_at: order.rejected_at,
    cancelled_at: order.cancelled_at,
    shop: order.shop
      ? {
          shop_id: order.shop.shop_id,
          business_name: order.shop.business_name,
          city: order.shop.city,
          state: order.shop.state,
          address_line_1: order.shop.address_line_1,
        }
      : null,
    branch: order.branch
      ? {
          branch_id: order.branch.branch_id,
          branch_name: order.branch.branch_name,
          branch_type: order.branch.branch_type,
          city: order.branch.city,
          state: order.branch.state,
          contact_number: order.branch.contact_number,
          latitude: order.branch.marketplaceSettings?.latitude
            ? Number(order.branch.marketplaceSettings.latitude)
            : null,
          longitude: order.branch.marketplaceSettings?.longitude
            ? Number(order.branch.marketplaceSettings.longitude)
            : null,
        }
      : null,
    customer: order.customer
      ? {
          id: order.customer.id,
          full_name: order.customer.full_name,
          phone: order.customer.phone,
          email: order.customer.email,
          status: order.customer.status,
        }
      : null,
    items: order.items.map((item) => ({
      item_id: item.item_id,
      medicine_name: item.medicine_name_snapshot,
      sku: item.variant_sku_snapshot,
      brand: item.brand_snapshot,
      pack_size: item.pack_size_snapshot,
      unit_price: Number(item.unit_price_snapshot),
      mrp: Number(item.mrp_snapshot),
      requires_prescription: item.requires_prescription_snapshot,
      quantity: item.quantity,
      line_total: Number(item.line_total),
    })),
    prescriptions: order.prescriptions.map((p) => ({
      prescription_id: p.prescription_id,
      original_name: p.original_name,
      mime_type: p.mime_type,
      file_size: p.file_size,
      sequence: p.sequence,
      uploaded_at: p.uploaded_at,
    })),
    status_history: order.statusHistory.map((h) => ({
      history_id: h.history_id,
      from_status: h.from_status,
      to_status: h.to_status,
      changed_by_type: h.changed_by_type,
      reason: h.reason,
      created_at: h.created_at,
    })),
  };
}
/**
 * CAdmin override: change payment status.
 * Fires push + email to customer when REFUNDED or PARTIALLY_REFUNDED.
 */
export const updatePaymentStatus = async ({
  order_id,
  new_payment_status,
  reason = "",
  cadmin_name = "CAdmin",
}) => {
  if (!VALID_PAYMENT_STATUSES.includes(new_payment_status)) {
    const err = new Error("Invalid payment status");
    err.code = "INVALID_PAYMENT_STATUS";
    throw err;
  }

  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      order_number: true,
      payment_status: true,
      customer_id: true,
      total_amount: true,
      customer: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    const err = new Error("Order not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (order.payment_status === new_payment_status) {
    const err = new Error("Payment status is already set to this value");
    err.code = "SAME_STATUS";
    throw err;
  }

  if (
    REASON_REQUIRED_PAYMENT_STATUSES.includes(new_payment_status) &&
    !reason?.trim()
  ) {
    const err = new Error(
      "Reason is required when marking as refunded or partially refunded"
    );
    err.code = "REASON_REQUIRED";
    throw err;
  }

  const old_payment_status = order.payment_status;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update payment_status
    const result = await tx.marketplaceOrder.update({
      where: { order_id },
      data: {
        payment_status: new_payment_status,
        updated_at: now,
      },
    });

    // 2. Record in status history (reuse existing table)
    await tx.marketplaceOrderStatusHistory.create({
      data: {
        order_id,
        from_status: result.status, // order status unchanged
        to_status: result.status,
        changed_by_type: "cadmin",
        reason: `payment_status: ${old_payment_status} → ${new_payment_status}${reason?.trim() ? ` | ${reason.trim()}` : ""}`,
      },
    });

    return result;
  });

  // 3. Fire notifications post-commit (non-blocking)
  if (REASON_REQUIRED_PAYMENT_STATUSES.includes(new_payment_status)) {
    _firePaymentRefundNotifications({
      customer_id: order.customer_id,
      customer_name: order.customer?.full_name || "Customer",
      customer_email: order.customer?.email || null,
      order_number: order.order_number,
      total_amount: Number(order.total_amount),
      payment_status: new_payment_status,
    }).catch((err) =>
      console.error(
        `[CAdmin Orders] Payment refund notification failed:`,
        err.message
      )
    );
  }

  return updated;
};

/**
 * Internal: fire push + email for refund events.
 * Non-blocking — called with .catch() by the caller.
 */
async function _firePaymentRefundNotifications({
  customer_id,
  customer_name,
  customer_email,
  order_number,
  total_amount,
  payment_status,
}) {
  const { MobilePush } = await import(
    "../../mobile/push/mobile.push.service.js"
  );
  const { sendEmail } = await import("../../../utils/email.js");

  const isPartial = payment_status === "PARTIALLY_REFUNDED";
  const label = isPartial ? "partially refunded" : "refunded";

  // ── Push notification ────────────────────────────────────
  if (customer_id) {
    await MobilePush.paymentRefunded(
      customer_id,
      order_number,
      payment_status
    );
  }

  // ── Email notification ───────────────────────────────────
  if (customer_email) {
    const { default: paymentRefundedTemplate } = await import(
      "../../notifications/templates/email/paymentRefunded.js"
    );

    const html = paymentRefundedTemplate({
      customerName: customer_name,
      orderNumber: order_number,
      totalAmount: total_amount.toFixed(2),
      isPartial,
    });

    await sendEmail({
      to: customer_email,
      subject: `Payment ${label} — Order ${order_number}`,
      html,
    });
  }
}
