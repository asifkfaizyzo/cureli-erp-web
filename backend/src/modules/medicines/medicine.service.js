// backend/src/modules/medicines/medicine.service.js (do not remove this comment)
// backend/src/modules/medicines/medicine.service.js

import prisma from "../../config/prisma.js";
import { checkSingleMedicine } from "./linking.service.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "MEDICINE_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class MedicineService {
  //  Helper to parse any value to number or null
  _toNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return isNaN(value) ? null : value;
    if (typeof value === "string") {
      if (value.trim() === "") return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    if (typeof value === "object" && value.toString) {
      const num = Number(value.toString());
      return isNaN(num) ? null : num;
    }
    return null;
  }

  _buildBranchFilter(shopId, branchId, role, branchMode) {
    const filter = { shop_id: shopId };
    if (role === "super_admin" && branchMode === "GLOBAL") {
      return filter;
    }
    if (branchId) {
      filter.branch_id = branchId;
    }
    return filter;
  }

  /* ============================================
     CREATE MEDICINE
     Updated to accept pre-computed linking data
  ============================================ */

  async createMedicine(data, shopId, branchId, userId, linkingData = null) {
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required to create medicines.",
        400,
        "BRANCH_REQUIRED",
      );
    }

    // Check for duplicate
    const existing = await prisma.medicine.findFirst({
      where: {
        shop_id: shopId,
        branch_id: branchId,
        name: data.name,
        manufacturer: data.manufacturer,
      },
    });

    if (existing) {
      throw new ApiError(
        `Medicine "${data.name}" by ${data.manufacturer} already exists`,
        409,
        "DUPLICATE_MEDICINE",
      );
    }

    // Parse stock levels
    const minStock = this._toNumber(data.min_stock_level);
    const maxStock = this._toNumber(data.max_stock_level);
    const reorderPt = this._toNumber(data.reorder_point);

    // Validate stock levels
    if (minStock !== null && maxStock !== null && minStock >= maxStock) {
      throw new ApiError(
        "Min stock must be less than max stock",
        400,
        "INVALID_STOCK_LEVELS",
      );
    }

    // Determine linking status
    let linkStatus = "PENDING";
    let masterMedicineId = null;
    let linkedVariantId = null; // ← ADD
    let linkedVariantSku = null;
    let linkConfidenceScore = null;
    let linkedAt = null;
    let linkedByType = null;
    let suggestedMasterId = null;
    let suggestionReason = null;

    // If linking data provided (from import flow), use it
    if (linkingData) {
      if (
        linkingData.status === "AUTO_LINKED" &&
        linkingData.master_medicine_id
      ) {
        linkStatus = "AUTO_LINKED";
        masterMedicineId = linkingData.master_medicine_id;
        linkedVariantId = linkingData.matched_variant?.variant_id ?? null; // ← ADD
        linkedVariantSku = linkingData.matched_variant?.sku_id ?? null;
        linkConfidenceScore = linkingData.confidence;
        linkedAt = new Date();
        linkedByType = "SYSTEM";
        suggestionReason = linkingData.reason;
      } else if (linkingData.status === "PENDING") {
        linkStatus = "SUGGESTED";
        linkConfidenceScore = linkingData.confidence;
        suggestedMasterId = linkingData.suggested_master_id;
        suggestionReason = linkingData.reason;
      } else {
        linkStatus = "PENDING";
      }
    }

    // Create medicine
    const medicine = await prisma.medicine.create({
      data: {
        name: data.name,
        generic_name: data.generic_name || null,
        manufacturer: data.manufacturer,
        category: data.category || null,
        sub_category: data.sub_category || null,
        schedule: data.schedule || null,
        hsn_code: data.hsn_code || null,
        pack_size: data.pack_size || null,
        unit_of_measure: data.unit_of_measure || "UNIT",
        gst_percentage: this._toNumber(data.gst_percentage) ?? 12,
        cgst_percentage: this._toNumber(data.cgst_percentage) ?? 6,
        sgst_percentage: this._toNumber(data.sgst_percentage) ?? 6,
        rack_no: data.rack_no || null,

        min_stock_level: minStock,
        max_stock_level: maxStock,
        reorder_point: reorderPt,

        shop_id: shopId,
        branch_id: branchId,
        created_by: userId,

        // Linking fields
        master_medicine_id: masterMedicineId,
        linked_variant_id: linkedVariantId, // ← ADD
        linked_variant_sku: linkedVariantSku,
        link_status: linkStatus,
        link_confidence_score: linkConfidenceScore,
        linked_at: linkedAt,
        linked_by_type: linkedByType,
        suggested_master_id: suggestedMasterId,
        suggestion_reason: suggestionReason,
        link_rejected: false,
      },
      include: {
        branch: {
          select: { branch_id: true, branch_name: true },
        },
        masterMedicine: {
          select: {
            master_medicine_id: true,
            master_key: true,
            generic_name: true,
          },
        },
      },
    });

    // If no linking data provided, try auto-link (fallback for non-import creation)
    if (!linkingData && !masterMedicineId) {
      try {
        const linkResult = await checkSingleMedicine({
          name: medicine.name,
          manufacturer: medicine.manufacturer,
          generic_name: medicine.generic_name,
        });

        if (linkResult.status === "AUTO_LINKED") {
          await prisma.medicine.update({
            where: { medicine_id: medicine.medicine_id },
            data: {
              master_medicine_id: linkResult.master_medicine_id,
              linked_variant_id: linkResult.matched_variant?.variant_id ?? null, // ← ADD
              linked_variant_sku: linkResult.matched_variant?.sku_id ?? null,
              link_status: "AUTO_LINKED",
              link_confidence_score: linkResult.confidence,
              linked_at: new Date(),
              linked_by_type: "SYSTEM",
              suggestion_reason: linkResult.reason,
            },
          });
        } else if (linkResult.status === "PENDING") {
          await prisma.medicine.update({
            where: { medicine_id: medicine.medicine_id },
            data: {
              link_status: "SUGGESTED",
              link_confidence_score: linkResult.confidence,
              suggested_master_id: linkResult.suggested_master_id,
              suggestion_reason: linkResult.reason,
            },
          });
        }
      } catch (linkError) {
        console.warn("⚠️ Auto-link failed:", linkError.message);
      }
    }

    return medicine;
  }

  /* ============================================
     GET MEDICINES
  ============================================ */
  async getMedicines(shopId, branchId, role, branchMode, filters = {}) {
    const {
      search,
      isActive,
      manufacturer,
      category,
      limit = 100,
      offset = 0,
    } = filters;
    const baseFilter = this._buildBranchFilter(
      shopId,
      branchId,
      role,
      branchMode,
    );

    const where = {
      ...baseFilter,
      ...(isActive !== undefined && { is_active: isActive }),
      ...(manufacturer && { manufacturer }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { generic_name: { contains: search, mode: "insensitive" } },
          { manufacturer: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: { branch: { select: { branch_id: true, branch_name: true } } },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, total };
  }

  /* ============================================
     GET MEDICINE BY ID
  ============================================ */
  async getMedicineById(medicineId, shopId, branchId, role, branchMode) {
    const baseFilter = this._buildBranchFilter(
      shopId,
      branchId,
      role,
      branchMode,
    );

    const medicine = await prisma.medicine.findFirst({
      where: { medicine_id: medicineId, ...baseFilter },
      include: {
        branch: { select: { branch_id: true, branch_name: true } },
        inventory: {
          where: { is_active: true },
          select: {
            batch_number: true,
            expiry_date: true,
            current_stock: true,
            available_stock: true,
            mrp: true,
            selling_rate: true,
          },
        },
      },
    });

    if (!medicine) {
      throw new ApiError("Medicine not found", 404, "NOT_FOUND");
    }

    return medicine;
  }

  /* ============================================
     UPDATE MEDICINE
  ============================================ */
  async updateMedicine(medicineId, shopId, branchId, role, branchMode, data) {
    const baseFilter = this._buildBranchFilter(
      shopId,
      branchId,
      role,
      branchMode,
    );

    const medicine = await prisma.medicine.findFirst({
      where: { medicine_id: medicineId, ...baseFilter },
    });

    if (!medicine) {
      throw new ApiError("Medicine not found", 404, "NOT_FOUND");
    }

    // Build update data
    const updateData = {};

    const fields = [
      "name",
      "generic_name",
      "manufacturer",
      "category",
      "sub_category",
      "schedule",
      "hsn_code",
      "pack_size",
      "rack_no",
      "is_active",
      "is_discontinued",
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Handle numeric fields
    if (data.min_stock_level !== undefined) {
      updateData.min_stock_level = this._toNumber(data.min_stock_level);
    }
    if (data.max_stock_level !== undefined) {
      updateData.max_stock_level = this._toNumber(data.max_stock_level);
    }
    if (data.reorder_point !== undefined) {
      updateData.reorder_point = this._toNumber(data.reorder_point);
    }

    return prisma.medicine.update({
      where: { medicine_id: medicineId },
      data: updateData,
    });
  }

  /* ============================================
     BULK CREATE MEDICINES
     Updated to accept linking data per medicine
  ============================================ */

  async bulkCreateMedicines(
    medicinesData,
    shopId,
    branchId,
    userId,
    linkingResults = null,
  ) {
    if (!branchId) {
      throw new ApiError(
        "Branch required for bulk import",
        400,
        "BRANCH_REQUIRED",
      );
    }

    //  FIX: linkingResults is now the LEGACY path (kept for backward compat)
    // The NEW path is _linkingData embedded directly in each medicine object

    // Legacy: Build linking map by index (old callers that still pass separate array)
    const legacyLinkingMap = new Map();
    if (linkingResults && Array.isArray(linkingResults)) {
      linkingResults.forEach((result) => {
        if (result.rowIndex !== undefined) {
          legacyLinkingMap.set(result.rowIndex, result);
        }
      });
    }

    const results = { created: [], skipped: [], errors: [] };

    for (let i = 0; i < medicinesData.length; i++) {
      const data = medicinesData[i];

      //  Priority 1: Linking data embedded directly in this product (new path)
      // Priority 2: Legacy index-based lookup (old path)
      // Priority 3: null (createMedicine will do its own catalog check)
      const linkingData = data._linkingData || legacyLinkingMap.get(i) || null;

      // Remove _linkingData from the data before passing to createMedicine
      // so it doesn't end up in the Prisma create call
      const { _linkingData, ...cleanData } = data;

      try {
        const medicine = await this.createMedicine(
          cleanData,
          shopId,
          branchId,
          userId,
          linkingData,
        );
        results.created.push(medicine);
      } catch (error) {
        if (error.statusCode === 409) {
          results.skipped.push({
            name: data.name,
            manufacturer: data.manufacturer,
            reason: "Duplicate",
            rowIndex: i,
          });
        } else {
          results.errors.push({
            name: data.name,
            manufacturer: data.manufacturer,
            error: error.message,
            rowIndex: i,
          });
        }
      }
    }

    return results;
  }

  /* ============================================
     SEARCH
  ============================================ */
  async searchMedicines(
    shopId,
    branchId,
    role,
    branchMode,
    searchTerm,
    limit = 20,
  ) {
    const baseFilter = this._buildBranchFilter(
      shopId,
      branchId,
      role,
      branchMode,
    );

    return prisma.medicine.findMany({
      where: {
        ...baseFilter,
        is_active: true,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { generic_name: { contains: searchTerm, mode: "insensitive" } },
          { manufacturer: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        medicine_id: true,
        name: true,
        generic_name: true,
        manufacturer: true,
        hsn_code: true,
        pack_size: true,
        rack_no: true,
        gst_percentage: true,
        cgst_percentage: true,
        sgst_percentage: true,
        min_stock_level: true,
        max_stock_level: true,
        reorder_point: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });
  }
}

export default new MedicineService();
