// backend/src/modules/rider/earnings/rider.earnings.routes.js (do not remove this comment)

import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import {
  handleGetOverview,
  handleGetWeekly,
  handleGetOrders,
  handleGetPayouts,
} from "./rider.earnings.controller.js";

const router = Router();

router.get("/overview", riderAuth, handleGetOverview);
router.get("/weekly", riderAuth, handleGetWeekly);
router.get("/orders", riderAuth, handleGetOrders);
router.get("/payouts", riderAuth, handleGetPayouts);

export default router;