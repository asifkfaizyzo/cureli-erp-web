// backend/src/modules/branches/branches.routes.js (do not remove this comment)
// src/modules/branches/branches.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission, requireRole } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { PERMISSIONS } from "../../config/permissions.js";

import {
  getBranchesController,
  getBranchesDropdownController,
  getBranchController,
  switchBranchController,
  getCurrentBranchController,
  getBranchLimitsController,
  createBranchController,
  updateBranchController,
  deleteBranchController,
  getBranchUsersController,
  reactivateBranchController,
  getReassignmentOptionsController,
} from "./branches.controller.js";

import {
  switchBranchSchema,
  createBranchSchema,
  updateBranchSchema,
} from "./branches.schema.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/branches
 * Get all branches (filtered by role)
 */
router.get(
  "/",
  requirePermission(PERMISSIONS.BRANCHES_VIEW),
  getBranchesController
);

/**
 * GET /api/branches/limits
 * Get current branch count vs plan limits (SA only)
 */
router.get(
  "/limits",
  requireRole("super_admin"),
  getBranchLimitsController
);
/**
 * POST /api/branches/:branch_id/reactivate
 * Reactivate a deactivated branch
 * SA only
 */
router.post(
  "/:branch_id/reactivate",
  requireRole("super_admin"),
  reactivateBranchController
);
/**
 * GET /api/branches/dropdown
 * Get branches for dropdown (Super Admin only)
 */
router.get(
  "/dropdown",
  requirePermission(PERMISSIONS.BRANCHES_SWITCH),
  getBranchesDropdownController
);

/**
 * GET /api/branches/current
 * Get current branch context
 */
router.get("/current", getCurrentBranchController);

/**
 * POST /api/branches/switch
 * Switch branch context (Super Admin only)
 */
router.post(
  "/switch",
  requirePermission(PERMISSIONS.BRANCHES_SWITCH),
  validateBody(switchBranchSchema),
  switchBranchController
);

/**
 * POST /api/branches
 * Create new branch (Super Admin only)
 */
router.post(
  "/",
  requireRole("super_admin"),
  validateBody(createBranchSchema),
  createBranchController
);

/**
 * GET /api/branches/:branch_id
 * Get single branch
 */
router.get(
  "/:branch_id",
  requirePermission(PERMISSIONS.BRANCHES_VIEW),
  getBranchController
);

/**
 * PUT /api/branches/:branch_id
 * Update branch
 * - SA: any branch
 * - BA: own branch only (enforced in controller)
 */
router.put(
  "/:branch_id",
  requirePermission(PERMISSIONS.BRANCHES_EDIT),
  validateBody(updateBranchSchema),
  updateBranchController
);

/**
 * DELETE /api/branches/:branch_id
 * Deactivate branch (Super Admin only)
 */
router.delete(
  "/:branch_id",
  requireRole("super_admin"),
  deleteBranchController
);

/**
 * GET /api/branches/:branch_id/users
 * Get active users in branch (for reassignment UI)
 */
router.get(
  "/:branch_id/users",
  requireRole("super_admin"),
  getBranchUsersController
);

/**
 * GET /api/branches/:branch_id/reassignment-options
 * Get other branches for user reassignment
 */
router.get(
  "/:branch_id/reassignment-options",
  requireRole("super_admin"),
  getReassignmentOptionsController
);

export default router;