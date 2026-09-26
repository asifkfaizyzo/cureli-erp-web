// backend/src/modules/mobile/coupons/mobile.coupon.routes.js (do not remove this comment)
// backend/src/modules/mobile/coupons/mobile.coupon.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import { handleValidateCoupon } from "./mobile.coupon.controller.js";

const router = Router();

router.use(mobileAuth);

// POST /mobile/coupons/validate
router.post("/validate", handleValidateCoupon);

export default router;