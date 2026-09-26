// backend/src/modules/cadmin/roles/cadminRoles.routes.js (do not remove this comment)
// backend/src/modules/cadmin/roles/cadminRoles.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import {
  createRoleSchema,
  updateRoleSchema,
  listRolesQuerySchema,
  assignRolesSchema,
} from "./cadminRoles.schema.js";
import {
  listRolesController,
  getRoleByIdController,
  createRoleController,
  updateRoleController,
  getRoleDeletionImpactController,
  deleteRoleController,
  getAdminRolesController,
  assignRolesController,
  removeAllRolesController,
} from "./cadminRoles.controller.js";

const router = Router();

router.use(requireCAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// ROLE MANAGEMENT
// All role management requires ADMINS_EDIT permission
// (only SUPER_CADMIN will have this in practice — but it flows through
//  the standard permission system rather than hardcoding a super-admin check)
// ─────────────────────────────────────────────────────────────────────────────

// GET /cadmin/roles
// List all roles (used for role picker in create/edit admin flows)
// Requires ADMINS_VIEW — any admin that can view admins can see available roles
router.get(
  "/roles",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW),
  validateQuery(listRolesQuerySchema),
  listRolesController
);

// GET /cadmin/roles/:role_id
// View a single role with full details + assigned admins list
router.get(
  "/roles/:role_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW),
  getRoleByIdController
);

// GET /cadmin/roles/:role_id/deletion-impact
// Check how many admins will be affected before deleting
// MUST be before /:role_id to avoid conflict — but since path is different it's fine
router.get(
  "/roles/:role_id/deletion-impact",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  getRoleDeletionImpactController
);

// POST /cadmin/roles
// Create a new custom role
router.post(
  "/roles",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  validateBody(createRoleSchema),
  createRoleController
);

// PATCH /cadmin/roles/:role_id
// Update role name, description, or permissions
router.patch(
  "/roles/:role_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  validateBody(updateRoleSchema),
  updateRoleController
);

// DELETE /cadmin/roles/:role_id
// Soft delete a role (blocked if active admins are assigned)
router.delete(
  "/roles/:role_id",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  deleteRoleController
);

// ─────────────────────────────────────────────────────────────────────────────
// ROLE ASSIGNMENTS (per admin)
// ─────────────────────────────────────────────────────────────────────────────

// GET /cadmin/admins/:cadmin_id/roles
// Get all roles assigned to a specific admin
router.get(
  "/admins/:cadmin_id/roles",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW_DETAIL),
  getAdminRolesController
);

// PUT /cadmin/admins/:cadmin_id/roles
// Full replacement of role assignments for an admin
router.put(
  "/admins/:cadmin_id/roles",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  validateBody(assignRolesSchema),
  assignRolesController
);

// DELETE /cadmin/admins/:cadmin_id/roles
// Remove all role assignments (used before reassignment or deactivation)
router.delete(
  "/admins/:cadmin_id/roles",
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  removeAllRolesController
);

export default router;