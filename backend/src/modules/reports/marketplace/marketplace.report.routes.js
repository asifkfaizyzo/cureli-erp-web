// backend/src/modules/reports/marketplace/marketplace.report.routes.js (do not remove this comment)
// backend/src/modules/reports/marketplace/marketplace.report.routes.js

import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import {
  getMarketplaceSalesSummary,
  getOrderStatusFunnel,
  getAcceptanceRate,
  getPrescriptionSummary,
  getListingHealth,
} from "./marketplace.report.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/sales-summary", getMarketplaceSalesSummary);
router.get("/order-funnel", getOrderStatusFunnel);
router.get("/acceptance-rate", getAcceptanceRate);
router.get("/prescription-summary", getPrescriptionSummary);
router.get("/listing-health", getListingHealth);

export default router;