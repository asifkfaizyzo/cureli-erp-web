// backend/src/modules/cadmin/plans/cadminPlans.service.js (do not remove this comment)
import prisma from "../../../config/prisma.js";
import { SubscriptionStatus } from "../../../config/subscription.js";
import * as audit from "../../audit/index.js";
import { generatePlanCode } from "../../../utils/planCode.js";

// ============================================
// CONSTANTS
// ============================================

const PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  DEPRECATED: "DEPRECATED",
  SUSPENDED: "SUSPENDED",
};

const PLAN_TYPE = {
  PRE_MADE: "PRE_MADE",
  CUSTOM: "CUSTOM",
};

const STATUS_PRIORITY = {
  ACTIVE: 1,
  DRAFT: 2,
  DEPRECATED: 3,
  SUSPENDED: 4,
};

const INTRO_TRIGGER_TYPE = {
  DURATION: "duration",
  DATE: "date",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function isPromoActive(promoFreeUntil) {
  if (!promoFreeUntil) return false;
  return new Date(promoFreeUntil) > new Date();
}

function getTotalDurationMonths(billingCycleMonths, bonusMonths) {
  return (billingCycleMonths || 12) + (bonusMonths || 0);
}

/**
 * Checks if intro pricing is currently in its active phase.
 * - duration trigger: always "active" if intro_price is set
 *   (runtime billing determines when it ends per-subscription)
 * - date trigger: active if intro_end_date is in the future
 */
function isIntroPriceActive(plan) {
  if (!plan.intro_price || !plan.intro_trigger_type) return false;

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
    return plan.intro_end_date
      ? new Date(plan.intro_end_date) > new Date()
      : false;
  }

  // duration type - always considered active (per-subscription tracking)
  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    return true;
  }

  return false;
}

async function getSubscriberCount(plan_id) {
  return prisma.shopSubscription.count({
    where: {
      plan_id,
      is_active: true,
      OR: [
        { end_date: { gte: new Date() } },
        { grace_period_until: { gte: new Date() } },
      ],
    },
  });
}



async function generateCloneName(originalName) {
  const baseName = originalName
    .replace(/\s*\(Copy(?:\s*\d+)?\)\s*$/, "")
    .trim();

  const existingPlans = await prisma.plan.findMany({
    where: {
      name: { startsWith: baseName },
      deleted_at: null,
    },
    select: { name: true },
  });

  const existingNames = new Set(existingPlans.map((p) => p.name.toLowerCase()));

  let cloneName = `${baseName} (Copy)`;
  let counter = 1;

  while (existingNames.has(cloneName.toLowerCase())) {
    counter++;
    cloneName = `${baseName} (Copy ${counter})`;
  }

  return cloneName;
}

async function logPlanActivity(
  {
    plan_id,
    cadmin_id,
    action,
    from_status = null,
    to_status = null,
    changes = null,
    meta = null,
  },
  tx = null,
) {
  const db = tx || prisma;
  await db.planActivityLog.create({
    data: {
      plan_id,
      cadmin_id,
      action,
      from_status,
      to_status,
      changes,
      meta,
    },
  });
}

/**
 * Format plan for API response.
 * Includes all promo + intro pricing fields and computed values.
 */
