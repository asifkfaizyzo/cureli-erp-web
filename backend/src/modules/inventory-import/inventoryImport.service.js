// backend/src/modules/inventory-import/inventoryImport.service.js (do not remove this comment)
// backend/src/modules/inventory-import/inventoryImport.service.js

import fs from "fs";
import prisma from "../../config/prisma.js";
import {
  parseInventoryFile,
  deduplicateMedicines,
  buildMedicineKey,
  computeFileHash,
  parsePackSizeMultiplier,
} from "./inventoryImport.parser.js";
import { validateRows }           from "./inventoryImport.validator.js";
import { storeConflictDecisions } from "./inventoryImport.resolver.js";
import { writeAll }               from "./inventoryImport.writer.js";
import { checkSingleMedicine }    from "../medicines/linking.service.js";
import * as audit                 from "../audit/audit.service.js";

class ImportError extends Error {
  constructor(message, statusCode = 400, code = "IMPORT_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
  }
}

const PHASE = {
  PARSING:       "PARSING",
  DEDUPLICATING: "DEDUPLICATING",
  CATALOG_CHECK: "CATALOG_CHECK",
  VALIDATING:    "VALIDATING",
  READY:         "READY",
  WRITING:       "WRITING",
};

async function updateProgress(importJobId, phase, progress, extra = {}) {
  await prisma.inventoryImportJob.update({
    where: { import_job_id: importJobId },
    data:  { processing_phase: phase, processing_progress: progress, ...extra },
  });
}

async function verifyJobOwnership(importJobId, shopId) {
  const job = await prisma.inventoryImportJob.findUnique({
    where: { import_job_id: importJobId },
  });
  if (!job)                   throw new ImportError("Import job not found.", 404, "NOT_FOUND");
  if (job.shop_id !== shopId) throw new ImportError("Access denied.",        403, "FORBIDDEN");
  return job;
}

function buildConflictKey(name, manufacturer, batchNumber) {
  const n = (name         || "").toLowerCase().trim();
  const m = (manufacturer || "").toLowerCase().trim();
  const b = (batchNumber  || "").toLowerCase().trim();
  return `${n}|${m}|${b}`;
}

async function detectConflicts(validRows, shopId, branchId) {
  if (validRows.length === 0) return {};

  const existingInventory = await prisma.inventory.findMany({
    where: { shop_id: shopId, branch_id: branchId, is_active: true },
    include: {
      medicine: {
        select: { medicine_id: true, name: true, manufacturer: true },
      },
    },
  });

  const existingMap = new Map();
  for (const inv of existingInventory) {
    if (!inv.medicine) continue;
    const key = buildConflictKey(inv.medicine.name, inv.medicine.manufacturer, inv.batch_number);
    existingMap.set(key, {
      inventoryId:   inv.inventory_id,
      medicineId:    inv.medicine_id,
      medicineName:  inv.medicine.name,
      batchNumber:   inv.batch_number,
      existingStock: Number(inv.current_stock),
    });
  }

  const conflicts = {};

  for (const row of validRows) {
    const key = buildConflictKey(row.productName, row.company, row.batchNumber);
    if (existingMap.has(key)) {
      const existing    = existingMap.get(key);
      const conflictKey = key;
      
      const multiplier  = parsePackSizeMultiplier(row.packSize);
      const existingStockInPacks = existing.existingStock / multiplier;

      if (!conflicts[conflictKey]) {
        conflicts[conflictKey] = {
          medicineKey:         buildMedicineKey(row.productName, row.company),
          medicineName:        row.productName,
          company:             row.company,
          batchNumber:         row.batchNumber,
          existingInventoryId: existing.inventoryId,
          existingMedicineId:  existing.medicineId,
          existingStock:       existingStockInPacks, // Pack-level display
          importQuantity:      row.quantity,         // Pack-level upload
          rowIndices:          [row.rowIndex],
          userDecision:        null,
        };
      } else {
        conflicts[conflictKey].rowIndices.push(row.rowIndex);
      }
    }
  }

  return conflicts;
}

