// backend/src/modules/users/users.routes.js (do not remove this comment)
// src/modules/users/users.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission, requireRole } from "../../middleware/rbac.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { PERMISSIONS } from "../../config/permissions.js";

import {
  getUsersController,
  getUserController,
  getUserLimitsController,
  createUserController,
  updateUserController,
  deleteUserController,
  resetPasswordController,
  checkUsernameController,
  checkPhoneController,
  reactivateUserController,
} from "./users.controller.js";

import {
  getUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  checkUsernameSchema,
  checkPhoneSchema,
} from "./users.schema.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/users
 * List users with filtering and pagination
 * - SA: sees all users in shop
 * - BA: sees only users in their branch
 */
router.get(
  "/",
  requirePermission(PERMISSIONS.USERS_VIEW),
  validateQuery(getUsersQuerySchema),
  getUsersController
);

/**
 * GET /api/users/limits
 * Get current user count vs plan limits
 */
router.get(
  "/limits",
  requirePermission(PERMISSIONS.USERS_VIEW),
  getUserLimitsController
);

/**
 * POST /api/users/check-username
 * Check if username is available
 */
router.post(
  "/check-username",
  requirePermission(PERMISSIONS.USERS_CREATE),
  validateBody(checkUsernameSchema),
  checkUsernameController
);

/**
 * POST /api/users/check-phone
 * Check if phone number is available
 */
router.post(
  "/check-phone",
  requirePermission(PERMISSIONS.USERS_CREATE),
  validateBody(checkPhoneSchema),
  checkPhoneController
);

/**
 * GET /api/users/:user_id
 * Get single user details
 * - SA: any user in shop
 * - BA: only users in their branch
 */
router.get(
  "/:user_id",
  requirePermission(PERMISSIONS.USERS_VIEW),
  getUserController
);

/**
 * POST /api/users
 * Create new user
 * - SA: can create any role for any branch
 * - BA: can only create 'staff' for their own branch
 */
router.post(
  "/",
  requirePermission(PERMISSIONS.USERS_CREATE),
  validateBody(createUserSchema),
  createUserController
);

/**
 * PUT /api/users/:user_id
 * Update existing user
 * - SA: can update all fields for any user
 * - BA: can update name/phone/username for staff in own branch only
 */
router.put(
  "/:user_id",
  requirePermission(PERMISSIONS.USERS_EDIT),
  validateBody(updateUserSchema),
  updateUserController
);

/**
 * DELETE /api/users/:user_id
 * Deactivate user (soft delete)
 * - SA only
 * - Cannot deactivate self or shop owner
 */
router.delete(
  "/:user_id",
  requireRole("super_admin"),
  deleteUserController
);

/**
 * POST /api/users/:user_id/reset-password
 * Reset user's password
 * - SA: can reset any user's password
 * - BA: can only reset staff passwords in own branch
 */
router.post(
  "/:user_id/reset-password",
  requirePermission(PERMISSIONS.USERS_RESET_PASSWORD),
  validateBody(resetPasswordSchema),
  resetPasswordController
);

router.post(
  "/:user_id/reactivate",
  requireRole("super_admin"),
  reactivateUserController
);

export default router;