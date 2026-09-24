// backend/src/modules/cadmin/admins/cadminAdmin.routes.js (do not remove this comment)
// backend/src/modules/cadmin/admins/cadminAdmin.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  getAdminsController,
  getAdminByIdController,
  createAdminController,
  updateAdminController,
  createSuperAdminController,
  toggleSuperAdminAccessController,
  toggleAdminAccessController,
  getAdminActivityController,
  getAdminRolesController,
  assignAdminRolesController,
} from "./cadminAdmin.controller.js";
import {
  validateGetAdminsQuery,
  validateCreateAdmin,
  validateUpdateAdmin,
  validateCreateSuperAdmin,
  validateToggleSuperAdminAccess,
  validateToggleAccess,
  validateGetActivityQuery,
  validateAssignAdminRoles,
} from "./cadminAdmin.schema.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Static paths MUST come before parameterized paths (:id)
// to prevent Express matching "super" or "roles" as an :id value
// ─────────────────────────────────────────────────────────────────────────────


// POST /cadmin/admins/super  ← MUST be before GET/PATCH /admins/:id
router.post(
  "/admins/super",
  requireCAdmin,
  validateCreateSuperAdmin,
  createSuperAdminController,
);

// GET /cadmin/admins
router.get(
  "/admins",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW),
  validateGetAdminsQuery,
  getAdminsController,
);

// POST /cadmin/admins
router.post(
  "/admins",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_CREATE),
  validateCreateAdmin,
  createAdminController,
);

// GET /cadmin/admins/:id
router.get(
  "/admins/:id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW_DETAIL),
  getAdminByIdController,
);

// PATCH /cadmin/admins/:id
router.patch(
  "/admins/:id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  validateUpdateAdmin,
  updateAdminController,
);

// PATCH /cadmin/admins/:id/access
router.patch(
  "/admins/:id/access",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_TOGGLE_ACCESS),
  validateToggleAccess,
  toggleAdminAccessController,
);

// PATCH /cadmin/admins/:id/super-access
router.patch(
  "/admins/:id/super-access",
  requireCAdmin,
  validateToggleSuperAdminAccess,
  toggleSuperAdminAccessController,
);

// GET /cadmin/admins/:id/activity
router.get(
  "/admins/:id/activity",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW_ACTIVITY),
  validateGetActivityQuery,
  getAdminActivityController,
);

// // GET /cadmin/admins/:id/roles
// router.get(
//   "/admins/:id/roles",
//   requireCAdmin,
//   requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW_DETAIL),
//   getAdminRolesController,
// );

// // PUT /cadmin/admins/:id/roles
// router.put(
//   "/admins/:id/roles",
//   requireCAdmin,
//   requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
//   validateAssignAdminRoles,
//   assignAdminRolesController,
// );

export default router;