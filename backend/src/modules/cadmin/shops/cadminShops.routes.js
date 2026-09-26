// backend/src/modules/cadmin/shops/cadminShops.routes.js (do not remove this comment)
// cadminShops.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import { shopFilesUpload, handleMulterError } from "../../../config/multer.js"; // ← CHANGED
import {
  listShopsController,
  getShopByIdController,
  updateShopController,
  toggleShopActiveController,
  getShopStatsController,
  updateShopSubscriptionController,
  uploadShopDocumentController,
} from "./cadminShops.controller.js";

const router = express.Router();

router.use(requireCAdmin);

router.get(
  "/shops/stats",
  requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_VIEW_STATS),
  getShopStatsController
);

router.get(
  "/shops",
  requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_VIEW),
  listShopsController
);

router.get(
  "/shops/:shop_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_VIEW_DETAIL),
  getShopByIdController
);

router.patch(
  "/shops/:shop_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_EDIT),
  updateShopController
);

router.patch(
  "/shops/:shop_id/toggle-active",
  requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_TOGGLE_ACTIVE),
  toggleShopActiveController
);

router.patch(
  "/shops/:shop_id/subscription",
  requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_UPDATE_SUBSCRIPTION),
  updateShopSubscriptionController
);

router.post(
  "/shops/:shop_id/documents",
  requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_UPLOAD_DOCUMENTS),
  shopFilesUpload,        // ← CHANGED: proper uploader with memory storage + validation
  handleMulterError,      // ← ADDED: error handler
  uploadShopDocumentController
);

export default router;