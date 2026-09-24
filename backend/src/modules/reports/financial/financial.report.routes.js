// backend/src/modules/reports/financial/financial.report.routes.js (do not remove this comment)
// backend/src/modules/reports/financial/financial.report.routes.js

import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import {
  getMedicinePLReport,
  getPeriodPLReport,
} from "./financial.report.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/medicine-pl", getMedicinePLReport);
router.get("/period-pl", getPeriodPLReport);

export default router;