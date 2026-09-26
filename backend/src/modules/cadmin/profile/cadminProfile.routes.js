// backend/src/modules/cadmin/profile/cadminProfile.routes.js (do not remove this comment)
import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  validateUpdateContact,
  validateUpdateIdentity,
  validateChangePassword,
  validateActivityQuery,
} from "./cadminProfile.schema.js";
import {
  getMyProfileController,
  getPendingCountsController,
  updateContactController,
  updateIdentityController,
  changeMyPasswordController,
  getActivityLogsController,
} from "./cadminProfile.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// SELF-REFERENTIAL ROUTES — NO permission gate
//
// /me and /pending-counts must NEVER have a permission gate.
// AuthContext calls /me immediately after login to load the admin's
// profile and permissions. If this endpoint is gated, any admin without
// the required permission will get a 403, admin stays null, and the
// entire app breaks for that user.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/me", getMyProfileController);
router.get("/pending-counts", getPendingCountsController);

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS MUTATION ROUTES — permission gated
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  "/me/contact",
  requireCAdminPermission(CADMIN_PERMISSIONS.SETTINGS_EDIT_CONTACT),
  validateUpdateContact,
  updateContactController,
);

router.patch(
  "/me/identity",
  requireCAdminPermission(CADMIN_PERMISSIONS.SETTINGS_EDIT_IDENTITY),
  validateUpdateIdentity,
  updateIdentityController,
);

router.post(
  "/me/change-password",
  requireCAdminPermission(CADMIN_PERMISSIONS.SETTINGS_EDIT_PASSWORD),
  validateChangePassword,
  changeMyPasswordController,
);

router.get(
  "/me/activity",
  requireCAdminPermission(CADMIN_PERMISSIONS.SETTINGS_VIEW),
  validateActivityQuery,
  getActivityLogsController,
);

export default router;