// backend/src/modules/inventory/inventory.service.js (do not remove this comment)
// backend/src/modules/inventory/inventory.service.js

import prisma from "../../config/prisma.js";
import { notify } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";

/* =====================================================
   Custom Error
===================================================== */
class ApiError extends Error {
  constructor(message, statusCode = 400, code = "INVENTORY_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/* =====================================================
   HELPER: Build Branch Filter
===================================================== */
function buildBranchFilter(shopId, branchId, role, branchMode) {
  const filter = { shop_id: shopId };

  if (role === "super_admin" && branchMode === "GLOBAL") {
    return filter;
  }

  if (branchId) {
    filter.branch_id = branchId;
  }

  return filter;
}

/* =====================================================
   INVENTORY SERVICE
===================================================== */
class InventoryService {
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

  _calculateStockStatus(
    currentStock,
    inventoryMinStock,
    medicineStockLevels,
    isExpired,
    expiryDate,
  ) {
    const stock = this._toNumber(currentStock) ?? 0;
    const minStockFromMedicine = this._toNumber(
      medicineStockLevels?.min_stock_level,
    );
    const minStockFromInventory = this._toNumber(inventoryMinStock);
    const effectiveMinStock = minStockFromInventory ?? minStockFromMedicine;

    // ── PRIORITY 1: AVAILABILITY (OUT OF STOCK) ──
    // If quantity is 0, it is Out of Stock. Expiry alerts on empty batches
    // are irrelevant and create false positives for inventory audits.
    if (stock === 0) return "Out of Stock";

    // ── PRIORITY 2: COMPLIANCE & LEGAL (EXPIRED) ──
    // If we have physical stock, but it is expired, we must flag it immediately
    // to block dispensing systems and prevent illegal sales.
    if (isExpired === true) return "Expired";

    if (expiryDate) {
      const expDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil(
        (expDate - today) / (1000 * 60 * 60 * 24),
      );
      if (daysUntilExpiry < 0) return "Expired";

      // ── PRIORITY 3: LIQUIDATION ALERT (EXPIRING SOON) ──
      // If we have stock expiring within 30 days, flag it for near-term removal.
      if (daysUntilExpiry <= 30) return "Expiring Soon";
    }

    // ── PRIORITY 4: REPLENISHMENT ALERT (LOW STOCK) ──
    // The item is safe to sell, but quantity is below the safety threshold.
    if (effectiveMinStock !== null && stock < effectiveMinStock) {
      return "Low Stock";
    }

    // ── PRIORITY 5: HEALTHY (IN STOCK) ──
    return "In Stock";
  }

  _parseExpiryDate(dateInput) {
    if (!dateInput) return null;

    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    const str = String(dateInput).trim();

    if (/^\d{1,2}\/\d{4}$/.test(str)) {
      const [month, year] = str.split("/");
      const date = new Date(parseInt(year), parseInt(month), 0);
      return isNaN(date.getTime()) ? null : date;
    }

    if (/^\d{1,2}\/\d{2}$/.test(str)) {
      const [month, year] = str.split("/");
      const fullYear = parseInt(year) + 2000;
      const date = new Date(fullYear, parseInt(month), 0);
      return isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  }

  async getOrCreateInventory(
    shopId,
    branchId,
    medicineId,
    batchNumber,
    expiryDate,
    mrp,
  ) {
    let inventory = await prisma.inventory.findFirst({
      where: {
        shop_id: shopId,
        branch_id: branchId,
        medicine_id: medicineId,
        batch_number: batchNumber,
      },
    });

    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicineId,
          batch_number: batchNumber,
          expiry_date: new Date(expiryDate),
          mrp,
          current_stock: 0,
          available_stock: 0,
        },
      });
    }

