// backend/src/modules/reports/inventory/inventory.report.routes.js (do not remove this comment)
import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import {
  getCurrentStockReport,
  getExpiryReport,
  getMinStockReport,
  getDeadStockReport,
  getStockAdjustmentsReport,
} from "./inventory.report.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/current-stock", getCurrentStockReport);
router.get("/expiry", getExpiryReport);
router.get("/min-stock", getMinStockReport);
router.get("/dead-stock", getDeadStockReport);
router.get("/adjustments", getStockAdjustmentsReport);

export default router;