async function buildAutoWritePlan(validRows, uniqueMedicinesMap, catalogResults, shopId, branchId) {
  const medicineNames = Array.from(uniqueMedicinesMap.values()).map((m) => m.name);

  const existingMedicines = await prisma.medicine.findMany({
    where: {
      shop_id:   shopId,
      branch_id: branchId,
      name:      { in: medicineNames, mode: "insensitive" },
      is_active: true,
    },
    select: {
      medicine_id:        true,
      name:               true,
      manufacturer:       true,
      master_medicine_id: true,
      link_status:        true,
    },
  });

  const existingMap = new Map();
  for (const med of existingMedicines) {
    existingMap.set(buildMedicineKey(med.name, med.manufacturer), med);
  }

  const medicinePlans = {};
  const stats = {
    existingMedicines:   0,
    willCreateLinked:    0,
    willCreateSuggested: 0,
    willCreateUnlinked:  0,
  };

  for (const [key, uniqueMed] of uniqueMedicinesMap) {
    const catalogResult = catalogResults[key];
    const existing      = existingMap.get(key);

    if (existing) {
      medicinePlans[key] = {
        key,
        inputName:          uniqueMed.name,
        inputCompany:       uniqueMed.company,
        hsnCode:            uniqueMed.hsnCode  || null,
        packSize:           uniqueMed.packSize  || null,
        medicineAction:     "use_existing",
        existingMedicineId: existing.medicine_id,
        masterMedicineId:   existing.master_medicine_id || null,
        variantId:          null,
        confidence:         100,
        rowIndices:         uniqueMed.rowIndices,
        rowCount:           uniqueMed.rowCount,
      };
      stats.existingMedicines++;

    } else if (catalogResult?.status === "AUTO_LINKED" && catalogResult.master_medicine_id) {
      medicinePlans[key] = {
        key,
        inputName:          uniqueMed.name,
        inputCompany:       uniqueMed.company,
        hsnCode:            uniqueMed.hsnCode  || null,
        packSize:           uniqueMed.packSize  || null,
        medicineAction:     "create_linked",
        existingMedicineId: null,
        masterMedicineId:   catalogResult.master_medicine_id,
        variantId:          catalogResult.matched_variant?.variant_id || null,
        confidence:         catalogResult.confidence,
        rowIndices:         uniqueMed.rowIndices,
        rowCount:           uniqueMed.rowCount,
      };
      stats.willCreateLinked++;

    } else if (catalogResult?.status === "PENDING" && catalogResult.suggestions?.length > 0) {
      medicinePlans[key] = {
        key,
        inputName:          uniqueMed.name,
        inputCompany:       uniqueMed.company,
        hsnCode:            uniqueMed.hsnCode  || null,
        packSize:           uniqueMed.packSize  || null,
        medicineAction:     "create_suggested",
        existingMedicineId: null,
        masterMedicineId:   null,
        suggestedMasterId:  catalogResult.suggested_master_id || null,
        variantId:          null,
        confidence:         catalogResult.confidence,
        suggestionReason:   catalogResult.reason || "",
        rowIndices:         uniqueMed.rowIndices,
        rowCount:           uniqueMed.rowCount,
      };
      stats.willCreateSuggested++;

    } else {
      medicinePlans[key] = {
        key,
        inputName:          uniqueMed.name,
        inputCompany:       uniqueMed.company,
        hsnCode:            uniqueMed.hsnCode  || null,
        packSize:           uniqueMed.packSize  || null,
        medicineAction:     "create_unlinked",
        existingMedicineId: null,
        masterMedicineId:   null,
        variantId:          null,
        confidence:         catalogResult?.confidence || 0,
        rowIndices:         uniqueMed.rowIndices,
        rowCount:           uniqueMed.rowCount,
      };
      stats.willCreateUnlinked++;
    }
  }

  return { medicinePlans, stats };
}

