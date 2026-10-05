// backend/src/modules/cadmin/dashboard/cadminDashboard.routes.js (do not remove this comment)
// backend/src/modules/cadmin/dashboard/cadminDashboard.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  getDashboardOverviewController,
  getRevenueDataController,
  getUserGrowthController,
  getRecentOnboardingController,
  getTopShopsController,
  getRecentActivityController,
  getDashboardAlertsController,
  getSubscriptionDistributionController,
} from "./cadminDashboard.controller.js";

const router = express.Router();

// All dashboard routes require a single permission: dashboard.view
// One permission covers all dashboard data endpoints —
// you either have access to the dashboard or you don't.
router.use(requireCAdmin);
router.use(requireCAdminPermission(CADMIN_PERMISSIONS.DASHBOARD_VIEW));

// GET /cadmin/dashboard/overview
router.get("/dashboard/overview", getDashboardOverviewController);

// GET /cadmin/dashboard/revenue
router.get("/dashboard/revenue", getRevenueDataController);

// GET /cadmin/dashboard/user-growth
router.get("/dashboard/user-growth", getUserGrowthController);

// GET /cadmin/dashboard/subscriptions
router.get("/dashboard/subscriptions", getSubscriptionDistributionController);

// GET /cadmin/dashboard/onboarding
router.get("/dashboard/onboarding", getRecentOnboardingController);

// GET /cadmin/dashboard/top-shops
router.get("/dashboard/top-shops", getTopShopsController);

// GET /cadmin/dashboard/activity
router.get("/dashboard/activity", getRecentActivityController);

// GET /cadmin/dashboard/alerts
router.get("/dashboard/alerts", getDashboardAlertsController);

export default router;