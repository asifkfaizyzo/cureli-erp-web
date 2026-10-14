// backend/src/modules/medicines/linkPropagation.service.js (do not remove this comment)
import prisma from "../../config/prisma.js";
import { createListingForMedicine } from "../marketplace-listings/listings.service.js";
import * as audit from "../audit/index.js";
import { notifyAsync } from "../notifications/notification.service.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";

// ══════════════════════════════════════════════════════════════
// CROSS-SHOP LINK PROPAGATION
// ══════════════════════════════════════════════════════════════
//
// When a medicine is linked to a catalog variant in one shop,
// automatically link all identical medicines (exact name + manufacturer)
// in other shops/branches to the same variant.
//
// Matching rule: case-insensitive exact match on name AND manufacturer.
// No fuzzy matching. One letter difference = no propagation.
// ══════════════════════════════════════════════════════════════

/**
 * Find an existing catalog link for the same medicine in another shop.
 * Used by the import flow to skip the catalog check entirely.
 *
 * @param {string} name - Medicine name
 * @param {string} manufacturer - Manufacturer name
 * @param {string} excludeShopId - Shop ID to exclude (the importing shop)
 * @returns {Promise<{masterMedicineId, variantId, variantSku, confidence, shopId}|null>}
 */
export async function findCrossShopLink(name, manufacturer, excludeShopId) {
  if (!name || !manufacturer) return null;

  const existing = await prisma.medicine.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
      manufacturer: { equals: manufacturer.trim(), mode: "insensitive" },
      shop_id: { not: excludeShopId },
      link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] },
      linked_variant_id: { not: null },
      master_medicine_id: { not: null },
      is_active: true,
    },
    select: {
      shop_id: true,
      master_medicine_id: true,
      linked_variant_id: true,
      linked_variant_sku: true,
      link_confidence_score: true,
    },
    orderBy: { linked_at: "desc" },
  });

  if (!existing) return null;

  return {
    masterMedicineId: existing.master_medicine_id,
    variantId: existing.linked_variant_id,
    variantSku: existing.linked_variant_sku,
    confidence: existing.link_confidence_score || 100,
    shopId: existing.shop_id,
  };
}

/**
 * Propagate a catalog link to all other shops/branches that have
 * the same medicine (exact name + manufacturer) but are not yet linked.
 *
 * This function is designed to be called via setImmediate (fire-and-forget)
 * so it never blocks the primary linking action.
 *
 * @param {Object} params
 * @param {string} params.sourceMedicineId - The medicine that was just linked
 * @param {string} params.name - Medicine name
 * @param {string} params.manufacturer - Manufacturer name
 * @param {string} params.masterMedicineId - Master catalog medicine ID
 * @param {string} params.variantId - Linked variant ID
 * @param {string} params.variantSku - Linked variant SKU
 * @param {string|null} params.actorId - Who triggered the original link
 * @param {string} params.actorType - 'cadmin' | 'system' | 'erp_user'
 * @param {string|null} params.variantName - Variant name for notifications
 * @param {string|null} params.masterName - Master generic name for notifications
 */
export async function propagateLinkToOtherShops({
  sourceMedicineId,
  name,
  manufacturer,
  masterMedicineId,
  variantId,
  variantSku,
  actorId,
  actorType,
  variantName,
  masterName,
}) {
  if (!name || !manufacturer || !variantId) return;

  try {
    // ── Step 1: Find all unlinked copies ──────────────────────────
    const targets = await prisma.medicine.findMany({
      where: {
        name: { equals: name.trim(), mode: "insensitive" },
        manufacturer: { equals: manufacturer.trim(), mode: "insensitive" },
        medicine_id: { not: sourceMedicineId },
        is_active: true,
        OR: [
          { master_medicine_id: null },
          { link_status: { notIn: ["AUTO_LINKED", "MANUAL_LINKED"] } },
        ],
      },
      select: {
        medicine_id: true,
        shop_id: true,
        branch_id: true,
        name: true,
      },
    });

    if (targets.length === 0) return;

    const targetIds = targets.map((t) => t.medicine_id);
    const now = new Date();

    // ── Step 2: Bulk update all targets ───────────────────────────
    const updateResult = await prisma.medicine.updateMany({
      where: { medicine_id: { in: targetIds } },
      data: {
        master_medicine_id: masterMedicineId,
        linked_variant_id: variantId,
        linked_variant_sku: variantSku,
        link_status: "AUTO_LINKED",
        link_confidence_score: 100,
        linked_at: now,
        linked_by_id: actorId,
        linked_by_type: "PROPAGATED",
        link_rejected: false,
        suggested_master_id: null,
        suggested_variant_id: null,
        suggestion_reason: null,
      },
    });

    const propagatedCount = updateResult.count;
    if (propagatedCount === 0) return;

    // ── Step 3: Create marketplace listings ───────────────────────
    for (const target of targets) {
      if (!target.branch_id) continue;
      try {
        await createListingForMedicine(
          target.medicine_id,
          target.branch_id,
          target.shop_id,
          variantId,
        );
      } catch {
        /* non-critical — listing sync will catch these later */
      }
    }

    // ── Step 4: Audit log (single batch entry) ────────────────────
    try {
      await audit.log({
        action: audit.AuditAction?.MEDICINE_LINK_PROPAGATED || "MEDICINE_LINK_PROPAGATED",
        entity_type: audit.EntityType?.MEDICINE || "MEDICINE",
        entity_id: sourceMedicineId,
        actor_type: actorType || "system",
        actor_id: actorId,
        reason_code: audit.ReasonCode?.SYSTEM_PROPAGATION || "SYSTEM_PROPAGATION",
        metadata: {
          source_medicine_id: sourceMedicineId,
          medicine_name: name,
          manufacturer,
          master_medicine_id: masterMedicineId,
          variant_id: variantId,
          variant_sku: variantSku,
          propagated_to_ids: targetIds,
          propagated_count: propagatedCount,
        },
      });
    } catch {
      /* non-critical */
    }

    // ── Step 5: Notifications per shop ────────────────────────────
    const shopGroups = new Map();
    for (const target of targets) {
      if (!shopGroups.has(target.shop_id)) {
        shopGroups.set(target.shop_id, { names: [], count: 0 });
      }
      const group = shopGroups.get(target.shop_id);
      if (!group.names.includes(target.name)) group.names.push(target.name);
      group.count++;
    }

    for (const [shopId, group] of shopGroups) {
      try {
        notifyAsync({
          type: NOTIFICATION_EVENTS.MEDICINE_LINKED,
          context: {
            shop_id: shopId,
            medicine_name: group.names[0],
            variant_name: variantName || "",
            master_name: masterName || "",
            linked_count: group.count,
            propagated: true,
          },
        });
      } catch {
        /* non-critical */
      }
    }

    console.log(
      `[LinkPropagation] Propagated link for "${name}" (${manufacturer}) ` +
        `to ${propagatedCount} medicines across ${shopGroups.size} shops`,
    );
  } catch (error) {
    console.error("[LinkPropagation] Failed:", error.message);
  }
}