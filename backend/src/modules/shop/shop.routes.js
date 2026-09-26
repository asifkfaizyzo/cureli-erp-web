// backend/src/modules/shop/shop.routes.js (do not remove this comment)
// backend/src/modules/shop/shop.routes.js

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { shopInfoSchema, shopGstSchema } from "./shop.schema.js";
import {
  updateShopInfoController,
  updateShopGstController,
  getVerificationStatusController,
  getShopProfileController,        // ADD THIS
} from "./shop.controller.js";

const router = express.Router();

// NEW: Get shop profile for invoice printing
router.get(
  "/profile",
  requireAuth,
  getShopProfileController
);

// Existing routes - keep as-is
router.get(
  "/verification-status",
  requireAuth,
  getVerificationStatusController
);

router.patch(
  "/setup/info",
  requireAuth,
  validateBody(shopInfoSchema),
  updateShopInfoController
);

router.patch(
  "/setup/gst",
  requireAuth,
  validateBody(shopGstSchema),
  updateShopGstController
);

export default router;