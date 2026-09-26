// backend/src/modules/cadmin/users/cadminUser.routes.js (do not remove this comment)
// backend/src/modules/cadmin/users/cadminUser.routes.js

import express from "express";
import { requireCAdmin }           from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS }      from "../../../config/cadminPermissions.js";
import {
  getUsersController,
  getUserByIdController,
  updateUserController,
  toggleUserAccessController,
  resetUserPasswordController,
  deleteUserController,
} from "./cadminUser.controller.js";

const router = express.Router();

router.get(
  "/users",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.USERS_VIEW),
  getUsersController
);

router.get(
  "/users/:id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.USERS_VIEW_DETAIL),
  getUserByIdController
);

router.patch(
  "/users/:id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.USERS_EDIT),
  updateUserController
);

router.patch(
  "/users/:id/access",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.USERS_TOGGLE_ACCESS),
  toggleUserAccessController
);

router.post(
  "/users/:id/reset-password",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.USERS_RESET_PASSWORD),
  resetUserPasswordController
);

// DELETE — soft delete with mandatory reason
router.delete(
  "/users/:id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.USERS_DELETE),
  deleteUserController
);

export default router;