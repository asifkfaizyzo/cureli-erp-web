// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.controller.js (do not remove this comment)
// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.controller.js

/**
 * ═══════════════════════════════════════════════════════════════
 * CADMIN MASTER MEDICINES CONTROLLER
 * ═══════════════════════════════════════════════════════════════
 */

import {
  getMasterMedicines,
  getMasterMedicineById,
  getMasterMedicineByKey,
  getVariantBySkuId,
  getMasterMedicineStats,
  getFilterOptions,
  autocompleteSearch,
  getDistinctShops,
  getUnmappedMedicinesAggregated,
  getNeedsReviewMedicines,
  getLinkedMedicines,
  getLinkedMedicinesByVariant,
  acceptReviewMatch,
  rejectReviewMatch,
  matchUnmappedToVariant,
  matchUnmappedToMaster,
  ignoreUnmappedMedicines,
  unlinkShopMedicine,
  uploadMasterImage,
  deleteMasterImage,
  createMasterMedicine,
  createVariantForMasterMedicine,
  getMappingHistory,
  unignoreShopMedicine,
} from "./cadminMasterMedicines.service.js";

import { extractRequestContext } from "../../audit/audit.utils.js";

// ══════════════════════════════════════════════════════════════
// HELPER: Build audit context from cadmin request
// ══════════════════════════════════════════════════════════════

function buildAuditCtx(req) {
  return extractRequestContext(req);
}

// ══════════════════════════════════════════════════════════════
// LIST MASTER MEDICINES
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines
 * List all master medicines with pagination, search, filters
 */
