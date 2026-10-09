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
];

// ── Whitelist of editable slash fields ──
const SLASH_MODES = ["NONE", "NEW", "OLD"];

export async function getPricingConfig() {
  let config = await prisma.deliveryPricingConfig.findFirst();

  if (!config) {
    config = await prisma.deliveryPricingConfig.create({ data: {} });
  }

  return config;
}

export async function updatePricingConfig(data, cadmin_id) {
  let existing = await prisma.deliveryPricingConfig.findFirst();

  if (!existing) {
    existing = await prisma.deliveryPricingConfig.create({ data: {} });
  }

  // ── Build clean update payload from whitelist only ──
  const updateData = {};

  // Numeric fields: coerce to Number, preserve 0 as valid
  for (const key of NUMERIC_FIELDS) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      updateData[key] = Number(data[key]);
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

  // tip_enabled: boolean
  if ("tip_enabled" in data) {
    updateData.tip_enabled = Boolean(data.tip_enabled);
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

        validatedTiers.push({
          priority,
          min_subtotal,
          max_distance_km,
          pct: finalPct,
        });
      }

      validatedTiers.sort((a, b) => a.priority - b.priority);
      updateData.delivery_tiers = validatedTiers;
    }
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
