// backend/src/modules/reports/purchase/purchase.report.controller.js (do not remove this comment)
// backend/src/modules/reports/purchase/purchase.report.controller.js

import { success, fail } from "../../../utils/response.js";
import purchaseReportService from "./purchase.report.service.js";

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

// B1 — Purchase Register
export async function getPurchaseRegisterController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplierId: req.query.supplierId,
      paymentStatus: req.query.paymentStatus,
      search: req.query.search,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await purchaseReportService.getPurchaseRegister(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Purchase register retrieved");
  } catch (error) {
    console.error("getPurchaseRegister ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// B2 — Purchase Outstanding & Payables
export async function getPurchaseOutstandingController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      supplierId: req.query.supplierId,
      agingBucket: req.query.agingBucket,
      search: req.query.search,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await purchaseReportService.getPurchaseOutstanding(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Purchase outstanding retrieved");
  } catch (error) {
    console.error("getPurchaseOutstanding ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// B3 — Purchase Returns Report
export async function getPurchaseReturnsReportController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplierId: req.query.supplierId,
      returnReason: req.query.returnReason,
      approvalStatus: req.query.approvalStatus,
      search: req.query.search,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await purchaseReportService.getPurchaseReturnsReport(
      shopId, branchId, role, branchMode, filters,
    );

    return success(res, data, "Purchase returns report retrieved");
  } catch (error) {
    console.error("getPurchaseReturnsReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}