export async function listMasterMedicines(req, res) {
  try {
    const {
      search,
      type,
      form,
      category,
      imageStatus,
      prescriptionRequired,
      minVariants,
      maxVariants,
      page,
      limit,
      sort,
      order,
    } = req.query;

    const result = await getMasterMedicines({
      search,
      type,
      form,
      category,
      imageStatus,
      prescriptionRequired,
      minVariants,
      maxVariants,
      page,
      limit,
      sort,
      order,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error listing master medicines:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch master medicines",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET SINGLE MASTER MEDICINE
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/:id
 * Get single master medicine by ID or master_key with all variants
 */
export async function getMasterMedicine(req, res) {
  try {
    const { id } = req.params;

    const medicine = await getMasterMedicineById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Master medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Error getting master medicine:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch master medicine",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET VARIANT BY SKU ID
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/variants/:skuId
 * Get single variant by SKU ID
 */
export async function getVariant(req, res) {
  try {
    const { skuId } = req.params;

    const variant = await getVariantBySkuId(skuId);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error("Error getting variant:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch variant",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET STATISTICS
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/stats
 * Get statistics for master medicines
 */
export async function getMasterMedicinesStats(req, res) {
  try {
    const stats = await getMasterMedicineStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting master medicine stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// GET FILTER OPTIONS
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/filters
 * Get filter options for dropdowns
 */
export async function getFilters(req, res) {
  try {
    const filters = await getFilterOptions();

    return res.status(200).json({
      success: true,
      data: filters,
    });
  } catch (error) {
    console.error("Error getting filter options:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// AUTOCOMPLETE SEARCH
// ══════════════════════════════════════════════════════════════

/**
 * GET /cadmin/master-medicines/autocomplete
 * Autocomplete search for medicines
 */
export async function autocomplete(req, res) {
  try {
    const { q, limit } = req.query;

    const result = await autocompleteSearch(q, parseInt(limit) || 10);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in autocomplete:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch suggestions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// DISTINCT SHOPS FOR MAPPING FILTERS
// ══════════════════════════════════════════════════════════════

export async function listShops(req, res) {
  try {
    const { context, search, page, limit } = req.query;
    const result = await getDistinctShops({
      context: context || "unmapped",
      search: search || "",
      page,
      limit,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error listing shops:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shops",
    });
  }
}

// ══════════════════════════════════════════════════════════════
// UNMAPPED MEDICINES
// ══════════════════════════════════════════════════════════════

export async function listUnmappedMedicines(req, res) {
  try {
    const { search, type, page, limit, sort, order, shopIds, dateFrom, dateTo } =
      req.query;
    const parsedShopIds = shopIds
      ? shopIds.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const result = await getUnmappedMedicinesAggregated({
      search,
      type,
      page,
      limit,
      sort: sort || "occurrenceCount",
      order: order || "desc",
      shopIds: parsedShopIds,
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error listing unmapped medicines:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unmapped medicines",
    });
  }
}

// ══════════════════════════════════════════════════════════════
// NEEDS REVIEW
// ══════════════════════════════════════════════════════════════

export async function listNeedsReview(req, res) {
  try {
    const { search, confidenceFilter, page, limit, shopIds, dateFrom, dateTo, sort, order } =
      req.query;
    const parsedShopIds = shopIds
      ? shopIds.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const result = await getNeedsReviewMedicines({
      search,
      confidenceFilter,
      page,
      limit,
      shopIds: parsedShopIds,
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
      sort: sort || "confidenceScore",
      order: order || "desc",
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error listing needs review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch review items",
    });
  }
}

// ══════════════════════════════════════════════════════════════
// LINKED MEDICINES
// ══════════════════════════════════════════════════════════════

export async function listLinkedMedicines(req, res) {
  try {
    const { id } = req.params;
    const linked = await getLinkedMedicines(id);
    return res.status(200).json({ success: true, data: linked });
  } catch (error) {
    console.error("Error listing linked medicines:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch linked medicines",
    });
  }
}

// ══════════════════════════════════════════════════════════════
// LINKED MEDICINES BY VARIANT
// ══════════════════════════════════════════════════════════════

export async function listLinkedByVariant(req, res) {
  try {
    const { variantId } = req.params;
    const result = await getLinkedMedicinesByVariant(variantId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error listing linked medicines by variant:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// ACCEPT REVIEW
// ══════════════════════════════════════════════════════════════

export async function acceptMatch(req, res) {
  try {
    const { medicineId } = req.params;
    const auditContext = buildAuditCtx(req);
    const result = await acceptReviewMatch(
      medicineId,
      auditContext.actor_id,
      auditContext,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error accepting match:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// REJECT REVIEW
// ══════════════════════════════════════════════════════════════

export async function rejectMatch(req, res) {
  try {
    const { medicineId } = req.params;
    const auditContext = buildAuditCtx(req);
    const result = await rejectReviewMatch(medicineId, auditContext);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error rejecting match:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// MATCH UNMAPPED TO VARIANT
// ══════════════════════════════════════════════════════════════

export async function matchToVariant(req, res) {
  try {
    const { medicineIds, variantId } = req.body;
    const auditContext = buildAuditCtx(req);

    if (
      !medicineIds ||
      !Array.isArray(medicineIds) ||
      medicineIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "medicineIds array is required",
      });
    }
    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: "variantId is required",
      });
    }

    const result = await matchUnmappedToVariant(
      medicineIds,
      variantId,
      auditContext.actor_id,
      auditContext,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error matching to variant:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// MATCH UNMAPPED TO MASTER
// ══════════════════════════════════════════════════════════════

export async function matchToMaster(req, res) {
  try {
    const { medicineIds, masterMedicineId } = req.body;
    const auditContext = buildAuditCtx(req);

    if (
      !medicineIds ||
      !Array.isArray(medicineIds) ||
      medicineIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "medicineIds array is required",
      });
    }
    if (!masterMedicineId) {
      return res.status(400).json({
        success: false,
        message: "masterMedicineId is required",
      });
    }

    const result = await matchUnmappedToMaster(
      medicineIds,
      masterMedicineId,
      auditContext.actor_id,
      auditContext,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error matching to master:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// IGNORE UNMAPPED
// ══════════════════════════════════════════════════════════════

export async function ignoreUnmapped(req, res) {
  try {
    const { medicineIds } = req.body;
    const auditContext = buildAuditCtx(req);

    if (
      !medicineIds ||
      !Array.isArray(medicineIds) ||
      medicineIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "medicineIds array is required",
      });
    }

    const result = await ignoreUnmappedMedicines(
      medicineIds,
      auditContext.actor_id, // <-- Pass cadmin actor_id
      auditContext,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error ignoring unmapped:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// UNLINK SHOP MEDICINE
// ══════════════════════════════════════════════════════════════

export async function unlinkMedicine(req, res) {
  try {
    const { medicineId } = req.params;
    const auditContext = buildAuditCtx(req);
    const result = await unlinkShopMedicine(medicineId, auditContext);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error unlinking medicine:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// IMAGE UPLOAD
// ══════════════════════════════════════════════════════════════

export async function handleImageUpload(req, res) {
  try {
    const { id } = req.params;
    const auditContext = buildAuditCtx(req);
    const cadminName = req.cadmin?.name || req.cadmin?.email || "CAdmin";

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const image = await uploadMasterImage(
      id,
      {
        buffer:       req.file.buffer,       // memory buffer from multer
        mimetype:     req.file.mimetype,     // "image/jpeg" etc
        originalname: req.file.originalname, // original filename for ext
        type:         req.body.type || "PRIMARY",
        skuId:        req.body.skuId,
      },
      cadminName,
      auditContext,
    );

    return res.status(200).json({ success: true, data: image });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// IMAGE DELETE
// ══════════════════════════════════════════════════════════════

export async function handleImageDelete(req, res) {
  try {
    const { imageId } = req.params;
    const auditContext = buildAuditCtx(req);
    const result = await deleteMasterImage(imageId, auditContext);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ══════════════════════════════════════════════════════════════
// CREATE MASTER MEDICINE
// ══════════════════════════════════════════════════════════════

export async function createMasterMed(req, res) {
  try {
    const auditContext = buildAuditCtx(req);
    const result = await createMasterMedicine(
      req.body,
      auditContext.actor_id,
      auditContext,
    );
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating master medicine:", error);
    if (error.code === "DUPLICATE_MASTER_KEY" || error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_MASTER_KEY",
        message: error.message,
        data: {
          existingMaster: error.existingMaster || null,
        },
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// CREATE VARIANT FOR MASTER MEDICINE
// ══════════════════════════════════════════════════════════════

export async function createVariantUnderMaster(req, res) {
  try {
    const { id } = req.params;
    const auditContext = buildAuditCtx(req);
    const result = await createVariantForMasterMedicine(
      id,
      req.body,
      auditContext.actor_id,
      auditContext,
    );
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating variant under master:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// MAPPING HISTORY
// ══════════════════════════════════════════════════════════════

export async function listMappingHistory(req, res) {
  try {
    const { search, status, page, limit, sort, order, shopIds, dateFrom, dateTo } = req.query;
    
    // Defensive split
    const parsedShopIds = shopIds && String(shopIds).trim() !== ""
      ? String(shopIds).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const result = await getMappingHistory({
      search,
      status,
      page,
      limit,
      sort: sort || "actionDate",
      order: order || "desc",
      shopIds: parsedShopIds,
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("CRITICAL: listMappingHistory failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mapping history",
      error: error.message,      // <-- Expose error message to frontend
      stack: error.stack,        // <-- Expose stack trace for quick debugging
    });
  }
}

// ══════════════════════════════════════════════════════════════
// UNIGNORE SHOP MEDICINE
// ══════════════════════════════════════════════════════════════

export async function unignoreMedicine(req, res) {
  try {
    const { medicineId } = req.params;
    const auditContext = buildAuditCtx(req);
    const result = await unignoreShopMedicine(medicineId, auditContext);
    
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error un-ignoring medicine:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}