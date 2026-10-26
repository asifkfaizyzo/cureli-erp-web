// backend/src/modules/cadmin/pricing/cadminPricing.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";

// ── Whitelist of editable pricing fields (matches DeliveryPricingConfig model) ──
const NUMERIC_FIELDS = [
  "service_tier_1_max",
  "service_tier_1_charge",
  "service_tier_2_max",
  "service_tier_2_charge",
  "service_tier_3_charge",
  "delivery_tier_1_max",
  "delivery_tier_1_charge",
  "delivery_tier_2_max",
  "delivery_tier_2_charge",
  "delivery_tier_3_max",
  "delivery_tier_3_charge",
  "delivery_tier_4_charge",
  "free_km_radius",
  "per_km_tier_1_max",
  "per_km_tier_1_rate",
  "per_km_tier_2_rate",
  "packing_tier_1_max",
  "packing_tier_1_charge",
  "packing_tier_2_max",
  "packing_tier_2_charge",
  "packing_tier_3_charge",
  "same_day_cutoff_hour",
  "gst_rate",
];

const TOGGLE_FIELDS = [
  "is_active",
  "service_charge_enabled",
  "delivery_fee_enabled",
  "km_surcharge_enabled",
  "packing_enabled",
  "tip_enabled",
  "gst_enabled",
  "gst_on_subtotal",
  "gst_on_delivery",
  "gst_on_service",
  "gst_on_packaging",
];

const STRING_FIELDS = [
  "gst_type",
];

// ── Whitelist of editable slash fields ──
const SLASH_MODES = ["NONE", "NEW", "OLD"];

export async function getAllPricingConfigs() {
  return await prisma.deliveryPricingConfig.findMany({
    orderBy: { fulfillment_type: "asc" },
  });
}

export async function getPricingConfig(fulfillment_type = "INSTANT_DELIVERY") {
  let config = await prisma.deliveryPricingConfig.findUnique({
    where: { fulfillment_type },
  });

  if (!config) {
    config = await prisma.deliveryPricingConfig.create({
      data: { fulfillment_type },
    });
  }

  return config;
}

