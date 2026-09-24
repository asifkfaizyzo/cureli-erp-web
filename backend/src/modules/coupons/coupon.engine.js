// backend/src/modules/coupons/coupon.engine.js (do not remove this comment)
// backend/src/modules/coupons/coupon.engine.js
//
// Pure functions — no DB calls, no side effects.
// Receives coupon object + order inputs, returns validation result and discount.
//
// Follows the same pattern as pricing.engine.js:
//   - All money values are plain numbers (not Prisma Decimals)
//   - All money math uses parseFloat((x).toFixed(2))
//   - Callers are responsible for normalising DB rows before passing in

/**
 * @typedef {Object} CouponInput
 * @property {string}  coupon_id
 * @property {string}  code
 * @property {string}  type            - "FLAT" | "PERCENTAGE"
 * @property {number}  value           - ₹50 for FLAT, 20.00 for PERCENTAGE
 * @property {number|null} max_discount - cap for PERCENTAGE; null = no cap
 * @property {number}  min_order_amount
 * @property {number|null} max_uses_total
 * @property {number|null} max_uses_per_user
 * @property {Date}    valid_from
 * @property {Date|null} valid_until
 * @property {boolean} is_active
 * @property {number}  total_used
 */

/**
 * @typedef {Object} CouponValidationResult
 * @property {boolean} valid
 * @property {number}  discount       - 0 when invalid
 * @property {string|null} reason     - human-readable reason when invalid
 */

/**
 * Calculate the raw discount amount for a coupon against a given subtotal.
 * Does NOT check eligibility — use validateCouponEligibility first.
 *
 * @param {CouponInput} coupon
 * @param {number} subtotal - order subtotal in rupees (before any discounts)
 * @returns {number} discount amount in rupees, capped at subtotal
 */
export function calculateCouponDiscount({ coupon, subtotal }) {
  let discount = 0;

  if (coupon.type === "FLAT") {
    discount = coupon.value;
  } else if (coupon.type === "PERCENTAGE") {
    discount = (subtotal * coupon.value) / 100;

    // Apply max_discount cap if set
    if (coupon.max_discount !== null && coupon.max_discount !== undefined) {
      discount = Math.min(discount, coupon.max_discount);
    }
  }

  // Discount can never exceed subtotal (order can't go negative)
  discount = Math.min(discount, subtotal);

  return parseFloat(discount.toFixed(2));
}

/**
 * Validate whether a coupon is eligible for use.
 * Checks all business rules EXCEPT the per-user usage count
 * (caller must provide that separately since it requires a DB query).
 *
 * @param {Object} params
 * @param {CouponInput} params.coupon
 * @param {number}      params.subtotal       - order subtotal in rupees
 * @param {number}      params.userUsageCount - how many times this user has used this coupon
 * @param {Date}        [params.now]          - current time (injectable for testing)
 * @returns {CouponValidationResult}
 */
export function validateCouponEligibility({
  coupon,
  subtotal,
  userUsageCount,
  now = new Date(),
}) {
  // ── 1. Active check ────────────────────────────────────────
  if (!coupon.is_active) {
    return { valid: false, discount: 0, reason: "This coupon is no longer active" };
  }

  // ── 2. Validity window ─────────────────────────────────────
  if (now < coupon.valid_from) {
    return { valid: false, discount: 0, reason: "This coupon is not yet valid" };
  }

  if (coupon.valid_until !== null && coupon.valid_until !== undefined && now > coupon.valid_until) {
    return { valid: false, discount: 0, reason: "This coupon has expired" };
  }

  // ── 3. Minimum order amount ────────────────────────────────
  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      discount: 0,
      reason: `Minimum order amount ₹${coupon.min_order_amount} required`,
    };
  }

  // ── 4. Global usage limit ──────────────────────────────────
  if (
    coupon.max_uses_total !== null &&
    coupon.max_uses_total !== undefined &&
    coupon.total_used >= coupon.max_uses_total
  ) {
    return { valid: false, discount: 0, reason: "This coupon has reached its usage limit" };
  }

  // ── 5. Per-user usage limit ────────────────────────────────
  if (
    coupon.max_uses_per_user !== null &&
    coupon.max_uses_per_user !== undefined &&
    userUsageCount >= coupon.max_uses_per_user
  ) {
    return {
      valid: false,
      discount: 0,
      reason: `You have already used this coupon ${coupon.max_uses_per_user} time(s)`,
    };
  }

  // ── 6. Calculate discount ──────────────────────────────────
  const discount = calculateCouponDiscount({ coupon, subtotal });

  if (discount <= 0) {
    return { valid: false, discount: 0, reason: "Coupon discount is zero for this order" };
  }

  return { valid: true, discount, reason: null };
}

/**
 * Normalise a DB coupon row to plain numbers.
 * Prisma returns Decimal objects — this converts them for the engine.
 *
 * @param {Object} dbRow - Raw Prisma Coupon row
 * @returns {CouponInput}
 */
export function normaliseCoupon(dbRow) {
  return {
    coupon_id: dbRow.coupon_id,
    code: dbRow.code,
    type: dbRow.type,
    value: Number(dbRow.value),
    max_discount: dbRow.max_discount !== null ? Number(dbRow.max_discount) : null,
    min_order_amount: Number(dbRow.min_order_amount),
    max_uses_total: dbRow.max_uses_total ?? null,
    max_uses_per_user: dbRow.max_uses_per_user ?? null,
    valid_from: dbRow.valid_from,
    valid_until: dbRow.valid_until ?? null,
    is_active: dbRow.is_active,
    total_used: dbRow.total_used,
  };
}