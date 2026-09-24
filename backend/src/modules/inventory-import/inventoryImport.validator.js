// backend/src/modules/inventory-import/inventoryImport.validator.js (do not remove this comment)
// src/modules/inventory-import/inventoryImport.validator.js
//
// Row-level validation for inventory import.
// Runs after parsing, before catalog check.
// Produces hard errors (block the row) and soft warnings (allow with notice).

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

// Standard GST slabs in India
const VALID_GST_SLABS = new Set([0, 5, 12, 18, 28]);

// Warn if expiry is within this many days
const NEAR_EXPIRY_WARN_DAYS = 90;

// ══════════════════════════════════════════════════════════════════════════════
// ERROR CODES
// ══════════════════════════════════════════════════════════════════════════════

export const ERROR_CODES = {
  // Hard errors — row blocked
  MISSING_PRODUCT_NAME:  "R001",
  MISSING_BATCH_NUMBER:  "R002",
  INVALID_QUANTITY:      "R003",
  INVALID_MRP:           "R004",
  INVALID_EXPIRY_DATE:   "R005",
  PURCHASE_EXCEEDS_MRP:  "R006",
  NEGATIVE_QUANTITY:     "R007",

  // Soft warnings — row allowed
  EXPIRED_BATCH:         "W001",
  NEAR_EXPIRY:           "W002",
  NEGATIVE_MARGIN:       "W003",
  NON_STANDARD_GST:      "W004",
  INVALID_HSN_LENGTH:    "W005",
  ZERO_QUANTITY:         "W006",
  MISSING_COMPANY:       "W007",
  MISSING_PURCHASE_RATE: "W008",

  // Cross-row — duplicate within import file
  DUPLICATE_IN_FILE:     "D001",
};

// ══════════════════════════════════════════════════════════════════════════════
// PER-ROW VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Validate a single parsed row.
 *
 * @param {ParsedRow} row - Output from parser.parseRow()
 * @returns {{ errors: ValidationError[], warnings: ValidationWarning[] }}
 */