export async function updatePricingConfig(data, cadmin_id, fulfillment_type = "INSTANT_DELIVERY") {
  const targetType = data.fulfillment_type || fulfillment_type;

  let existing = await prisma.deliveryPricingConfig.findUnique({
    where: { fulfillment_type: targetType },
  });

  if (!existing) {
    existing = await prisma.deliveryPricingConfig.create({
      data: { fulfillment_type: targetType },
    });
  }

  // ── Build clean update payload from whitelist only ──
  const updateData = {};

  // Numeric fields: coerce to Number, preserve 0 as valid
  for (const key of NUMERIC_FIELDS) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      updateData[key] = Number(data[key]);
    }
  }

  // Toggle booleans
  for (const key of TOGGLE_FIELDS) {
    if (key in data) {
      updateData[key] = Boolean(data[key]);
    }
  }

  // String fields
  for (const key of STRING_FIELDS) {
    if (key in data) {
      updateData[key] = String(data[key]).trim();
    }
  }

   // ── delivery_tiers_json: dynamic unlimited-tier JSON ─────────
  if ("delivery_tiers_json" in data) {
    const raw = data.delivery_tiers_json;
    if (raw === null || raw === undefined || raw === "") {
      updateData.delivery_tiers_json = null;
    } else {
      let tiers;
      if (typeof raw === "string") {
        try {
          tiers = JSON.parse(raw);
        } catch {
          throw new Error("delivery_tiers_json must be valid JSON");
        }
      } else {
        tiers = raw;
      }

      if (!Array.isArray(tiers))
        throw new Error("delivery_tiers_json must be an array");
      if (tiers.length === 0)
        throw new Error("At least one delivery tier is required");

      const validated = [];
      const seenMins = new Set();

      for (const [i, t] of tiers.entries()) {
        const min = Number(t.min_order_value);
        const flat = Number(t.flat_charge);
        const radius = Number(t.free_radius_km);
        const rate = Number(t.per_km_rate);

        if (isNaN(min) || min < 0)
          throw new Error(`Tier ${i + 1}: min_order_value must be ≥ 0`);
        if (isNaN(flat) || flat < 0)
          throw new Error(`Tier ${i + 1}: flat_charge must be ≥ 0`);
        if (isNaN(radius) || radius < 0)
          throw new Error(`Tier ${i + 1}: free_radius_km must be ≥ 0`);
        if (isNaN(rate) || rate < 0)
          throw new Error(`Tier ${i + 1}: per_km_rate must be ≥ 0`);

        if (seenMins.has(min))
          throw new Error(`Tier ${i + 1}: duplicate min_order_value ₹${min}`);
        seenMins.add(min);

        validated.push({
          min_order_value: min,
          flat_charge: flat,
          free_radius_km: radius,
          per_km_rate: rate,
        });
      }

      // Sort by min_order_value ASC
      validated.sort((a, b) => a.min_order_value - b.min_order_value);

      // First tier must start at ₹0
      if (validated[0].min_order_value !== 0) {
        throw new Error(
          "The first delivery tier must have min_order_value = 0",
        );
      }

      // ── Monotonicity hard block (3 constraints) ──────────────
      // As min_order_value increases:
      //   flat_charge   → non-increasing  (higher order = lower/equal flat)
      //   free_radius_km → non-decreasing  (higher order = more/equal free km)
      //   per_km_rate   → non-increasing  (higher order = lower/equal rate)
      for (let i = 1; i < validated.length; i++) {
        const prev = validated[i - 1];
        const curr = validated[i];

        if (curr.flat_charge > prev.flat_charge) {
          throw new Error(
            `Tier ${i + 1} (≥₹${curr.min_order_value}): flat_charge ₹${curr.flat_charge} cannot be higher than previous tier ₹${prev.flat_charge}. Higher order value must have lower or equal flat fee.`,
          );
        }
        if (curr.free_radius_km < prev.free_radius_km) {
          throw new Error(
            `Tier ${i + 1} (≥₹${curr.min_order_value}): free_radius_km ${curr.free_radius_km}km cannot be less than previous tier ${prev.free_radius_km}km. Higher order value must have more or equal free km.`,
          );
        }
        if (curr.per_km_rate > prev.per_km_rate) {
          throw new Error(
            `Tier ${i + 1} (≥₹${curr.min_order_value}): per_km_rate ₹${curr.per_km_rate}/km cannot be higher than previous tier ₹${prev.per_km_rate}/km. Higher order value must have lower or equal per-km rate.`,
          );
        }
      }

      updateData.delivery_tiers_json = validated;
    }
  }

  // max_delivery_km: nullable — empty string / 0 / null → null
  if ("max_delivery_km" in data) {
    const raw = data.max_delivery_km;
    if (raw === null || raw === "" || raw === 0 || raw === "0") {
      updateData.max_delivery_km = null;
    } else {
      updateData.max_delivery_km = Number(raw);
    }
  }

  // free_km_mode: enum — must be EXCESS_ONLY or FULL_DISTANCE
  const VALID_FREE_KM_MODES = ["EXCESS_ONLY", "FULL_DISTANCE"];
  if ("free_km_mode" in data) {
    const raw = data.free_km_mode;
    if (VALID_FREE_KM_MODES.includes(raw)) {
      updateData.free_km_mode = raw;
    } else {
      updateData.free_km_mode = "EXCESS_ONLY";
    }
  }

  // Version bump + audit
  updateData.version = { increment: 1 };
  if (cadmin_id) {
    updateData.updated_by = cadmin_id;
  }
  // NOTE: updated_at is handled automatically by Prisma's @updatedAt

  const updated = await prisma.deliveryPricingConfig.update({
    where: { config_id: existing.config_id },
    data: updateData,
  });

  return updated;
}

/**
 * Fetch the single SlashDisplayConfig row.
 * Creates it with defaults if it doesn't exist yet.
 */
export async function getSlashConfig() {
  let config = await prisma.slashDisplayConfig.findFirst();

  if (!config) {
    config = await prisma.slashDisplayConfig.create({
      data: {
        is_enabled: false,
        service_mode: "NONE",
        service_pct: 0,
        delivery_mode: "NONE",
        delivery_tiers: [],
      },
    });
  }

  return config;
}

/**
 * Validate and update the SlashDisplayConfig row.
 *
 * @param {Object} data        - Update data payload from req.body
 * @param {string|null} cadmin_id - ID of the admin making the change
 */
