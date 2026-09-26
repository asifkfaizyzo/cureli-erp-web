// backend/src/modules/reports/inventory/inventory.report.controller.js (do not remove this comment)
// backend/src/modules/reports/inventory/inventory.report.controller.js

import { success, fail } from "../../../utils/response.js";
import inventoryReportService from "./inventory.report.service.js";

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

export async function getCurrentStockReport(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      category: req.query.category,
      manufacturer: req.query.manufacturer,
      stockLevel: req.query.stockLevel,
      search: req.query.search,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await inventoryReportService.getCurrentStock(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Current stock report retrieved");
  } catch (error) {
    console.error("getCurrentStockReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getExpiryReport(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      expiryBucket: req.query.expiryBucket,
      manufacturer: req.query.manufacturer,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await inventoryReportService.getExpiryReport(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Expiry report retrieved");
  } catch (error) {
    console.error("getExpiryReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getMinStockReport(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      category: req.query.category,
      manufacturer: req.query.manufacturer,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await inventoryReportService.getMinStockReport(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Min stock and reorder report retrieved");
  } catch (error) {
    console.error("getMinStockReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getDeadStockReport(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      daysThreshold: req.query.daysThreshold || 90,
      category: req.query.category,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await inventoryReportService.getDeadStockReport(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Dead stock report retrieved");
  } catch (error) {
    console.error("getDeadStockReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getStockAdjustmentsReport(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      reasonType: req.query.reasonType,
      staffId: req.query.staffId,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await inventoryReportService.getStockAdjustments(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Stock adjustments audit log retrieved");
  } catch (error) {
    console.error("getStockAdjustmentsReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}