// ── Background parse+catalog job ─────────────────────────────────────────────

async function _processImportJob(importJobId, parseResult, shopId, branchId) {
  try {
    await updateProgress(importJobId, PHASE.DEDUPLICATING, 20);

    const uniqueMedicinesMap = deduplicateMedicines(parseResult.rows);
    const uniqueCount        = uniqueMedicinesMap.size;

    await updateProgress(importJobId, PHASE.CATALOG_CHECK, 25);

    const catalogResults = {};
    let   checkedCount   = 0;

    for (const [key, uniqueMed] of uniqueMedicinesMap) {
      let result;
      try {
        result = await checkSingleMedicine({
          name:         uniqueMed.name,
          manufacturer: uniqueMed.company,
          generic_name: "",
          pack_size:    uniqueMed.packSize || "",
        });
      } catch {
        result = { status: "NO_MATCH", confidence: 0, reason: "Catalog check error" };
      }

      catalogResults[key] = result;
      checkedCount++;

      const overallPct = Math.round(25 + (checkedCount / uniqueCount) * 55);
      await updateProgress(importJobId, PHASE.CATALOG_CHECK, overallPct);
    }

    await updateProgress(importJobId, PHASE.VALIDATING, 85);

    // Store quantity mode
    const quantityMode = parseResult.quantityMode || "PER_PACK";

    const validationResult = validateRows(parseResult.rows);
    const conflictReport   = await detectConflicts(validationResult.validRows, shopId, branchId);

    await updateProgress(importJobId, PHASE.READY, 95);

    const { medicinePlans } = await buildAutoWritePlan(
      validationResult.validRows,
      uniqueMedicinesMap,
      catalogResults,
      shopId,
      branchId
    );

    await prisma.inventoryImportJob.update({
      where: { import_job_id: importJobId },
      data:  {
        status:              "AWAITING_REVIEW",
        processing_phase:    PHASE.READY,
        processing_progress: 100,
        resolutions:         { ...medicinePlans, __quantityMode: quantityMode },
        conflict_decisions:  conflictReport,
        valid_rows:          validationResult.summary.valid,
        error_rows:          validationResult.summary.errors,
        error_log: [
          ...validationResult.errorRows.map((r) => ({
            rowIndex:    r.rowIndex,
            productName: r.productName,
            batchNumber: r.batchNumber,
            errors:      r.errors,
          })),
          ...validationResult.duplicateRows.map((r) => ({
            rowIndex:    r.rowIndex,
            productName: r.productName,
            batchNumber: r.batchNumber,
            errors:      [r.warning],
          })),
        ],
        parsing_completed_at: new Date(),
      },
    });

  } catch (error) {
    await prisma.inventoryImportJob.update({
      where: { import_job_id: importJobId },
      data:  {
        status:    "FAILED",
        error_log: [{ message: error.message, phase: "background_processing" }],
      },
    }).catch(() => {});
  }
}

// ── Background write job ──────────────────────────────────────────────────────

const _activeWriteResults = new Map();

