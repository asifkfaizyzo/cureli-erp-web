// backend/src/modules/cadmin/fleet-pricing/pricingEngine.service.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-pricing/pricingEngine.service.js

import prisma from "../../../config/prisma.js";

/**
 * Calculates delivery fee for a single distance leg based on configured slabs.
 *
 * @param {number} distanceKm
 * @param {number} baseFee
 * @param {Array} slabs - Sorted by from_km ascending
 * @returns {number} Leg total amount
 */
export function calculateLegFee(distanceKm, baseFee = 0, slabs = []) {
  const dist = Math.max(0, Number(distanceKm) || 0);
  let totalLegFee = Number(baseFee) || 0;

  if (dist === 0 || !slabs || slabs.length === 0) {
    return Number(totalLegFee.toFixed(2));
  }

  // Slabs sorted ascending
  const sortedSlabs = [...slabs].sort(
    (a, b) => Number(a.from_km) - Number(b.from_km)
  );

  for (const slab of sortedSlabs) {
    const fromKm = Number(slab.from_km);
    const toKm = slab.to_km !== null && slab.to_km !== undefined ? Number(slab.to_km) : Infinity;
    const rate = Number(slab.rate) || 0;

    if (dist <= fromKm) {
      continue;
    }

    if (slab.rate_type === "FLAT_FIXED") {
      // If distance reaches into this fixed slab
      if (dist > fromKm && dist <= toKm) {
        totalLegFee += rate;
        break; // Fixed slab covers the entire portion up to toKm
      }
    } else {
      // PER_KM incremental slab calculation
      const applicableDistance = Math.min(dist, toKm) - fromKm;
      if (applicableDistance > 0) {
        totalLegFee += applicableDistance * rate;
      }
    }
  }

  return Number(totalLegFee.toFixed(2));
}

/**
 * Calculates complete rider delivery earnings breakdown.
 *
 * @param {Object} params
 * @param {number} params.pickup_distance_km - Leg 1 (Rider -> Pharmacy)
 * @param {number} params.drop_distance_km   - Leg 2 (Pharmacy -> Customer)
 * @param {string} [params.rider_type]       - 'INDEPENDENT' | 'TEAM'
 * @param {Object} [params.overrideConfig]   - Optional config object for simulation/preview
 * @returns {Promise<Object>} Granular fare calculation result
 */
export async function calculateDeliveryEarnings({
  pickup_distance_km = 0,
  drop_distance_km = 0,
  rider_type = "INDEPENDENT",
  overrideConfig = null,
}) {
  // If internal Cureli team rider, delivery fare is ₹0 (handled via fixed payroll)
  if (rider_type === "TEAM") {
    return {
      rider_type: "TEAM",
      pickup_distance_km: Number(pickup_distance_km),
      drop_distance_km: Number(drop_distance_km),
      total_distance_km: Number(pickup_distance_km) + Number(drop_distance_km),
      pickup_fee: 0,
      drop_fee: 0,
      surge_fee: 0,
      floor_topup_fee: 0,
      total_rider_earning: 0,
      pricing_config_id: null,
      surge_rule_id: null,
      is_team_rider: true,
    };
  }

  // 1. Resolve Active Pricing Config
  let config = overrideConfig;
  if (!config) {
    const now = new Date();
    config = await prisma.riderPricingConfig.findFirst({
      where: {
        status: "ACTIVE",
        effective_from: { lte: now },
        OR: [{ effective_until: null }, { effective_until: { gt: now } }],
      },
      include: {
        slabs: true,
      },
      orderBy: { effective_from: "desc" },
    });
  }

  // Fallback defaults if no config row exists
  const minFloor = config ? Number(config.min_floor_payout) : 25.0;
  const pickupBase = config ? Number(config.pickup_base_fee) : 10.0;
  const dropBase = config ? Number(config.drop_base_fee) : 15.0;

  const pickupSlabs = config?.slabs ? config.slabs.filter((s) => s.leg_type === "LEG_1_PICKUP") : [];
  const dropSlabs = config?.slabs ? config.slabs.filter((s) => s.leg_type === "LEG_2_DROP") : [];

  // 2. Calculate Leg 1 and Leg 2
  const pickupFee = calculateLegFee(pickup_distance_km, pickupBase, pickupSlabs);
  const dropFee = calculateLegFee(drop_distance_km, dropBase, dropSlabs);
  const baseSubtotal = pickupFee + dropFee;

  // 3. Resolve Active Surge Rule
  let activeSurge = null;
  const now = new Date();

  activeSurge = await prisma.riderSurgeRule.findFirst({
    where: {
      is_active: true,
      OR: [{ expires_at: null }, { expires_at: { gt: now } }],
    },
    orderBy: { activated_at: "desc" },
  });

  // Calculate Surge
  let surgeFee = 0;
  let surgeRuleId = null;

  if (activeSurge) {
    surgeRuleId = activeSurge.rule_id;
    const surgeVal = Number(activeSurge.value);

    if (activeSurge.calc_type === "MULTIPLIER") {
      surgeFee = Math.max(0, baseSubtotal * (surgeVal - 1));
    } else if (activeSurge.calc_type === "FLAT_ADDITION") {
      surgeFee = surgeVal;
    }
  }
  surgeFee = Number(surgeFee.toFixed(2));

  // 4. Enforce Floor Payout Guarantee
  const fareBeforeFloor = baseSubtotal + surgeFee;
  let floorTopupFee = 0;

  if (fareBeforeFloor < minFloor) {
    floorTopupFee = Number((minFloor - fareBeforeFloor).toFixed(2));
  }

  const totalRiderEarning = Number((fareBeforeFloor + floorTopupFee).toFixed(2));

  return {
    rider_type: "INDEPENDENT",
    pricing_config_id: config?.config_id ?? null,
    config_version: config?.version ?? 1,
    pickup_distance_km: Number(pickup_distance_km),
    drop_distance_km: Number(drop_distance_km),
    total_distance_km: Number((Number(pickup_distance_km) + Number(drop_distance_km)).toFixed(2)),
    pickup_fee: pickupFee,
    drop_fee: dropFee,
    surge_fee: surgeFee,
    surge_rule_id: surgeRuleId,
    floor_topup_fee: floorTopupFee,
    min_floor_guarantee: minFloor,
    total_rider_earning: totalRiderEarning,
    is_team_rider: false,
  };
}