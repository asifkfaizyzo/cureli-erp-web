/**
 * ═══════════════════════════════════════════════════════════════
 * backend/src/modules/medicines/linking.routes.js
 * ═══════════════════════════════════════════════════════════════
 */

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getSuggestionsForMedicine,
  manuallyLinkMedicine,
  unlinkMedicine,
  bulkAutoLinkMedicines,
  getUnlinkedMedicines,
  searchMasterCatalog,
  bulkCheckImportRows,
  resubmitMedicinesForReview,
  getResubmitEligibleCount,
} from "./linking.service.js";
import { success, fail } from "../../utils/response.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ══════════════════════════════════════════════════════════════
// BULK CHECK IMPORT ROWS (NEW - Must be before /:medicineId)
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/check-import
 * Bulk check import rows against master catalog
 */
router.post("/check-import", async (req, res) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return fail(res, "rows array is required", 400);
    }

    if (rows.length > 500) {
      return fail(res, "Maximum 500 rows per request", 400);
    }

    // Validate each row has at minimum a name field
    // pack_size, manufacturer, generic_name are all optional
    const invalidRow = rows.findIndex(
      (r) => typeof r !== "object" || r === null,
    );
    if (invalidRow !== -1) {
      return fail(res, `Row ${invalidRow} is not a valid object`, 400);
    }

    const result = await bulkCheckImportRows(rows);
    return success(res, result, "Import check complete");
  } catch (error) {
    console.error("linking.checkImport ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// SEARCH MASTER CATALOG
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/medicines/linking/search-catalog
 * Search master catalog for manual linking
 */
router.get("/search-catalog", async (req, res) => {
  try {
    const { q, limit } = req.query;
    const results = await searchMasterCatalog(q, parseInt(limit) || 10);
    return success(res, { results }, "Search results");
  } catch (error) {
    console.error("linking.searchCatalog ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// GET UNLINKED MEDICINES
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/medicines/linking/unlinked
 * Get all unlinked medicines for current shop
 */
router.get("/unlinked", async (req, res) => {
  try {
    const shopId = req.user.shop_id;
    const branchId = req.headers["x-branch-id"] || null;
    const { status, page, limit } = req.query;
    
    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }
    
    const result = await getUnlinkedMedicines(shopId, branchId, {
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    
    return success(res, result, "Unlinked medicines retrieved");
  } catch (error) {
    console.error("linking.getUnlinked ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// GET SUGGESTIONS FOR MEDICINE
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/medicines/linking/:medicineId/suggestions
 * Get link suggestions for a medicine
 */
router.get("/:medicineId/suggestions", async (req, res) => {
  try {
    const { medicineId } = req.params;
    const result = await getSuggestionsForMedicine(medicineId);
    return success(res, result, "Suggestions retrieved");
  } catch (error) {
    console.error("linking.getSuggestions ERROR:", error);
    return fail(res, error.message, error.message === "Medicine not found" ? 404 : 500);
  }
});

// ══════════════════════════════════════════════════════════════
// MANUAL LINK (CAdmin only in practice, but API allows user)
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/:medicineId/link
 * Manually link medicine to master catalog
 */
router.post("/:medicineId/link", async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { masterMedicineId } = req.body;
    const userId = req.user.user_id;
    
    if (!masterMedicineId) {
      return fail(res, "masterMedicineId is required", 400);
    }
    
    const result = await manuallyLinkMedicine(medicineId, masterMedicineId, userId, "USER");
    return success(res, result, "Medicine linked successfully");
  } catch (error) {
    console.error("linking.manualLink ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// UNLINK
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/:medicineId/unlink
 * Unlink medicine from master catalog
 */
router.post("/:medicineId/unlink", async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { reject } = req.body;
    
    const result = await unlinkMedicine(medicineId, reject === true);
    return success(res, result, `Medicine ${reject ? "rejected" : "unlinked"} successfully`);
  } catch (error) {
    console.error("linking.unlink ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// RESUBMIT ELIGIBLE COUNT (badge number for button)
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/medicines/linking/resubmit-count
 * Returns how many medicines are eligible for resubmission
 */
router.get("/resubmit-count", async (req, res) => {
  try {
    const shopId = req.user.shop_id;
    const branchId = req.headers["x-branch-id"] || null;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const count = await getResubmitEligibleCount(shopId, branchId);
    return success(res, { count }, "Resubmit count retrieved");
  } catch (error) {
    console.error("linking.resubmitCount ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// RESUBMIT MEDICINES FOR CATALOG REVIEW
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/resubmit
 * Body: { medicineIds: string[] }
 * Resets non-linked medicines to PENDING, re-runs auto-matcher,
 * increments resubmission_count, logs audit with actor info.
 */
router.post("/resubmit", async (req, res) => {
  try {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const userName = req.user.full_name || req.user.username || null;
    const branchId = req.headers["x-branch-id"] || null;
    const { medicineIds } = req.body;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    if (!branchId) {
      return fail(
        res,
        "Please select a specific branch to resubmit medicines",
        400,
        { code: "BRANCH_REQUIRED" },
      );
    }

    if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
      return fail(res, "medicineIds array is required", 400);
    }

    if (medicineIds.length > 500) {
      return fail(res, "Maximum 500 medicines per resubmission", 400);
    }

    const result = await resubmitMedicinesForReview(
      shopId,
      branchId,
      medicineIds,
      userId,
      userName,
    );

    return success(res, result, "Resubmission complete");
  } catch (error) {
    console.error("linking.resubmit ERROR:", error);
    return fail(res, error.message, 500);
  }
});

// ══════════════════════════════════════════════════════════════
// BULK AUTO-LINK
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/medicines/linking/bulk-auto-link
 * Auto-link all pending medicines for shop
 */
router.post("/bulk-auto-link", async (req, res) => {
  try {
    const shopId = req.user.shop_id;
    const branchId = req.headers["x-branch-id"] || null;
    
    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }
    
    const result = await bulkAutoLinkMedicines(shopId, branchId);
    return success(res, result, "Bulk auto-link completed");
  } catch (error) {
    console.error("linking.bulkAutoLink ERROR:", error);
    return fail(res, error.message, 500);
  }
});




export default router;