async function _executeWrite(importJobId, job, userId) {
  await prisma.inventoryImportJob.update({
    where: { import_job_id: importJobId },
    data:  { processing_phase: PHASE.WRITING, processing_progress: 0 },
  }).catch(() => {});

  let parsedRows;
  try {
    const buffer      = fs.readFileSync(job.storage_key);
    const parseResult = await parseInventoryFile(
      buffer,
      job.original_file_name,
      job.column_mapping
    );
    parsedRows = validateRows(parseResult.rows).validRows;
  } catch (parseError) {
    await prisma.inventoryImportJob.update({
      where: { import_job_id: importJobId },
      data: {
        status:    "FAILED",
        error_log: [{ message: `Re-parse failed: ${parseError.message}`, phase: "write_reparse" }],
      },
    }).catch(() => {});
    return;
  }

  let writeResult;
  try {
    const quantityMode = job.resolutions?.__quantityMode || "PER_PACK";
    writeResult = await writeAll(job, parsedRows, userId, quantityMode);
  } catch (writeError) {
    await prisma.inventoryImportJob.update({
      where: { import_job_id: importJobId },
      data: {
        status:    "FAILED",
        error_log: [{ message: writeError.message, phase: "write_all" }],
      },
    }).catch(() => {});
    return;
  }

  _activeWriteResults.set(importJobId, writeResult);
  setTimeout(() => {
    _activeWriteResults.delete(importJobId);
  }, 10 * 60 * 1000);

  try {
    await audit.log({
      action:      "INVENTORY_IMPORT_COMPLETED",
      actor_type:  "erp_user",
      actor_id:    userId,
      entity_type: "INVENTORY_IMPORT_JOB",
      entity_id:   importJobId,
      shop_id:     job.shop_id,
      branch_id:   job.branch_id,
      metadata: {
        fileName:            job.original_file_name,
        importedRows:        writeResult.importedRows,
        mergedRows:          writeResult.mergedRows,
        replacedRows:        writeResult.replacedRows,
        skippedRows:         writeResult.skippedRows,
        newMedicinesCreated: writeResult.newMedicinesCreated,
        errorRows:           writeResult.errorRows,
      },
    });
  } catch { /* non-critical */ }

  try {
    if (job.storage_key && fs.existsSync(job.storage_key)) {
      fs.unlinkSync(job.storage_key);
    }
  } catch { /* non-critical */ }

  console.log("[ImportResult]", JSON.stringify(writeResult, null, 2));
}

// ══════════════════════════════════════════════════════════════════════════════

class InventoryImportService {

  async initiateImport(file, branchId, userId, shopId) {
    const filePath = file.path;
    const buffer   = fs.readFileSync(filePath);
    const fileHash = computeFileHash(buffer);

    const oneDayAgo    = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentImport = await prisma.inventoryImportJob.findFirst({
      where: {
        shop_id:    shopId,
        file_hash:  fileHash,
        created_at: { gte: oneDayAgo },
        status:     { notIn: ["CANCELLED", "FAILED"] },
      },
      orderBy: { created_at: "desc" },
    });

    let parseResult;
    try {
      parseResult = await parseInventoryFile(buffer, file.originalname);
    } catch (parseError) {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      throw parseError;
    }

    const job = await prisma.inventoryImportJob.create({
      data: {
        shop_id:             shopId,
        branch_id:           branchId,
        created_by:          userId,
        original_file_name:  file.originalname,
        storage_key:         filePath,
        file_size:           file.size,
        file_hash:           fileHash,
        status:              "PARSING",
        total_rows:          parseResult.totalRows,
        parsed_row_count:    parseResult.totalRows,
        processing_phase:    PHASE.PARSING,
        processing_progress: 10,
        detected_software:   parseResult.detectedSoftware,
        column_mapping:      this._buildColumnMappingObject(
                               parseResult.detectedHeaders,
                               parseResult.mappedHeaders
                             ),
        expires_at:          new Date(Date.now() + 48 * 60 * 60 * 1000),
        parsing_started_at:  new Date(),
      },
    });

    setImmediate(() => {
      _processImportJob(job.import_job_id, parseResult, shopId, branchId)
        .catch(() => {});
    });

    return {
      importJobId:           job.import_job_id,
      totalRows:             parseResult.totalRows,
      detectedSoftware:      parseResult.detectedSoftware,
      autoMappingConfidence: parseResult.autoMappingConfidence,
      mappingNeeded:         parseResult.mappingNeeded,
      detectedHeaders:       parseResult.detectedHeaders,
      unmappedHeaders:       parseResult.unmappedHeaders,
      status:                "PARSING",
      processingPhase:       PHASE.PARSING,
      processingProgress:    10,
      preview:               parseResult.rows.slice(0, 20).map((r) => r.raw),
      duplicateFileWarning:  recentImport
        ? {
            message:        "This file was recently imported. Review carefully.",
            previousJobId:  recentImport.import_job_id,
            previousStatus: recentImport.status,
          }
        : null,
    };
  }