function formatPlan(plan, subscriberCount = 0) {
  const promoActive = isPromoActive(plan.promo_free_until);
  const introActive = isIntroPriceActive(plan);
  const totalDuration = getTotalDurationMonths(
    plan.billing_cycle_months,
    plan.bonus_months,
  );

  return {
    plan_id: plan.plan_id,
    plan_code: plan.plan_code,        
    name: plan.name,
    description: plan.description,
    type: plan.type,

    // Pricing
    price: Number(plan.price),
    compare_at_price: plan.compare_at_price
      ? Number(plan.compare_at_price)
      : null,

    // Limits
    max_users: plan.max_users,
    max_branches: plan.max_branches,

    // Billing duration
    billing_cycle_months: plan.billing_cycle_months,
    bonus_months: plan.bonus_months,
    total_duration_months: totalDuration,

    // Promotional access
    promo_free_until: plan.promo_free_until,
    is_promo_active: promoActive,

    // Intro pricing
    intro_price: plan.intro_price ? Number(plan.intro_price) : null,
    intro_trigger_type: plan.intro_trigger_type || null,
    intro_duration_years: plan.intro_duration_years || null, // renamed from intro_duration_months
    intro_end_date: plan.intro_end_date || null,
    is_intro_active: introActive,

    // Flags
    is_featured: plan.is_featured,
    is_customizable: plan.is_customizable,

    // Status & counts
    status: plan.status,
    subscriber_count: subscriberCount,

    // Custom plan shop info
    created_for_shop_id: plan.created_for_shop_id,
    created_for_shop: plan.createdForShop
      ? {
          shop_id: plan.createdForShop.shop_id,
          business_name: plan.createdForShop.business_name,
        }
      : null,

    // Metadata
    created_by: plan.created_by,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
    activated_at: plan.activated_at,
    suspended_at: plan.suspended_at,
    deleted_at: plan.deleted_at,

    creator: plan.creator
      ? {
          cadmin_id: plan.creator.cadmin_id,
          username: plan.creator.username,
        }
      : null,
  };
}

// ============================================
// LIST PLANS
// ============================================

export async function listPlans({
  page = 1,
  limit = 20,
  search,
  status,
  type,
  has_active_promo = false,
  sort_by = "created_at",
  sort_order = "desc",
  include_deleted = false,
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (!include_deleted) where.deleted_at = null;
  if (status) where.status = status;
  if (type) where.type = type;
  if (has_active_promo) where.promo_free_until = { gt: new Date() };

  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  let orderBy = [];
  if (sort_by === "status") {
    orderBy.push({ created_at: sort_order });
  } else {
    orderBy.push({ [sort_by]: sort_order });
  }

  const [plans, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        creator: {
          select: { cadmin_id: true, username: true },
        },
        createdForShop: {
          select: { shop_id: true, business_name: true },
        },
      },
    }),
    prisma.plan.count({ where }),
  ]);

  const plansWithCounts = await Promise.all(
    plans.map(async (plan) => {
      let subscriberCount = 0;
      if (
        plan.status === PLAN_STATUS.ACTIVE ||
        plan.status === PLAN_STATUS.DEPRECATED
      ) {
        subscriberCount = await getSubscriberCount(plan.plan_id);
      }
      return formatPlan(plan, subscriberCount);
    }),
  );

  if (sort_by === "status") {
    plansWithCounts.sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] || 99;
      const priorityB = STATUS_PRIORITY[b.status] || 99;
      if (priorityA !== priorityB) {
        return sort_order === "asc"
          ? priorityA - priorityB
          : priorityB - priorityA;
      }
      return sort_order === "asc"
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    });
  }

  return {
    plans: plansWithCounts,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

// ============================================
// GET PLAN STATS
// ============================================

export async function getPlanStats() {
  const baseWhere = { deleted_at: null, type: PLAN_TYPE.PRE_MADE };

  const [total, draft, active, deprecated, suspended, withActivePromo, trashed] =
    await Promise.all([
      prisma.plan.count({ where: baseWhere }),
      prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.DRAFT } }),
      prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.ACTIVE } }),
      prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.DEPRECATED } }),
      prisma.plan.count({ where: { ...baseWhere, status: PLAN_STATUS.SUSPENDED } }),
      prisma.plan.count({ where: { ...baseWhere, promo_free_until: { gt: new Date() } } }),
      prisma.plan.count({
        where: {
          deleted_at: { not: null },
          type: PLAN_TYPE.PRE_MADE,
        },
      }),
    ]);

  return {
    total,
    draft,
    active,
    deprecated,
    suspended,
    with_active_promo: withActivePromo,
    trashed,
  };
}

// ============================================
// GET SINGLE PLAN
// ============================================

