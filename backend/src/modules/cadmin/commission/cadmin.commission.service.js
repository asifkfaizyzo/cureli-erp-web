// backend/src/modules/cadmin/commission/cadmin.commission.service.js

import prisma from "../../../config/prisma.js";
import * as audit from "../../audit/index.js";
import { notifyAsync, NOTIFICATION_EVENTS } from "../../notifications/index.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const VALID_TYPES = new Set([
  "FLAT_PERCENT",
  "FLAT_AMOUNT",
  "HYBRID",
  "CAPPED_PERCENT",
]);

const VALID_BASES = new Set(["SUBTOTAL", "SUBTOTAL_PLUS_SERVICE", "GRAND_TOTAL"]);
const VALID_FREQS = new Set(["PER_ORDER", "WEEKLY"]);

function toDecimal(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function buildRateData(data) {
  const result = {};

  if (data.commission_type) result.commission_type = data.commission_type;
  if (data.name !== undefined) result.name = data.name.trim();
  if (data.description !== undefined) result.description = data.description?.trim() || null;
  if (data.commission_base) result.commission_base = data.commission_base;
  if (data.settlement_frequency) result.settlement_frequency = data.settlement_frequency;

  // Rate fields — set to null if not relevant to the type
  result.flat_percent = toDecimal(data.flat_percent);
  result.flat_amount = toDecimal(data.flat_amount);
  result.hybrid_percent = toDecimal(data.hybrid_percent);
  result.hybrid_flat_amount = toDecimal(data.hybrid_flat_amount);
  result.capped_percent = toDecimal(data.capped_percent);
  result.capped_max_amount = toDecimal(data.capped_max_amount);

  return result;
}

function validateRuleData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.name?.trim()) {
    errors.push("Rule name is required");
  }
  if (data.name?.trim().length > 120) {
    errors.push("Rule name must be 120 characters or less");
  }

  const type = data.commission_type;
  if (type && !VALID_TYPES.has(type)) {
    errors.push(`Invalid commission type: ${type}`);
  }

  if (data.commission_base && !VALID_BASES.has(data.commission_base)) {
    errors.push(`Invalid commission base: ${data.commission_base}`);
  }

  if (data.settlement_frequency && !VALID_FREQS.has(data.settlement_frequency)) {
    errors.push(`Invalid settlement frequency: ${data.settlement_frequency}`);
  }

  // Type-specific validation
  if (type === "FLAT_PERCENT" || (!isUpdate && !type)) {
    const pct = toDecimal(data.flat_percent);
    if (pct !== null && (pct < 0 || pct > 100)) {
      errors.push("Flat percent must be between 0 and 100");
    }
  }

  if (type === "FLAT_AMOUNT") {
    const amt = toDecimal(data.flat_amount);
    if (amt !== null && amt < 0) {
      errors.push("Flat amount cannot be negative");
    }
  }

  if (type === "HYBRID") {
    const pct = toDecimal(data.hybrid_percent);
    const amt = toDecimal(data.hybrid_flat_amount);
    if (pct !== null && (pct < 0 || pct > 100)) {
      errors.push("Hybrid percent must be between 0 and 100");
    }
    if (amt !== null && amt < 0) {
      errors.push("Hybrid flat amount cannot be negative");
    }
  }

  if (type === "CAPPED_PERCENT") {
    const pct = toDecimal(data.capped_percent);
    const cap = toDecimal(data.capped_max_amount);
    if (pct !== null && (pct < 0 || pct > 100)) {
      errors.push("Capped percent must be between 0 and 100");
    }
    if (cap !== null && cap < 0) {
      errors.push("Capped max amount cannot be negative");
    }
  }

  if (errors.length > 0) {
    const err = new Error(errors.join("; "));
    err.status = 400;
    throw err;
  }
}

function formatRuleDescription(rule) {
  switch (rule.commission_type) {
    case "FLAT_PERCENT":
      return `${rule.flat_percent}% of ${rule.commission_base.toLowerCase().replace(/_/g, " ")}`;
    case "FLAT_AMOUNT":
      return `₹${rule.flat_amount} per order`;
    case "HYBRID":
      return `${rule.hybrid_percent}% + ₹${rule.hybrid_flat_amount} per order`;
    case "CAPPED_PERCENT":
      return `${rule.capped_percent}% (max ₹${rule.capped_max_amount})`;
    default:
      return "Unknown";
  }
}

