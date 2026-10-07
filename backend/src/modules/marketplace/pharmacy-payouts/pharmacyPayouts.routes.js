// src/modules/marketplace/pharmacy-payouts/pharmacyPayouts.routes.js

import express from "express";
import { requireAuth } from "../../../middleware/auth.js";
import * as ctrl from "./pharmacyPayouts.controller.js";

const router = express.Router();

// Enforce auth context globally on this route branch
router.use(requireAuth);

router.get("/current", ctrl.getCurrentWeek);
router.get("/summary", ctrl.getSummary);
router.get("/history", ctrl.getHistory);
router.get("/:payoutId", ctrl.getDetail);

export default router;