export async function getPlanById(plan_id) {
  const plan = await prisma.plan.findUnique({
    where: { plan_id },
    include: {
      creator: { select: { cadmin_id: true, username: true } },
      createdForShop: { select: { shop_id: true, business_name: true } },
    },
  });

  if (!plan) throw createError("Plan not found", "NOT_FOUND");

  const subscriberCount = await getSubscriberCount(plan_id);
  return formatPlan(plan, subscriberCount);
}

// ============================================
// CREATE PLAN
// ============================================

export async function createPlan(data, cadmin_id, auditContext = {}) {
  const {
    name,
    description,
    price,
    compare_at_price,
    max_users,
    max_branches,
    billing_cycle_months = 12,
    bonus_months = 0,
    promo_free_until,
    is_featured,
    type = PLAN_TYPE.PRE_MADE,
    created_for_shop_id = null,
    intro_price = null,
    intro_trigger_type = null,
    intro_duration_years = null,
    intro_end_date = null,
  } = data;

  // ── Validation (unchanged) ────────────────────────────────────────────────
  if (compare_at_price !== null && compare_at_price !== undefined) {
    if (compare_at_price <= price) {
      throw createError(
        "Compare-at price must be greater than the actual price",
        "VALIDATION_ERROR",
      );
    }
  }

  if (promo_free_until) {
    if (new Date(promo_free_until) <= new Date()) {
      throw createError(
        "Promo free until date must be in the future",
        "VALIDATION_ERROR",
      );
    }
  }

  if (intro_price !== null && intro_price !== undefined) {
    if (!intro_trigger_type) {
      throw createError(
        "intro_trigger_type is required when intro_price is set",
        "VALIDATION_ERROR",
      );
    }
    if (intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
      if (!intro_end_date) {
        throw createError(
          "intro_end_date is required when trigger type is 'date'",
          "VALIDATION_ERROR",
        );
      }
      if (new Date(intro_end_date) <= new Date()) {
        throw createError(
          "Intro end date must be in the future",
          "VALIDATION_ERROR",
        );
      }
      if (
        promo_free_until &&
        new Date(intro_end_date) <= new Date(promo_free_until)
      ) {
        throw createError(
          "Intro end date must be after promo free until date",
          "VALIDATION_ERROR",
        );
      }
    }
    if (intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
      if (!intro_duration_years) {
        throw createError(
          "intro_duration_years is required when trigger type is 'duration'",
          "VALIDATION_ERROR",
        );
      }
    }
  }

  if (type === PLAN_TYPE.CUSTOM && created_for_shop_id) {
    const shop = await prisma.shop.findUnique({
      where: { shop_id: created_for_shop_id },
    });
    if (!shop) throw createError("Shop not found", "SHOP_NOT_FOUND");
  }

  // ── Create ────────────────────────────────────────────────────────────────

  const result = await prisma.$transaction(async (tx) => {
    // Generate plan_code inside transaction so sequence is consumed atomically
    const plan_code = await generatePlanCode(tx);

    const plan = await tx.plan.create({
      data: {
        plan_code, // ← NEW
        name: name.trim(),
        description: description?.trim() || null,
        type,

        price: BigInt(price),
        compare_at_price: compare_at_price ? BigInt(compare_at_price) : null,

        max_users,
        max_branches,

        billing_cycle_months,
        bonus_months,

        promo_free_until: promo_free_until ? new Date(promo_free_until) : null,

        intro_price:
          intro_price !== null && intro_price !== undefined
            ? BigInt(intro_price)
            : null,
        intro_trigger_type: intro_trigger_type || null,
        intro_duration_years: intro_duration_years || null,
        intro_end_date: intro_end_date ? new Date(intro_end_date) : null,

        is_featured: is_featured || false,

        created_for_shop_id:
          type === PLAN_TYPE.CUSTOM ? created_for_shop_id : null,

        status: PLAN_STATUS.DRAFT,
        created_by: cadmin_id,
      },
      include: {
        creator: { select: { cadmin_id: true, username: true } },
        createdForShop: { select: { shop_id: true, business_name: true } },
      },
    });

    await logPlanActivity(
      {
        plan_id: plan.plan_id,
        cadmin_id,
        action: "created",
        to_status: PLAN_STATUS.DRAFT,
        meta: {
          plan_code: plan.plan_code, // ← NEW
          name: plan.name,
          type: plan.type,
          shop_id: plan.created_for_shop_id,
          has_promo: !!promo_free_until,
          has_compare_price: !!compare_at_price,
          bonus_months,
          has_intro_pricing: !!intro_price,
          intro_trigger_type: intro_trigger_type || null,
        },
      },
      tx,
    );

    await audit.log(
      {
        action: audit.AuditAction.PLAN_CREATED,
        entity_type: audit.EntityType.PLAN,
        entity_id: plan.plan_id,
        shop_id: plan.created_for_shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          plan_code: plan.plan_code, // ← NEW
          name: plan.name,
          price: Number(plan.price),
          max_users: plan.max_users,
          max_branches: plan.max_branches,
          type: plan.type,
          billing_cycle_months: plan.billing_cycle_months,
          bonus_months: plan.bonus_months,
          has_promo: !!promo_free_until,
          promo_free_until,
          has_compare_price: !!compare_at_price,
          has_intro_pricing: !!intro_price,
          intro_trigger_type: intro_trigger_type || null,
          intro_price: intro_price ? Number(intro_price) : null,
        },
      },
      { tx },
    );

    return plan;
  });

  return formatPlan(result, 0);
}

