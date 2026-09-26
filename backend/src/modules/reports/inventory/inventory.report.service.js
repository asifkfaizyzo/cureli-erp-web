// backend/src/modules/reports/inventory/inventory.report.service.js (do not remove this comment)
// backend/src/modules/reports/inventory/inventory.report.service.js

import prisma from "../../../config/prisma.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "REPORT_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class InventoryReportService {
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

  _calculateStockStatus(currentStock, inventoryMinStock, medicineStockLevels, isExpired, expiryDate) {
    const stock = this._toNumber(currentStock) ?? 0;
    const minStockFromMedicine = this._toNumber(medicineStockLevels?.min_stock_level);
    const minStockFromInventory = this._toNumber(inventoryMinStock);
    const effectiveMinStock = minStockFromInventory ?? minStockFromMedicine;

    if (stock === 0) return "Out of Stock";
    if (isExpired === true) return "Expired";

    if (expiryDate) {
      const expDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) return "Expired";
      if (daysUntilExpiry <= 30) return "Expiring Soon";
    }

    if (effectiveMinStock !== null && stock < effectiveMinStock) return "Low Stock";
    return "In Stock";
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

  // ─────────────────────────────────────────────────────────────────
  // C1 — CURRENT STOCK SNAPSHOT (UPDATED TO ALLOW OUT OF STOCK ITEMS)
  // ─────────────────────────────────────────────────────────────────
  async getCurrentStock(shopId, branchId, role, branchMode, filters = {}) {
    const { category, manufacturer, stockLevel, search, branchId: filterBranchId, limit = 50, offset = 0 } = filters;
    const queryBranchId = filterBranchId || branchId;
    const baseFilter = this._buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_active: true, // Allow current_stock to be 0 or more so "Out of Stock" works!
      ...(manufacturer && { medicine: { manufacturer: { equals: manufacturer, mode: "insensitive" } } }),
      ...(search && {
        OR: [
          { medicine: { name: { contains: search, mode: "insensitive" } } },
          { batch_number: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const items = await prisma.inventory.findMany({
      where,
      include: {
        medicine: true,
        branch: { select: { branch_name: true } },
      },
      orderBy: { expiry_date: "asc" },
    });

    let mapped = items.map((inv) => {
      const resolvedCategory = inv.medicine?.category || "Uncategorized";
      const status = this._calculateStockStatus(
        inv.current_stock,
        inv.minimum_stock,
        inv.medicine,
        inv.is_expired,
        inv.expiry_date
      );

      return {
        inventory_id: inv.inventory_id,
        medicine_name: inv.medicine?.name || "-",
        manufacturer: inv.medicine?.manufacturer || "-",
        category: resolvedCategory,
        batch_number: inv.batch_number,
        expiry_date: inv.expiry_date,
        current_stock: Number(inv.current_stock),
        available_stock: Number(inv.available_stock),
        reserved_stock: Number(inv.reserved_stock),
        mrp: Number(inv.mrp),
        selling_rate: Number(inv.selling_rate || inv.mrp),
        rack_no: inv.rack_no || inv.medicine?.rack_no || "-",
        branch_name: inv.branch?.branch_name || "Main Branch",
        status,
      };
    });

    if (category) {
      mapped = mapped.filter((x) => x.category.toLowerCase() === category.toLowerCase());
    }

    if (stockLevel) {
      mapped = mapped.filter((x) => x.status.toLowerCase() === stockLevel.toLowerCase());
    }

    const total = mapped.length;
    const paginated = mapped.slice(Number(offset), Number(offset) + Number(limit));

    const totalStockVal = mapped.reduce((sum, item) => sum + (item.current_stock * item.mrp), 0);
    const totalQty = mapped.reduce((sum, item) => sum + item.current_stock, 0);

    return {
      records: paginated,
      total,
      summary: {
        total_items: total,
        total_quantity: totalQty,
        total_value_at_mrp: totalStockVal,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // C2 — EXPIRY REPORT
  // ─────────────────────────────────────────────────────────────────
  async getExpiryReport(shopId, branchId, role, branchMode, filters = {}) {
    const { expiryBucket, manufacturer, branchId: filterBranchId, limit = 50, offset = 0 } = filters;
    const queryBranchId = filterBranchId || branchId;
    const baseFilter = this._buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_active: true,
      current_stock: { gt: 0 },
      ...(manufacturer && { medicine: { manufacturer: { equals: manufacturer, mode: "insensitive" } } }),
    };

    const items = await prisma.inventory.findMany({
      where,
      include: {
        medicine: true,
        branch: { select: { branch_name: true } },
      },
      orderBy: { expiry_date: "asc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bucketCounts = {
      expired: 0,
      within_30: 0,
      "31_60": 0,
      "61_90": 0,
      "91_180": 0,
      safe: 0,
    };

    const bucketValueAtRisk = {
      expired: 0,
      within_30: 0,
      "31_60": 0,
      "61_90": 0,
      "91_180": 0,
      safe: 0,
    };

    let mapped = items.map((inv) => {
      const expDate = new Date(inv.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let bucket = "safe";
      if (inv.is_expired || diffDays < 0) {
        bucket = "expired";
      } else if (diffDays <= 30) {
        bucket = "within_30";
      } else if (diffDays <= 60) {
        bucket = "31_60";
      } else if (diffDays <= 90) {
        bucket = "61_90";
      } else if (diffDays <= 180) {
        bucket = "91_180";
      } else {
        bucket = "safe";
      }

      const stockVal = Number(inv.current_stock) * Number(inv.mrp);
      bucketCounts[bucket] += 1;
      bucketValueAtRisk[bucket] += stockVal;

      return {
        inventory_id: inv.inventory_id,
        medicine_name: inv.medicine?.name || "-",
        batch_number: inv.batch_number,
        expiry_date: inv.expiry_date,
        current_stock: Number(inv.current_stock),
        mrp: Number(inv.mrp),
        value_at_risk: stockVal,
        manufacturer: inv.medicine?.manufacturer || "-",
        branch_name: inv.branch?.branch_name || "Main Branch",
        bucket,
        days_remaining: diffDays,
      };
    });

    if (expiryBucket) {
      mapped = mapped.filter((item) => item.bucket === expiryBucket);
    }

    const total = mapped.length;
    const paginated = mapped.slice(Number(offset), Number(offset) + Number(limit));

    return {
      records: paginated,
      total,
      summary: {
        expired_count: bucketCounts.expired,
        expired_value: bucketValueAtRisk.expired,
        urgent_count: bucketCounts.within_30,
        urgent_value: bucketValueAtRisk.within_30,
        total_value_at_risk: Object.values(bucketValueAtRisk).reduce((a, b) => a + b, 0) - bucketValueAtRisk.safe,
      },
      buckets: Object.keys(bucketCounts).reduce((acc, key) => {
        acc[key] = {
          count: bucketCounts[key],
          value: bucketValueAtRisk[key],
        };
        return acc;
      }, {}),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // C3 — MIN STOCK & REORDER REPORT
  // ─────────────────────────────────────────────────────────────────
  async getMinStockReport(shopId, branchId, role, branchMode, filters = {}) {
    const { category, manufacturer, branchId: filterBranchId, limit = 50, offset = 0 } = filters;
    const queryBranchId = filterBranchId || branchId;
    const baseFilter = this._buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_active: true,
      ...(manufacturer && { manufacturer: { equals: manufacturer, mode: "insensitive" } }),
    };

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        inventory: {
          where: { is_active: true },
          select: {
            current_stock: true,
            minimum_stock: true,
          },
        },
      },
    });

    const itemsToReorder = [];

    for (const med of medicines) {
      const totalStock = med.inventory.reduce((sum, inv) => sum + Number(inv.current_stock), 0);
      const minStockLevel = Number(med.min_stock_level || 0);

      if (totalStock < minStockLevel && minStockLevel > 0) {
        const lastPurchaseItem = await prisma.purchaseInvoiceItem.findFirst({
          where: {
            medicine_id: med.medicine_id,
            invoice: { status: "CONFIRMED" },
          },
          include: {
            invoice: {
              include: { supplier: { select: { name: true } } },
            },
          },
          orderBy: { created_at: "desc" },
        });

        itemsToReorder.push({
          medicine_id: med.medicine_id,
          medicine_name: med.name,
          manufacturer: med.manufacturer,
          category: med.category || "Uncategorized",
          minimum_level: minStockLevel,
          reorder_point: Number(med.reorder_point || 0),
          current_stock: totalStock,
          shortage: minStockLevel - totalStock,
          last_purchase_date: lastPurchaseItem?.invoice?.invoice_date || null,
          last_purchase_rate: lastPurchaseItem ? Number(lastPurchaseItem.purchase_rate) : null,
          last_supplier_name: lastPurchaseItem?.invoice?.supplier?.name || "-",
        });
      }
    }

    const total = itemsToReorder.length;
    const paginated = itemsToReorder.slice(Number(offset), Number(offset) + Number(limit));

    return {
      records: paginated,
      total,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // C4 — DEAD STOCK & NON-MOVING REPORT
  // ─────────────────────────────────────────────────────────────────
  async getDeadStockReport(shopId, branchId, role, branchMode, filters = {}) {
    const { daysThreshold = 90, category, branchId: filterBranchId, limit = 50, offset = 0 } = filters;
    const queryBranchId = filterBranchId || branchId;
    const baseFilter = this._buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_active: true,
      current_stock: { gt: 0 },
    };

    if (category) {
      where.medicine = { category: { equals: category, mode: "insensitive" } };
    }

    const inventories = await prisma.inventory.findMany({
      where,
      include: {
        medicine: true,
        branch: { select: { branch_name: true } },
      },
    });

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - Number(daysThreshold));

    const deadStockList = [];

    for (const inv of inventories) {
      const lastSale = await prisma.salesInvoiceItem.findFirst({
        where: {
          inventory_id: inv.inventory_id,
          invoice: { status: "CONFIRMED" },
        },
        include: { invoice: { select: { invoice_date: true } } },
        orderBy: { invoice: { invoice_date: "desc" } },
      });

      const lastMovementDate = lastSale?.invoice?.invoice_date || inv.created_at;
      const daysSinceLastSale = Math.floor(
        (new Date().getTime() - new Date(lastMovementDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastSale >= Number(daysThreshold)) {
        deadStockList.push({
          inventory_id: inv.inventory_id,
          medicine_name: inv.medicine?.name || "-",
          manufacturer: inv.medicine?.manufacturer || "-",
          category: inv.medicine?.category || "Uncategorized",
          current_stock: Number(inv.current_stock),
          stock_value: Number(inv.current_stock) * Number(inv.mrp),
          last_sale_date: lastSale?.invoice?.invoice_date || null,
          days_since_last_sale: daysSinceLastSale,
          branch_name: inv.branch?.branch_name || "Main Branch",
        });
      }
    }

    const total = deadStockList.length;
    const paginated = deadStockList.slice(Number(offset), Number(offset) + Number(limit));

    return {
      records: paginated,
      total,
      summary: {
        total_dead_items: total,
        total_locked_capital: deadStockList.reduce((sum, item) => sum + item.stock_value, 0),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // C5 — STOCK ADJUSTMENT AUDIT LOG
  // ─────────────────────────────────────────────────────────────────
  async getStockAdjustments(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate, reasonType, staffId, branchId: filterBranchId, limit = 50, offset = 0 } = filters;
    const queryBranchId = filterBranchId || branchId;
    const baseFilter = this._buildBranchFilter(shopId, queryBranchId, role, branchMode);

    const where = {
      ...baseFilter,
      ...(reasonType && { reason: reasonType }),
      ...(staffId && { created_by: staffId }),
      ...(startDate &&
        endDate && {
          adjustment_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        include: {
          medicine: { select: { name: true, manufacturer: true } },
          creator: { select: { full_name: true } },
          approver: { select: { full_name: true } },
          branch: { select: { branch_name: true } },
        },
        orderBy: { adjustment_date: "desc" },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    return {
      records: adjustments.map((adj) => ({
        adjustment_id: adj.adjustment_id,
        adjustment_date: adj.adjustment_date,
        medicine_name: adj.medicine?.name || "-",
        batch_number: adj.batch_number,
        old_quantity: Number(adj.old_quantity),
        new_quantity: Number(adj.new_quantity),
        variance: Number(adj.variance),
        reason: adj.reason,
        reason_notes: adj.reason_notes || "-",
        adjusted_by: adj.creator?.full_name || "-",
        approved_by: adj.approver?.full_name || "System Auto-Approved",
        branch_name: adj.branch?.branch_name || "Main Branch",
      })),
      total,
    };
  }
}

export default new InventoryReportService();