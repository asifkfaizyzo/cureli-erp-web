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
export function computePricing({
  subtotal,
  distance_km,
  tip = 0,
  config,
  fulfillment_type = "INSTANT_DELIVERY",
}) {
  // ── Max distance guard (skip for pickup — no distance involved) ──
  if (
    fulfillment_type !== "PICKUP" &&
    config.max_delivery_km !== null &&
    distance_km > config.max_delivery_km
  ) {
    return {
      subtotal,
      service_charge: 0,
      delivery_fee: 0,
      km_surcharge: 0,
      distance_rate: 0,
      full_distance_charge: 0,
      packing_charge: 0,
      tip: 0,
      grand_total: 0,
      delivery_available: false,
      unavailable_reason: `Delivery not available beyond ${config.max_delivery_km} km`,
      matchedDeliveryTier: null,
    };
  }

  // ── Service charge ────────────────────────────────────────
  let service_charge = 0;
  if (config.service_charge_enabled !== false) {
    if (subtotal <= config.service_tier_1_max) {
      service_charge = config.service_tier_1_charge;
    } else if (subtotal <= config.service_tier_2_max) {
      service_charge = config.service_tier_2_charge;
    } else {
      service_charge = config.service_tier_3_charge;
    }
  }

  // ── Delivery fee (merged distance-tiered) ─────────────────
  // New system: a single tier object owns flat_charge + free_radius + per_km_rate.
  // km_surcharge is permanently 0 (distance is baked into delivery_fee).
  let delivery_fee = 0;
  let km_surcharge = 0;
  let distance_rate = 0;
  let full_distance_charge = 0;
  let matchedDeliveryTier = null;

  if (
    config.delivery_fee_enabled !== false &&
    config.deliveryTiers &&
    config.deliveryTiers.length > 0
  ) {
    // ── NEW PATH: dynamic JSON tiers ─────────────────────
    // Match: highest min_order_value that does not exceed subtotal
    matchedDeliveryTier = config.deliveryTiers[0];
    for (const tier of config.deliveryTiers) {
      if (subtotal >= tier.min_order_value) matchedDeliveryTier = tier;
    }

    distance_rate = matchedDeliveryTier.per_km_rate;
    const excessKm = Math.max(0, distance_km - matchedDeliveryTier.free_radius_km);
    const distanceCharge = parseFloat((excessKm * distance_rate).toFixed(2));

    delivery_fee = parseFloat(
      (matchedDeliveryTier.flat_charge + distanceCharge).toFixed(2),
    );
    km_surcharge = 0; // always 0 — distance is already inside delivery_fee

    // Theoretical full-distance cost (no free radius) — used for anchor strikethrough.
    full_distance_charge = parseFloat((distance_km * distance_rate).toFixed(2));

  } else if (config.delivery_fee_enabled !== false) {
    // ── LEGACY FALLBACK: flat columns (unmigrated config only) ─────────
    if (subtotal < config.delivery_tier_1_max) {
      delivery_fee = config.delivery_tier_1_charge;
    } else if (subtotal < config.delivery_tier_2_max) {
      delivery_fee = config.delivery_tier_2_charge;
    } else if (subtotal < config.delivery_tier_3_max) {
      delivery_fee = config.delivery_tier_3_charge;
    } else {
      delivery_fee = config.delivery_tier_4_charge;
    }
    if (config.km_surcharge_enabled !== false) {
      const extra_km = Math.max(0, distance_km - config.free_km_radius);
      distance_rate =
        subtotal < config.per_km_tier_1_max
          ? config.per_km_tier_1_rate
          : config.per_km_tier_2_rate;
      full_distance_charge = parseFloat((distance_km * distance_rate).toFixed(2));
      if (extra_km > 0) {
        km_surcharge = parseFloat((extra_km * distance_rate).toFixed(2));
      }
    }
  }

  // ── Packing charge (same tier structure as service) ───────
  let packing_charge = 0;
  if (config.packing_enabled) {
    if (subtotal <= config.packing_tier_1_max) {
      packing_charge = config.packing_tier_1_charge;
    } else if (subtotal <= config.packing_tier_2_max) {
      packing_charge = config.packing_tier_2_charge;
    } else {
      packing_charge = config.packing_tier_3_charge;
    }
  }

  // ── Tip ───────────────────────────────────────────────────
  const tip_amount = Math.max(0, Number(tip) || 0);

  // ── Grand total ───────────────────────────────────────────
  const grand_total = parseFloat(
    (subtotal + service_charge + delivery_fee + km_surcharge + packing_charge + tip_amount).toFixed(2),
  );

  return {
    subtotal,
    service_charge,
    delivery_fee,
    km_surcharge,
    distance_rate,
    full_distance_charge,
    packing_charge,
    tip: tip_amount,
    grand_total,
    delivery_available: true,
    unavailable_reason: null,
    matchedDeliveryTier,
  };
}