// ============================================
// UPDATE PLAN
// ============================================

export async function updatePlan(plan_id, updates, cadmin_id, auditContext = {}) {
  const existingPlan = await prisma.plan.findUnique({ where: { plan_id } });

  if (!existingPlan) throw createError("Plan not found", "NOT_FOUND");
  if (existingPlan.deleted_at)
    throw createError("Cannot update a deleted plan", "DELETED");
  if (existingPlan.status !== PLAN_STATUS.DRAFT)
    throw createError(
      "Only draft plans can be edited. Clone this plan to make changes.",
      "NOT_DRAFT",
    );

  const newPrice =
    updates.price !== undefined ? updates.price : Number(existingPlan.price);
  const newCompareAtPrice =
    updates.compare_at_price !== undefined
      ? updates.compare_at_price
      : existingPlan.compare_at_price
        ? Number(existingPlan.compare_at_price)
        : null;

  if (newCompareAtPrice !== null && newCompareAtPrice <= newPrice) {
    throw createError(
      "Compare-at price must be greater than the actual price",
      "VALIDATION_ERROR",
    );
  }

  if (updates.promo_free_until !== undefined && updates.promo_free_until !== null) {
    if (new Date(updates.promo_free_until) <= new Date()) {
      throw createError(
        "Promo free until date must be in the future",
        "VALIDATION_ERROR",
      );
    }
  }

  const resolvedIntroPrice =
    updates.intro_price !== undefined
      ? updates.intro_price
      : existingPlan.intro_price
        ? Number(existingPlan.intro_price)
        : null;

  const resolvedIntroTrigger =
    updates.intro_trigger_type !== undefined
      ? updates.intro_trigger_type
      : existingPlan.intro_trigger_type || null;

  const resolvedIntroDuration =
    updates.intro_duration_years !== undefined
      ? updates.intro_duration_years
      : existingPlan.intro_duration_years || null;

  const resolvedIntroEndDate =
    updates.intro_end_date !== undefined
      ? updates.intro_end_date
      : existingPlan.intro_end_date || null;

  const resolvedPromoFreeUntil =
    updates.promo_free_until !== undefined
      ? updates.promo_free_until
      : existingPlan.promo_free_until || null;

  if (resolvedIntroPrice !== null && resolvedIntroPrice !== undefined) {
    if (!resolvedIntroTrigger) {
      throw createError(
        "intro_trigger_type is required when intro_price is set",
        "VALIDATION_ERROR",
      );
    }
    if (resolvedIntroTrigger === INTRO_TRIGGER_TYPE.DATE) {
      if (!resolvedIntroEndDate) {
        throw createError(
          "intro_end_date is required when trigger type is 'date'",
          "VALIDATION_ERROR",
        );
      }
      if (new Date(resolvedIntroEndDate) <= new Date()) {
        throw createError("Intro end date must be in the future", "VALIDATION_ERROR");
      }
      if (
        resolvedPromoFreeUntil &&
        new Date(resolvedIntroEndDate) <= new Date(resolvedPromoFreeUntil)
      ) {
        throw createError(
          "Intro end date must be after promo free until date",
          "VALIDATION_ERROR",
        );
      }
    }
    if (resolvedIntroTrigger === INTRO_TRIGGER_TYPE.DURATION) {
      if (!resolvedIntroDuration) {
        throw createError(
          "intro_duration_years is required when trigger type is 'duration'",
          "VALIDATION_ERROR",
        );
      }
    }
  } else {
    if (
      updates.intro_price === null &&
      (resolvedIntroTrigger || resolvedIntroDuration || resolvedIntroEndDate)
    ) {
      updates.intro_trigger_type   = null;
      updates.intro_duration_years = null;
      updates.intro_end_date       = null;
    }
  }

  const changes = {};
  const allowedFields = [
    "name",
    "description",
    "price",
    "compare_at_price",
    "max_users",
    "max_branches",
    "billing_cycle_months",
    "bonus_months",
    "promo_free_until",
    "is_featured",
    "intro_price",
    "intro_trigger_type",
    "intro_duration_years",
    "intro_end_date",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      let oldValue;
      let newValue;

      if (field === "price" || field === "compare_at_price" || field === "intro_price") {
        oldValue = existingPlan[field] ? Number(existingPlan[field]) : null;
        newValue = updates[field];
      } else if (field === "promo_free_until" || field === "intro_end_date") {
        oldValue = existingPlan[field] ? existingPlan[field].toISOString() : null;
        newValue = updates[field] ? new Date(updates[field]).toISOString() : null;
      } else {
        oldValue = existingPlan[field];
        newValue = updates[field];
      }

      const hasChanged =
        oldValue !== newValue && !(oldValue === null && newValue === null);

      if (hasChanged) {
        changes[field] = { old: oldValue, new: newValue };

        if (field === "price") {
          updateData[field] = BigInt(newValue);
        } else if (field === "compare_at_price" || field === "intro_price") {
          updateData[field] = newValue !== null ? BigInt(newValue) : null;
        } else if (field === "promo_free_until" || field === "intro_end_date") {
          updateData[field] = newValue ? new Date(newValue) : null;
        } else if (field === "name" || field === "description") {
          updateData[field] = typeof newValue === "string" ? newValue.trim() : newValue;
        } else {
          updateData[field] = newValue;
        }
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return formatPlan(existingPlan, 0);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPlan = await tx.plan.update({
      where: { plan_id },
      data: updateData,
      include: {
        creator: { select: { cadmin_id: true, username: true } },
        createdForShop: { select: { shop_id: true, business_name: true } },
      },
    });

    await logPlanActivity({ plan_id, cadmin_id, action: "updated", changes }, tx);

    await audit.log(
      {
        action: audit.AuditAction.PLAN_UPDATED,
        entity_type: audit.EntityType.PLAN,
        entity_id: plan_id,
        shop_id: updatedPlan.created_for_shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          changed_fields: Object.keys(changes),
          before: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])),
          after:  Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])),
        },
      },
      { tx },
    );

    return updatedPlan;
  });

  return formatPlan(result, 0);
}