export async function updateSlashConfig(data, cadmin_id) {
  let existing = await prisma.slashDisplayConfig.findFirst();

  if (!existing) {
    existing = await prisma.slashDisplayConfig.create({ data: {} });
  }

  const updateData = {};

  // ── 1. Validate master toggle ──
  if ("is_enabled" in data) {
    updateData.is_enabled = Boolean(data.is_enabled);
  }

  // ── 2. Validate Service Mode ──
  const service_mode = data.service_mode ?? existing.service_mode;
  if ("service_mode" in data) {
    if (!SLASH_MODES.includes(data.service_mode)) {
      throw new Error(
        `Invalid service_mode. Must be one of: ${SLASH_MODES.join(", ")}`,
      );
    }
    updateData.service_mode = data.service_mode;
  }

  // ── 3. Validate & Auto-Normalize Service Percentage ──
  if ("service_pct" in data || "service_mode" in data) {
    const rawPct =
      data.service_pct !== undefined
        ? Number(data.service_pct)
        : Number(existing.service_pct);
    const absPct = Math.abs(rawPct);

    if (service_mode === "NONE") {
      updateData.service_pct = 0;
    } else if (service_mode === "NEW") {
      if (absPct <= 0 || absPct > 200) {
        throw new Error(
          "For NEW mode, service markup must be between 1% and 200% (e.g. 50% for markup)",
        );
      }
      updateData.service_pct = absPct; // always positive
    } else if (service_mode === "OLD") {
      if (absPct <= 0 || absPct > 100) {
        throw new Error(
          "For OLD mode, service discount must be between 1% and 100% (e.g. 50% for half price, 100% for free)",
        );
      }
      updateData.service_pct = -absPct; // always negative
    }
  }

  // ── 4. Validate Delivery Mode ──
  const delivery_mode = data.delivery_mode ?? existing.delivery_mode;
  if ("delivery_mode" in data) {
    if (!SLASH_MODES.includes(data.delivery_mode)) {
      throw new Error(
        `Invalid delivery_mode. Must be one of: ${SLASH_MODES.join(", ")}`,
      );
    }
    updateData.delivery_mode = data.delivery_mode;
  }

  // ── 5. Validate & Auto-Normalize Delivery Tiers ──
  if ("delivery_tiers" in data || "delivery_mode" in data) {
    const rawTiers = data.delivery_tiers ?? existing.delivery_tiers;

    if (delivery_mode === "NONE") {
      updateData.delivery_tiers = [];
    } else {
      if (!Array.isArray(rawTiers)) {
        throw new Error("delivery_tiers must be an array");
      }

      const validatedTiers = [];
      const priorities = new Set();

      for (const [index, t] of rawTiers.entries()) {
        const priority = Number(t.priority);
        if (isNaN(priority) || priority <= 0) {
          throw new Error(
            `Tier at index ${index} has an invalid or missing priority.`,
          );
        }
        if (priorities.has(priority)) {
          throw new Error(
            `Duplicate priority: ${priority}. Priorities must be unique.`,
          );
        }
        priorities.add(priority);

        const pct = Number(t.pct);
        if (isNaN(pct)) {
          throw new Error(
            `Tier with priority ${priority} is missing a percentage rate.`,
          );
        }

        const absPct = Math.abs(pct);
        let finalPct = 0;

        // Apply mode-specific limits and enforce correct sign
        if (delivery_mode === "NEW") {
          if (absPct <= 0 || absPct > 200) {
            throw new Error(
              `For NEW mode, tier percentage (priority ${priority}) must be between 1% and 200%`,
            );
          }
          finalPct = absPct; // always positive
        } else if (delivery_mode === "OLD") {
          if (absPct <= 0 || absPct > 100) {
            throw new Error(
              `For OLD mode, tier discount (priority ${priority}) must be between 1% and 100% (e.g. 100% for free delivery)`,
            );
          }
          finalPct = -absPct; // always negative
        }

        // Validate conditions
        // Treat 0, empty string, null, undefined as "no condition"
        const minSubtotalRaw = Number(t.min_subtotal);
        const min_subtotal =
          t.min_subtotal !== null &&
          t.min_subtotal !== "" &&
          t.min_subtotal !== undefined &&
          minSubtotalRaw > 0
            ? minSubtotalRaw
            : null;

        const maxDistanceRaw = Number(t.max_distance_km);
        const max_distance_km =
          t.max_distance_km !== null &&
          t.max_distance_km !== "" &&
          t.max_distance_km !== undefined &&
          maxDistanceRaw > 0
            ? maxDistanceRaw
            : null;

        if (
          min_subtotal !== null &&
          (isNaN(min_subtotal) || min_subtotal < 0)
        ) {
          throw new Error(
            `Tier with priority ${priority} has an invalid min_subtotal.`,
          );
        }
        if (
          max_distance_km !== null &&
          (isNaN(max_distance_km) || max_distance_km < 0)
        ) {
          throw new Error(
            `Tier with priority ${priority} has an invalid max_distance_km.`,
          );
        }

         // Per-tier formula mode: FULL (whole-bill) or EXCESS (distance-only)
        const tierMode = t.mode === 'EXCESS' ? 'EXCESS' : 'FULL';

        validatedTiers.push({
          priority,
          min_subtotal,
          max_distance_km,
          pct: finalPct,
          mode: tierMode,
        });
      }

      validatedTiers.sort((a, b) => a.priority - b.priority);

      // Mode-flip warning (dismissible, not hard block)
      for (let i = 1; i < validatedTiers.length; i++) {
        if (validatedTiers[i].mode !== validatedTiers[i - 1].mode) {
          console.warn(
            `[SlashConfig] Mode flip between tier priority ${validatedTiers[i - 1].priority} (${validatedTiers[i - 1].mode}) → ${validatedTiers[i].priority} (${validatedTiers[i].mode}). Allowed but may confuse customers.`,
          );
          break; // one warning is enough
        }
      }

      updateData.delivery_tiers = validatedTiers;    }
  }

  // ── 6. Save update data, increment config version ──
  updateData.version = { increment: 1 };
  if (cadmin_id) {
    updateData.updated_by = cadmin_id;
  }

  const updated = await prisma.slashDisplayConfig.update({
    where: { config_id: existing.config_id },
    data: updateData,
  });

  return updated;
}
