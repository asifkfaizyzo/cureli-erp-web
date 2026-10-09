// backend/src/modules/mobile/checkout/slash.engine.js
// Pure function — no DB calls, no side effects.
// Receives raw pricing output + slash config, returns adjusted
// charges with anchor (strikethrough) values and savings.
//
// Called AFTER computePricing() and BEFORE coupon/loyalty discounts.

/**
 * @typedef {Object} SlashTier
 * @property {number}       priority        - Lower number = higher priority
 * @property {number|null}  min_subtotal    - Order subtotal must be >= this (null = no check)
 * @property {number|null}  max_distance_km - Order distance must be <= this (null = no check)
 * @property {number}       pct             - Percentage: positive for NEW mode, negative for OLD mode
 */

/**
 * @typedef {Object} SlashConfig
 * @property {boolean}      is_enabled      - Master toggle
 * @property {'NONE'|'NEW'|'OLD'} service_mode
 * @property {number}       service_pct     - e.g. +50 or -30
 * @property {'NONE'|'NEW'|'OLD'} delivery_mode
 * @property {SlashTier[]}  delivery_tiers  - Sorted by priority ASC at evaluation time
 */

/**
 * @typedef {Object} SlashResult
 * @property {number}       service_charge          - Actual (what customer pays)
 * @property {number|null}  service_charge_anchor    - Strikethrough value (null = no slash)
 * @property {number}       delivery_charge          - Actual combined delivery (what customer pays)
 * @property {number|null}  delivery_charge_anchor   - Strikethrough combined delivery (null = no slash)
 * @property {number}       platform_savings         - Total savings (anchor - actual), always >= 0
 * @property {number}       grand_total              - Recalculated: subtotal + service + delivery + tip
 * @property {boolean}      delivery_available       - Passed through from raw pricing
 * @property {string|null}  unavailable_reason       - Passed through from raw pricing
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIER MATCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the first matching delivery tier by priority.
 * Tiers are sorted by priority ASC (lower = higher priority).
 * A tier matches when ALL its non-null conditions are satisfied.
 * A tier with all-null conditions is the "default" fallback.
 *
 * @param {SlashTier[]} tiers
 * @param {number} subtotal
 * @param {number} distance_km
 * @returns {SlashTier|null}
 */