// ============================================
// ACTIVATE PLAN
// ============================================

export async function activatePlan(plan_id, cadmin_id, auditContext = {}) {
  const plan = await prisma.plan.findUnique({ where: { plan_id } });

  if (!plan) throw createError("Plan not found", "NOT_FOUND");
  if (plan.deleted_at)
    throw createError("Cannot activate a deleted plan", "DELETED");
  if (plan.status !== PLAN_STATUS.DRAFT)
    throw createError("Only draft plans can be activated", "NOT_DRAFT");



  const result = await prisma.$transaction(async (tx) => {
    const activatedPlan = await tx.plan.update({
      where: { plan_id },
      data: { status: PLAN_STATUS.ACTIVE, activated_at: new Date() },
      include: {
        creator: { select: { cadmin_id: true, username: true } },
        createdForShop: { select: { shop_id: true, business_name: true } },
      },
    });

    await logPlanActivity(
      {
        plan_id,
        cadmin_id,
        action: "activated",
        from_status: PLAN_STATUS.DRAFT,
        to_status: PLAN_STATUS.ACTIVE,
        meta: {
          has_promo: isPromoActive(activatedPlan.promo_free_until),
          bonus_months: activatedPlan.bonus_months,
          has_intro_pricing: !!activatedPlan.intro_price,
          intro_trigger_type: activatedPlan.intro_trigger_type || null,
        },
      },
      tx,
    );

    await audit.log(
      {
        action: audit.AuditAction.PLAN_ACTIVATED,
        entity_type: audit.EntityType.PLAN,
        entity_id: plan_id,
        shop_id: activatedPlan.created_for_shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          activated_by_cadmin_id: cadmin_id,
          name: activatedPlan.name,
          price: Number(activatedPlan.price),
          has_promo: isPromoActive(activatedPlan.promo_free_until),
          promo_free_until: activatedPlan.promo_free_until,
          has_intro_pricing: !!activatedPlan.intro_price,
          intro_trigger_type: activatedPlan.intro_trigger_type || null,
        },
      },
      { tx },
    );

    return activatedPlan;
  });

  return formatPlan(result, 0);
}

