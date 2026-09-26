// backend/src/modules/reports/sales/sales.report.routes.js (do not remove this comment)
// backend/src/modules/reports/sales/sales.report.routes.js

import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import {
  getSalesSummaryController,
  getSalesRegisterController,
  getSalesProfitController,
  getSalesReturnsReportController,
  getPaymentCollectionController,
  getOutstandingReceivablesController,
  getDayBookController,
} from "./sales.report.controller.js";

const router = express.Router();

router.use(requireAuth);

// A1 — Sales Summary
router.get("/summary", getSalesSummaryController);

// A2 — Sales Register
router.get("/register", getSalesRegisterController);

// A3 — Profit Report
router.get("/profit", getSalesProfitController);

// A4 — Sales Returns
router.get("/returns", getSalesReturnsReportController);

// A5 — Payment Collection
router.get("/payments", getPaymentCollectionController);

// A6 — Outstanding & Receivables
router.get("/outstanding", getOutstandingReceivablesController);

// A7 — Day Book
router.get("/daybook", getDayBookController);

export default router;