function findMatchingTier(tiers, subtotal, distance_km) {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;

  const sorted = [...tiers].sort((a, b) => a.priority - b.priority);

  for (const tier of sorted) {
    let matches = true;

    if (tier.min_subtotal != null) {
      if (subtotal < tier.min_subtotal) matches = false;
    }

    if (tier.max_distance_km != null) {
      if (distance_km > tier.max_distance_km) matches = false;
    }

    if (matches) return tier;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERCENTAGE APPLICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a slash percentage to a computed fee.
 *
 * Mode NEW: computed value = actual (customer pays full).
 *           anchor = computed × (1 + pct/100).  pct is positive.
 *           Example: computed=20, pct=+50 → anchor=30, actual=20
 *
 * Mode OLD: computed value = anchor (struck-through).
 *           actual = computed × (1 + pct/100).  pct is negative.
 *           Example: computed=100, pct=-50 → anchor=100, actual=50
 *
 * @param {number} value - The raw computed fee from pricing engine
 * @param {'NONE'|'NEW'|'OLD'} mode
 * @param {number} pct - Positive for NEW, negative for OLD
 * @returns {{ actual: number, anchor: number|null }}
 */
function applyPercentage(value, mode, pct) {
  if (mode === 'NONE' || pct === 0) {
    return { actual: value, anchor: null };
  }

  if (mode === 'NEW') {
    const actual = value;
    const anchor = parseFloat((value * (1 + pct / 100)).toFixed(2));
    return { actual, anchor };
  }

  if (mode === 'OLD') {
    const anchor = value;
    const raw = value * (1 + pct / 100);
    const actual = Math.max(0, parseFloat(raw.toFixed(2)));
    return { actual, anchor };
  }

  return { actual: value, anchor: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply slash display logic to raw pricing output.
 *
 * @param {Object} params
 * @param {number}       params.subtotal            - From computePricing()
 * @param {number}       params.service_charge      - From computePricing()
 * @param {number}       params.delivery_fee        - From computePricing()
 * @param {number}       params.km_surcharge        - From computePricing()
 * @param {number}       params.tip                 - From computePricing()
 * @param {number}       params.grand_total         - From computePricing()
 * @param {boolean}      params.delivery_available  - From computePricing()
 * @param {string|null}  params.unavailable_reason  - From computePricing()
 * @param {number}       params.distance_km         - Branch-to-customer distance
 * @param {SlashConfig}  params.config              - Normalised slash config
 * @returns {SlashResult}
 */
export function applySlash({
  subtotal,
  service_charge,
  delivery_fee,
  km_surcharge,
  tip,
  grand_total,
  delivery_available,
  unavailable_reason,
  distance_km,
  config,
}) {
  // ── 1. Disabled or missing config → pass through ──────────────
  if (!config || !config.is_enabled) {
    return {
      service_charge,
      service_charge_anchor: null,
      delivery_charge: parseFloat((delivery_fee + km_surcharge).toFixed(2)),
      delivery_charge_anchor: null,
      platform_savings: 0,
      grand_total,
      delivery_available,
      unavailable_reason,
    };
  }

  // ── 2. Delivery unavailable → pass through zeros ──────────────
  if (!delivery_available) {
    return {
      service_charge: 0,
      service_charge_anchor: null,
      delivery_charge: 0,
      delivery_charge_anchor: null,
      platform_savings: 0,
      grand_total: 0,
      delivery_available: false,
      unavailable_reason,
    };
  }

  // ── 3. Service charge slash ───────────────────────────────────
  const serviceResult = applyPercentage(
    service_charge,
    config.service_mode,
    config.service_pct,
  );

  // ── 4. Delivery charge slash (combined delivery + km) ─────────
  const combinedDelivery = parseFloat((delivery_fee + km_surcharge).toFixed(2));
  let deliveryActual = combinedDelivery;
  let deliveryAnchor = null;

  if (config.delivery_mode !== 'NONE') {
    const matchedTier = findMatchingTier(
      config.delivery_tiers,
      subtotal,
      distance_km,
    );

    if (matchedTier) {
      const deliveryResult = applyPercentage(
        combinedDelivery,
        config.delivery_mode,
        matchedTier.pct,
      );
      deliveryActual = deliveryResult.actual;
      deliveryAnchor = deliveryResult.anchor;
    }
  }

  // ── 5. Platform savings (always >= 0) ─────────────────────────
  const serviceSavings = serviceResult.anchor != null
    ? serviceResult.anchor - serviceResult.actual
    : 0;
  const deliverySavings = deliveryAnchor != null
    ? deliveryAnchor - deliveryActual
    : 0;
  const platform_savings = parseFloat(
    Math.max(0, serviceSavings + deliverySavings).toFixed(2),
  );

  // ── 6. Recalculate grand total ────────────────────────────────
  // grand_total = subtotal + actual_service + actual_delivery + tip
  // Coupon and loyalty discounts are applied AFTER this in getQuote().
  const newGrandTotal = parseFloat(
    (subtotal + serviceResult.actual + deliveryActual + tip).toFixed(2),
  );

  return {
    service_charge: serviceResult.actual,
    service_charge_anchor: serviceResult.anchor,
    delivery_charge: deliveryActual,
    delivery_charge_anchor: deliveryAnchor,
    platform_savings,
    grand_total: newGrandTotal,
    delivery_available: true,
    unavailable_reason: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG NORMALISER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a DB SlashDisplayConfig row to plain JS types.
 * Prisma returns Decimal objects and raw JSON — this converts them.
 *
 * @param {Object|null} dbRow - Raw Prisma SlashDisplayConfig row
 * @returns {SlashConfig}
 */
export function normaliseSlashConfig(dbRow) {
  if (!dbRow) {
    return {
      is_enabled: false,
      service_mode: 'NONE',
      service_pct: 0,
      delivery_mode: 'NONE',
      delivery_tiers: [],
    };
  }

  // Parse tiers JSON safely
  let tiers = [];
  try {
    const raw = dbRow.delivery_tiers;
    if (typeof raw === 'string') {
      tiers = JSON.parse(raw);
    } else if (Array.isArray(raw)) {
      tiers = raw;
    }
  } catch {
    tiers = [];
  }

  // Normalise each tier's numeric fields
  const normalisedTiers = tiers.map((t) => ({
    priority: Number(t.priority) || 99,
    min_subtotal: t.min_subtotal != null ? Number(t.min_subtotal) : null,
    max_distance_km: t.max_distance_km != null ? Number(t.max_distance_km) : null,
    pct: Number(t.pct) || 0,
  }));

  return {
    is_enabled: Boolean(dbRow.is_enabled),
    service_mode: dbRow.service_mode || 'NONE',
    service_pct: Number(dbRow.service_pct) || 0,
    delivery_mode: dbRow.delivery_mode || 'NONE',
    delivery_tiers: normalisedTiers,
  };
}