  async getJobStatus(importJobId, shopId) {
    const job = await verifyJobOwnership(importJobId, shopId);
    const writeResult = _activeWriteResults.get(importJobId) || null;

    return {
      importJobId:        job.import_job_id,
      status:             job.status,
      processingPhase:    job.processing_phase,
      processingProgress: job.processing_progress,
      totalRows:          job.total_rows,
      parsedRowCount:     job.parsed_row_count,
      validRows:          job.valid_rows,
      errorRows:          job.error_rows,
      writeResult,
    };
  }

  async getFullJob(importJobId, shopId) {
    const job = await verifyJobOwnership(importJobId, shopId);

    const medicinePlans     = job.resolutions        || {};
    const conflictDecisions = job.conflict_decisions  || {};

    const autoSummary = {
      existingMedicines:   0,
      willCreateLinked:    0,
      willCreateSuggested: 0,
      willCreateUnlinked:  0,
      totalMedicines:      Object.keys(medicinePlans).length - 1, // Exclude __quantityMode helper key
    };

    for (const [key, plan] of Object.entries(medicinePlans)) {
      if (key === "__quantityMode") continue;
      if (plan.medicineAction === "use_existing")     autoSummary.existingMedicines++;
      if (plan.medicineAction === "create_linked")    autoSummary.willCreateLinked++;
      if (plan.medicineAction === "create_suggested") autoSummary.willCreateSuggested++;
      if (plan.medicineAction === "create_unlinked")  autoSummary.willCreateUnlinked++;
    }

    return {
      importJobId:        job.import_job_id,
      shopId:             job.shop_id,
      branchId:           job.branch_id,
      status:             job.status,
      processingPhase:    job.processing_phase,
      processingProgress: job.processing_progress,
      originalFileName:   job.original_file_name,
      detectedSoftware:   job.detected_software,
      columnMapping:      job.column_mapping,
      totalRows:          job.total_rows,
      validRows:          job.valid_rows,
      errorRows:          job.error_rows,
      medicinePlans,
      autoSummary,
      conflictDecisions,
      hasConflicts:       Object.keys(conflictDecisions).length > 0,
      errorLog:           job.error_log || [],
      createdAt:          job.created_at,
      parsingCompletedAt: job.parsing_completed_at,
    };
  }

  async getJobDetail(importJobId, shopId) {
    const job = await prisma.inventoryImportJob.findUnique({
      where: { import_job_id: importJobId },
      include: {
        creator: { select: { full_name: true } },
        branch:  { select: { branch_name: true } },
      },
    });

    if (!job)                   throw new ImportError("Import job not found.", 404, "NOT_FOUND");
    if (job.shop_id !== shopId) throw new ImportError("Access denied.",        403, "FORBIDDEN");

    let validationErrors = [];
    if (Array.isArray(job.error_log)) {
      validationErrors = job.error_log;
    } else if (job.error_log && typeof job.error_log === "object" && !job.error_log.__writeResult) {
      validationErrors = [job.error_log];
    }

    const mergedAndReplaced   = job.existing_batches_merged || 0;
    const totalImported       = job.imported_rows || 0;
    const pureNewBatches      = Math.max(0, totalImported - mergedAndReplaced);

    return {
      importJobId:          job.import_job_id,
      originalFileName:     job.original_file_name,
      detectedSoftware:     job.detected_software,
      status:               job.status,
      branch:               job.branch,
      creator:              job.creator,
      createdAt:            job.created_at,
      completedAt:          job.completed_at,

      totalRows:            job.total_rows || 0,
      importedRows:         totalImported,
      newBatches:           pureNewBatches,
      mergedAndReplaced,
      skippedRows:          job.skipped_rows || 0,
      errorRows:            job.error_rows || 0,
      newMedicinesCreated:  job.new_medicines_created || 0,

      validationErrors,
      hasErrors:            validationErrors.length > 0,
      errorCount:           validationErrors.length,
    };
  }

