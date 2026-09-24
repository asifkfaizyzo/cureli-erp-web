// backend/src/modules/inventory-import/inventoryImport.resolver.js (do not remove this comment)
// Simplified — only handles conflict decisions now.
// Medicine decisions are automatic, no user input needed.

import prisma from "../../config/prisma.js";

const VALID_CONFLICT_ACTIONS = new Set(["merge", "replace", "skip"]);

// ══════════════════════════════════════════════════════════════════════════════
// STORE CONFLICT DECISIONS
// Only conflicts need user decisions. Medicines are handled automatically.
// ══════════════════════════════════════════════════════════════════════════════

export async function storeConflictDecisions(importJobId, userConflictDecisions) {
  const job = await prisma.inventoryImportJob.findUnique({
    where:  { import_job_id: importJobId },
    select: {
      conflict_decisions: true,
      valid_rows:         true,
      error_rows:         true,
      error_log:          true,
    },
  });

  if (!job) throw new Error("Import job not found.");

  const existingConflicts = job.conflict_decisions || {};

  // Validate decisions
  const errors = [];
  for (const [key, decision] of Object.entries(userConflictDecisions)) {
    if (!VALID_CONFLICT_ACTIONS.has(decision)) {
      errors.push({
        key,
        message: `Invalid conflict decision "${decision}". Must be merge, replace, or skip.`,
      });
    }
  }

  if (errors.length > 0) {
    throw Object.assign(
      new Error("Invalid conflict decisions."),
      { statusCode: 400, validationErrors: errors }
    );
  }

  // Merge decisions into existing conflict entries
  const mergedConflicts = { ...existingConflicts };
  for (const [key, decision] of Object.entries(userConflictDecisions)) {
    if (mergedConflicts[key]) {
      mergedConflicts[key] = {
        ...mergedConflicts[key],
        userDecision: decision,
      };
    }
  }

  // Persist
  await prisma.inventoryImportJob.update({
    where: { import_job_id: importJobId },
    data:  { conflict_decisions: mergedConflicts },
  });

  // Build summary for confirm step display
  const summary = buildConflictSummary(mergedConflicts, job);

  return { summary, mergedConflicts };
}

// ══════════════════════════════════════════════════════════════════════════════
// BUILD CONFIRM SUMMARY
// Called after conflicts are resolved. Powers the confirm step display.
// ══════════════════════════════════════════════════════════════════════════════

function buildConflictSummary(conflictDecisions, job) {
  let willMerge   = 0;
  let willReplace = 0;
  let willSkip    = 0;

  for (const entry of Object.values(conflictDecisions)) {
    if (entry.userDecision === "merge")   willMerge++;
    if (entry.userDecision === "replace") willReplace++;
    if (entry.userDecision === "skip")    willSkip++;
  }

  const totalConflicts   = Object.keys(conflictDecisions).length;
  const validRows        = job.valid_rows || 0;
  const errorRows        = job.error_rows || 0;

  // Rows that are not conflicts and not errors will create new batches
  const conflictRowCount = Object.values(conflictDecisions)
    .reduce((sum, c) => sum + (c.rowIndices?.length || 0), 0);
  const willImport = Math.max(0, validRows - conflictRowCount);

  return {
    willImport,
    willMerge,
    willReplace,
    willSkip,
    blockedByError: errorRows,
    totalConflicts,
  };
}