// backend/src/modules/cadmin/fleet-pricing/fleetSurge.service.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-pricing/fleetSurge.service.js

import prisma from "../../../config/prisma.js";

/**
 * Deactivates expired surge rules.
 */
async function cleanExpiredSurges() {
  const now = new Date();
  await prisma.riderSurgeRule.updateMany({
    where: {
      is_active: true,
      expires_at: { lte: now },
    },
    data: { is_active: false },
  });
}

/**
 * Returns all configured surge presets and indicates the currently active surge.
 */
export async function getSurgeRules() {
  await cleanExpiredSurges();

  const rules = await prisma.riderSurgeRule.findMany({
    orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
  });

  return rules.map((r) => ({
    rule_id: r.rule_id,
    name: r.name,
    description: r.description,
    is_active: r.is_active,
    calc_type: r.calc_type,
    value: Number(r.value),
    expires_at: r.expires_at,
    activated_at: r.activated_at,
    created_at: r.created_at,
  }));
}

/**
 * Creates a new surge preset rule.
 */
export async function createSurgeRule(data, adminId) {
  const created = await prisma.riderSurgeRule.create({
    data: {
      name: data.name,
      description: data.description || null,
      calc_type: data.calc_type || "MULTIPLIER",
      value: data.value,
      is_active: false,
    },
  });

  return created;
}

/**
 * Manually toggle a surge rule ON or OFF.
 */
export async function toggleSurgeRule(ruleId, { is_active, expires_at = null }, adminId) {
  const existing = await prisma.riderSurgeRule.findUnique({
    where: { rule_id: ruleId },
  });

  if (!existing) {
    throw new Error("Surge rule not found");
  }

  return await prisma.$transaction(async (tx) => {
    if (is_active) {
      // Deactivate all other surge rules (only 1 global surge active at a time)
      await tx.riderSurgeRule.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });

      return await tx.riderSurgeRule.update({
        where: { rule_id: ruleId },
        data: {
          is_active: true,
          expires_at: expires_at ? new Date(expires_at) : null,
          activated_at: new Date(),
          activated_by: adminId,
        },
      });
    } else {
      return await tx.riderSurgeRule.update({
        where: { rule_id: ruleId },
        data: {
          is_active: false,
          expires_at: null,
        },
      });
    }
  });
}

/**
 * Deletes a surge preset (only allowed if inactive).
 */
export async function deleteSurgeRule(ruleId) {
  const rule = await prisma.riderSurgeRule.findUnique({
    where: { rule_id: ruleId },
  });

  if (!rule) throw new Error("Surge rule not found");
  if (rule.is_active) throw new Error("Cannot delete an active surge rule. Turn it OFF first.");

  await prisma.riderSurgeRule.delete({
    where: { rule_id: ruleId },
  });

  return { success: true };
}