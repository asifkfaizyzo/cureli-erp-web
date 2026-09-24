// backend/src/modules/cadmin/fleet-pricing/fleetPricing.service.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-pricing/fleetPricing.service.js

import prisma from "../../../config/prisma.js";
import { calculateDeliveryEarnings } from "./pricingEngine.service.js";

/**
 * Auto-seeds default Pricing Config v1 if database has no active config.
 */
async function ensureDefaultConfigExists() {
  const existing = await prisma.riderPricingConfig.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!existing) {
    const created = await prisma.riderPricingConfig.create({
      data: {
        version: 1,
        name: "Standard Initial Pricing",
        status: "ACTIVE",
        min_floor_payout: 25.0,
        pickup_base_fee: 10.0,
        drop_base_fee: 15.0,
        effective_from: new Date(),
        slabs: {
          create: [
            // Leg 1: Pickup slabs
            { leg_type: "LEG_1_PICKUP", from_km: 0.0, to_km: 2.0, rate_type: "FLAT_FIXED", rate: 5.0 },
            { leg_type: "LEG_1_PICKUP", from_km: 2.0, to_km: 5.0, rate_type: "PER_KM", rate: 4.0 },
            { leg_type: "LEG_1_PICKUP", from_km: 5.0, to_km: null, rate_type: "PER_KM", rate: 6.0 },

            // Leg 2: Drop slabs
            { leg_type: "LEG_2_DROP", from_km: 0.0, to_km: 2.0, rate_type: "FLAT_FIXED", rate: 10.0 },
            { leg_type: "LEG_2_DROP", from_km: 2.0, to_km: 6.0, rate_type: "PER_KM", rate: 8.0 },
            { leg_type: "LEG_2_DROP", from_km: 6.0, to_km: null, rate_type: "PER_KM", rate: 12.0 },
          ],
        },
      },
      include: { slabs: true },
    });
    return created;
  }
  return existing;
}

/**
 * Lazy activates any SCHEDULED configs whose effective_from time has arrived.
 */
export async function checkAndActivateScheduledConfigs() {
  const now = new Date();

  const dueScheduled = await prisma.riderPricingConfig.findFirst({
    where: {
      status: "SCHEDULED",
      effective_from: { lte: now },
    },
    orderBy: { effective_from: "desc" },
  });

  if (dueScheduled) {
    await prisma.$transaction([
      // Archive existing active
      prisma.riderPricingConfig.updateMany({
        where: { status: "ACTIVE" },
        data: {
          status: "ARCHIVED",
          effective_until: dueScheduled.effective_from,
        },
      }),
      // Activate scheduled
      prisma.riderPricingConfig.update({
        where: { config_id: dueScheduled.config_id },
        data: { status: "ACTIVE" },
      }),
    ]);
  }
}

/**
 * Fetches active pricing configuration along with upcoming scheduled models.
 */
export async function getPricingConfigData() {
  await checkAndActivateScheduledConfigs();
  await ensureDefaultConfigExists();

  const activeConfig = await prisma.riderPricingConfig.findFirst({
    where: { status: "ACTIVE" },
    include: { slabs: { orderBy: { from_km: "asc" } } },
    orderBy: { effective_from: "desc" },
  });

  const scheduledConfigs = await prisma.riderPricingConfig.findMany({
    where: { status: "SCHEDULED" },
    include: { slabs: { orderBy: { from_km: "asc" } } },
    orderBy: { effective_from: "asc" },
  });

  return {
    active_config: formatPricingConfig(activeConfig),
    scheduled_configs: scheduledConfigs.map(formatPricingConfig),
  };
}

/**
 * Creates a new pricing config version (either immediate or scheduled).
 */
