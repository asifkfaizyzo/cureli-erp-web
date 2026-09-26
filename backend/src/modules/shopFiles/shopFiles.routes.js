// backend/src/modules/shopFiles/shopFiles.routes.js (do not remove this comment)
// backend/src/modules/shopFiles/shopFiles.routes.js

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  uploadShopFileController,
  listRejectedController,
  resubmitController,
  messageController,
  getVerificationStatusController,
} from "./shopFiles.controller.js";

//  NEW: Import from universal multer config
import { createUploader, handleMulterError } from "../../config/multer.js";

const router = express.Router();

//  NEW: Use universal uploader for 'shop_files' folder
const shopFilesUpload = createUploader("shop_files", {
  fieldName: "file",
  maxFiles: 1,
});

// Routes
router.get(
  "/verification-status",
  requireAuth,
  getVerificationStatusController,
);
router.get("/rejected", requireAuth, listRejectedController);

//  UPDATED: Using universal uploader + error handler
router.post(
  "/upload",
  requireAuth,
  shopFilesUpload,
  handleMulterError,
  uploadShopFileController,
);

//  UPDATED: Using universal uploader + error handler for resubmit
router.post(
  "/:file_id/resubmit",
  requireAuth,
  shopFilesUpload,
  handleMulterError,
  resubmitController,
);

router.post("/:file_id/message", requireAuth, messageController);

export default router;
