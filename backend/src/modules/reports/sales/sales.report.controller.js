// backend/src/modules/reports/sales/sales.report.controller.js (do not remove this comment)
// backend/src/modules/reports/sales/sales.report.controller.js

import { success, fail } from "../../../utils/response.js";
import salesReportService from "./sales.report.service.js";

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

// A1 — Sales Summary
export async function getSalesSummaryController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId,
    };

    const data = await salesReportService.getSalesSummary(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Sales summary retrieved");
  } catch (error) {
    console.error("getSalesSummary ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// A2 — Sales Register
export async function getSalesRegisterController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      customerId: req.query.customerId,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      search: req.query.search,
      staffId: req.query.staffId,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await salesReportService.getSalesRegister(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Sales register retrieved");
  } catch (error) {
    console.error("getSalesRegister ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// A3 — Profit Report
export async function getSalesProfitController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      category: req.query.category,
      manufacturer: req.query.manufacturer,
      sortBy: req.query.sortBy || "profit",
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await salesReportService.getSalesProfit(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Sales profit report retrieved");
  } catch (error) {
    console.error("getSalesProfit ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// A4 — Sales Returns Report
export async function getSalesReturnsReportController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      customerId: req.query.customerId,
      returnReason: req.query.returnReason,
      approvalStatus: req.query.approvalStatus,
      search: req.query.search,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await salesReportService.getSalesReturnsReport(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Sales returns report retrieved");
  } catch (error) {
    console.error("getSalesReturnsReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// A5 — Payment Collection
export async function getPaymentCollectionController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      customerId: req.query.customerId,
      paymentMode: req.query.paymentMode,
      search: req.query.search,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await salesReportService.getPaymentCollection(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Payment collection report retrieved");
  } catch (error) {
    console.error("getPaymentCollection ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// A6 — Outstanding & Receivables
export async function getOutstandingReceivablesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      customerId: req.query.customerId,
      agingBucket: req.query.agingBucket,
      search: req.query.search,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await salesReportService.getOutstandingReceivables(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Outstanding receivables retrieved");
  } catch (error) {
    console.error("getOutstandingReceivables ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// A7 — Day Book
export async function getDayBookController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      date: req.query.date,
      branchId: req.query.branchId,
    };

    const data = await salesReportService.getDayBook(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Day book retrieved");
  } catch (error) {
    console.error("getDayBook ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}