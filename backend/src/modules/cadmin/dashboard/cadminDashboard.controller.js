// backend/src/modules/cadmin/dashboard/cadminDashboard.controller.js (do not remove this comment)
// backend/src/modules/cadmin/dashboard/cadminDashboard.controller.js

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminDashboard.service.js";

export async function getDashboardOverviewController(req, res) {
  try {
    const { period = "30d" } = req.query;
    const cadminRole = req.cadmin?.role || "SUPER_CADMIN";
    const result = await svc.getDashboardOverview(period, cadminRole);
    return success(res, result, "Dashboard overview fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch dashboard overview", 500);
  }
}

export async function getRevenueDataController(req, res) {
  try {
    const { period = "30d" } = req.query;
    const result = await svc.getRevenueData(period);
    return success(res, result, "Revenue data fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch revenue data", 500);
  }
}

export async function getUserGrowthController(req, res) {
  try {
    const { period = "30d" } = req.query;
    const result = await svc.getUserGrowthData(period);
    return success(res, result, "User growth data fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch user growth data", 500);
  }
}

export async function getSubscriptionDistributionController(req, res) {
  try {
    const result = await svc.getSubscriptionDistribution();
    return success(res, result, "Subscription distribution fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch subscription distribution", 500);
  }
}

export async function getRecentOnboardingController(req, res) {
  try {
    const { page = 1, limit = 5 } = req.query;
    const result = await svc.getRecentOnboarding(Number(page), Number(limit));
    return success(res, result, "Recent onboarding fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch recent onboarding", 500);
  }
}

export async function getTopShopsController(req, res) {
  try {
    const { period = "30d", page = 1, limit = 5 } = req.query;
    const result = await svc.getTopShops(period, Number(page), Number(limit));
    return success(res, result, "Top shops fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch top shops", 500);
  }
}

export async function getRecentActivityController(req, res) {
  try {
    const { limit = 10 } = req.query;
    const result = await svc.getRecentActivity(Number(limit));
    return success(res, result, "Recent activity fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch recent activity", 500);
  }
}

export async function getDashboardAlertsController(req, res) {
  try {
    const cadminRole = req.cadmin?.role || "SUPER_CADMIN";
    const result = await svc.getDashboardAlerts(cadminRole);
    return success(res, result, "Dashboard alerts fetched successfully");
  } catch (err) {
    console.error("[DASHBOARD CTRL] Error:", err);
    return fail(res, err.message || "Failed to fetch dashboard alerts", 500);
  }
}