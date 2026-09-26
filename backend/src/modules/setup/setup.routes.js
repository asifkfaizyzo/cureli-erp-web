// backend/src/modules/setup/setup.routes.js (do not remove this comment)
// src/modules/setup/setup.routes.js
import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  getSetupStatusController,
  checkUsernameController,
  checkPhoneController,
  completeSetupController,
} from "./setup.controller.js";
import {
  checkUsernameSchema,
  checkPhoneSchema,
  completeSetupSchema,
} from "./setup.schema.js";

const router = express.Router();

/**
 * GET /setup/status
 * Check if setup is complete for the current shop
 */
router.get("/status", requireAuth, getSetupStatusController);

/**
 * POST /setup/check-username
 * Check if a username is available
 */
router.post(
  "/check-username",
  requireAuth,
  validateBody(checkUsernameSchema),
  checkUsernameController
);

/**
 * POST /setup/check-phone
 * Check if a phone number is already registered
 */
router.post(
  "/check-phone",
  requireAuth,
  validateBody(checkPhoneSchema),
  checkPhoneController
);

/**
 * POST /setup/complete
 * Submit all setup data (branches + users) in one transaction
 */
router.post(
  "/complete",
  requireAuth,
  validateBody(completeSetupSchema),
  completeSetupController
);

export default router;