// ============================================
// SUSPEND PLAN
// ============================================

export async function suspendPlan(plan_id, cadmin_id, auditContext = {}) {
  const plan = await prisma.plan.findUnique({ where: { plan_id } });

  if (!plan) throw createError("Plan not found", "NOT_FOUND");
  if (plan.status !== PLAN_STATUS.ACTIVE)
    throw createError("Only active plans can be suspended", "NOT_ACTIVE");

  const subscriberCount = await getSubscriberCount(plan_id);
  const newStatus =
    subscriberCount > 0 ? PLAN_STATUS.DEPRECATED : PLAN_STATUS.SUSPENDED;

  const result = await prisma.$transaction(async (tx) => {
    const updatedPlan = await tx.plan.update({
      where: { plan_id },
      data: { status: newStatus, suspended_at: new Date() },
      include: {
        creator: { select: { cadmin_id: true, username: true } },
        createdForShop: { select: { shop_id: true, business_name: true } },
      },
    });

    await logPlanActivity(
      {
        plan_id,
        cadmin_id,
        action: "suspended",
        from_status: PLAN_STATUS.ACTIVE,
        to_status: newStatus,
        meta: { subscriber_count: subscriberCount },
      },
      tx,
    );

    await audit.log(
      {
        action: audit.AuditAction.PLAN_SUSPENDED,
        entity_type: audit.EntityType.PLAN,
        entity_id: plan_id,
        shop_id: updatedPlan.created_for_shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          reason:
            subscriberCount > 0
              ? `Plan has ${subscriberCount} active subscribers`
              : "Admin action",
          suspended_by_cadmin_id: cadmin_id,
          new_status: newStatus,
          active_subscriptions_count: subscriberCount,
        },
      },
      { tx },
    );

    return updatedPlan;
  });

  return {
    ...formatPlan(result, subscriberCount),
    subscriber_count: subscriberCount,
  };
}

// ============================================
// REACTIVATE PLAN
// ============================================

