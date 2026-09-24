// backend/src/modules/medicines/medicine.controller.js (do not remove this comment)
// backend/src/modules/medicines/medicine.controller.js

import { success, fail } from "../../utils/response.js";
import prisma from "../../config/prisma.js"; //  FIX: Add missing prisma import
import medicineService from "./medicine.service.js";

/**
 * Extract branch context from request headers
 * pharmacy-web sends: X-Branch-Mode and X-Branch-Id headers
 */
function extractBranchContext(req) {
  const branchMode = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"] || null;

  // For super_admin: use header branch context
  // For others: use their assigned branch_id from JWT
  if (req.user.role === "super_admin") {
    return {
      branchId: branchMode === "GLOBAL" ? null : headerBranchId,
      branchMode,
    };
  }

  // branch_admin/staff: always use their assigned branch
  return {
    branchId: req.user.branch_id,
    branchMode: "BRANCH",
  };
}

export async function createMedicineController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { branchId } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.createMedicine(
      req.validated,
      shopId,
      branchId,
      userId,
    );

    return success(res, medicine, "Medicine created successfully", 201);
  } catch (error) {
    console.error("medicine.create ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getMedicinesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      search: req.query.search,
      isActive: req.query.isActive === "true",
      manufacturer: req.query.manufacturer,
      category: req.query.category,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await medicineService.getMedicines(
      shopId,
      branchId,
      role,
      branchMode,
      filters,
    );

    return success(res, result, "Medicines retrieved successfully");
  } catch (error) {
    console.error("medicine.getAll ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getMedicineByIdController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { medicineId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.getMedicineById(
      medicineId,
      shopId,
      branchId,
      role,
      branchMode,
    );

    return success(res, medicine, "Medicine retrieved successfully");
  } catch (error) {
    console.error("medicine.getById ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function updateMedicineController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { medicineId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicine = await medicineService.updateMedicine(
      medicineId,
      shopId,
      branchId,
      role,
      branchMode,
      req.validated,
    );

    return success(res, medicine, "Medicine updated successfully");
  } catch (error) {
    console.error("medicine.update ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function bulkCreateMedicinesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { branchId } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const result = await medicineService.bulkCreateMedicines(
      req.validated.medicines,
      shopId,
      branchId,
      userId,
    );

    return success(res, result, "Bulk medicine import completed");
  } catch (error) {
    console.error("medicine.bulkCreate ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

//  Search endpoint for autocomplete
export async function searchMedicinesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);
    const searchTerm = req.query.q || req.query.search || "";

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const medicines = await medicineService.searchMedicines(
      shopId,
      branchId,
      role,
      branchMode,
      searchTerm,
      parseInt(req.query.limit) || 20,
    );

    return success(res, { medicines }, "Search results");
  } catch (error) {
    console.error("medicine.search ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/**
 * GET /api/medicines/catalog-link-status
 * Get catalog link status for medicines
 *
 *  FIX: Now uses the prisma import at the top of this file
 */
export const getCatalogLinkStatusController = async (req, res) => {
  try {
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req); //  FIX: Use extractBranchContext instead of raw header
    const { ids } = req.query;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    // Parse medicine IDs if provided
    const medicineIds = ids ? ids.split(",").filter(Boolean) : null;

    // Build query
    const where = {
      shop_id: shopId,
      ...(branchId && { branch_id: branchId }),
      ...(medicineIds && { medicine_id: { in: medicineIds } }),
    };

    // Get medicines with their link status
    const medicines = await prisma.medicine.findMany({
      where,
      select: {
        medicine_id: true,
        name: true,
        link_status: true,
        master_medicine_id: true,
        link_confidence_score: true,
        suggested_master_id: true,
      },
    });

    // Map to response format
    const statusData = medicines.map((med) => ({
      medicine_id: med.medicine_id,
      status: med.master_medicine_id
        ? "LINKED"
        : med.link_status === "PENDING" || med.link_status === "SUGGESTED"
          ? "PENDING"
          : "NOT_LINKED",
      master_medicine_id: med.master_medicine_id,
      confidence: med.link_confidence_score || 0,
      pending_link_id: med.suggested_master_id,
    }));

    return success(res, statusData, "Catalog link status retrieved");
  } catch (error) {
    console.error("getCatalogLinkStatus error:", error);
    return fail(res, error.message, 500);
  }
};
