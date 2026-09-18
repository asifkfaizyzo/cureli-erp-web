// backend/src/modules/inventory/inventory.controller.js

import inventoryService from "./inventory.service.js";
import { success, fail } from "../../utils/response.js";

function extractBranchContext(req) {
  const branchMode = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"] || null;

  if (req.user.role === "super_admin") {
    return {
      branchId: branchMode === "GLOBAL" ? null : headerBranchId,
      branchMode,
    };
  }

  return {
    branchId: req.user.branch_id,
    branchMode: "BRANCH",
  };
}

class InventoryController {
    async getInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const filters = {
        medicineId: req.query.medicineId,
        search: req.query.search,
        includeExpired: req.query.includeExpired === "true",
        lowStock: req.query.lowStock === "true",
        expiredOnly: req.query.expiredOnly === "true",
        status: req.query.status || null,
        expiry: req.query.expiry || null,
        supplier: req.query.supplier || null,
        category: req.query.category || null,
        catalogStatus: req.query.catalogStatus || null, // <-- ADD THIS LINE HERE
        branchId: req.query.branchId || null,
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
        sortBy: req.query.sortBy || null,
        sortOrder: req.query.sortOrder || "asc",
      };

      const result = await inventoryService.getInventory(
        shopId,
        branchId,
        role,
        branchMode,
        filters,
      );

      return success(res, result, "Inventory retrieved successfully");
    } catch (error) {
      console.error("getInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getInventoryFacets(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const facets = await inventoryService.getInventoryFacets(
        shopId,
        branchId,
        role,
        branchMode,
      );

      return success(res, facets, "Inventory metadata facets retrieved");
    } catch (error) {
      console.error("getInventoryFacets error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getByMedicine(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { medicineId } = req.params;
      const { branchId, branchMode } = extractBranchContext(req);

      const filters = {
        includeExpired: req.query.includeExpired === "true",
      };

      const inventory = await inventoryService.getInventoryByMedicine(
        shopId,
        medicineId,
        branchId,
        role,
        branchMode,
        filters,
      );

      return success(
        res,
        inventory,
        "Medicine inventory retrieved successfully",
      );
    } catch (error) {
      console.error("getByMedicine error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async exportInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const result = await inventoryService.exportInventory(
        shopId,
        branchId,
        role,
        branchMode,
      );

      const timestamp = new Date().toISOString().split("T")[0];
      const branchSuffix = branchId ? `_${branchId.slice(0, 8)}` : "_all";
      const filename = `Inventory_Backup${branchSuffix}_${timestamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", result.buffer.length);

      return res.status(200).send(result.buffer);
    } catch (error) {
      console.error("exportInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async resetInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;
      const { branchId, branchMode } = extractBranchContext(req);

      if (!branchId || branchMode === "GLOBAL") {
        return fail(
          res,
          "Please select a specific branch to reset inventory. Global mode is not allowed.",
          400,
          { code: "BRANCH_REQUIRED" },
        );
      }

      const result = await inventoryService.resetInventory(
        shopId,
        branchId,
        userId,
      );

      return success(res, result, result.message);
    } catch (error) {
      console.error("resetInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getLowStock(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const items = await inventoryService.getLowStockItems(
        shopId,
        branchId,
        role,
        branchMode,
      );

      return success(res, items, "Low stock items retrieved successfully");
    } catch (error) {
      console.error("getLowStock error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getExpiringSoon(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);
      const daysAhead = parseInt(req.query.daysAhead) || 90;

      const items = await inventoryService.getExpiringSoonItems(
        shopId,
        daysAhead,
        branchId,
        role,
        branchMode,
      );

      return success(res, items, "Expiring items retrieved successfully");
    } catch (error) {
      console.error("getExpiringSoon error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getStockLedger(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const filters = {
        medicineId: req.query.medicineId,
        batchNumber: req.query.batchNumber,
        movementType: req.query.movementType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
      };

      const result = await inventoryService.getStockLedger(
        shopId,
        branchId,
        role,
        branchMode,
        filters,
      );

      return success(res, result, "Stock ledger retrieved successfully");
    } catch (error) {
      console.error("getStockLedger error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async createAdjustment(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;
      const { branchId } = extractBranchContext(req);

      if (!branchId) {
        return fail(
          res,
          "Please select a specific branch to create adjustments",
          400,
          { code: "BRANCH_REQUIRED" },
        );
      }

      const adjustment = await inventoryService.createStockAdjustment(
        { ...req.validated, shopId, branchId },
        userId,
      );

      return success(
        res,
        adjustment,
        "Stock adjustment created successfully",
        201,
      );
    } catch (error) {
      console.error("createAdjustment error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async getStockSummary(req, res) {
    try {
      const shopId = req.user.shop_id;
      const role = req.user.role;
      const { branchId, branchMode } = extractBranchContext(req);

      const summary = await inventoryService.getStockSummary(
        shopId,
        branchId,
        role,
        branchMode,
      );

      return success(res, summary, "Stock summary retrieved successfully");
    } catch (error) {
      console.error("getStockSummary error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async updateInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;
      const { inventoryId } = req.params;
      const { branchId } = extractBranchContext(req);

      if (!branchId) {
        return fail(
          res,
          "Please select a specific branch to update inventory",
          400,
          { code: "BRANCH_REQUIRED" },
        );
      }

      const updated = await inventoryService.updateInventory(
        inventoryId,
        shopId,
        branchId,
        req.validated,
        userId,
      );

      return success(res, updated, "Inventory updated successfully");
    } catch (error) {
      console.error("updateInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async deleteInventory(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;
      const { inventoryId } = req.params;
      const { branchId } = extractBranchContext(req);

      if (!branchId) {
        return fail(
          res,
          "Please select a specific branch to delete inventory",
          400,
          { code: "BRANCH_REQUIRED" },
        );
      }

      const result = await inventoryService.deleteInventory(
        inventoryId,
        shopId,
        branchId,
        userId,
      );

      return success(res, result, "Inventory item deleted successfully");
    } catch (error) {
      console.error("deleteInventory error:", error);
      return fail(res, error.message, error.statusCode || 500);
    }
  }

  async createInventoryWithMedicine(req, res) {
    try {
      const shopId = req.user.shop_id;
      const userId = req.user.user_id;
      const { branchId, branchMode } = extractBranchContext(req);

      if (!branchId || branchMode === "GLOBAL") {
        return fail(
          res,
          "Please select a specific branch to add inventory",
          400,
          { code: "BRANCH_REQUIRED" },
        );
      }

      const result = await inventoryService.createInventoryWithMedicine(
        req.validated,
        shopId,
        branchId,
        userId,
      );

      return success(
        res,
        result,
        "Medicine added to inventory successfully",
        201,
      );
    } catch (error) {
      console.error("createInventoryWithMedicine error:", error);

      if (error.code === "DUPLICATE_BATCH") {
        return fail(res, error.message, 409);
      }
      if (error.code === "BRANCH_REQUIRED") {
        return fail(res, error.message, 400, { code: "BRANCH_REQUIRED" });
      }
      if (error.code === "INVALID_EXPIRY") {
        return fail(res, error.message, 400);
      }

      return fail(res, error.message, error.statusCode || 500);
    }
  }
}

export default new InventoryController();
