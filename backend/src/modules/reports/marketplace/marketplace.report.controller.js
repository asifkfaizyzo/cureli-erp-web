// backend/src/modules/reports/marketplace/marketplace.report.controller.js (do not remove this comment)
// backend/src/modules/reports/marketplace/marketplace.report.controller.js

import { success, fail } from "../../../utils/response.js";
import marketplaceReportService from "./marketplace.report.service.js";

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

// F1 — Marketplace Sales Summary
export async function getMarketplaceSalesSummary(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      paymentMethod: req.query.paymentMethod,
      branchId: req.query.branchId,
    };

    const data = await marketplaceReportService.getSalesSummary(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Marketplace sales summary retrieved");
  } catch (error) {
    console.error("getMarketplaceSalesSummary ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// F2 — Order Status Funnel
export async function getOrderStatusFunnel(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId,
    };

    const data = await marketplaceReportService.getOrderStatusFunnel(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Order status funnel retrieved");
  } catch (error) {
    console.error("getOrderStatusFunnel ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// F3 — Acceptance Rate
export async function getAcceptanceRate(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId,
    };

    const data = await marketplaceReportService.getAcceptanceRate(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Acceptance rate report retrieved");
  } catch (error) {
    console.error("getAcceptanceRate ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// F4 — Prescription Request Summary
export async function getPrescriptionSummary(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId,
    };

    const data = await marketplaceReportService.getPrescriptionSummary(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Prescription request summary retrieved");
  } catch (error) {
    console.error("getPrescriptionSummary ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

// F5 — Listing Health
export async function getListingHealth(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId,
    };

    const data = await marketplaceReportService.getListingHealth(
      shopId, branchId, role, branchMode, filters
    );

    return success(res, data, "Listing health report retrieved");
  } catch (error) {
    console.error("getListingHealth ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}