function computeExample(rule, subtotal = 500) {
  let commission = 0;

  switch (rule.commission_type) {
    case "FLAT_PERCENT":
      commission = (subtotal * parseFloat(rule.flat_percent)) / 100;
      break;
    case "FLAT_AMOUNT":
      commission = parseFloat(rule.flat_amount);
      break;
    case "HYBRID":
      commission =
        (subtotal * parseFloat(rule.hybrid_percent)) / 100 +
        parseFloat(rule.hybrid_flat_amount);
      break;
    case "CAPPED_PERCENT": {
      const raw = (subtotal * parseFloat(rule.capped_percent)) / 100;
      commission = Math.min(raw, parseFloat(rule.capped_max_amount));
      break;
    }
  }

  commission = parseFloat(commission.toFixed(2));

  return {
    order_subtotal: subtotal,
    commission_amount: commission,
    pharmacy_receives: parseFloat((subtotal - commission).toFixed(2)),
    description: formatRuleDescription(rule),
  };
}

// ─────────────────────────────────────────────
// AUDIENCE RESOLUTION FOR NOTIFICATIONS
// ─────────────────────────────────────────────

async function getShopIdsWithoutOverrides() {
  const shopsWithOverrides = await prisma.commissionOverride.findMany({
    where: { is_active: true },
    select: { shop_id: true },
  });
  const excludedIds = shopsWithOverrides.map((o) => o.shop_id);

  const liveShops = await prisma.marketplaceProfile.findMany({
    where: {
      is_live: true,
      ...(excludedIds.length > 0
        ? { shop_id: { notIn: excludedIds } }
        : {}),
    },
    select: { shop_id: true },
  });

  return liveShops.map((s) => s.shop_id);
}

async function notifyAffectedPharmacies(eventType, shopIds, context) {
  if (!shopIds || shopIds.length === 0) return;

  try {
    const users = await prisma.user.findMany({
      where: {
        shop_id: { in: shopIds },
        is_active: true,
        role: { in: ["super_admin", "owner"] },
      },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        shop_id: true,
      },
    });

    if (users.length === 0) return;

    const recipients = users.map((u) => ({
      email: u.email || null,
      name: u.full_name || "Pharmacy Owner",
      user_id: u.user_id,
      shop_id: u.shop_id,
      type: "user",
    }));

    notifyAsync({
      type: eventType,
      context,
      channels: ["inapp", "email"],
      audience: recipients,
    });
  } catch (err) {
    console.error("[Commission] Failed to notify affected pharmacies:", err.message);
  }
}

// ─────────────────────────────────────────────
// CRUD — RULES
// ─────────────────────────────────────────────

export async function listRules() {
  const rules = await prisma.commissionRule.findMany({
    orderBy: [{ is_default: "desc" }, { created_at: "desc" }],
    include: {
      _count: {
        select: { overrides: { where: { is_active: true } } },
      },
    },
  });

  return rules.map((r) => ({
    ...r,
    override_count: r._count.overrides,
    description_text: formatRuleDescription(r),
    _count: undefined,
  }));
}

export async function getRuleDetail(ruleId) {
  const rule = await prisma.commissionRule.findUnique({
    where: { rule_id: ruleId },
    include: {
      overrides: {
        where: { is_active: true },
        include: {
          shop: {
            select: {
              shop_id: true,
              business_name: true,
              city: true,
            },
          },
        },
      },
    },
  });

  if (!rule) {
    const err = new Error("Commission rule not found");
    err.status = 404;
    throw err;
  }

  return {
    ...rule,
    description_text: formatRuleDescription(rule),
    examples: [
      computeExample(rule, 200),
      computeExample(rule, 500),
      computeExample(rule, 1500),
    ],
  };
}