  async submitConflictDecisions(importJobId, shopId, userConflictDecisions) {
    const job = await verifyJobOwnership(importJobId, shopId);

    if (job.status !== "AWAITING_REVIEW") {
      throw new ImportError(
        `Cannot submit decisions for a job with status "${job.status}".`,
        400,
        "INVALID_STATE"
      );
    }

    const { summary } = await storeConflictDecisions(importJobId, userConflictDecisions);
    return { summary };
  }

  async confirmImport(importJobId, shopId, userId) {
    const job = await verifyJobOwnership(importJobId, shopId);

    if (job.status !== "AWAITING_REVIEW") {
      throw new ImportError(
        `Cannot confirm a job with status "${job.status}".`,
        400,
        "INVALID_STATE"
      );
    }

    const conflictDecisions = job.conflict_decisions || {};
    const unresolved = Object.entries(conflictDecisions).filter(
      ([, entry]) => !entry.userDecision
    );

    if (unresolved.length > 0) {
      throw new ImportError(
        `${unresolved.length} batch conflict(s) still need a decision.`,
        400,
        "INCOMPLETE_DECISIONS"
      );
    }

    await prisma.inventoryImportJob.update({
      where: { import_job_id: importJobId },
      data:  { status: "CONFIRMING" },
    });

    const jobSnapshot = { ...job, status: "CONFIRMING" };

    setImmediate(() => {
      _executeWrite(importJobId, jobSnapshot, userId).catch(() => {});
    });

    return { queued: true };
  }

  async cancelJob(importJobId, shopId, userId) {
    const job = await verifyJobOwnership(importJobId, shopId);

    if (["COMPLETED", "PARTIAL", "FAILED", "CANCELLED", "CONFIRMING"].includes(job.status)) {
      throw new ImportError(
        `Cannot cancel a job with status "${job.status}".`,
        400,
        "INVALID_STATE"
      );
    }

    if (job.storage_key && fs.existsSync(job.storage_key)) {
      try { fs.unlinkSync(job.storage_key); } catch { /* ignore */ }
    }

    await prisma.inventoryImportJob.update({
      where: { import_job_id: importJobId },
      data:  { status: "CANCELLED", cancelled_at: new Date() },
    });

    try {
      await audit.log({
        action:      "INVENTORY_IMPORT_CANCELLED",
        actor_type:  "erp_user",
        actor_id:    userId,
        entity_type: "INVENTORY_IMPORT_JOB",
        entity_id:   importJobId,
        shop_id:     job.shop_id,
        branch_id:   job.branch_id,
        metadata:    { fileName: job.original_file_name },
      });
    } catch { /* non-critical */ }
  }

  async getImportHistory(shopId, branchId, page = 1, limit = 20) {
    const skip  = (page - 1) * limit;
    const where = {
      shop_id: shopId,
      ...(branchId && { branch_id: branchId }),
    };

    const [jobs, total] = await Promise.all([
      prisma.inventoryImportJob.findMany({
        where,
        select: {
          import_job_id:           true,
          original_file_name:      true,
          status:                  true,
          total_rows:              true,
          imported_rows:           true,
          skipped_rows:            true,
          error_rows:              true,
          new_medicines_created:   true,
          existing_batches_merged: true,
          detected_software:       true,
          created_at:              true,
          completed_at:            true,
          creator: { select: { full_name: true } },
          branch:  { select: { branch_name: true } },
        },
        orderBy: { created_at: "desc" },
        take:    limit,
        skip,
      }),
      prisma.inventoryImportJob.count({ where }),
    ]);

    return {
      jobs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  _buildColumnMappingObject(detectedHeaders, mappedHeaders) {
    const mapping = {};
    detectedHeaders.forEach((header, i) => {
      const canonicalKey = mappedHeaders[i];
      if (canonicalKey && header) mapping[canonicalKey] = header;
    });
    return mapping;
  }
}

export default new InventoryImportService();