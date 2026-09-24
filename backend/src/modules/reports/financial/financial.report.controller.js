// backend/src/modules/reports/financial/financial.report.controller.js (do not remove this comment)
// backend/src/modules/reports/financial/financial.report.controller.js

import { success, fail } from "../../../utils/response.js";
import financialReportService from "./financial.report.service.js";

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

export async function getMedicinePLReport(req, res) {
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
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await financialReportService.getMedicinePLReport(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Medicine P&L report generated");
  } catch (error) {
    console.error("getMedicinePLReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getPeriodPLReport(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const data = await financialReportService.getPeriodPLReport(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Period-wise P&L report generated");
  } catch (error) {
    console.error("getPeriodPLReport ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}