export async function createRule(data, cadminId) {
  validateRuleData(data);

  const ruleData = buildRateData(data);

  const rule = await prisma.commissionRule.create({
    data: {
      ...ruleData,
      created_by: cadminId,
      updated_by: cadminId,
    },
  });

  audit
    .log({
      action: audit.AuditAction.COMMISSION_RULE_CREATED,
      entity_type: audit.EntityType.COMMISSION_RULE,
      entity_id: rule.rule_id,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        name: rule.name,
        commission_type: rule.commission_type,
        description_text: formatRuleDescription(rule),
      },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  return rule;
}

export async function updateRule(ruleId, data, cadminId) {
  const existing = await prisma.commissionRule.findUnique({
    where: { rule_id: ruleId },
  });

  if (!existing) {
    const err = new Error("Commission rule not found");
    err.status = 404;
    throw err;
  }

  validateRuleData(data, true);

  const ruleData = buildRateData(data);

  const updated = await prisma.commissionRule.update({
    where: { rule_id: ruleId },
    data: {
      ...ruleData,
      updated_by: cadminId,
    },
  });

  // Audit
  audit
    .log({
      action: audit.AuditAction.COMMISSION_RULE_UPDATED,
      entity_type: audit.EntityType.COMMISSION_RULE,
      entity_id: ruleId,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        name: updated.name,
        changed_fields: Object.keys(ruleData),
        description_text: formatRuleDescription(updated),
      },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  // Notify affected pharmacies if this is the default rule
  if (updated.is_default) {
    const shopIds = await getShopIdsWithoutOverrides();
    notifyAffectedPharmacies(
      NOTIFICATION_EVENTS.COMMISSION_RATE_CHANGED,
      shopIds,
      {
        title: "Commission Rate Updated",
        message: `The default marketplace commission has been updated to ${formatRuleDescription(updated)}. This applies to all your marketplace orders.`,
        rule_name: updated.name,
        description_text: formatRuleDescription(updated),
      }
    );
  } else {
    // Notify shops with overrides pointing to this rule
    const overrides = await prisma.commissionOverride.findMany({
      where: { rule_id: ruleId, is_active: true },
      select: { shop_id: true },
    });
    const shopIds = overrides.map((o) => o.shop_id);
    if (shopIds.length > 0) {
      notifyAffectedPharmacies(
        NOTIFICATION_EVENTS.COMMISSION_RATE_CHANGED,
        shopIds,
        {
          title: "Your Commission Rate Updated",
          message: `Your custom marketplace commission has been updated to ${formatRuleDescription(updated)}.`,
          rule_name: updated.name,
          description_text: formatRuleDescription(updated),
        }
      );
    }
  }

  return updated;
}

export async function deleteRule(ruleId, cadminId) {
  const existing = await prisma.commissionRule.findUnique({
    where: { rule_id: ruleId },
    include: {
      _count: { select: { overrides: true } },
    },
  });

  if (!existing) {
    const err = new Error("Commission rule not found");
    err.status = 404;
    throw err;
  }

  if (existing.is_default) {
    const err = new Error("Cannot delete the default commission rule. Set another rule as default first.");
    err.status = 400;
    throw err;
  }

  if (existing._count.overrides > 0) {
    const err = new Error(
      `Cannot delete this rule — ${existing._count.overrides} shop(s) are using it as a custom override. Remove those overrides first.`
    );
    err.status = 400;
    throw err;
  }

  await prisma.commissionRule.delete({ where: { rule_id: ruleId } });

  audit
    .log({
      action: audit.AuditAction.COMMISSION_RULE_DELETED,
      entity_type: audit.EntityType.COMMISSION_RULE,
      entity_id: ruleId,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: { name: existing.name, commission_type: existing.commission_type },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  return { deleted: true };
}

// ─────────────────────────────────────────────
// DEFAULT MANAGEMENT
// ─────────────────────────────────────────────

export async function setDefaultRule(ruleId, cadminId) {
  const rule = await prisma.commissionRule.findUnique({
    where: { rule_id: ruleId },
  });

  if (!rule) {
    const err = new Error("Commission rule not found");
    err.status = 404;
    throw err;
  }

  if (!rule.is_active) {
    const err = new Error("Cannot set an inactive rule as default. Activate it first.");
    err.status = 400;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    // Unset current default
    await tx.commissionRule.updateMany({
      where: { is_default: true },
      data: { is_default: false },
    });

    // Set new default
    await tx.commissionRule.update({
      where: { rule_id: ruleId },
      data: { is_default: true, updated_by: cadminId },
    });
  });

  audit
    .log({
      action: audit.AuditAction.COMMISSION_DEFAULT_CHANGED,
      entity_type: audit.EntityType.COMMISSION_RULE,
      entity_id: ruleId,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        new_default_name: rule.name,
        description_text: formatRuleDescription(rule),
      },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  // Notify all shops without overrides
  const shopIds = await getShopIdsWithoutOverrides();
  notifyAffectedPharmacies(
    NOTIFICATION_EVENTS.COMMISSION_RATE_CHANGED,
    shopIds,
    {
      title: "Default Commission Rate Changed",
      message: `The default marketplace commission is now "${rule.name}" — ${formatRuleDescription(rule)}. This applies to all your marketplace orders.`,
      rule_name: rule.name,
      description_text: formatRuleDescription(rule),
    }
  );

  return { rule_id: ruleId, is_default: true };
}

// ─────────────────────────────────────────────
// TOGGLE ACTIVE
// ─────────────────────────────────────────────

export async function toggleRuleActive(ruleId, cadminId) {
  const rule = await prisma.commissionRule.findUnique({
    where: { rule_id: ruleId },
  });

  if (!rule) {
    const err = new Error("Commission rule not found");
    err.status = 404;
    throw err;
  }

  const newActive = !rule.is_active;

  if (!newActive && rule.is_default) {
    const err = new Error("Cannot deactivate the default rule. Set another rule as default first.");
    err.status = 400;
    throw err;
  }

  const updated = await prisma.commissionRule.update({
    where: { rule_id: ruleId },
    data: { is_active: newActive, updated_by: cadminId },
  });

  audit
    .log({
      action: newActive
        ? audit.AuditAction.COMMISSION_RULE_ACTIVATED
        : audit.AuditAction.COMMISSION_RULE_DEACTIVATED,
      entity_type: audit.EntityType.COMMISSION_RULE,
      entity_id: ruleId,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: { name: rule.name, is_active: newActive },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  return { rule_id: ruleId, is_active: newActive };
}

// ─────────────────────────────────────────────
// GLOBAL SUSPENSION (Kill Switch)
// ─────────────────────────────────────────────

export async function suspendCommission(until, cadminId) {
  const defaultRule = await prisma.commissionRule.findFirst({
    where: { is_default: true },
  });

  if (!defaultRule) {
    const err = new Error("No default commission rule exists. Create one first.");
    err.status = 400;
    throw err;
  }

  const suspendedUntil = until ? new Date(until) : null;
  if (suspendedUntil && isNaN(suspendedUntil.getTime())) {
    const err = new Error("Invalid date format for suspended_until");
    err.status = 400;
    throw err;
  }

  const updated = await prisma.commissionRule.update({
    where: { rule_id: defaultRule.rule_id },
    data: {
      is_suspended: true,
      suspended_until: suspendedUntil,
      updated_by: cadminId,
    },
  });

  audit
    .log({
      action: audit.AuditAction.COMMISSION_SUSPENDED,
      entity_type: audit.EntityType.COMMISSION_RULE,
      entity_id: defaultRule.rule_id,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        suspended_until: suspendedUntil?.toISOString() || "indefinite",
      },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  // Notify ALL live shops
  const allShops = await prisma.marketplaceProfile.findMany({
    where: { is_live: true },
    select: { shop_id: true },
  });
  const shopIds = allShops.map((s) => s.shop_id);

  const untilText = suspendedUntil
    ? `until ${suspendedUntil.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : "until further notice";

  notifyAffectedPharmacies(
    NOTIFICATION_EVENTS.COMMISSION_SUSPENDED,
    shopIds,
    {
      title: "Commission Temporarily Waived",
      message: `Marketplace commission has been set to 0% ${untilText}. You will keep 100% of your medicine sales during this period.`,
      suspended_until: suspendedUntil?.toISOString() || null,
    }
  );

  return {
    is_suspended: true,
    suspended_until: suspendedUntil,
  };
}

export async function resumeCommission(cadminId) {
  const defaultRule = await prisma.commissionRule.findFirst({
    where: { is_default: true },
  });

  if (!defaultRule) {
    const err = new Error("No default commission rule exists");
    err.status = 400;
    throw err;
  }

  if (!defaultRule.is_suspended) {
    const err = new Error("Commission is not currently suspended");
    err.status = 400;
    throw err;
  }

  const updated = await prisma.commissionRule.update({
    where: { rule_id: defaultRule.rule_id },
    data: {
      is_suspended: false,
      suspended_until: null,
      updated_by: cadminId,
    },
  });

  audit
    .log({
      action: audit.AuditAction.COMMISSION_RESUMED,
      entity_type: audit.EntityType.COMMISSION_RULE,
      entity_id: defaultRule.rule_id,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        resumed_rate: formatRuleDescription(updated),
      },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  // Notify ALL live shops
  const allShops = await prisma.marketplaceProfile.findMany({
    where: { is_live: true },
    select: { shop_id: true },
  });
  notifyAffectedPharmacies(
    NOTIFICATION_EVENTS.COMMISSION_RESUMED,
    allShops.map((s) => s.shop_id),
    {
      title: "Commission Resumed",
      message: `Marketplace commission has resumed. Your current rate is ${formatRuleDescription(updated)}.`,
      description_text: formatRuleDescription(updated),
    }
  );

  return {
    is_suspended: false,
    suspended_until: null,
    current_rate: formatRuleDescription(updated),
  };
}

// ─────────────────────────────────────────────
// OVERRIDES
// ─────────────────────────────────────────────

export async function listOverrides() {
  const overrides = await prisma.commissionOverride.findMany({
    where: { is_active: true },
    include: {
      shop: {
        select: {
          shop_id: true,
          business_name: true,
          city: true,
        },
      },
      rule: {
        select: {
          rule_id: true,
          name: true,
          commission_type: true,
          commission_base: true,        
          flat_percent: true,
          flat_amount: true,
          hybrid_percent: true,
          hybrid_flat_amount: true,
          capped_percent: true,
          capped_max_amount: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return overrides.map((o) => ({
    ...o,
    rule_description: formatRuleDescription(o.rule),
  }));
}

export async function assignOverride(shopId, ruleId, cadminId) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id: shopId },
    select: { shop_id: true, business_name: true },
  });
  if (!shop) {
    const err = new Error("Shop not found");
    err.status = 404;
    throw err;
  }

  const rule = await prisma.commissionRule.findUnique({
    where: { rule_id: ruleId },
  });
  if (!rule) {
    const err = new Error("Commission rule not found");
    err.status = 404;
    throw err;
  }
  if (!rule.is_active) {
    const err = new Error("Cannot assign an inactive rule");
    err.status = 400;
    throw err;
  }

  const override = await prisma.commissionOverride.upsert({
    where: { shop_id: shopId },
    create: {
      shop_id: shopId,
      rule_id: ruleId,
      is_active: true,
      created_by: cadminId,
    },
    update: {
      rule_id: ruleId,
      is_active: true,
    },
  });

  audit
    .log({
      action: audit.AuditAction.COMMISSION_OVERRIDE_ASSIGNED,
      entity_type: audit.EntityType.COMMISSION_OVERRIDE,
      entity_id: override.override_id,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        shop_name: shop.business_name,
        rule_name: rule.name,
        description_text: formatRuleDescription(rule),
      },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  // Notify the specific shop
  notifyAffectedPharmacies(
    NOTIFICATION_EVENTS.COMMISSION_OVERRIDE_CHANGED,
    [shopId],
    {
      title: "Custom Commission Rate Activated",
      message: `A custom marketplace commission of ${formatRuleDescription(rule)} has been activated for your pharmacy.`,
      rule_name: rule.name,
      description_text: formatRuleDescription(rule),
    }
  );

  return override;
}

export async function removeOverride(overrideId, cadminId) {
  const override = await prisma.commissionOverride.findUnique({
    where: { override_id: overrideId },
    include: {
      shop: { select: { shop_id: true, business_name: true } },
      rule: { select: { name: true } },
    },
  });

  if (!override) {
    const err = new Error("Override not found");
    err.status = 404;
    throw err;
  }

  await prisma.commissionOverride.update({
    where: { override_id: overrideId },
    data: { is_active: false },
  });

  audit
    .log({
      action: audit.AuditAction.COMMISSION_OVERRIDE_REMOVED,
      entity_type: audit.EntityType.COMMISSION_OVERRIDE,
      entity_id: overrideId,
      actor_type: audit.ActorType.CADMIN,
      actor_id: cadminId,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        shop_name: override.shop.business_name,
        previous_rule: override.rule.name,
      },
    })
    .catch((e) => console.error("[Commission] Audit log failed:", e.message));

  // Get default rule for the notification
  const defaultRule = await prisma.commissionRule.findFirst({
    where: { is_default: true },
  });

  notifyAffectedPharmacies(
    NOTIFICATION_EVENTS.COMMISSION_OVERRIDE_CHANGED,
    [override.shop.shop_id],
    {
      title: "Custom Commission Removed",
      message: `Your custom commission rate has been removed. You are now on the standard platform rate${defaultRule ? ` (${formatRuleDescription(defaultRule)})` : ""}.`,
      description_text: defaultRule ? formatRuleDescription(defaultRule) : "No default set",
    }
  );

  return { removed: true };
}

// ─────────────────────────────────────────────
// EFFECTIVE RATE RESOLUTION (used by pharmacy API)
// ─────────────────────────────────────────────

export async function getEffectiveRateForShop(shopId) {
  // 1. Get default rule
  const defaultRule = await prisma.commissionRule.findFirst({
    where: { is_default: true, is_active: true },
  });

  // No default rule at all → zero commission
  if (!defaultRule) {
    return {
      has_commission: false,
      is_suspended: false,
      commission_type: "FLAT_PERCENT",
      rate_description: "No commission configured",
      examples: [
        { order_subtotal: 500, commission_amount: 0, pharmacy_receives: 500 },
      ],
      source: "none",
    };
  }

  // 2. Check global suspension
  if (defaultRule.is_suspended) {
    const untilText = defaultRule.suspended_until
      ? `until ${defaultRule.suspended_until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
      : "until further notice";

    return {
      has_commission: false,
      is_suspended: true,
      suspended_until: defaultRule.suspended_until,
      commission_type: defaultRule.commission_type,
      rate_description: `Commission waived ${untilText}`,
      examples: [
        { order_subtotal: 500, commission_amount: 0, pharmacy_receives: 500 },
      ],
      source: "suspended",
    };
  }

  // 3. Check for shop-specific override
  const override = await prisma.commissionOverride.findUnique({
    where: { shop_id: shopId },
    include: {
      rule: true,
    },
  });

  const effectiveRule =
    override?.is_active && override.rule?.is_active
      ? override.rule
      : defaultRule;

  const source =
    override?.is_active && override.rule?.is_active
      ? "override"
      : "default";

  return {
    has_commission: true,
    is_suspended: false,
    commission_type: effectiveRule.commission_type,
    commission_base: effectiveRule.commission_base,
    settlement_frequency: effectiveRule.settlement_frequency,
    rate_description: formatRuleDescription(effectiveRule),
    rule_name: effectiveRule.name,
    flat_percent: effectiveRule.flat_percent,
    flat_amount: effectiveRule.flat_amount,
    hybrid_percent: effectiveRule.hybrid_percent,
    hybrid_flat_amount: effectiveRule.hybrid_flat_amount,
    capped_percent: effectiveRule.capped_percent,
    capped_max_amount: effectiveRule.capped_max_amount,
    examples: [
      computeExample(effectiveRule, 200),
      computeExample(effectiveRule, 500),
      computeExample(effectiveRule, 1500),
    ],
    source,
  };
}