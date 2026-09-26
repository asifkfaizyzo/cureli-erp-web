// backend/src/modules/cadmin/cadminDocs/cadminDocs.routes.js (do not remove this comment)
// backend/src/modules/cadmin/cadminDocs/cadminDocs.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import { validateBody } from "../../../middleware/validate.js";
import {
  listFilesController,
  getShopDetailController,
  getFileController,
  verifyFileController,
  rejectFileController,
  batchUpdateFilesController,
} from "./cadminDocs.controller.js";
import { rejectSchema, validateVerificationQuery } from "./cadminDocs.schema.js";

const router = express.Router();

// NOTE: batch route MUST be before /:file_id to avoid route conflict
// POST /cadmin/files/batch
router.post(
  "/files/batch",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.DOCUMENTS_BATCH_UPDATE),
  batchUpdateFilesController
);

// GET /cadmin/files — list shops pending verification
router.get(
  "/files",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.DOCUMENTS_VIEW),
  validateVerificationQuery,
  listFilesController
);

// GET /cadmin/files/shop/:shop_id
router.get(
  "/files/shop/:shop_id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.DOCUMENTS_VIEW_SHOP_DETAIL),
  getShopDetailController
);

// GET /cadmin/files/:file_id
router.get(
  "/files/:file_id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.DOCUMENTS_VIEW_FILE),
  getFileController
);

// PATCH /cadmin/files/:file_id/verify
router.patch(
  "/files/:file_id/verify",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.DOCUMENTS_VERIFY),
  verifyFileController
);

// PATCH /cadmin/files/:file_id/reject
router.patch(
  "/files/:file_id/reject",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.DOCUMENTS_REJECT),
  validateBody(rejectSchema),
  rejectFileController
);

export default router;