export async function createPricingConfig(data, adminId) {
  const isImmediate = data.is_immediate || !data.effective_from || new Date(data.effective_from) <= new Date();
  const effectiveDate = isImmediate ? new Date() : new Date(data.effective_from);

  // Determine next version number
  const latest = await prisma.riderPricingConfig.findFirst({
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  return await prisma.$transaction(async (tx) => {
    if (isImmediate) {
      // Archive current active
      await tx.riderPricingConfig.updateMany({
        where: { status: "ACTIVE" },
        data: {
          status: "ARCHIVED",
          effective_until: effectiveDate,
        },
      });
    }

    const created = await tx.riderPricingConfig.create({
      data: {
        version: nextVersion,
        name: data.name || `Pricing Model v${nextVersion}`,
        status: isImmediate ? "ACTIVE" : "SCHEDULED",
        min_floor_payout: data.min_floor_payout,
        pickup_base_fee: data.pickup_base_fee,
        drop_base_fee: data.drop_base_fee,
        effective_from: effectiveDate,
        created_by: adminId,
        slabs: {
          create: [
            ...(data.pickup_slabs || []).map((slab) => ({
              leg_type: "LEG_1_PICKUP",
              from_km: slab.from_km,
              to_km: slab.to_km || null,
              rate_type: slab.rate_type,
              rate: slab.rate,
            })),
            ...(data.drop_slabs || []).map((slab) => ({
              leg_type: "LEG_2_DROP",
              from_km: slab.from_km,
              to_km: slab.to_km || null,
              rate_type: slab.rate_type,
              rate: slab.rate,
            })),
          ],
        },
      },
      include: { slabs: true },
    });

    return formatPricingConfig(created);
  });
}

/**
 * Fetches paginated version history of past configs.
 */
export async function getPricingHistory({ page = 1, limit = 10 }) {
  const skip = (Number(page) - 1) * Number(limit);

  const [configs, total] = await Promise.all([
    prisma.riderPricingConfig.findMany({
      where: { status: "ARCHIVED" },
      include: { slabs: { orderBy: { from_km: "asc" } } },
      orderBy: { effective_from: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.riderPricingConfig.count({ where: { status: "ARCHIVED" } }),
  ]);

  return {
    items: configs.map(formatPricingConfig),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
    },
  };
}

/**
 * Simulates fare calculation for UI preview.
 */
export async function simulatePricingPreview(data) {
  const mockConfig = {
    min_floor_payout: data.min_floor_payout,
    pickup_base_fee: data.pickup_base_fee,
    drop_base_fee: data.drop_base_fee,
    slabs: [
      ...(data.pickup_slabs || []).map((s) => ({ ...s, leg_type: "LEG_1_PICKUP" })),
      ...(data.drop_slabs || []).map((s) => ({ ...s, leg_type: "LEG_2_DROP" })),
    ],
  };

  return await calculateDeliveryEarnings({
    pickup_distance_km: data.pickup_distance_km || 0,
    drop_distance_km: data.drop_distance_km || 0,
    overrideConfig: mockConfig,
  });
}

function formatPricingConfig(config) {
  if (!config) return null;
  return {
    config_id: config.config_id,
    version: config.version,
    name: config.name,
    status: config.status,
    min_floor_payout: Number(config.min_floor_payout),
    pickup_base_fee: Number(config.pickup_base_fee),
    drop_base_fee: Number(config.drop_base_fee),
    effective_from: config.effective_from,
    effective_until: config.effective_until,
    pickup_slabs: (config.slabs || [])
      .filter((s) => s.leg_type === "LEG_1_PICKUP")
      .map((s) => ({
        slab_id: s.slab_id,
        from_km: Number(s.from_km),
        to_km: s.to_km !== null ? Number(s.to_km) : null,
        rate_type: s.rate_type,
        rate: Number(s.rate),
      })),
    drop_slabs: (config.slabs || [])
      .filter((s) => s.leg_type === "LEG_2_DROP")
      .map((s) => ({
        slab_id: s.slab_id,
        from_km: Number(s.from_km),
        to_km: s.to_km !== null ? Number(s.to_km) : null,
        rate_type: s.rate_type,
        rate: Number(s.rate),
      })),
    created_at: config.created_at,
    updated_at: config.updated_at,
  };
}