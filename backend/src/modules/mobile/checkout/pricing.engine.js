// backend/src/modules/mobile/checkout/pricing.engine.js (do not remove this comment)
// backend/src/modules/mobile/checkout/pricing.engine.js
// Pure function — no DB calls, no side effects.
// Receives config object + order inputs, returns full breakdown.

/**
 * @typedef {Object} PricingConfig
 * @property {number} service_tier_1_max
 * @property {number} service_tier_1_charge
 * @property {number} service_tier_2_max
 * @property {number} service_tier_2_charge
 * @property {number} service_tier_3_charge
 * @property {number} delivery_tier_1_max
 * @property {number} delivery_tier_1_charge
 * @property {number} delivery_tier_2_max
 * @property {number} delivery_tier_2_charge
 * @property {number} delivery_tier_3_max
 * @property {number} delivery_tier_3_charge
 * @property {number} delivery_tier_4_charge
 * @property {number} free_km_radius
 * @property {number} per_km_tier_1_max
 * @property {number} per_km_tier_1_rate
 * @property {number} per_km_tier_2_rate
 * @property {number|null} max_delivery_km
 */

/**
 * @typedef {Object} PricingResult
 * @property {number} subtotal
 * @property {number} service_charge
 * @property {number} delivery_fee
 * @property {number} km_surcharge
 * @property {number} tip
 * @property {number} grand_total
 * @property {boolean} delivery_available
 * @property {string|null} unavailable_reason
 */

/**
 * Compute the full pricing breakdown for a marketplace order.
 *
 * @param {Object} params
 * @param {number}        params.subtotal     - Sum of item prices in rupees
 * @param {number}        params.distance_km  - Distance from branch to customer
 * @param {number}        params.tip          - Customer-chosen tip (0 if none)
 * @param {PricingConfig} params.config       - Global pricing config from DB
 * @returns {PricingResult}
 */
export function computePricing({ subtotal, distance_km, tip = 0, config }) {
  // ── Max distance guard ─────────────────────────────────────
  if (config.max_delivery_km !== null && distance_km > config.max_delivery_km) {
    return {
      subtotal,
      service_charge: 0,
      delivery_fee: 0,
      km_surcharge: 0,
      tip: 0,
      grand_total: 0,
      delivery_available: false,
      unavailable_reason: `Delivery not available beyond ${config.max_delivery_km} km`,
    };
  }

  // ── Service charge ────────────────────────────────────────
  let service_charge;
  if (subtotal <= config.service_tier_1_max) {
    service_charge = config.service_tier_1_charge;
  } else if (subtotal <= config.service_tier_2_max) {
    service_charge = config.service_tier_2_charge;
  } else {
    service_charge = config.service_tier_3_charge;
  }

  // ── Delivery fee ──────────────────────────────────────────
  let delivery_fee;
  if (subtotal < config.delivery_tier_1_max) {
    delivery_fee = config.delivery_tier_1_charge;
  } else if (subtotal < config.delivery_tier_2_max) {
    delivery_fee = config.delivery_tier_2_charge;
  } else if (subtotal < config.delivery_tier_3_max) {
    delivery_fee = config.delivery_tier_3_charge;
  } else {
    delivery_fee = config.delivery_tier_4_charge;
  }

  // ── Per-km surcharge (only beyond free_km_radius) ─────────
  let km_surcharge = 0;
  const extra_km = distance_km - config.free_km_radius;

  if (extra_km > 0) {
    const rate =
      subtotal < config.per_km_tier_1_max
        ? config.per_km_tier_1_rate
        : config.per_km_tier_2_rate;

    km_surcharge = parseFloat((extra_km * rate).toFixed(2));
  }

  // ── Tip ───────────────────────────────────────────────────
  const tip_amount = Math.max(0, Number(tip) || 0);

  // ── Grand total ───────────────────────────────────────────
  const grand_total = parseFloat(
    (subtotal + service_charge + delivery_fee + km_surcharge + tip_amount).toFixed(2),
  );

  return {
    subtotal,
    service_charge,
    delivery_fee,
    km_surcharge,
    tip: tip_amount,
    grand_total,
    delivery_available: true,
    unavailable_reason: null,
  };
}

/**
 * Normalise a DB config row to plain numbers.
 * Prisma returns Decimal objects — this converts them for the engine.
 *
 * @param {Object} dbRow - Raw Prisma DeliveryPricingConfig row
 * @returns {PricingConfig}
 */
export function normaliseConfig(dbRow) {
  return {
    service_tier_1_max:    Number(dbRow.service_tier_1_max),
    service_tier_1_charge: Number(dbRow.service_tier_1_charge),
    service_tier_2_max:    Number(dbRow.service_tier_2_max),
    service_tier_2_charge: Number(dbRow.service_tier_2_charge),
    service_tier_3_charge: Number(dbRow.service_tier_3_charge),

    delivery_tier_1_max:    Number(dbRow.delivery_tier_1_max),
    delivery_tier_1_charge: Number(dbRow.delivery_tier_1_charge),
    delivery_tier_2_max:    Number(dbRow.delivery_tier_2_max),
    delivery_tier_2_charge: Number(dbRow.delivery_tier_2_charge),
    delivery_tier_3_max:    Number(dbRow.delivery_tier_3_max),
    delivery_tier_3_charge: Number(dbRow.delivery_tier_3_charge),
    delivery_tier_4_charge: Number(dbRow.delivery_tier_4_charge),

    free_km_radius:     Number(dbRow.free_km_radius),
    per_km_tier_1_max:  Number(dbRow.per_km_tier_1_max),
    per_km_tier_1_rate: Number(dbRow.per_km_tier_1_rate),
    per_km_tier_2_rate: Number(dbRow.per_km_tier_2_rate),

    max_delivery_km: dbRow.max_delivery_km !== null
      ? Number(dbRow.max_delivery_km)
      : null,

    tip_enabled: dbRow.tip_enabled,
  };
}