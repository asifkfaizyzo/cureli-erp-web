// backend/src/modules/cadmin/marketplace-dashboard/cadminMarketplaceDashboard.routes.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace-dashboard/cadminMarketplaceDashboard.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { getMarketplaceDashboardController } from "./cadminMarketplaceDashboard.controller.js";

const router = express.Router();

router.use(requireCAdmin);

/**
 * GET /cadmin/marketplace-dashboard
 * Returns full marketplace overview: KPIs, recent orders, recent sign-ups, shop stats.
 */
router.get("/marketplace-dashboard", getMarketplaceDashboardController);

export default router;