export async function reactivatePlan(plan_id, cadmin_id, auditContext = {}) {
  const plan = await prisma.plan.findUnique({ where: { plan_id } });

  if (!plan) throw createError("Plan not found", "NOT_FOUND");
  if (plan.status !== PLAN_STATUS.SUSPENDED)
    throw createError(
      "Only suspended plans can be reactivated. Deprecated plans must wait until all subscribers finish their term.",
      "NOT_SUSPENDED",
    );

  const subscriberCount = await getSubscriberCount(plan_id);
  if (subscriberCount > 0)
    throw createError(
      "Cannot reactivate plan with active subscribers",
      "HAS_SUBSCRIBERS",
    );


  const result = await prisma.$transaction(async (tx) => {
    const reactivatedPlan = await tx.plan.update({
      where: { plan_id },
      data: {
        status: PLAN_STATUS.ACTIVE,
        activated_at: new Date(),
        suspended_at: null,
      },
      include: {
        creator: { select: { cadmin_id: true, username: true } },
        createdForShop: { select: { shop_id: true, business_name: true } },
      },
    });

    await logPlanActivity(
      {
        plan_id,
        cadmin_id,
        action: "reactivated",
        from_status: PLAN_STATUS.SUSPENDED,
        to_status: PLAN_STATUS.ACTIVE,
      },
      tx,
    );

    await audit.log(
      {
        action: audit.AuditAction.PLAN_REACTIVATED,
        entity_type: audit.EntityType.PLAN,
        entity_id: plan_id,
        shop_id: reactivatedPlan.created_for_shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          reactivated_by_cadmin_id: cadmin_id,
          name: reactivatedPlan.name,
        },
      },
      { tx },
    );

    return reactivatedPlan;
  });

  return formatPlan(result, 0);
}

// ============================================
// CLONE PLAN
// ============================================

export async function clonePlan(plan_id, cadmin_id, customName = null, auditContext = {}) {
  const originalPlan = await prisma.plan.findUnique({ where: { plan_id } });

  if (!originalPlan) throw createError("Plan not found", "NOT_FOUND");
  if (originalPlan.deleted_at)
    throw createError("Cannot clone a deleted plan", "DELETED");

  const cloneName =
    customName?.trim() || (await generateCloneName(originalPlan.name));

  const result = await prisma.$transaction(async (tx) => {
    // Each clone gets its own fresh plan_code
    const plan_code = await generatePlanCode(tx);             // ← NEW

    const clonedPlan = await tx.plan.create({
      data: {
        plan_code,                                             // ← NEW
        name: cloneName,
        description: originalPlan.description,
        type: PLAN_TYPE.PRE_MADE,

        price: originalPlan.price,
        compare_at_price: originalPlan.compare_at_price,

        max_users: originalPlan.max_users,
        max_branches: originalPlan.max_branches,

        billing_cycle_months: originalPlan.billing_cycle_months,
        bonus_months: originalPlan.bonus_months,

        promo_free_until: null,

        intro_price: originalPlan.intro_price,
        intro_trigger_type: originalPlan.intro_trigger_type,
        intro_duration_years: originalPlan.intro_duration_years,
        intro_end_date:
          originalPlan.intro_end_date &&
          new Date(originalPlan.intro_end_date) > new Date()
            ? originalPlan.intro_end_date
            : null,

        is_featured: false,
        created_for_shop_id: null,

        status: PLAN_STATUS.DRAFT,
        created_by: cadmin_id,
      },
      include: {
        creator: { select: { cadmin_id: true, username: true } },
        createdForShop: { select: { shop_id: true, business_name: true } },
      },
    });

    await logPlanActivity(
      {
        plan_id: clonedPlan.plan_id,
        cadmin_id,
        action: "cloned",
        to_status: PLAN_STATUS.DRAFT,
        meta: {
          plan_code: clonedPlan.plan_code,                    // ← NEW
          cloned_from: originalPlan.plan_id,
          cloned_from_code: originalPlan.plan_code,           // ← NEW
          original_name: originalPlan.name,
          copied_fields: [
            "price",
            "compare_at_price",
            "billing_cycle_months",
            "bonus_months",
            "intro_price",
            "intro_trigger_type",
            "intro_duration_years",
            "intro_end_date",
          ],
          reset_fields: ["promo_free_until", "is_featured"],
          intro_end_date_reset:
            originalPlan.intro_end_date &&
            new Date(originalPlan.intro_end_date) <= new Date(),
        },
      },
      tx,
    );

    await audit.log(
      {
        action: audit.AuditAction.PLAN_CLONED,
        entity_type: audit.EntityType.PLAN,
        entity_id: clonedPlan.plan_id,
        shop_id: null,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          plan_code: clonedPlan.plan_code,                    // ← NEW
          source_plan_id: originalPlan.plan_id,
          source_plan_code: originalPlan.plan_code,           // ← NEW
          source_plan_name: originalPlan.name,
          new_plan_name: clonedPlan.name,
          copied_intro_pricing: !!originalPlan.intro_price,
          intro_end_date_was_reset:
            originalPlan.intro_end_date &&
            new Date(originalPlan.intro_end_date) <= new Date(),
        },
      },
      { tx },
    );

    return clonedPlan;
  });

  return formatPlan(result, 0);
}

