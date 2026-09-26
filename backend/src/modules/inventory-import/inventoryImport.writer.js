// backend/src/modules/inventory-import/inventoryImport.writer.js (do not remove this comment)
// backend/src/modules/inventory-import/inventoryImport.writer.js

import prisma from "../../config/prisma.js";
import { buildMedicineKey, parsePackSizeMultiplier } from "./inventoryImport.parser.js";

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(expiryDate) < today;
}

function buildConflictLookupKey(medicineKey, batchNumber) {
  return `${medicineKey}|${(batchNumber || "").toLowerCase().trim()}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MEDICINE CREATION
// ══════════════════════════════════════════════════════════════════════════════

async function resolveMedicineId(plan, shopId, branchId, userId) {
  switch (plan.medicineAction) {

    case "use_existing":
      return plan.existingMedicineId;

    case "create_linked": {
      const existing = await prisma.medicine.findFirst({
        where: {
          shop_id:      shopId,
          branch_id:    branchId,
          name:         { equals: plan.inputName,        mode: "insensitive" },
          manufacturer: { equals: plan.inputCompany || "Unknown", mode: "insensitive" },
        },
        select: { medicine_id: true },
      });
      if (existing) return existing.medicine_id;

      let variantSku = null;
      if (plan.variantId) {
        const variant = await prisma.masterMedicineVariant.findUnique({
          where:  { variant_id: plan.variantId },
          select: { sku_id: true },
        });
        variantSku = variant?.sku_id || null;
      }

      const medicine = await prisma.medicine.create({
        data: {
          name:                  plan.inputName,
          manufacturer:          plan.inputCompany || "Unknown",
          hsn_code:              plan.hsnCode  || null,
          pack_size:             plan.packSize  || null,
          gst_percentage:        12,
          cgst_percentage:       6,
          sgst_percentage:       6,
          unit_of_measure:       "UNIT",
          shop_id:               shopId,
          branch_id:             branchId,
          created_by:            userId,
          master_medicine_id:    plan.masterMedicineId,
          linked_variant_id:     plan.variantId || null,
          linked_variant_sku:    variantSku,
          link_status:           "AUTO_LINKED",
          link_confidence_score: plan.confidence,
          linked_at:             new Date(),
          linked_by_type:        "SYSTEM",
          link_rejected:         false,
        },
      });
      return medicine.medicine_id;
    }

    case "create_suggested": {
      const existing = await prisma.medicine.findFirst({
        where: {
          shop_id:      shopId,
          branch_id:    branchId,
          name:         { equals: plan.inputName,        mode: "insensitive" },
          manufacturer: { equals: plan.inputCompany || "Unknown", mode: "insensitive" },
        },
        select: { medicine_id: true },
      });
      if (existing) return existing.medicine_id;

      const medicine = await prisma.medicine.create({
        data: {
          name:                  plan.inputName,
          manufacturer:          plan.inputCompany || "Unknown",
          hsn_code:              plan.hsnCode  || null,
          pack_size:             plan.packSize  || null,
          gst_percentage:        12,
          cgst_percentage:       6,
          sgst_percentage:       6,
          unit_of_measure:       "UNIT",
          shop_id:               shopId,
          branch_id:             branchId,
          created_by:            userId,
          link_status:           "SUGGESTED",
          link_confidence_score: plan.confidence,
          suggested_master_id:   plan.suggestedMasterId || null,
          suggestion_reason:     plan.suggestionReason  || null,
          link_rejected:         false,
        },
      });
      return medicine.medicine_id;
    }

    case "create_unlinked":
    default: {
      const existing = await prisma.medicine.findFirst({
        where: {
          shop_id:      shopId,
          branch_id:    branchId,
          name:         { equals: plan.inputName,        mode: "insensitive" },
          manufacturer: { equals: plan.inputCompany || "Unknown", mode: "insensitive" },
        },
        select: { medicine_id: true },
      });
      if (existing) return existing.medicine_id;

      const medicine = await prisma.medicine.create({
        data: {
          name:            plan.inputName,
          manufacturer:    plan.inputCompany || "Unknown",
          hsn_code:        plan.hsnCode  || null,
          pack_size:       plan.packSize  || null,
          gst_percentage:  12,
          cgst_percentage: 6,
          sgst_percentage: 6,
          unit_of_measure: "UNIT",
          shop_id:         shopId,
          branch_id:       branchId,
          created_by:      userId,
          link_status:     "PENDING",
          link_rejected:   false,
        },
      });
      return medicine.medicine_id;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// WRITE ONE INVENTORY BATCH (UPSERT/REACTIVATE SAFE)
// ══════════════════════════════════════════════════════════════════════════════

async function writeNewBatch(row, medicineId, shopId, branchId, userId, jobId, fileName) {
  const isPerUnit = row._quantityMode === "PER_UNIT";
  const multiplier = isPerUnit ? 1 : parsePackSizeMultiplier(row.packSize);
  
  // Quantities scaled up by pack multiplier
  const qty      = (toNumber(row.quantity) ?? 0) * multiplier;
  const expiryDt = row.expiryDate ? new Date(row.expiryDate) : null;

  if (!expiryDt) {
    throw new Error("Cannot create inventory batch without a valid expiry date.");
  }

  // Rates divided by multiplier (e.g. tablet price = pack price / N)
  const mrp              = (toNumber(row.mrp) ?? 0) / multiplier;
  const lastPurchaseRate = toNumber(row.purchaseRate) ? (toNumber(row.purchaseRate) / multiplier) : null;
  
  const rawSellingRate   = toNumber(row.sellingRate);
  const sellingRate      = rawSellingRate ? (rawSellingRate / multiplier) : mrp; // Default to MRP if blank/empty

  return prisma.$transaction(async (tx) => {
    // Check if record exists (ACTIVE or INACTIVE)
    const existing = await tx.inventory.findFirst({
      where: {
        shop_id:      shopId,
        branch_id:    branchId,
        medicine_id:  medicineId,
        batch_number: row.batchNumber,
      },
    });

    // Guard against duplicate batch in the same import file
    if (existing && existing.is_active && existing.import_job_id === jobId) {
      return null; // Duplicate within same file, skip silently
    }

    let inventory;
    if (existing) {
      // Re-activate and overwrite with new batch data
      inventory = await tx.inventory.update({
        where: { inventory_id: existing.inventory_id },
        data: {
          expiry_date:        expiryDt,
          current_stock:      qty,
          available_stock:    qty,
          reserved_stock:     0,
          mrp,
          selling_rate:       sellingRate,
          last_purchase_rate: lastPurchaseRate,
          rack_no:            row.rack || existing.rack_no || null,
          is_expired:         isExpired(expiryDt),
          is_active:          true,
          source:             "IMPORT",
          import_job_id:      jobId,
          updated_at:         new Date(),
        },
      });
    } else {
      // Create brand new inventory record
      inventory = await tx.inventory.create({
        data: {
          shop_id:            shopId,
          branch_id:          branchId,
          medicine_id:        medicineId,
          batch_number:       row.batchNumber,
          expiry_date:        expiryDt,
          current_stock:      qty,
          available_stock:    qty,
          reserved_stock:     0,
          mrp,
          selling_rate:       sellingRate,
          last_purchase_rate: lastPurchaseRate,
          rack_no:            row.rack || null,
          is_expired:         isExpired(expiryDt),
          is_active:          true,
          source:             "IMPORT",
          import_job_id:      jobId,
        },
      });
    }

    if (qty > 0) {
      await tx.stockLedger.create({
        data: {
          shop_id:          shopId,
          branch_id:        branchId,
          medicine_id:      medicineId,
          inventory_id:     inventory.inventory_id,
          movement_type:    "INVENTORY_IMPORT",
          reference_type:   "INVENTORY_IMPORT",
          reference_id:     null,
          reference_number: fileName,
          batch_number:     row.batchNumber,
          expiry_date:      expiryDt,
          quantity_in:      qty,
          quantity_out:     0,
          quantity_net:     qty,
          balance_after:    qty,
          rate:             lastPurchaseRate,
          amount:           lastPurchaseRate
            ? qty * lastPurchaseRate
            : null,
          transaction_date: new Date(),
          created_by:       userId,
          remarks:          `Imported from: ${fileName}`,
        },
      });
    }

    return inventory;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// MERGE EXISTING BATCH
// ══════════════════════════════════════════════════════════════════════════════

async function mergeExistingBatch(row, medicineId, existingInventoryId, shopId, branchId, userId, fileName) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventory.findUnique({
      where: { inventory_id: existingInventoryId },
    });

    if (!existing) return null;

    const isPerUnit = row._quantityMode === "PER_UNIT";
    const multiplier = isPerUnit ? 1 : parsePackSizeMultiplier(row.packSize);
    
    // Scale up merging stock
    const addedQty = (toNumber(row.quantity) ?? 0) * multiplier;
    const newStock = Number(existing.current_stock) + addedQty;
    const reserved = Number(existing.reserved_stock ?? 0);

    const purchaseRate = toNumber(row.purchaseRate) ? (toNumber(row.purchaseRate) / multiplier) : null;

    await tx.inventory.update({
      where: { inventory_id: existing.inventory_id },
      data:  {
        current_stock:   newStock,
        available_stock: newStock - reserved,
        is_active:       true,
        updated_at:      new Date(),
      },
    });

    await tx.stockLedger.create({
      data: {
        shop_id:          shopId,
        branch_id:        branchId,
        medicine_id:      medicineId,
        inventory_id:     existing.inventory_id,
        movement_type:    "INVENTORY_IMPORT",
        reference_type:   "INVENTORY_IMPORT",
        reference_id:     null,
        reference_number: fileName,
        batch_number:     row.batchNumber,
        expiry_date:      existing.expiry_date,
        quantity_in:      addedQty,
        quantity_out:     0,
        quantity_net:     addedQty,
        balance_after:    newStock,
        rate:             purchaseRate,
        amount:           purchaseRate
          ? addedQty * purchaseRate
          : null,
        transaction_date: new Date(),
        created_by:       userId,
        remarks:          `Merged via inventory import: ${fileName}`,
      },
    });

    return existing;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// REPLACE EXISTING BATCH
// ══════════════════════════════════════════════════════════════════════════════

async function replaceExistingBatch(row, medicineId, existingInventoryId, shopId, branchId, userId, jobId, fileName) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventory.findUnique({
      where: { inventory_id: existingInventoryId },
    });

    if (!existing) return null;

    const isPerUnit = row._quantityMode === "PER_UNIT";
    const multiplier = isPerUnit ? 1 : parsePackSizeMultiplier(row.packSize);
    
    // Scale up replacement stock
    const newQty   = (toNumber(row.quantity) ?? 0) * multiplier;
    const expiryDt = row.expiryDate ? new Date(row.expiryDate) : existing.expiry_date;

    const rawMrp   = toNumber(row.mrp);
    const mrp      = rawMrp !== null ? (rawMrp / multiplier) : existing.mrp;

    const rawSellingRate = toNumber(row.sellingRate);
    const sellingRate  = rawSellingRate !== null
      ? (rawSellingRate / multiplier)
      : (rawMrp !== null ? mrp : existing.selling_rate);

    const purchaseRate = toNumber(row.purchaseRate) !== null
      ? (toNumber(row.purchaseRate) / multiplier)
      : existing.last_purchase_rate;

    await tx.inventory.update({
      where: { inventory_id: existing.inventory_id },
      data:  {
        current_stock:      newQty,
        available_stock:    newQty,
        reserved_stock:     0,
        mrp,
        selling_rate:       sellingRate,
        last_purchase_rate: purchaseRate,
        expiry_date:        expiryDt,
        rack_no:            row.rack || existing.rack_no,
        is_expired:         isExpired(expiryDt),
        is_active:          true,
        source:             "IMPORT",
        import_job_id:      jobId,
        updated_at:         new Date(),
      },
    });

    await tx.stockLedger.create({
      data: {
        shop_id:          shopId,
        branch_id:        branchId,
        medicine_id:      medicineId,
        inventory_id:     existing.inventory_id,
        movement_type:    "INVENTORY_IMPORT",
        reference_type:   "INVENTORY_IMPORT",
        reference_id:     null,
        reference_number: fileName,
        batch_number:     row.batchNumber,
        expiry_date:      expiryDt,
        quantity_in:      newQty,
        quantity_out:     0,
        quantity_net:     newQty,
        balance_after:    newQty,
        rate:             purchaseRate,
        amount:           purchaseRate
          ? newQty * purchaseRate
          : null,
        transaction_date: new Date(),
        created_by:       userId,
        remarks:          `Replaced via inventory import: ${fileName}`,
      },
    });

    return existing;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// WRITE ALL ROWS
// ══════════════════════════════════════════════════════════════════════════════

export async function writeAll(job, parsedRows, userId, quantityMode = "PER_PACK") {
  const shopId   = job.shop_id;
  const branchId = job.branch_id;
  const jobId    = job.import_job_id;
  const fileName = job.original_file_name;

  const medicinePlans     = job.resolutions       || {};
  const conflictDecisions = job.conflict_decisions || {};

  const rowToPlan = new Map();
  for (const plan of Object.values(medicinePlans)) {
    for (const rowIdx of (plan.rowIndices || [])) {
      rowToPlan.set(rowIdx, plan);
    }
  }

  const result = {
    importedRows:        0,
    mergedRows:          0,
    replacedRows:        0,
    skippedRows:         0,
    errorRows:           0,
    newMedicinesCreated: 0,
    catalogLinked:       0,
    catalogSuggested:    0,
    catalogUnlinked:     0,
    errors:              [],
  };

  const medicineIdCache = new Map();

  for (const row of parsedRows) {
    const plan = rowToPlan.get(row.rowIndex);

    if (!plan) {
      result.skippedRows++;
      result.errors.push({
        rowIndex:    row.rowIndex,
        productName: row.productName,
        message:     "No medicine plan found for this row.",
      });
      continue;
    }

    let medicineId;

    if (medicineIdCache.has(plan.key)) {
      medicineId = medicineIdCache.get(plan.key);
    } else {
      try {
        medicineId = await resolveMedicineId(plan, shopId, branchId, userId);

        if (!medicineId) {
          result.skippedRows++;
          continue;
        }

        medicineIdCache.set(plan.key, medicineId);

        if (plan.medicineAction !== "use_existing") {
          result.newMedicinesCreated++;
          if (plan.medicineAction === "create_linked")    result.catalogLinked++;
          if (plan.medicineAction === "create_suggested") result.catalogSuggested++;
          if (plan.medicineAction === "create_unlinked")  result.catalogUnlinked++;
        }
      } catch (medError) {
        result.errorRows++;
        result.errors.push({
          rowIndex:    row.rowIndex,
          productName: row.productName,
          message:     `Failed to create medicine: ${medError.message}`,
        });
        continue;
      }
    }

    // Attach quantity mode so write functions know whether to apply multiplier
    row._quantityMode = quantityMode;

    // ── Conflict handling ───────────────────────────────────────────────────
    const conflictKey   = buildConflictLookupKey(plan.key, row.batchNumber);
    const conflictEntry = conflictDecisions[conflictKey];

    if (conflictEntry && conflictEntry.userDecision) {
      const conflictAction = conflictEntry.userDecision;

      if (conflictAction === "skip") {
        result.skippedRows++;
        continue;
      }

      if (conflictAction === "merge") {
        try {
          const merged = await mergeExistingBatch(
            row, medicineId, conflictEntry.existingInventoryId,
            shopId, branchId, userId, fileName
          );

          if (merged) {
            result.mergedRows++;
            continue;
          }
        } catch (mergeError) {
          result.errorRows++;
          result.errors.push({
            rowIndex:    row.rowIndex,
            productName: row.productName,
            message:     `Merge failed: ${mergeError.message}`,
          });
          continue;
        }
      }

      if (conflictAction === "replace") {
        try {
          const replaced = await replaceExistingBatch(
            row, medicineId, conflictEntry.existingInventoryId,
            shopId, branchId, userId, jobId, fileName
          );

          if (replaced) {
            result.replacedRows++;
            continue;
          }
        } catch (replaceError) {
          result.errorRows++;
          result.errors.push({
            rowIndex:    row.rowIndex,
            productName: row.productName,
            message:     `Replace failed: ${replaceError.message}`,
          });
          continue;
        }
      }
    }

    try {
      const created = await writeNewBatch(
        row, medicineId, shopId, branchId, userId, jobId, fileName
      );

      if (created === null) {
        result.skippedRows++;
      } else {
        result.importedRows++;
      }
    } catch (createError) {
      result.errorRows++;
      result.errors.push({
        rowIndex:    row.rowIndex,
        productName: row.productName,
        message:     `Failed to create batch: ${createError.message}`,
      });
    }
  }

  const finalStatus =
    result.errorRows > 0 &&
    result.importedRows === 0 &&
    result.mergedRows   === 0 &&
    result.replacedRows === 0
      ? "FAILED"
      : result.errorRows > 0
        ? "PARTIAL"
        : "COMPLETED";

  await prisma.inventoryImportJob.update({
    where: { import_job_id: jobId },
    data:  {
      status:                  finalStatus,
      imported_rows:           result.importedRows + result.mergedRows + result.replacedRows,
      skipped_rows:            result.skippedRows,
      error_rows:              result.errorRows,
      new_medicines_created:   result.newMedicinesCreated,
      existing_batches_merged: result.mergedRows,
      completed_at:            new Date(),
      confirmed_at:            new Date(),
    },
  });

  return result;
}