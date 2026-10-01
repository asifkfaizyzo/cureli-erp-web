import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listRequests,
  getRequest,
  getFileUrl,
} from "./cadminPrescriptionRequests.controller.js";

const router = express.Router();

router.use(requireCAdmin);

/**
 * GET /cadmin/prescription-requests
 */
router.get("/prescription-requests", listRequests);

/**
 * GET /cadmin/prescription-requests/:requestId
 */
router.get("/prescription-requests/:requestId", getRequest);

/**
 * GET /cadmin/prescription-requests/:requestId/files/:fileId/url
 */
router.get(
  "/prescription-requests/:requestId/files/:fileId/url",
  getFileUrl,
);

export default router;