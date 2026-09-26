// backend/src/modules/reports/gst/gst.report.controller.js (do not remove this comment)
// backend/src/modules/reports/gst/gst.report.controller.js

import { success, fail } from "../../../utils/response.js";
import gstReportService from "./gst.report.service.js";

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

export async function getGstr1Report(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      month: req.query.month,
      quarter: req.query.quarter,
      branchId: req.query.branchId,
    };

    const data = await gstReportService.getGstr1Report(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "GSTR-1 report generated");
  } catch (error) {
    console.error("getGstr1Report ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getGstr2Report(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      month: req.query.month,
      quarter: req.query.quarter,
      supplierId: req.query.supplierId,
      branchId: req.query.branchId,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const data = await gstReportService.getGstr2Report(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "GSTR-2 report generated");
  } catch (error) {
    console.error("getGstr2Report ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

export async function getGstr3bSummary(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      month: req.query.month,
      branchId: req.query.branchId,
    };

    const data = await gstReportService.getGstr3bSummary(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "GSTR-3B monthly summary generated");
  } catch (error) {
    console.error("getGstr3bSummary ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}