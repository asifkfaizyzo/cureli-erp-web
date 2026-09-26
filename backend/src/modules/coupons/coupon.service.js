// backend/src/modules/coupons/coupon.service.js (do not remove this comment)
// backend/src/modules/coupons/coupon.service.js
import prisma from "../../config/prisma.js";
import { validateCouponEligibility, normaliseCoupon } from "./coupon.engine.js";

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE BUSINESS LOGIC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a coupon code for a given customer and order subtotal.
 *
 * @param {Object} params
 * @param {string} params.code         - Case-insensitive coupon code
 * @param {string} params.customer_id
 * @param {number} params.subtotal     - Subtotal of order in rupees
 * @returns {Promise<{ valid: boolean, discount: number, reason: string|null, coupon: Object|null }>}
 */
export async function validateCouponForCustomer({ code, customer_id, subtotal }) {
  if (!code || typeof code !== "string") {
    return { valid: false, discount: 0, reason: "Coupon code is required", coupon: null };
  }

  const normalizedCode = code.trim().toUpperCase();

  // 1. Fetch coupon
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    return { valid: false, discount: 0, reason: "Invalid coupon code", coupon: null };
  }

  // 2. Count customer usages of this coupon
  const userUsageCount = await prisma.couponUsage.count({
    where: {
      coupon_id: coupon.coupon_id,
      customer_id,
    },
  });

  // 3. Delegate calculation to pure engine
  const normalised = normaliseCoupon(coupon);
  const result = validateCouponEligibility({
    coupon: normalised,
    subtotal,
    userUsageCount,
    now: new Date(),
  });

  return {
    valid: result.valid,
    discount: result.discount,
    reason: result.reason,
    coupon: result.valid ? { coupon_id: coupon.coupon_id, code: coupon.code, type: coupon.type } : null,
  };
}

/**
 * Record a coupon usage.
 * MUST run inside an existing Prisma transaction client ($transaction).
 *
 * @param {Object} params
 * @param {string} params.coupon_id
 * @param {string} params.customer_id
 * @param {string} params.order_id
 * @param {number} params.discount_amount
 * @param {Object} tx - Prisma transaction instance
 */
export async function recordCouponUsage({ coupon_id, customer_id, order_id, discount_amount }, tx) {
  const transactionClient = tx || prisma;

  // 1. Double check coupon existence and lock row to prevent limits race condition
  const [coupon] = await transactionClient.$queryRaw`
    SELECT coupon_id, total_used, max_uses_total 
    FROM coupons 
    WHERE coupon_id = ${coupon_id}::uuid FOR UPDATE
  `;

  if (!coupon) {
    throw new Error("Coupon not found during usage recording");
  }

  if (coupon.max_uses_total !== null && coupon.total_used >= coupon.max_uses_total) {
    throw new Error("Coupon limit reached during checkout checkout");
  }

  // 2. Record coupon usage log
  await transactionClient.couponUsage.create({
    data: {
      coupon_id,
      customer_id,
      order_id,
      discount_amount,
    },
  });

  // 3. Increment usage count on original coupon
  await transactionClient.coupon.update({
    where: { coupon_id },
    data: {
      total_used: { increment: 1 },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CADMIN ADMINISTRATION CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function createCoupon(data, actor) {
  const code = data.code.trim().toUpperCase();

  // Validate format
  const codeRegex = /^[A-Z0-9-]+$/;
  if (!codeRegex.test(code)) {
    const err = new Error("Code must contain only uppercase alphanumeric characters and hyphens.");
    err.code = "VALIDATION_ERROR";
    err.status = 400;
    throw err;
  }

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    const err = new Error(`A coupon with the code "${code}" already exists.`);
    err.code = "DUPLICATE_ERROR";
    err.status = 400;
    throw err;
  }

  return prisma.coupon.create({
    data: {
      code,
      description: data.description ?? null,
      type: data.type,
      value: data.value,
      max_discount: data.type === "PERCENTAGE" ? (data.max_discount ?? null) : null,
      min_order_amount: data.min_order_amount ?? 0,
      max_uses_total: data.max_uses_total ?? null,
      max_uses_per_user: data.max_uses_per_user ?? 1,
      valid_from: new Date(data.valid_from),
      valid_until: data.valid_until ? new Date(data.valid_until) : null,
      is_active: data.is_active ?? true,
      created_by_cadmin_id: actor.cadminId,
      created_by_name: actor.cadminName,
    },
  });
}

export async function listCoupons({ page = 1, limit = 20, search = "", status = "ALL" }) {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (search) {
    where.code = { contains: search.trim().toUpperCase() };
  }

  const now = new Date();
  if (status === "ACTIVE") {
    where.is_active = true;
    where.valid_from = { lte: now };
    where.OR = [{ valid_until: null }, { valid_until: { gte: now } }];
  } else if (status === "INACTIVE") {
    where.OR = [
      { is_active: false },
      { valid_until: { lt: now } },
    ];
  }

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.coupon.count({ where }),
  ]);

  return {
    coupons,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function getCouponDetail(coupon_id) {
  const coupon = await prisma.coupon.findUnique({
    where: { coupon_id },
    include: {
      _count: { select: { usages: true } },
    },
  });
  if (!coupon) throw new Error("Coupon not found");
  return coupon;
}

export async function updateCoupon(coupon_id, data, actor) {
  const coupon = await prisma.coupon.findUnique({ where: { coupon_id } });
  if (!coupon) throw new Error("Coupon not found");

  const updates = {
    description: data.description !== undefined ? data.description : coupon.description,
    is_active: data.is_active !== undefined ? data.is_active : coupon.is_active,
    valid_from: data.valid_from ? new Date(data.valid_from) : coupon.valid_from,
    valid_until: data.valid_until !== undefined ? (data.valid_until ? new Date(data.valid_until) : null) : coupon.valid_until,
    max_uses_total: data.max_uses_total !== undefined ? data.max_uses_total : coupon.max_uses_total,
    max_uses_per_user: data.max_uses_per_user !== undefined ? data.max_uses_per_user : coupon.max_uses_per_user,
    min_order_amount: data.min_order_amount !== undefined ? data.min_order_amount : coupon.min_order_amount,
  };

  return prisma.coupon.update({
    where: { coupon_id },
    data: updates,
  });
}

/**
 * Soft Deletion Policy: Per user's strict instructions,
 * Coupons are never permanently deleted from DB to protect order logs.
 * Deletion deactivates and renames code suffix to release namespaces.
 */
export async function deleteCoupon(coupon_id, actor) {
  const coupon = await prisma.coupon.findUnique({ where: { coupon_id } });
  if (!coupon) throw new Error("Coupon not found");

  // Deactivate and scramble code so release namespace can reuse original code
  const scrambledCode = `${coupon.code}-DELETED-${Date.now()}`;

  return prisma.coupon.update({
    where: { coupon_id },
    data: {
      is_active: false,
      code: scrambledCode,
    },
  });
}