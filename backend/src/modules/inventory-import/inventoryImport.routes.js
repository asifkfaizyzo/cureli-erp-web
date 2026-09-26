// backend/src/modules/inventory-import/inventoryImport.routes.js (do not remove this comment)
// src/modules/inventory-import/inventoryImport.routes.js

import { Router }            from "express";
import { requireAuth }       from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { inventoryImportUpload } from "../../config/multer.js";
import inventoryImportController from "./inventoryImport.controller.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/upload",
  requirePermission("inventory:create"),
  inventoryImportUpload.single("file"),
  inventoryImportController.upload
);

router.get(
  "/",
  requirePermission("inventory:view"),
  inventoryImportController.getHistory
);

router.get(
  "/:importJobId/status",
  requirePermission("inventory:view"),
  inventoryImportController.getStatus
);

router.get(
  "/:importJobId/error-report",
  requirePermission("inventory:view"),
  inventoryImportController.downloadErrorReport
);

router.get(
  "/:importJobId/detail",
  requirePermission("inventory:view"),
  inventoryImportController.getJobDetail
);

router.get(
  "/:importJobId",
  requirePermission("inventory:view"),
  inventoryImportController.getJob
);

router.post(
  "/:importJobId/resolve",
  requirePermission("inventory:create"),
  inventoryImportController.resolve
);

router.post(
  "/:importJobId/confirm",
  requirePermission("inventory:create"),
  inventoryImportController.confirm
);

router.delete(
  "/:importJobId",
  requirePermission("inventory:create"),
  inventoryImportController.cancelJob
);

export default router;