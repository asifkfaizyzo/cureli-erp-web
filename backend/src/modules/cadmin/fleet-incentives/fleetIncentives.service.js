// backend/src/modules/cadmin/fleet-incentives/fleetIncentives.service.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-incentives/fleetIncentives.service.js

import prisma from "../../../config/prisma.js";

/**
 * Validates and sorts incentive tiers.
 * - Max 6 tiers.
 * - Targets and rewards must be strictly ascending.
 */
function validateTiers(tiers = []) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    throw new Error("At least one incentive tier is required");
  }
  if (tiers.length > 6) {
    throw new Error("A maximum of 6 incentive tiers are allowed");
  }

  const sorted = [...tiers].sort((a, b) => Number(a.target_value) - Number(b.target_value));

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].tier_level = i + 1;
    if (i > 0) {
      if (Number(sorted[i].target_value) <= Number(sorted[i - 1].target_value)) {
        throw new Error(`Tier ${i + 1} target must be greater than Tier ${i} target`);
      }
      if (Number(sorted[i].reward_amount) <= Number(sorted[i - 1].reward_amount)) {
        throw new Error(`Tier ${i + 1} reward must be greater than Tier ${i} reward`);
      }
    }
  }

  return sorted;
}

/**
 * Fetches all incentive templates (with active tier lists).
 */
export async function getIncentiveTemplates(query = {}) {
  const { period_type, is_active } = query;

  const where = {};
  if (period_type) where.period_type = period_type;
  if (is_active !== undefined) where.is_active = is_active === "true" || is_active === true;

  const templates = await prisma.incentiveTemplate.findMany({
    where,
    include: {
      tiers: { orderBy: { tier_level: "asc" } },
      _count: { select: { schedules: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return templates.map(formatTemplate);
}

/**
 * Fetches a single template by ID.
 */
export async function getIncentiveTemplateById(templateId) {
  const template = await prisma.incentiveTemplate.findUnique({
    where: { template_id: templateId },
    include: {
      tiers: { orderBy: { tier_level: "asc" } },
      schedules: {
        where: { end_date: { gte: new Date() } },
        orderBy: { start_date: "asc" },
        take: 5,
      },
    },
  });

  if (!template) throw new Error("Incentive template not found");
  return formatTemplate(template);
}

/**
 * Creates a new incentive template with stepper tiers.
 */
export async function createIncentiveTemplate(data, adminId) {
  const validatedTiers = validateTiers(data.tiers);

  const created = await prisma.$transaction(async (tx) => {
    return await tx.incentiveTemplate.create({
      data: {
        title: data.title,
        description: data.description || null,
        period_type: data.period_type || "DAILY",
        metric_type: data.metric_type || "ORDER_COUNT",
        min_online_hours: data.min_online_hours ?? null,
        max_denial_count: data.max_denial_count ?? null,
        max_cancellation_count: data.max_cancellation_count ?? null,
        min_acceptance_rate: data.min_acceptance_rate ?? null,
        min_completion_rate: data.min_completion_rate ?? null,
        is_active: true,
        created_by: adminId,
        tiers: {
          create: validatedTiers.map((t) => ({
            tier_level: t.tier_level,
            target_value: t.target_value,
            reward_amount: t.reward_amount,
          })),
        },
      },
      include: { tiers: { orderBy: { tier_level: "asc" } } },
    });
  });

  return formatTemplate(created);
}

/**
 * Updates an existing template and replaces its tiers.
 */
export async function updateIncentiveTemplate(templateId, data) {
  const existing = await prisma.incentiveTemplate.findUnique({
    where: { template_id: templateId },
  });
  if (!existing) throw new Error("Incentive template not found");

  const validatedTiers = data.tiers ? validateTiers(data.tiers) : null;

  const updated = await prisma.$transaction(async (tx) => {
    if (validatedTiers) {
      await tx.incentiveTier.deleteMany({
        where: { template_id: templateId },
      });
    }

    return await tx.incentiveTemplate.update({
      where: { template_id: templateId },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        period_type: data.period_type !== undefined ? data.period_type : existing.period_type,
        metric_type: data.metric_type !== undefined ? data.metric_type : existing.metric_type,
        min_online_hours: data.min_online_hours !== undefined ? data.min_online_hours : existing.min_online_hours,
        max_denial_count: data.max_denial_count !== undefined ? data.max_denial_count : existing.max_denial_count,
        max_cancellation_count:
          data.max_cancellation_count !== undefined ? data.max_cancellation_count : existing.max_cancellation_count,
        min_acceptance_rate:
          data.min_acceptance_rate !== undefined ? data.min_acceptance_rate : existing.min_acceptance_rate,
        min_completion_rate:
          data.min_completion_rate !== undefined ? data.min_completion_rate : existing.min_completion_rate,
        is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
        tiers: validatedTiers
          ? {
              create: validatedTiers.map((t) => ({
                tier_level: t.tier_level,
                target_value: t.target_value,
                reward_amount: t.reward_amount,
              })),
            }
          : undefined,
      },
      include: { tiers: { orderBy: { tier_level: "asc" } } },
    });
  });

  return formatTemplate(updated);
}

/**
 * Archives / deactivates a template.
 */
export async function toggleTemplateActive(templateId, isActive) {
  const updated = await prisma.incentiveTemplate.update({
    where: { template_id: templateId },
    data: { is_active: isActive },
    include: { tiers: { orderBy: { tier_level: "asc" } } },
  });

  return formatTemplate(updated);
}

/**
 * Format helper for template objects.
 */
function formatTemplate(t) {
  if (!t) return null;
  return {
    template_id: t.template_id,
    title: t.title,
    description: t.description,
    period_type: t.period_type,
    metric_type: t.metric_type,
    gating_conditions: {
      min_online_hours: t.min_online_hours !== null ? Number(t.min_online_hours) : null,
      max_denial_count: t.max_denial_count,
      max_cancellation_count: t.max_cancellation_count,
      min_acceptance_rate: t.min_acceptance_rate !== null ? Number(t.min_acceptance_rate) : null,
      min_completion_rate: t.min_completion_rate !== null ? Number(t.min_completion_rate) : null,
    },
    tiers: (t.tiers || []).map((tier) => ({
      tier_id: tier.tier_id,
      tier_level: tier.tier_level,
      target_value: Number(tier.target_value),
      reward_amount: Number(tier.reward_amount),
    })),
    usage_count: t._count?.schedules ?? 0,
    is_active: t.is_active,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}