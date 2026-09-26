// backend/src/modules/reports/purchase/purchase.report.routes.js (do not remove this comment)
// backend/src/modules/reports/purchase/purchase.report.routes.js

import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import {
  getPurchaseRegisterController,
  getPurchaseOutstandingController,
  getPurchaseReturnsReportController,
} from "./purchase.report.controller.js";

const router = express.Router();

router.use(requireAuth);

// B1 — Purchase Register
router.get("/register", getPurchaseRegisterController);

// B2 — Purchase Outstanding & Payables
router.get("/outstanding", getPurchaseOutstandingController);

// B3 — Purchase Returns
router.get("/returns", getPurchaseReturnsReportController);

export default router;