    return inventory;
  }

  async checkAndSendStockAlerts(inventory, medicine, branch) {
    const currentStock = Number(inventory.current_stock);
    const minimumStock = Number(inventory.minimum_stock || 0);

    setImmediate(() => {
      if (currentStock === 0 && inventory.minimum_stock !== null) {
        notify({
          type: NOTIFICATION_EVENTS.OUT_OF_STOCK_ALERT,
          context: {
            shop_id: inventory.shop_id,
            branch_id: inventory.branch_id,
            inventory_id: inventory.inventory_id,
            medicine_name: medicine.name,
            batch_number: inventory.batch_number,
            branch_name: branch?.branch_name || null,
          },
        }).catch((err) =>
          console.error("[Notification] OUT_OF_STOCK_ALERT failed:", err),
        );
      } else if (
        currentStock > 0 &&
        inventory.minimum_stock !== null &&
        currentStock <= minimumStock
      ) {
        notify({
          type: NOTIFICATION_EVENTS.LOW_STOCK_ALERT,
          context: {
            shop_id: inventory.shop_id,
            branch_id: inventory.branch_id,
            inventory_id: inventory.inventory_id,
            medicine_name: medicine.name,
            batch_number: inventory.batch_number,
            current_stock: currentStock,
            minimum_stock: minimumStock,
            branch_name: branch?.branch_name || null,
          },
        }).catch((err) =>
          console.error("[Notification] LOW_STOCK_ALERT failed:", err),
        );
      }
    });
  }

  async updateStock(data, userId, tx = null) {
    const {
      inventoryId,
      shopId,
      branchId,
      medicineId,
      batchNumber,
      movementType,
      quantityIn = 0,
      quantityOut = 0,
      rate,
      referenceType,
      referenceId,
      referenceNumber,
      transactionDate,
      remarks,
    } = data;

    const executeUpdate = async (transaction) => {
      const inventory = await transaction.inventory.findUnique({
        where: { inventory_id: inventoryId },
        include: {
          medicine: {
            select: {
              name: true,
              min_stock_level: true,
              max_stock_level: true,
              reorder_point: true,
            },
          },
          branch: {
            select: { branch_name: true },
          },
        },
      });

      if (!inventory) {
        throw new ApiError("Inventory not found", 404, "NOT_FOUND");
      }

      const qtyIn = Number(quantityIn);
      const qtyOut = Number(quantityOut);
      const netQty = qtyIn - qtyOut;
      const newStock = Number(inventory.current_stock) + netQty;

      if (newStock < 0) {
        throw new ApiError(
          `Insufficient stock for ${inventory.medicine.name} (Batch: ${batchNumber}). ` +
            `Current: ${inventory.current_stock}, Attempting to deduct: ${qtyOut}, Net change: ${netQty}`,
          400,
          "INSUFFICIENT_STOCK",
        );
      }

      const updatedInventory = await transaction.inventory.update({
        where: { inventory_id: inventoryId },
        data: {
          current_stock: newStock,
          available_stock: newStock - Number(inventory.reserved_stock || 0),
        },
      });

      const validReferenceId =
        referenceType === "PURCHASE_INVOICE" ? referenceId : null;

      const ledgerEntry = await transaction.stockLedger.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicineId,
          inventory_id: inventoryId,
          movement_type: movementType,
          reference_type: referenceType,
          reference_id: validReferenceId,
          reference_number: referenceNumber,
          batch_number: batchNumber,
          expiry_date: inventory.expiry_date,
          quantity_in: qtyIn,
          quantity_out: qtyOut,
          quantity_net: netQty,
          balance_after: newStock,
          rate: rate || null,
          amount: rate ? Number(netQty) * Number(rate) : null,
          transaction_date: transactionDate
            ? new Date(transactionDate)
            : new Date(),
          created_by: userId,
          remarks,
        },
      });

      this.checkAndSendStockAlerts(
        { ...updatedInventory, inventory_id: inventoryId },
        inventory.medicine,
        inventory.branch,
      );

      const status = this._calculateStockStatus(
        newStock,
        inventory.minimum_stock,
        {
          min_stock_level: inventory.medicine?.min_stock_level,
          max_stock_level: inventory.medicine?.max_stock_level,
          reorder_point: inventory.medicine?.reorder_point,
        },
        inventory.is_expired,
        inventory.expiry_date,
      );

      return {
        inventory: { ...updatedInventory, status },
        ledgerEntry,
      };
    };

    if (tx) {
      return executeUpdate(tx);
    } else {
      return prisma.$transaction(executeUpdate);
    }
  }

  /* ============================================
     GET INVENTORY — Dynamic Server-Side Filter & Sort
  ============================================ */
  async getInventory(shopId, branchId, role, branchMode, filters = {}) {
    const {
      medicineId,
      search,
      includeExpired = false,
      lowStock = false,
      expiredOnly = false,
      status = null,
      expiry = null,
      supplier = null,
      category = null,
      catalogStatus = null,
      branchId: filterBranchId = null,
      limit = 100,
      offset = 0,
      sortBy = null,
      sortOrder = "asc",
    } = filters;

    const queryBranchId = filterBranchId || branchId;
    const baseFilter = buildBranchFilter(
      shopId,
      queryBranchId,
      role,
      branchMode,
    );

    const where = {
      ...baseFilter,
      ...(medicineId && { medicine_id: medicineId }),
      is_active: true,
    };

    // ── Load full set to execute precise, compliant, global sorting and filtering ──
    const rawInventories = await prisma.inventory.findMany({
      where,
      include: {
        medicine: {
          select: {
            medicine_id: true,
            name: true,
            manufacturer: true,
            pack_size: true,
            hsn_code: true,
            category: true,
            sub_category: true,
            schedule: true,
            branch_id: true,
            rack_no: true,
            min_stock_level: true,
            max_stock_level: true,
            reorder_point: true,
            master_medicine_id: true,
            link_status: true,
            resubmission_count: true,   
            last_resubmitted_at: true,   
            masterMedicine: {
              select: {
                primary_category: true,
              },
            },
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        stockMovements: {
          where: {
            movement_type: "PURCHASE",
            reference_type: "PURCHASE_INVOICE",
          },
          take: 1,
          orderBy: {
            transaction_date: "desc",
          },
          select: {
            reference_id: true,
          },
        },
      },
    });

    const purchaseInvoiceIds = rawInventories
      .flatMap((inv) => inv.stockMovements.map((sm) => sm.reference_id))
      .filter(Boolean);

    const purchaseInvoices =
      purchaseInvoiceIds.length > 0
        ? await prisma.purchaseInvoice.findMany({
            where: {
              invoice_id: { in: purchaseInvoiceIds },
            },
            select: {
              invoice_id: true,
              supplier: {
                select: {
                  name: true,
                },
              },
            },
          })
        : [];

    const supplierMap = new Map(
      purchaseInvoices.map((inv) => [inv.invoice_id, inv.supplier?.name]),
    );

        let inventories = rawInventories.map((inv) => {
      const firstMovementId = inv.stockMovements?.[0]?.reference_id;
      const supplierName = firstMovementId
        ? supplierMap.get(firstMovementId)
        : null;

      const { stockMovements, ...rest } = inv;

      const computedStatus = this._calculateStockStatus(
        rest.current_stock,
        rest.minimum_stock,
        {
          min_stock_level: rest.medicine?.min_stock_level,
          max_stock_level: rest.medicine?.max_stock_level,
          reorder_point: rest.medicine?.reorder_point,
        },
        rest.is_expired,
        rest.expiry_date,
      );

      const resolvedCategory =
        rest.medicine?.category ||
        rest.medicine?.masterMedicine?.primary_category ||
        null;

      return {
        ...rest,
        medicine: inv.medicine, // ── EXPLICITLY PRESERVE THE RELATION PROPERTY ──
        supplier_name: supplierName || null,
        status: computedStatus,
        medicine_name: rest.medicine?.name,
        medicine_manufacturer: rest.medicine?.manufacturer,
        medicine_category: resolvedCategory,
        medicine_sub_category: rest.medicine?.sub_category,
        medicine_hsn_code: rest.medicine?.hsn_code,
        medicine_pack_size: rest.medicine?.pack_size,
        medicine_schedule: rest.medicine?.schedule,
        medicine_rack_no: rest.medicine?.rack_no,
        medicine_min_stock: rest.medicine?.min_stock_level,
        medicine_max_stock: rest.medicine?.max_stock_level,
        medicine_reorder_point: rest.medicine?.reorder_point,
        resubmission_count: rest.medicine?.resubmission_count || 0, 
        last_resubmitted_at: rest.medicine?.last_resubmitted_at || null, 
      };
    });

    // ── Apply JS Filtering ──
    if (search) {
      const s = search.toLowerCase();
      inventories = inventories.filter(
        (inv) =>
          inv.medicine_name?.toLowerCase().includes(s) ||
          inv.medicine_manufacturer?.toLowerCase().includes(s) ||
          inv.medicine_category?.toLowerCase().includes(s) ||
          inv.batch_number?.toLowerCase().includes(s) ||
          inv.supplier_name?.toLowerCase().includes(s),
      );
    }

    if (status) {
      inventories = inventories.filter(
        (inv) => inv.status.toLowerCase() === status.toLowerCase(),
      );
    }

    if (expiry) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      inventories = inventories.filter((inv) => {
        const expDate = inv.expiry_date ? new Date(inv.expiry_date) : null;
        if (!expDate) return expiry !== "expired";
        expDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

        if (expiry === "expired") {
          return inv.is_expired === true || diffDays < 0;
        }
        if (expiry === "30days") {
          return diffDays >= 0 && diffDays <= 30;
        }
        if (expiry === "90days") {
          return diffDays >= 0 && diffDays <= 90;
        }
        if (expiry === "valid") {
          return !inv.is_expired && diffDays > 90;
        }
        return true;
      });
    }

    if (expiredOnly) {
      inventories = inventories.filter((inv) => inv.status === "Expired");
    }

    if (!includeExpired && !expiredOnly && !expiry && !status) {
      inventories = inventories.filter((inv) => inv.status !== "Expired");
    }

    if (lowStock) {
      inventories = inventories.filter(
        (inv) => inv.status === "Low Stock" || inv.status === "Out of Stock",
      );
    }

    if (category) {
      inventories = inventories.filter(
        (inv) =>
          inv.medicine_category?.toLowerCase() === category.toLowerCase(),
      );
    }

    if (supplier) {
      inventories = inventories.filter(
        (inv) => inv.supplier_name?.toLowerCase() === supplier.toLowerCase(),
      );
    }

    // ── ADD THIS NEW BLOCK FOR CATALOG STATUS FILTERING ──
    if (catalogStatus) {
      const targetStatus = catalogStatus.toLowerCase(); // "linked", "pending", "not_linked"
      inventories = inventories.filter((inv) => {
        const itemStatus = inv.medicine?.master_medicine_id
          ? "linked"
          : (inv.medicine?.link_status === "PENDING" || inv.medicine?.link_status === "SUGGESTED" || inv.medicine?.link_status === "SUGGESTED_MATCH")
            ? "pending"
            : "not_linked";
        return itemStatus === targetStatus;
      });
    }

    if (filterBranchId) {
      inventories = inventories.filter(
        (inv) => inv.branch_id === filterBranchId,
      );
    }

    // ── Apply JS Global Sorting ──
    const dir = sortOrder === "desc" ? -1 : 1;

    if (sortBy === "status") {
      const statusOrder = [
        "Out of Stock",
        "Low Stock",
        "Expiring Soon",
        "Expired",
        "In Stock",
      ];
      inventories.sort((a, b) => {
        const aIdx = statusOrder.indexOf(a.status);
        const bIdx = statusOrder.indexOf(b.status);
        return (aIdx - bIdx) * dir;
      });
    } else if (sortBy === "supplier") {
      inventories.sort((a, b) => {
        const aVal = (a.supplier_name || "").toLowerCase();
        const bVal = (b.supplier_name || "").toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      });
    } else if (sortBy === "name") {
      inventories.sort((a, b) => {
        const aVal = (a.medicine_name || "").toLowerCase();
        const bVal = (b.medicine_name || "").toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      });
    } else if (sortBy === "category") {
      inventories.sort((a, b) => {
        const aVal = (a.medicine_category || "").toLowerCase();
        const bVal = (b.medicine_category || "").toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      });
    } else if (sortBy === "manufacturer") {
      inventories.sort((a, b) => {
        const aVal = (a.medicine_manufacturer || "").toLowerCase();
        const bVal = (b.medicine_manufacturer || "").toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      });
    } else if (sortBy === "branch") {
      inventories.sort((a, b) => {
        const aVal = (a.branch?.branch_name || "").toLowerCase();
        const bVal = (b.branch?.branch_name || "").toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      });
    } else if (sortBy === "batch") {
      inventories.sort((a, b) => {
        const aVal = (a.batch_number || "").toLowerCase();
        const bVal = (b.batch_number || "").toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      });
    } else if (sortBy === "expiry") {
      inventories.sort((a, b) => {
        const aVal = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
        const bVal = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
        return (aVal - bVal) * dir;
      });
    } else if (sortBy === "qty") {
      inventories.sort((a, b) => {
        const aVal = Number(a.current_stock || 0);
        const bVal = Number(b.current_stock || 0);
        return (aVal - bVal) * dir;
      });
    } else if (sortBy === "mrp") {
      inventories.sort((a, b) => {
        const aVal = Number(a.mrp || 0);
        const bVal = Number(b.mrp || 0);
        return (aVal - bVal) * dir;
      });
    } else if (sortBy === "rack") {
      inventories.sort((a, b) => {
        const aVal = (a.rack_no || "").toLowerCase();
        const bVal = (b.rack_no || "").toLowerCase();
        return aVal.localeCompare(bVal) * dir;
      });
    } else {
      // Default Sort: Expiry Ascending, then Batch Ascending
      inventories.sort((a, b) => {
        const aExp = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
        const bExp = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
        if (aExp !== bExp) return aExp - bExp;
        return (a.batch_number || "").localeCompare(b.batch_number || "");
      });
    }

    const total = inventories.length;
    const paginatedItems = inventories.slice(offset, offset + limit);

    return { inventories: paginatedItems, total };
  }

  /* ============================================
     GET DYNAMIC FILTER METADATA (FACETS)
  ============================================ */
  async getInventoryFacets(shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const medicinesWithCategories = await prisma.medicine.findMany({
      where: {
        shop_id: shopId,
        ...(baseFilter.branch_id && { branch_id: baseFilter.branch_id }),
        is_active: true,
        category: { not: null },
      },
      distinct: ["category"],
      select: { category: true },
    });

    const categories = medicinesWithCategories
      .map((m) => m.category)
      .filter(Boolean);

    const branches = await prisma.branch.findMany({
      where: { shop_id: shopId, is_active: true },
      select: { branch_id: true, branch_name: true },
    });

    return { categories, branches };
  }

  async getInventoryByMedicine(
    shopId,
    medicineId,
    branchId,
    role,
    branchMode,
    filters = {},
  ) {
    const { includeExpired = false } = filters;
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const inventories = await prisma.inventory.findMany({
      where: {
        ...baseFilter,
        medicine_id: medicineId,
        is_active: true,
        ...(!includeExpired && { is_expired: false }),
      },
      include: {
        medicine: {
          select: {
            name: true,
            manufacturer: true,
            pack_size: true,
            min_stock_level: true,
            max_stock_level: true,
            reorder_point: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
      },
      orderBy: [{ expiry_date: "asc" }, { batch_number: "asc" }],
    });

    return inventories.map((inv) => ({
      ...inv,
      status: this._calculateStockStatus(
        inv.current_stock,
        inv.minimum_stock,
        {
          min_stock_level: inv.medicine?.min_stock_level,
          max_stock_level: inv.medicine?.max_stock_level,
          reorder_point: inv.medicine?.reorder_point,
        },
        inv.is_expired,
        inv.expiry_date,
      ),
    }));
  }

  async getLowStockItems(shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const inventories = await prisma.inventory.findMany({
      where: {
        ...baseFilter,
        is_active: true,
        is_expired: false,
      },
      include: {
        medicine: {
          select: {
            name: true,
            manufacturer: true,
            min_stock_level: true,
            max_stock_level: true,
            reorder_point: true,
          },
        },
        branch: {
          select: { branch_id: true, branch_name: true },
        },
      },
    });

    return inventories
      .map((inv) => ({
        ...inv,
        status: this._calculateStockStatus(
          inv.current_stock,
          inv.minimum_stock,
          {
            min_stock_level: inv.medicine?.min_stock_level,
            max_stock_level: inv.medicine?.max_stock_level,
            reorder_point: inv.medicine?.reorder_point,
          },
          inv.is_expired,
          inv.expiry_date,
        ),
      }))
      .filter(
        (inv) => inv.status === "Low Stock" || inv.status === "Out of Stock",
      );
  }

  async getExpiringSoonItems(
    shopId,
    daysAhead = 90,
    branchId,
    role,
    branchMode,
  ) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const inventories = await prisma.inventory.findMany({
      where: {
        ...baseFilter,
        is_active: true,
        is_expired: false,
        expiry_date: {
          gte: new Date(),
          lte: futureDate,
        },
        current_stock: { gt: 0 },
      },
      include: {
        medicine: {
          select: {
            name: true,
            manufacturer: true,
            min_stock_level: true,
            max_stock_level: true,
            reorder_point: true,
          },
        },
        branch: {
          select: { branch_id: true, branch_name: true },
        },
      },
      orderBy: { expiry_date: "asc" },
    });

    return inventories.map((inv) => ({
      ...inv,
      status: this._calculateStockStatus(
        inv.current_stock,
        inv.minimum_stock,
        {
          min_stock_level: inv.medicine?.min_stock_level,
          max_stock_level: inv.medicine?.max_stock_level,
          reorder_point: inv.medicine?.reorder_point,
        },
        inv.is_expired,
        inv.expiry_date,
      ),
    }));
  }

  async getStockLedger(shopId, branchId, role, branchMode, filters = {}) {
    const {
      medicineId,
      batchNumber,
      movementType,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      ...(medicineId && { medicine_id: medicineId }),
      ...(batchNumber && { batch_number: batchNumber }),
      ...(movementType && { movement_type: movementType }),
      ...(startDate &&
        endDate && {
          transaction_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [ledgers, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        include: {
          medicine: {
            select: { name: true, manufacturer: true },
          },
          branch: {
            select: { branch_id: true, branch_name: true },
          },
          creator: {
            select: { full_name: true },
          },
        },
        orderBy: { transaction_date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.stockLedger.count({ where }),
    ]);

    return { ledgers, total };
  }

  async createStockAdjustment(data, userId) {
    const {
      shopId,
      branchId,
      medicineId,
      inventoryId,
      batchNumber,
      newQuantity,
      reason,
      reasonNotes,
      adjustmentDate,
    } = data;

    if (!branchId) {
      throw new ApiError(
        "Branch selection is required for stock adjustments",
        400,
        "BRANCH_REQUIRED",
      );
    }

    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId },
        include: {
          medicine: {
            select: { name: true },
          },
          branch: {
            select: { branch_name: true },
          },
        },
      });

      if (!inventory) {
        throw new ApiError("Inventory not found", 404, "NOT_FOUND");
      }

      if (inventory.branch_id !== branchId) {
        throw new ApiError(
          "This inventory item belongs to a different branch",
          403,
          "BRANCH_MISMATCH",
        );
      }

      const oldQty = Number(inventory.current_stock);
      const newQty = Number(newQuantity);
      const variance = newQty - oldQty;

      const adjustment = await tx.stockAdjustment.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicineId,
          inventory_id: inventoryId,
          batch_number: batchNumber,
          reason,
          reason_notes: reasonNotes,
          old_quantity: oldQty,
          new_quantity: newQty,
          variance,
          adjustment_date: adjustmentDate
            ? new Date(adjustmentDate)
            : new Date(),
          created_by: userId,
        },
      });

      if (variance !== 0) {
        await this.updateStock(
          {
            inventoryId,
            shopId,
            branchId,
            medicineId,
            batchNumber,
            movementType: "STOCK_ADJUSTMENT",
            quantityIn: variance > 0 ? variance : 0,
            quantityOut: variance < 0 ? Math.abs(variance) : 0,
            referenceType: "STOCK_ADJUSTMENT",
            referenceId: adjustment.adjustment_id,
            referenceNumber: `ADJ-${adjustment.adjustment_id.slice(-8)}`,
            transactionDate: adjustmentDate,
            remarks: `${reason}${reasonNotes ? ` - ${reasonNotes}` : ""}`,
          },
          userId,
          tx,
        );
      }

      return adjustment;
    });
  }

  async getStockSummary(shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const baseWhere = {
      ...baseFilter,
      is_active: true,
    };

    const allInventories = await prisma.inventory.findMany({
      where: baseWhere,
      include: {
        medicine: {
          select: {
            min_stock_level: true,
            max_stock_level: true,
            reorder_point: true,
          },
        },
      },
    });

    const inventoriesWithStatus = allInventories.map((inv) => ({
      ...inv,
      status: this._calculateStockStatus(
        inv.current_stock,
        inv.minimum_stock,
        {
          min_stock_level: inv.medicine?.min_stock_level,
          max_stock_level: inv.medicine?.max_stock_level,
          reorder_point: inv.medicine?.reorder_point,
        },
        inv.is_expired,
        inv.expiry_date,
      ),
    }));

    const totalItems = inventoriesWithStatus.filter(
      (inv) => Number(inv.current_stock) > 0,
    ).length;
    const totalQty = inventoriesWithStatus.reduce(
      (sum, inv) => sum + Number(inv.current_stock || 0),
      0,
    );
    const lowStock = inventoriesWithStatus.filter(
      (inv) => inv.status === "Low Stock",
    ).length;
    const outOfStock = inventoriesWithStatus.filter(
      (inv) => inv.status === "Out of Stock",
    ).length;
    const expiringSoon = inventoriesWithStatus.filter(
      (inv) => inv.status === "Expiring Soon",
    ).length;
    const expired = inventoriesWithStatus.filter(
      (inv) => inv.status === "Expired",
    ).length;

    return {
      totalItems,
      totalStockQuantity: totalQty,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      expiringSoonCount: expiringSoon,
      expiredCount: expired,
    };
  }

  async markExpiredItems(shopId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiringItems = await prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        expiry_date: { lt: today },
        is_expired: false,
        current_stock: { gt: 0 },
      },
      include: {
        medicine: {
          select: { name: true },
        },
        branch: {
          select: { branch_name: true },
        },
      },
    });

    const updateResult = await prisma.inventory.updateMany({
      where: {
        shop_id: shopId,
        expiry_date: { lt: today },
        is_expired: false,
      },
      data: { is_expired: true },
    });

    expiringItems.forEach((item) => {
      notify({
        type: NOTIFICATION_EVENTS.EXPIRED_STOCK_ALERT,
        context: {
          shop_id: item.shop_id,
          branch_id: item.branch_id,
          inventory_id: item.inventory_id,
          medicine_name: item.medicine.name,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date.toISOString().split("T")[0],
          current_stock: Number(item.current_stock),
          branch_name: item.branch?.branch_name || null,
        },
      }).catch((err) =>
        console.error("[Notification] EXPIRED_STOCK_ALERT failed:", err),
      );
    });

    return updateResult;
  }

  async sendNearExpiryAlerts(shopId, daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringItems = await prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
        is_expired: false,
        expiry_date: {
          gte: new Date(),
          lte: futureDate,
        },
        current_stock: { gt: 0 },
      },
      include: {
        medicine: {
          select: { name: true },
        },
        branch: {
          select: { branch_name: true },
        },
      },
    });

    expiringItems.forEach((item) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24),
      );

      notify({
        type: NOTIFICATION_EVENTS.NEAR_EXPIRY_ALERT,
        context: {
          shop_id: item.shop_id,
          branch_id: item.branch_id,
          inventory_id: item.inventory_id,
          medicine_name: item.medicine.name,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date.toISOString().split("T")[0],
          days_until_expiry: daysUntilExpiry,
          current_stock: Number(item.current_stock),
          branch_name: item.branch?.branch_name || null,
        },
      }).catch((err) =>
        console.error("[Notification] NEAR_EXPIRY_ALERT failed:", err),
      );
    });

    return { sent: expiringItems.length };
  }

  async updateInventory(inventoryId, shopId, branchId, data, userId) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId },
        include: {
          medicine: true,
          branch: {
            select: { branch_id: true, branch_name: true },
          },
        },
      });

      if (!inventory) {
        throw new ApiError("Inventory item not found", 404, "NOT_FOUND");
      }

      if (inventory.shop_id !== shopId) {
        throw new ApiError(
          "Inventory item does not belong to your shop",
          403,
          "FORBIDDEN",
        );
      }

      if (inventory.branch_id !== branchId) {
        throw new ApiError(
          "This inventory item belongs to a different branch",
          403,
          "BRANCH_MISMATCH",
        );
      }

      const medicineUpdateData = {};

      if (data.name !== undefined && data.name && data.name.trim()) {
        medicineUpdateData.name = data.name.trim();
      }
      if (
        data.manufacturer !== undefined &&
        data.manufacturer &&
        data.manufacturer.trim()
      ) {
        medicineUpdateData.manufacturer = data.manufacturer.trim();
      }
      if (data.category !== undefined) {
        medicineUpdateData.category = data.category?.trim() || null;
      }
      if (data.hsn_code !== undefined) {
        medicineUpdateData.hsn_code = data.hsn_code?.trim() || null;
      }
      if (data.min_stock_level !== undefined) {
        medicineUpdateData.min_stock_level = this._toNumber(
          data.min_stock_level,
        );
      }
      if (data.max_stock_level !== undefined) {
        medicineUpdateData.max_stock_level = this._toNumber(
          data.max_stock_level,
        );
      }
      if (data.reorder_point !== undefined) {
        medicineUpdateData.reorder_point = this._toNumber(data.reorder_point);
      }
      if (data.rack_no !== undefined) {
        medicineUpdateData.rack_no = data.rack_no?.trim() || null;
      }

      let updatedMedicine = inventory.medicine;
      if (Object.keys(medicineUpdateData).length > 0) {
        if (medicineUpdateData.name || medicineUpdateData.manufacturer) {
          const newName = medicineUpdateData.name || inventory.medicine.name;
          const newMfac =
            medicineUpdateData.manufacturer || inventory.medicine.manufacturer;

          const duplicate = await tx.medicine.findFirst({
            where: {
              shop_id: shopId,
              branch_id: branchId,
              name: newName,
              manufacturer: newMfac,
              medicine_id: { not: inventory.medicine_id },
            },
          });

          if (duplicate) {
            throw new ApiError(
              `Medicine "${newName}" by ${newMfac} already exists`,
              409,
              "DUPLICATE_MEDICINE",
            );
          }
        }

        updatedMedicine = await tx.medicine.update({
          where: { medicine_id: inventory.medicine_id },
          data: medicineUpdateData,
        });
      }

      const inventoryUpdateData = {};

      if (
        data.batch_number !== undefined &&
        data.batch_number &&
        data.batch_number.trim()
      ) {
        const existingBatch = await tx.inventory.findFirst({
          where: {
            shop_id: shopId,
            branch_id: branchId,
            medicine_id: inventory.medicine_id,
            batch_number: data.batch_number.trim(),
            inventory_id: { not: inventoryId },
          },
        });

        if (existingBatch) {
          throw new ApiError(
            `Batch "${data.batch_number}" already exists for this medicine`,
            409,
            "DUPLICATE_BATCH",
          );
        }
        inventoryUpdateData.batch_number = data.batch_number.trim();
      }

      if (data.expiry_date !== undefined) {
        if (data.expiry_date) {
          const parsedDate = this._parseExpiryDate(data.expiry_date);
          if (parsedDate) {
            inventoryUpdateData.expiry_date = parsedDate;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            inventoryUpdateData.is_expired = parsedDate < today;
          }
        }
      }

      if (data.mrp !== undefined) {
        inventoryUpdateData.mrp = this._toNumber(data.mrp) || 0;
      }
      if (data.selling_rate !== undefined) {
        inventoryUpdateData.selling_rate = this._toNumber(data.selling_rate);
      }
      if (data.last_purchase_rate !== undefined) {
        inventoryUpdateData.last_purchase_rate = this._toNumber(
          data.last_purchase_rate,
        );
      }
      if (data.rack_no !== undefined) {
        inventoryUpdateData.rack_no = data.rack_no?.trim() || null;
      }
      if (data.minimum_stock !== undefined) {
        inventoryUpdateData.minimum_stock = this._toNumber(data.minimum_stock);
      }

      if (Object.keys(inventoryUpdateData).length > 0) {
        await tx.inventory.update({
          where: { inventory_id: inventoryId },
          data: inventoryUpdateData,
        });
      }

      const finalInventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId },
        include: {
          medicine: {
            select: {
              medicine_id: true,
              name: true,
              manufacturer: true,
              category: true,
              hsn_code: true,
              pack_size: true,
              min_stock_level: true,
              max_stock_level: true,
              reorder_point: true,
              rack_no: true,
               resubmission_count: true,
            },
          },
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
            },
          },
        },
      });

      const status = this._calculateStockStatus(
        finalInventory.current_stock,
        finalInventory.minimum_stock,
        {
          min_stock_level: finalInventory.medicine?.min_stock_level,
          max_stock_level: finalInventory.medicine?.max_stock_level,
          reorder_point: finalInventory.medicine?.reorder_point,
        },
        finalInventory.is_expired,
        finalInventory.expiry_date,
      );

      return {
        inventory_id: finalInventory.inventory_id,
        medicine_id: finalInventory.medicine_id,
        shop_id: finalInventory.shop_id,
        branch_id: finalInventory.branch_id,
        batch_number: finalInventory.batch_number,
        expiry_date: finalInventory.expiry_date,
        current_stock: finalInventory.current_stock,
        available_stock: finalInventory.available_stock,
        minimum_stock: finalInventory.minimum_stock,
        mrp: finalInventory.mrp,
        selling_rate: finalInventory.selling_rate,
        last_purchase_rate: finalInventory.last_purchase_rate,
        rack_no: finalInventory.rack_no,
        status,
        is_expired: finalInventory.is_expired,
        is_active: finalInventory.is_active,
        medicine: finalInventory.medicine,
        medicine_name: finalInventory.medicine?.name,
        medicine_manufacturer: finalInventory.medicine?.manufacturer,
        medicine_category: finalInventory.medicine?.category,
        medicine_hsn_code: finalInventory.medicine?.hsn_code,
        medicine_min_stock: finalInventory.medicine?.min_stock_level,
        medicine_max_stock: finalInventory.medicine?.max_stock_level,
        medicine_reorder_point: finalInventory.medicine?.reorder_point,
        medicine_rack_no: finalInventory.medicine?.rack_no,
        resubmission_count: finalInventory.medicine?.resubmission_count || 0,
        branch: finalInventory.branch,
        branch_name: finalInventory.branch?.branch_name,
        updated_at: finalInventory.updated_at,
      };
    });
  }

  async deleteInventory(inventoryId, shopId, branchId, userId) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId },
        include: {
          medicine: {
            select: { name: true },
          },
        },
      });

      if (!inventory) {
        throw new ApiError("Inventory item not found", 404, "NOT_FOUND");
      }

      if (inventory.shop_id !== shopId) {
        throw new ApiError(
          "Inventory item does not belong to your shop",
          403,
          "FORBIDDEN",
        );
      }

      if (inventory.branch_id !== branchId) {
        throw new ApiError(
          "This inventory item belongs to a different branch",
          403,
          "BRANCH_MISMATCH",
        );
      }

      if (Number(inventory.current_stock) > 0) {
        throw new ApiError(
          `Cannot delete inventory with existing stock (${inventory.current_stock} units). ` +
            `Please use stock adjustment to reduce to zero first.`,
          400,
          "STOCK_EXISTS",
        );
      }

      await tx.inventory.update({
        where: { inventory_id: inventoryId },
        data: { is_active: false },
      });

      return {
        inventory_id: inventoryId,
        medicine_name: inventory.medicine?.name,
        deleted_at: new Date(),
      };
    });
  }

  async exportInventory(shopId, branchId, role, branchMode) {
    const XLSX = await import("xlsx");

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const inventories = await prisma.inventory.findMany({
      where: {
        ...baseFilter,
        is_active: true,
      },
      include: {
        medicine: {
          select: {
            name: true,
            manufacturer: true,
            pack_size: true,
            hsn_code: true,
            category: true,
            rack_no: true,
          },
        },
        branch: {
          select: { branch_name: true },
        },
      },
      orderBy: [{ expiry_date: "asc" }, { batch_number: "asc" }],
    });

    const rows = inventories.map((inv) => ({
      "Product Name": inv.medicine?.name || "",
      Manufacturer: inv.medicine?.manufacturer || "",
      Batch: inv.batch_number || "",
      Expiry: inv.expiry_date
        ? new Date(inv.expiry_date).toLocaleDateString("en-IN")
        : "",
      "Pack Size": inv.medicine?.pack_size || "",
      Quantity: Number(inv.current_stock || 0),
      MRP: Number(inv.mrp || 0),
      "Purchase Rate": Number(inv.last_purchase_rate || 0),
      "Selling Rate": Number(inv.selling_rate || 0),
      "HSN Code": inv.medicine?.hsn_code || "",
      Category: inv.medicine?.category || "",
      Rack: inv.rack_no || inv.medicine?.rack_no || "",
      Branch: inv.branch?.branch_name || "",
      Status: inv.is_expired ? "Expired" : "Active",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 30 }, // Product Name
      { wch: 20 }, // Manufacturer
      { wch: 12 }, // Batch
      { wch: 12 }, // Expiry
      { wch: 10 }, // Pack Size
      { wch: 10 }, // Quantity
      { wch: 10 }, // MRP
      { wch: 12 }, // Purchase Rate
      { wch: 12 }, // Selling Rate
      { wch: 10 }, // HSN
      { wch: 15 }, // Category
      { wch: 8 }, // Rack
      { wch: 15 }, // Branch
      { wch: 10 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return {
      buffer,
      totalItems: rows.length,
    };
  }

  /* ============================================
     RESET INVENTORY (SOFT DELETE ALL)
     - Deactivates all inventory for a branch
     - Creates stock ledger entries for audit trail
     - Does NOT permanently delete any records
  ============================================ */
  async resetInventory(shopId, branchId, userId) {
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required to reset inventory",
        400,
        "BRANCH_REQUIRED",
      );
    }

    return prisma.$transaction(async (tx) => {
      // Fetch all active inventory for this branch
      const allInventory = await tx.inventory.findMany({
        where: {
          shop_id: shopId,
          branch_id: branchId,
          is_active: true,
        },
        include: {
          medicine: {
            select: { name: true },
          },
        },
      });

      if (allInventory.length === 0) {
        return {
          deactivatedCount: 0,
          ledgerEntriesCreated: 0,
          message: "No active inventory found for this branch.",
        };
      }

      let ledgerEntriesCreated = 0;

      // Create audit ledger entries for items that have stock
      for (const inv of allInventory) {
        const currentStock = Number(inv.current_stock || 0);

        if (currentStock > 0) {
          await tx.stockLedger.create({
            data: {
              shop_id: shopId,
              branch_id: branchId,
              medicine_id: inv.medicine_id,
              inventory_id: inv.inventory_id,
              movement_type: "STOCK_ADJUSTMENT", // ← FIXED (was "INVENTORY_RESET")
              reference_type: "STOCK_ADJUSTMENT", // ← FIXED (was "INVENTORY_RESET")
              reference_id: null,
              reference_number: `RESET-${Date.now()}`,
              batch_number: inv.batch_number,
              expiry_date: inv.expiry_date,
              quantity_in: 0,
              quantity_out: currentStock,
              quantity_net: -currentStock,
              balance_after: 0,
              rate: inv.last_purchase_rate,
              amount: inv.last_purchase_rate
                ? currentStock * Number(inv.last_purchase_rate)
                : null,
              transaction_date: new Date(),
              created_by: userId,
              remarks: `Inventory reset — bulk deactivation by user ${userId}`,
            },
          });
          ledgerEntriesCreated++;
        }
      }

      // Soft-deactivate all inventory and zero out stock
      const updateResult = await tx.inventory.updateMany({
        where: {
          shop_id: shopId,
          branch_id: branchId,
          is_active: true,
        },
        data: {
          is_active: false,
          current_stock: 0,
          available_stock: 0,
          reserved_stock: 0,
          updated_at: new Date(),
        },
      });

      return {
        deactivatedCount: updateResult.count,
        ledgerEntriesCreated,
        message: `Successfully deactivated ${updateResult.count} inventory items.`,
      };
    });
  }

  async createInventoryWithMedicine(data, shopId, branchId, userId) {
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required to add inventory",
        400,
        "BRANCH_REQUIRED",
      );
    }

    const {
      name,
      manufacturer,
      generic_name,
      category,
      sub_category,
      schedule,
      hsn_code,
      pack_size,
      unit_of_measure = "UNIT",
      gst_percentage = 12,
      cgst_percentage = 6,
      sgst_percentage = 6,
      rack_no,
      min_stock_level,
      max_stock_level,
      reorder_point,
      batch_number,
      expiry_date,
      quantity,
      mrp,
      selling_rate,
      purchase_rate,
      minimum_stock,
    } = data;

    return prisma.$transaction(async (tx) => {
      const existingMedicine = await tx.medicine.findFirst({
        where: {
          shop_id: shopId,
          branch_id: branchId,
          name: { equals: name.trim(), mode: "insensitive" },
          manufacturer: { equals: manufacturer.trim(), mode: "insensitive" },
        },
      });

      let medicine;

      if (existingMedicine) {
        medicine = existingMedicine;
      } else {
        medicine = await tx.medicine.create({
          data: {
            shop: {
              connect: { shop_id: shopId },
            },
            creator: {
              connect: { user_id: userId },
            },
            ...(branchId && {
              branch: {
                connect: { branch_id: branchId },
              },
            }),
            name: name.trim(),
            manufacturer: manufacturer.trim(),
            generic_name: generic_name?.trim() || null,
            category: category?.trim() || null,
            sub_category: sub_category?.trim() || null,
            schedule: schedule || null,
            hsn_code: hsn_code?.trim() || null,
            pack_size: pack_size?.trim() || null,
            unit_of_measure: unit_of_measure,
            gst_percentage: gst_percentage,
            cgst_percentage: cgst_percentage,
            sgst_percentage: sgst_percentage,
            rack_no: rack_no?.trim() || null,
            min_stock_level: min_stock_level ?? null,
            max_stock_level: max_stock_level ?? null,
            reorder_point: reorder_point ?? null,
          },
        });
      }

      const existingBatch = await tx.inventory.findFirst({
        where: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicine.medicine_id,
          batch_number: batch_number.trim(),
          is_active: true,
        },
      });

      if (existingBatch) {
        throw new ApiError(
          `Batch "${batch_number}" already exists for ${name}. Use stock adjustment to update quantity.`,
          409,
          "DUPLICATE_BATCH",
        );
      }

      const parsedExpiry = this._parseExpiryDate(expiry_date);
      if (!parsedExpiry) {
        throw new ApiError("Invalid expiry date format", 400, "INVALID_EXPIRY");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isExpired = parsedExpiry < today;

      const inventory = await tx.inventory.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicine.medicine_id,
          batch_number: batch_number.trim(),
          expiry_date: parsedExpiry,
          current_stock: quantity,
          available_stock: quantity,
          reserved_stock: 0,
          mrp: mrp,
          selling_rate: selling_rate ?? null,
          last_purchase_rate: purchase_rate ?? null,
          minimum_stock: minimum_stock ?? null,
          rack_no: rack_no?.trim() || null,
          is_expired: isExpired,
          is_active: true,
        },
      });

      if (quantity > 0) {
        await tx.stockLedger.create({
          data: {
            shop_id: shopId,
            branch_id: branchId,
            medicine_id: medicine.medicine_id,
            inventory_id: inventory.inventory_id,
            movement_type: "OPENING_STOCK",
            reference_type: "MANUAL_ENTRY",
            reference_id: null,
            reference_number: `OPEN-${inventory.inventory_id.slice(-8).toUpperCase()}`,
            batch_number: batch_number.trim(),
            expiry_date: parsedExpiry,
            quantity_in: quantity,
            quantity_out: 0,
            quantity_net: quantity,
            balance_after: quantity,
            rate: purchase_rate ?? null,
            amount: purchase_rate ? quantity * purchase_rate : null,
            transaction_date: new Date(),
            created_by: userId,
            remarks: "Opening stock — added manually from inventory page",
          },
        });
      }

      const status = this._calculateStockStatus(
        quantity,
        minimum_stock,
        {
          min_stock_level: medicine.min_stock_level,
          max_stock_level: medicine.max_stock_level,
          reorder_point: medicine.reorder_point,
        },
        isExpired,
        parsedExpiry,
      );

      return {
        inventory_id: inventory.inventory_id,
        medicine_id: medicine.medicine_id,
        shop_id: shopId,
        branch_id: branchId,
        batch_number: inventory.batch_number,
        expiry_date: inventory.expiry_date,
        current_stock: quantity,
        available_stock: quantity,
        mrp: inventory.mrp,
        selling_rate: inventory.selling_rate,
        last_purchase_rate: inventory.last_purchase_rate,
        minimum_stock: inventory.minimum_stock,
        rack_no: inventory.rack_no,
        is_expired: isExpired,
        is_active: true,
        status,
        medicine_name: medicine.name,
        medicine_manufacturer: medicine.manufacturer,
        medicine_category: medicine.category,
        medicine_hsn_code: medicine.hsn_code,
        medicine_pack_size: medicine.pack_size,
        medicine_rack_no: medicine.rack_no,
        medicine_min_stock: medicine.min_stock_level,
        medicine_max_stock: medicine.max_stock_level,
        medicine_reorder_point: medicine.reorder_point,
        catalog_status: "NOT_LINKED",
      };
    });
  }
}

export default new InventoryService();