function validateRow(row) {
  const errors   = [];
  const warnings = [];
  const today    = new Date();
  today.setHours(0, 0, 0, 0);

  // ── R001: Product name required ─────────────────────────────────────────
  if (!row.productName || !row.productName.trim()) {
    errors.push({
      code:     ERROR_CODES.MISSING_PRODUCT_NAME,
      field:    "productName",
      message:  "Product name is required.",
      rawValue: row.raw.productName,
    });
  }

  // ── R002: Batch number required ──────────────────────────────────────────
  if (!row.batchNumber || !row.batchNumber.trim()) {
    errors.push({
      code:     ERROR_CODES.MISSING_BATCH_NUMBER,
      field:    "batchNumber",
      message:  "Batch number is required.",
      rawValue: row.raw.batchNumber,
    });
  }

  // ── R003 + R007: Quantity must be a non-negative integer ─────────────────
  if (row.quantity === null) {
    errors.push({
      code:     ERROR_CODES.INVALID_QUANTITY,
      field:    "quantity",
      message:  "Quantity must be a number.",
      rawValue: row.raw.quantity,
    });
  } else if (row.quantity < 0) {
    errors.push({
      code:     ERROR_CODES.NEGATIVE_QUANTITY,
      field:    "quantity",
      message:  "Quantity cannot be negative.",
      rawValue: row.raw.quantity,
    });
  } else if (row.quantity === 0) {
    // Zero quantity is allowed but warn
    warnings.push({
      code:     ERROR_CODES.ZERO_QUANTITY,
      field:    "quantity",
      message:  "Quantity is zero. This batch will be imported with no stock.",
      rawValue: row.raw.quantity,
    });
  }

  // ── R004: MRP must be a positive number ──────────────────────────────────
  if (row.mrp === null || row.mrp === undefined) {
    errors.push({
      code:     ERROR_CODES.INVALID_MRP,
      field:    "mrp",
      message:  "MRP is required and must be a positive number.",
      rawValue: row.raw.mrp,
    });
  } else if (row.mrp <= 0) {
    errors.push({
      code:     ERROR_CODES.INVALID_MRP,
      field:    "mrp",
      message:  `MRP must be greater than zero. Got: ${row.mrp}`,
      rawValue: row.raw.mrp,
    });
  }

  // ── R005: Expiry date must be parseable ──────────────────────────────────
  if (!row.expiryDate) {
    errors.push({
      code:     ERROR_CODES.INVALID_EXPIRY_DATE,
      field:    "expiryDate",
      message:  "Expiry date is required and could not be parsed.",
      rawValue: row.raw.expiryDate,
    });
  }

  // ── R006: Purchase rate must not exceed MRP ───────────────────────────────
  if (
    row.purchaseRate !== null &&
    row.mrp !== null &&
    row.purchaseRate > row.mrp
  ) {
    errors.push({
      code:     ERROR_CODES.PURCHASE_EXCEEDS_MRP,
      field:    "purchaseRate",
      message:  `Purchase rate (${row.purchaseRate}) exceeds MRP (${row.mrp}). This is likely a data error.`,
      rawValue: row.raw.purchaseRate,
    });
  }

  // ── W001: Expired batch ──────────────────────────────────────────────────
  if (row.expiryDate && row.expiryDate < today) {
    warnings.push({
      code:     ERROR_CODES.EXPIRED_BATCH,
      field:    "expiryDate",
      message:  `This batch expired on ${row.expiryDate.toLocaleDateString("en-IN")}. It will be marked as expired.`,
      rawValue: row.raw.expiryDate,
    });
  }

  // ── W002: Near expiry ────────────────────────────────────────────────────
  if (row.expiryDate && row.expiryDate >= today) {
    const daysUntilExpiry = Math.ceil(
      (row.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= NEAR_EXPIRY_WARN_DAYS) {
      warnings.push({
        code:     ERROR_CODES.NEAR_EXPIRY,
        field:    "expiryDate",
        message:  `This batch expires in ${daysUntilExpiry} days (${row.expiryDate.toLocaleDateString("en-IN")}).`,
        rawValue: row.raw.expiryDate,
      });
    }
  }

  // ── W003: Negative margin (selling rate < purchase rate) ─────────────────
  if (
    row.sellingRate !== null &&
    row.purchaseRate !== null &&
    row.sellingRate < row.purchaseRate
  ) {
    warnings.push({
      code:     ERROR_CODES.NEGATIVE_MARGIN,
      field:    "sellingRate",
      message:  `Selling rate (${row.sellingRate}) is below purchase rate (${row.purchaseRate}). Margin is negative.`,
      rawValue: row.raw.sellingRate,
    });
  }

  // ── W004: Non-standard GST slab ──────────────────────────────────────────
  if (row.gst !== null && !VALID_GST_SLABS.has(row.gst)) {
    warnings.push({
      code:     ERROR_CODES.NON_STANDARD_GST,
      field:    "gst",
      message:  `GST rate ${row.gst}% is not a standard slab (0, 5, 12, 18, 28).`,
      rawValue: row.raw.gst,
    });
  }

  // ── W005: HSN code length must be 4 or 8 digits ──────────────────────────
  if (row.hsnCode && !/^\d{4}$|^\d{8}$/.test(row.hsnCode)) {
    warnings.push({
      code:     ERROR_CODES.INVALID_HSN_LENGTH,
      field:    "hsnCode",
      message:  `HSN code "${row.hsnCode}" should be 4 or 8 digits.`,
      rawValue: row.raw.hsnCode,
    });
  }

  // ── W007: Missing company/manufacturer ───────────────────────────────────
  if (!row.company || !row.company.trim()) {
    warnings.push({
      code:     ERROR_CODES.MISSING_COMPANY,
      field:    "company",
      message:  "Manufacturer/company name is missing. Medicine matching may be less accurate.",
      rawValue: row.raw.company,
    });
  }

  // ── W008: Missing purchase rate ──────────────────────────────────────────
  if (row.purchaseRate === null) {
    warnings.push({
      code:     ERROR_CODES.MISSING_PURCHASE_RATE,
      field:    "purchaseRate",
      message:  "Purchase rate is missing. Stock ledger entry will have no cost value.",
      rawValue: row.raw.purchaseRate,
    });
  }

  return { errors, warnings };
}

// ══════════════════════════════════════════════════════════════════════════════
// CROSS-ROW DUPLICATE DETECTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Detect rows where the same productName + batchNumber appears more than once
 * within the import file itself (not against existing inventory — that is
 * handled separately in conflict detection).
 *
 * The FIRST occurrence is kept. Subsequent occurrences are flagged as
 * DUPLICATE_IN_FILE. They are not hard-blocked but are marked so the
 * frontend can show the user which row is being discarded.
 *
 * Returns a Set of rowIndex values that are duplicates.
 */
function detectIntraFileDuplicates(rows) {
  const seen       = new Map(); // "productName|batchNumber" → first rowIndex
  const duplicates = new Set();

  for (const row of rows) {
    if (!row.productName || !row.batchNumber) continue;

    const key = `${row.productName.toLowerCase().trim()}|${row.batchNumber.toLowerCase().trim()}`;

    if (seen.has(key)) {
      duplicates.add(row.rowIndex);
    } else {
      seen.set(key, row.rowIndex);
    }
  }

  return duplicates;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Validate all rows from the parser.
 *
 * @param {ParsedRow[]} rows - Output from parseInventoryFile()
 * @returns {ValidationResult}
 *   {
 *     validRows:     ParsedRow[],    // rows that passed all hard checks
 *     errorRows:     ErrorRow[],     // rows blocked by hard errors
 *     warningRows:   WarningRow[],   // rows allowed but with warnings
 *     duplicateRows: DuplicateRow[], // rows skipped as intra-file duplicates
 *     summary: {
 *       total:      number,
 *       valid:      number,
 *       errors:     number,
 *       warnings:   number,
 *       duplicates: number,
 *     }
 *   }
 */
export function validateRows(rows) {
  const duplicateRowIndices = detectIntraFileDuplicates(rows);

  const validRows     = [];
  const errorRows     = [];
  const warningRows   = [];
  const duplicateRows = [];

  for (const row of rows) {
    // Handle intra-file duplicates first
    if (duplicateRowIndices.has(row.rowIndex)) {
      duplicateRows.push({
        rowIndex:    row.rowIndex,
        productName: row.productName,
        batchNumber: row.batchNumber,
        warning: {
          code:    ERROR_CODES.DUPLICATE_IN_FILE,
          field:   "batchNumber",
          message: `Duplicate: "${row.productName}" batch "${row.batchNumber}" appears multiple times. First occurrence is kept.`,
        },
      });
      continue; // Do not validate duplicate rows — they are skipped entirely
    }

    const { errors, warnings } = validateRow(row);

    if (errors.length > 0) {
      errorRows.push({
        rowIndex:    row.rowIndex,
        productName: row.productName,
        batchNumber: row.batchNumber,
        errors,
        warnings,
        raw:         row.raw,
      });
    } else {
      // Row passed hard checks
      if (warnings.length > 0) {
        warningRows.push({
          rowIndex:    row.rowIndex,
          productName: row.productName,
          batchNumber: row.batchNumber,
          warnings,
        });
      }
      validRows.push({ ...row, warnings });
    }
  }

  return {
    validRows,
    errorRows,
    warningRows,
    duplicateRows,
    summary: {
      total:      rows.length,
      valid:      validRows.length,
      errors:     errorRows.length,
      warnings:   warningRows.length,
      duplicates: duplicateRows.length,
    },
  };
}