/**
 * Parse the delivery_tiers_json column into a sorted array of plain numbers.
 * Returns [] when the column is null / empty (triggers legacy flat-column fallback).
 */
function normaliseDeliveryTiers(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((t) => ({
      min_order_value: Number(t.min_order_value ?? 0),
      flat_charge:     Number(t.flat_charge ?? 0),
      free_radius_km:  Number(t.free_radius_km ?? 0),
      per_km_rate:     Number(t.per_km_rate ?? 0),
    }))
    .sort((a, b) => a.min_order_value - b.min_order_value);
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
    // ── Toggles ────────────────────────────────────────────
    service_charge_enabled: dbRow.service_charge_enabled !== false,
    delivery_fee_enabled:   dbRow.delivery_fee_enabled !== false,
    km_surcharge_enabled:   dbRow.km_surcharge_enabled !== false,
    packing_enabled:        dbRow.packing_enabled === true,

    // ── Service Charge Tiers ───────────────────────────────
    service_tier_1_max:    Number(dbRow.service_tier_1_max),
    service_tier_1_charge: Number(dbRow.service_tier_1_charge),
    service_tier_2_max:    Number(dbRow.service_tier_2_max),
    service_tier_2_charge: Number(dbRow.service_tier_2_charge),
    service_tier_3_charge: Number(dbRow.service_tier_3_charge),

    // ── Delivery Fee Tiers ─────────────────────────────────
    delivery_tier_1_max:    Number(dbRow.delivery_tier_1_max),
    delivery_tier_1_charge: Number(dbRow.delivery_tier_1_charge),
    delivery_tier_2_max:    Number(dbRow.delivery_tier_2_max),
    delivery_tier_2_charge: Number(dbRow.delivery_tier_2_charge),
    delivery_tier_3_max:    Number(dbRow.delivery_tier_3_max),
    delivery_tier_3_charge: Number(dbRow.delivery_tier_3_charge),
    delivery_tier_4_charge: Number(dbRow.delivery_tier_4_charge),

    // ── Packing Charge Tiers ───────────────────────────────
    packing_tier_1_max:    Number(dbRow.packing_tier_1_max ?? dbRow.service_tier_1_max),
    packing_tier_1_charge: Number(dbRow.packing_tier_1_charge ?? 0),
    packing_tier_2_max:    Number(dbRow.packing_tier_2_max ?? dbRow.service_tier_2_max),
    packing_tier_2_charge: Number(dbRow.packing_tier_2_charge ?? 0),
    packing_tier_3_charge: Number(dbRow.packing_tier_3_charge ?? 0),

    // ── Distance Surcharge (LEGACY — unmigrated fallback only) ─────────────
    free_km_radius:     Number(dbRow.free_km_radius),
    free_km_mode:       dbRow.free_km_mode ?? "EXCESS_ONLY",
    per_km_tier_1_max:  Number(dbRow.per_km_tier_1_max),
    per_km_tier_1_rate: Number(dbRow.per_km_tier_1_rate),
    per_km_tier_2_rate: Number(dbRow.per_km_tier_2_rate),

    // ── Dynamic Delivery Tiers (NEW — primary source of truth) ─────────────
    deliveryTiers: normaliseDeliveryTiers(dbRow.delivery_tiers_json),

    max_delivery_km: dbRow.max_delivery_km !== null
      ? Number(dbRow.max_delivery_km)
      : null,

    tip_enabled: dbRow.tip_enabled,

    // ── Same Day Cutoff ──────────────────────────────────
    // IST hour (0-23) after which Same Day is unavailable.
    // Only meaningful for the SAME_DAY config row.
    same_day_cutoff_hour: dbRow.same_day_cutoff_hour ?? 15,

    // ── GST ──────────────────────────────────────
    gst_enabled: Boolean(dbRow.gst_enabled),
    gst_rate: Number(dbRow.gst_rate ?? 0),
    gst_type: dbRow.gst_type || 'CGST_SGST',
    gst_on_subtotal: Boolean(dbRow.gst_on_subtotal),
    gst_on_delivery: Boolean(dbRow.gst_on_delivery),
    gst_on_service: Boolean(dbRow.gst_on_service),
    gst_on_packaging: Boolean(dbRow.gst_on_packaging),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER-BASED AUTO-ANCHOR (for order detail strikethrough)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the anchor (strikethrough) value when a tier makes a charge free.
 * If the current tier charge is 0 and a lower tier has a non-zero charge,
 * returns that lower tier's charge as the anchor.
 * Returns null if the charge is > 0 or no lower non-zero tier exists.
 *
 * @param {PricingConfig} config
 * @param {"service"|"delivery"} feeType
 * @param {number} subtotal
 * @returns {number|null}
 */
export function computeTierAnchor(config, feeType, subtotal) {
  if (feeType === "service") {
    let currentCharge;
    let lowerCharges = [];

    if (subtotal <= config.service_tier_1_max) {
      currentCharge = config.service_tier_1_charge;
    } else if (subtotal <= config.service_tier_2_max) {
      currentCharge = config.service_tier_2_charge;
      lowerCharges = [config.service_tier_1_charge];
    } else {
      currentCharge = config.service_tier_3_charge;
      lowerCharges = [config.service_tier_2_charge, config.service_tier_1_charge];
    }

    if (currentCharge > 0) return null;
    for (const ch of lowerCharges) {
      if (ch > 0) return ch;
    }
    return null;
  }

  if (feeType === "delivery") {
    const tiers = config.deliveryTiers;

    // ── NEW PATH: dynamic tiers ───────────────────────────
    if (tiers && tiers.length > 0) {
      // Find current tier index
      let currentIdx = 0;
      for (let i = 0; i < tiers.length; i++) {
        if (subtotal >= tiers[i].min_order_value) currentIdx = i;
      }

      const ct = tiers[currentIdx];
      // NOTE: distance-aware anchor requires distance_km. This function was
      // originally subtotal-only. For the new system, "0 charge" only truly
      // means free when distance is within free_radius. Without distance here,
      // we fall back to flat_charge comparison — the service layer should
      // prefer computeFreeRadiusAnchor for distance-aware anchoring.
      if (ct.flat_charge > 0) return null;

      for (let i = currentIdx - 1; i >= 0; i--) {
        if (tiers[i].flat_charge > 0) {
          return parseFloat(tiers[i].flat_charge.toFixed(2));
        }
      }
      return null;
    }

    // ── LEGACY FALLBACK: flat columns ─────────────────────
    let currentCharge;
    let lowerCharges = [];

    if (subtotal < config.delivery_tier_1_max) {
      currentCharge = config.delivery_tier_1_charge;
    } else if (subtotal < config.delivery_tier_2_max) {
      currentCharge = config.delivery_tier_2_charge;
      lowerCharges = [config.delivery_tier_1_charge];
    } else if (subtotal < config.delivery_tier_3_max) {
      currentCharge = config.delivery_tier_3_charge;
      lowerCharges = [config.delivery_tier_2_charge, config.delivery_tier_1_charge];
    } else {
      currentCharge = config.delivery_tier_4_charge;
      lowerCharges = [
        config.delivery_tier_3_charge,
        config.delivery_tier_2_charge,
        config.delivery_tier_1_charge,
      ];
    }

    if (currentCharge > 0) return null;
    for (const ch of lowerCharges) {
      if (ch > 0) return ch;
    }
    return null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC TIER MATCHER (exported for slash engine + service layer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the matching delivery tier for a given subtotal.
 * Returns the tier with the highest min_order_value that does not exceed subtotal.
 *
 * @param {number} subtotal
 * @param {Array}  tiers - sorted deliveryTiers from normaliseConfig
 * @returns {Object|null} matched tier or null if tiers empty
 */
export function findMatchingDeliveryTier(subtotal, tiers) {
  if (!tiers || tiers.length === 0) return null;
  let matched = tiers[0];
  for (const t of tiers) {
    if (subtotal >= t.min_order_value) matched = t;
  }
  return matched;
}

// ─────────────────────────────────────────────────────────────────────────────
// FREE-RADIUS AUTO-ANCHOR (for distance-surcharge "slashed km" strikethrough)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the anchor (strikethrough) value for the free-delivery-radius visual.
 * Returns the "what-if you had no free radius" delivery total, or null when
 * there is no benefit to display.
 *
 * NEW signature uses the matched tier directly. LEGACY callers still work
 * via the fallback branch (checks for presence of full_distance_charge).
 *
 * @param {Object} opts
 * @param {number}  opts.delivery_fee              - actual merged delivery charge
 * @param {number}  opts.km_surcharge              - always 0 in new system (legacy)
 * @param {number}  opts.full_distance_charge      - distance_km × rate (legacy)
 * @param {Object}  [opts.matchedDeliveryTier]     - new: the matched tier
 * @param {number}  [opts.distance_km]             - new: raw distance
 * @returns {number|null}
 */
export function computeFreeRadiusAnchor({
  delivery_fee,
  km_surcharge,
  full_distance_charge,
  matchedDeliveryTier,
  distance_km,
}) {
  // ── NEW PATH: use matched tier directly ──────────────────
  if (matchedDeliveryTier && distance_km !== undefined && distance_km !== null) {
    const { flat_charge, free_radius_km, per_km_rate } = matchedDeliveryTier;
    const actualDistCharge = Math.max(0, distance_km - free_radius_km) * per_km_rate;
    const fullDistCharge   = distance_km * per_km_rate;

    if (fullDistCharge <= actualDistCharge) return null; // no free-radius benefit
    return parseFloat((flat_charge + fullDistCharge).toFixed(2));
  }

  // ── LEGACY FALLBACK (unmigrated config) ──────────────────
  if (!full_distance_charge || full_distance_charge <= km_surcharge) return null;
  return parseFloat((delivery_fee + full_distance_charge).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER-BASED NUDGES (for checkout "Add ₹X more for free..." banners)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute nudge data for tier-based free charges.
 * Scans higher tiers for the nearest one with charge = 0 and returns
 * the gap the customer needs to bridge.
 *
 * Delivery nudge is suppressed when km_surcharge > 0 (combined delivery
 * won't be free even after the tier threshold is met).
 *
 * @param {PricingConfig} config
 * @param {number} subtotal
 * @param {number} distanceKm
 * @returns {{ free_delivery: { gap: number, threshold: number } | null, free_service_charge: { gap: number, threshold: number } | null }}
 */
export function computeNudges(config, subtotal, distanceKm) {
  const result = {
    free_delivery: null,
    free_service_charge: null,
  };

  // ── Service charge nudge ────────────────────────────────
  if (config.service_charge_enabled !== false) {
    let currentCharge;
    let thresholds = [];

    if (subtotal <= config.service_tier_1_max) {
      currentCharge = config.service_tier_1_charge;
      thresholds = [
        { charge: config.service_tier_2_charge, min: config.service_tier_1_max },
        { charge: config.service_tier_3_charge, min: config.service_tier_2_max },
      ];
    } else if (subtotal <= config.service_tier_2_max) {
      currentCharge = config.service_tier_2_charge;
      thresholds = [
        { charge: config.service_tier_3_charge, min: config.service_tier_2_max },
      ];
    } else {
      currentCharge = config.service_tier_3_charge;
    }

    if (currentCharge > 0) {
      for (const t of thresholds) {
        if (t.charge === 0) {
          const gap = Math.ceil(t.min - subtotal);
          if (gap > 0) {
            result.free_service_charge = { gap, threshold: t.min };
          }
          break;
        }
      }
    }
  }

  // ── Delivery fee nudge ──────────────────────────────────
  if (
    config.delivery_fee_enabled !== false &&
    config.deliveryTiers &&
    config.deliveryTiers.length > 1
  ) {
    // ── NEW PATH: dynamic tiers ───────────────────────────
    // Find current tier
    let currentIdx = 0;
    for (let i = 0; i < config.deliveryTiers.length; i++) {
      if (subtotal >= config.deliveryTiers[i].min_order_value) currentIdx = i;
    }

    const ct = config.deliveryTiers[currentIdx];
    const currentDelivery =
      ct.flat_charge + Math.max(0, distanceKm - ct.free_radius_km) * ct.per_km_rate;

    if (currentDelivery > 0) {
      // Scan higher tiers for the nearest one with a cheaper total delivery
      for (let i = currentIdx + 1; i < config.deliveryTiers.length; i++) {
        const nt = config.deliveryTiers[i];
        const nextDelivery =
          nt.flat_charge + Math.max(0, distanceKm - nt.free_radius_km) * nt.per_km_rate;

        if (nextDelivery < currentDelivery) {
          const gap = Math.ceil(nt.min_order_value - subtotal);
          if (gap > 0) {
            result.free_delivery = {
              gap,
              threshold: nt.min_order_value,
              targetDelivery: parseFloat(nextDelivery.toFixed(2)),
              isFreeDelivery: nextDelivery === 0,
            };
          }
          break; // only the nearest beneficial tier
        }
      }
    }
  } else if (config.delivery_fee_enabled !== false) {
    // ── LEGACY FALLBACK: flat columns ─────────────────────
    const withinFreeRadius = distanceKm <= config.free_km_radius;

    if (withinFreeRadius) {
      let currentCharge;
      let thresholds = [];

      if (subtotal < config.delivery_tier_1_max) {
        currentCharge = config.delivery_tier_1_charge;
        thresholds = [
          { charge: config.delivery_tier_2_charge, min: config.delivery_tier_1_max },
          { charge: config.delivery_tier_3_charge, min: config.delivery_tier_2_max },
          { charge: config.delivery_tier_4_charge, min: config.delivery_tier_3_max },
        ];
      } else if (subtotal < config.delivery_tier_2_max) {
        currentCharge = config.delivery_tier_2_charge;
        thresholds = [
          { charge: config.delivery_tier_3_charge, min: config.delivery_tier_2_max },
          { charge: config.delivery_tier_4_charge, min: config.delivery_tier_3_max },
        ];
      } else if (subtotal < config.delivery_tier_3_max) {
        currentCharge = config.delivery_tier_3_charge;
        thresholds = [
          { charge: config.delivery_tier_4_charge, min: config.delivery_tier_3_max },
        ];
      } else {
        currentCharge = config.delivery_tier_4_charge;
      }

      if (currentCharge > 0) {
        for (const t of thresholds) {
          if (t.charge === 0) {
            const gap = Math.ceil(t.min - subtotal);
            if (gap > 0) {
              result.free_delivery = { gap, threshold: t.min };
            }
            break;
          }
        }
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// GST CALCULATION (post-slash, pre-discount)
// ─────────────────────────────────────────────────────────────

/**
 * Compute GST on toggled charge components.
 * Called AFTER applySlash(), BEFORE coupon/loyalty.
 *
 * @param {Object} slashed  - output of applySlash()
 * @param {Object} config   - normalised DeliveryPricingConfig row
 * @returns {{ gst_rate, gst_type, gst_amount, gst_breakdown }}
 */
export function computeGST(slashed, config) {
  const empty = {
    gst_rate: 0,
    gst_type: config.gst_type || 'CGST_SGST',
    gst_amount: 0,
    gst_breakdown: [],
  };

  if (!config.gst_enabled || config.gst_rate <= 0) return empty;

  const rate = config.gst_rate;
  const components = [];
  let totalBase = 0;

  // ── Helper ──────────────────────────────────────
  const addComponent = (key, label, base) => {
    if (!config[key] || base <= 0) return;
    const gst = Math.round(base * rate) / 100;
    components.push({ component: label, base, gst });
    totalBase += base;
  };

  // ── Toggled components ──────────────────────────
  addComponent('gst_on_subtotal',  'medicine_subtotal', slashed.subtotal ?? 0);
  addComponent('gst_on_service',   'service_charge',    slashed.service_charge ?? 0);

  // delivery_charge is the merged value from slash engine (delivery + km)
  const mergedDelivery = slashed.delivery_charge
    ?? ((slashed.delivery_fee ?? 0) + (slashed.km_surcharge ?? 0));
  addComponent('gst_on_delivery',  'delivery_charge',   mergedDelivery);

  addComponent('gst_on_packaging', 'packing_charge',    slashed.packing_charge ?? 0);

  if (totalBase === 0) return empty;

  // Total GST on aggregate base (avoids per-line rounding drift)
  const gst_amount = Math.round(totalBase * rate) / 100;

  return {
    gst_rate: rate,
    gst_type: config.gst_type || 'CGST_SGST',
    gst_amount,
    gst_breakdown: components,
  };
}