// backend/src/modules/loyalty/loyalty.engine.js (do not remove this comment)
// backend/src/modules/loyalty/loyalty.engine.js

/**
 * @typedef {Object} LoyaltyConfigInput
 * @property {boolean}     is_enabled
 * @property {number}      earn_rate_amount     - ₹X per 1 point
 * @property {string}      earn_basis           - "TOTAL_PAYABLE" | "SUBTOTAL"
 * @property {number}      redemption_value     - 1 point = ₹Y
 * @property {number}      min_redeem_points
 * @property {number}      min_order_amount
 * @property {number|null} max_redeem_points
 * @property {number|null} max_redeem_percent   - e.g. 20.00 = 20%
 * @property {number|null} points_expiry_days
 */

/**
 * @typedef {Object} RedemptionValidationResult
 * @property {boolean} valid
 * @property {number}  allowedPoints   - actual points that can be redeemed (may be less than requested)
 * @property {number}  discount        - rupee discount for allowedPoints
 * @property {string|null} reason      - human-readable reason when invalid
 */

/**
 * Calculate how many loyalty points an order earns.
 *
 * @param {number} earningAmount   - base amount in rupees (total payable or post-coupon subtotal)
 * @param {number} earnRateAmount  - ₹X per 1 point (from config)
 * @returns {number} integer points earned (floor-rounded)
 */
export function calculatePointsEarned(earningAmount, earnRateAmount) {
  if (earnRateAmount <= 0) return 0;
  if (earningAmount <= 0) return 0;

  return Math.floor(earningAmount / earnRateAmount);
}

export function calculateRedemptionDiscount(pointsToRedeem, redemptionValue) {
  return parseFloat((pointsToRedeem * redemptionValue).toFixed(2));
}

export function validateRedemption({
  config,
  userBalance,
  pointsRequested,
  effectiveSubtotal,
}) {
  if (!config.is_enabled) {
    return { valid: false, allowedPoints: 0, discount: 0, reason: "Loyalty program is not active" };
  }

  if (effectiveSubtotal < config.min_order_amount) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `Minimum order amount ₹${config.min_order_amount} required to redeem points`,
    };
  }

  if (pointsRequested < config.min_redeem_points) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `Minimum ${config.min_redeem_points} points required to redeem`,
    };
  }

  if (userBalance <= 0) {
    return { valid: false, allowedPoints: 0, discount: 0, reason: "No loyalty points available" };
  }

  if (pointsRequested > userBalance) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `Insufficient points. You have ${userBalance} points`,
    };
  }

  let allowedPoints = pointsRequested;

  if (config.max_redeem_points !== null && config.max_redeem_points !== undefined) {
    allowedPoints = Math.min(allowedPoints, config.max_redeem_points);
  }

  if (config.max_redeem_percent !== null && config.max_redeem_percent !== undefined) {
    const maxDiscountByPercent = (effectiveSubtotal * config.max_redeem_percent) / 100;
    const maxPointsByPercent = Math.floor(maxDiscountByPercent / config.redemption_value);
    allowedPoints = Math.min(allowedPoints, maxPointsByPercent);
  }

  const maxPointsBySubtotal = Math.floor(
    (effectiveSubtotal - 1) / config.redemption_value,
  );
  allowedPoints = Math.min(allowedPoints, Math.max(0, maxPointsBySubtotal));

  if (allowedPoints < config.min_redeem_points) {
    return {
      valid: false,
      allowedPoints: 0,
      discount: 0,
      reason: `After applying limits, redemption falls below minimum ${config.min_redeem_points} points`,
    };
  }

  const discount = calculateRedemptionDiscount(allowedPoints, config.redemption_value);

  return {
    valid: true,
    allowedPoints,
    discount,
    reason: null,
  };
}

export function normaliseLoyaltyConfig(dbRow) {
  return {
    is_enabled: dbRow.is_enabled,
    earn_rate_amount: Number(dbRow.earn_rate_amount),
    earn_basis: dbRow.earn_basis,
    redemption_value: Number(dbRow.redemption_value),
    min_redeem_points: dbRow.min_redeem_points,
    min_order_amount: Number(dbRow.min_order_amount),
    max_redeem_points: dbRow.max_redeem_points ?? null,
    max_redeem_percent:
      dbRow.max_redeem_percent !== null ? Number(dbRow.max_redeem_percent) : null,
    points_expiry_days: dbRow.points_expiry_days ?? null,
  };
}