// backend/src/modules/mobile/loyalty/mobile.loyalty.routes.js (do not remove this comment)
// backend/src/modules/mobile/loyalty/mobile.loyalty.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import {
  handleGetLoyaltySummary,
  handleGetLoyaltyHistory,
} from "./mobile.loyalty.controller.js";

const router = Router();

router.use(mobileAuth);

// GET /mobile/loyalty/summary (balance + configuration)
router.get("/summary", handleGetLoyaltySummary);

// GET /mobile/loyalty/history (paginated transaction ledger)
router.get("/history", handleGetLoyaltyHistory);

export default router;