// ============================================
// SOFT DELETE PLAN
// ============================================

export async function softDeletePlan(plan_id, cadmin_id, auditContext = {}) {
  const plan = await prisma.plan.findUnique({ where: { plan_id } });

  if (!plan) throw createError("Plan not found", "NOT_FOUND");
  if (plan.deleted_at)
    throw createError("Plan is already deleted", "ALREADY_DELETED");
  const allowableStatuses = [PLAN_STATUS.DRAFT, PLAN_STATUS.SUSPENDED];
  if (!allowableStatuses.includes(plan.status)) {
    throw createError(
      "Only draft or suspended plans can be deleted. Active and deprecated plans must be retained for billing records.",
      "INVALID_STATUS",
    );
  }
  // ───────────────────────────────────────────────────────────────────────

  const result = await prisma.$transaction(async (tx) => {
    const deletedPlan = await tx.plan.update({
      where: { plan_id },
      data: { deleted_at: new Date() },
      include: {
        creator: { select: { cadmin_id: true, username: true } },
        createdForShop: { select: { shop_id: true, business_name: true } },
      },
    });

    await logPlanActivity(
      {
        plan_id,
        cadmin_id,
        action: "deleted",
        from_status: plan.status, // record whether it was a draft or suspended plan
      },
      tx,
    );

    await audit.log(
      {
        action: audit.AuditAction.PLAN_DELETED,
        entity_type: audit.EntityType.PLAN,
        entity_id: plan_id,
        shop_id: deletedPlan.created_for_shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          deleted_by_cadmin_id: cadmin_id,
          reason: `${plan.status} plan moved to trash`,
          name: deletedPlan.name,
          previous_status: plan.status,
        },
      },
      { tx },
    );

    return deletedPlan;
  });

  return formatPlan(result, 0);
}

// ============================================
// CRON JOB: TRANSITION DEPRECATED PLANS
// ============================================

export async function transitionDeprecatedPlans() {
  const deprecatedPlans = await prisma.plan.findMany({
    where: { status: PLAN_STATUS.DEPRECATED, deleted_at: null },
  });

  const transitioned = [];
  const systemContext = audit.buildSystemContext("transition-deprecated-plans");

  for (const plan of deprecatedPlans) {
    const subscriberCount = await getSubscriberCount(plan.plan_id);

    if (subscriberCount === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.plan.update({
          where: { plan_id: plan.plan_id },
          data: { status: PLAN_STATUS.SUSPENDED },
        });

        await tx.planActivityLog.create({
          data: {
            plan_id: plan.plan_id,
            cadmin_id: plan.created_by,
            action: "auto_suspended",
            from_status: PLAN_STATUS.DEPRECATED,
            to_status: PLAN_STATUS.SUSPENDED,
            meta: {
              reason: "All subscriptions ended",
              triggered_by: "cron_job",
            },
          },
        });

        await audit.log(
          {
            action: audit.AuditAction.PLAN_AUTO_SUSPENDED_BY_CRON,
            entity_type: audit.EntityType.PLAN,
            entity_id: plan.plan_id,
            shop_id: plan.created_for_shop_id,
            ...systemContext,
            reason_code: audit.AuditReasonCode.AUTOMATION,
            metadata: {
              reason: "All subscriptions ended",
              active_subscriptions_count: 0,
              plan_name: plan.name,
            },
          },
          { tx },
        );
      });

      transitioned.push({ plan_id: plan.plan_id, name: plan.name });
    }
  }

  return {
    checked: deprecatedPlans.length,
    transitioned: transitioned.length,
    plans: transitioned,
  };
}
