// backend/src/modules/users/users.controller.js (do not remove this comment)
// src/modules/users/users.controller.js

import { success, fail } from "../../utils/response.js";
import * as svc from "./users.service.js";
import * as audit from "../audit/index.js";

/**
 * GET /api/users
 * List users with filtering and pagination
 */
export async function getUsersController(req, res) {
  try {
    const {
      shop_id,
      role: requester_role,
      branch_id: requester_branch_id,
    } = req.user;
    const {
      branch_id,
      role,
      status,
      search,
      page,
      limit,
      sort_by,
      sort_order,
    } = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const result = await svc.getUsers({
      shop_id,
      branch_id,
      role,
      status,
      search,
      page,
      limit,
      sort_by,
      sort_order,
      requester_role,
      requester_branch_id,
    });

    return success(res, result);
  } catch (err) {
    console.error("getUsersController error:", err);
    return fail(res, "Failed to fetch users", 500);
  }
}

/**
 * GET /api/users/limits
 * Get current user count vs plan limits
 */
export async function getUserLimitsController(req, res) {
  try {
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const limits = await svc.getUserLimits(shop_id);

    return success(res, limits);
  } catch (err) {
    console.error("getUserLimitsController error:", err);
    return fail(res, "Failed to fetch user limits", 500);
  }
}

/**
 * GET /api/users/:user_id
 * Get single user details
 */
export async function getUserController(req, res) {
  try {
    const { user_id } = req.params;
    const {
      shop_id,
      role: requester_role,
      branch_id: requester_branch_id,
    } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const user = await svc.getUserById(user_id, shop_id);

    if (!user) {
      return fail(res, "User not found", 404);
    }

    // BA can only view users in their branch
    if (
      requester_role !== "super_admin" &&
      user.branch_id !== requester_branch_id
    ) {
      return fail(res, "Access denied. User not in your branch.", 403);
    }

    return success(res, { user });
  } catch (err) {
    console.error("getUserController error:", err);
    return fail(res, "Failed to fetch user", 500);
  }
}

/**
 * POST /api/users
 * Create new user
 */
export async function createUserController(req, res) {
  try {
    const {
      shop_id,
      role: requester_role,
      branch_id: requester_branch_id,
    } = req.user;
    const {
      full_name,
      phone_number,
      username,
      password,
      role,
      branch_id,
      email,
    } = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // ============================================
    // BRANCH ADMIN RESTRICTIONS
    // ============================================
    if (requester_role === "branch_admin") {
      // BA can only create 'staff' role
      if (role !== "staff") {
        return fail(res, "Branch admins can only create staff members", 403, {
          code: "ROLE_RESTRICTED",
        });
      }

      // BA can only create users in their own branch
      if (branch_id !== requester_branch_id) {
        return fail(res, "You can only create users in your own branch", 403, {
          code: "BRANCH_RESTRICTED",
        });
      }
    }

    //  Extract audit context
    const auditContext = audit.extractRequestContext(req);

    // Create user
    const user = await svc.createUser({
      shop_id,
      branch_id,
      full_name,
      phone_number,
      username,
      password,
      role,
      email,
      auditContext, //  Pass context
    });

    return success(res, { user }, "User created successfully", 201);
  } catch (err) {
    console.error("createUserController error:", err);

    // Handle specific errors
    if (err.code === "INVALID_BRANCH") {
      return fail(res, err.message, 400);
    }
    if (err.code === "USER_LIMIT_EXCEEDED") {
      return fail(res, err.message, 400);
    }
    if (err.code === "USERNAME_TAKEN") {
      return fail(res, err.message, 400);
    }
    if (err.code === "PHONE_TAKEN") {
      return fail(res, err.message, 400);
    }
    if (err.code === "BRANCH_ADMIN_EXISTS") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to create user", 500);
  }
}

/**
 * PUT /api/users/:user_id
 * Update existing user
 */
export async function updateUserController(req, res) {
  try {
    const { user_id } = req.params;
    const {
      shop_id,
      role: requester_role,
      branch_id: requester_branch_id,
    } = req.user;
    const updates = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Get target user first for validation
    const targetUser = await svc.getUserById(user_id, shop_id);

    if (!targetUser) {
      return fail(res, "User not found", 404);
    }

    // ============================================
    // BRANCH ADMIN RESTRICTIONS
    // ============================================
    if (requester_role === "branch_admin") {
      // BA can only edit users in their own branch
      if (targetUser.branch_id !== requester_branch_id) {
        return fail(res, "You can only edit users in your own branch", 403, {
          code: "BRANCH_RESTRICTED",
        });
      }

      // BA can only edit staff, not other BAs
      if (targetUser.role !== "staff") {
        return fail(res, "You can only edit staff members", 403, {
          code: "ROLE_RESTRICTED",
        });
      }

      // BA cannot change role, branch, or active status
      if (updates.role !== undefined) {
        return fail(res, "You cannot change user roles", 403, {
          code: "FIELD_RESTRICTED",
        });
      }
      if (updates.branch_id !== undefined) {
        return fail(res, "You cannot change user branch", 403, {
          code: "FIELD_RESTRICTED",
        });
      }
      if (updates.is_active !== undefined) {
        return fail(res, "You cannot change user status", 403, {
          code: "FIELD_RESTRICTED",
        });
      }
    }

    //  Extract audit context
    const auditContext = audit.extractRequestContext(req);

    // Perform update
    const updatedUser = await svc.updateUser(
      user_id,
      shop_id,
      updates,
      auditContext, //  Pass context
    );

    return success(res, { user: updatedUser }, "User updated successfully");
  } catch (err) {
    console.error("updateUserController error:", err);

    if (err.code === "USER_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "CANNOT_MODIFY_SA") {
      return fail(res, err.message, 403);
    }
    if (err.code === "USERNAME_TAKEN") {
      return fail(res, err.message, 400);
    }
    if (err.code === "PHONE_TAKEN") {
      return fail(res, err.message, 400);
    }
    if (err.code === "INVALID_BRANCH") {
      return fail(res, err.message, 400);
    }
    if (err.code === "BRANCH_ADMIN_EXISTS") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to update user", 500);
  }
}

/**
 * DELETE /api/users/:user_id
 * Deactivate user (soft delete)
 */
export async function deleteUserController(req, res) {
  try {
    const { user_id } = req.params;
    const { shop_id, user_id: requester_user_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    //  Extract audit context
    const auditContext = audit.extractRequestContext(req);

    await svc.deleteUser(
      user_id,
      shop_id,
      requester_user_id,
      auditContext, //  Pass context
    );

    return success(res, null, "User deactivated successfully");
  } catch (err) {
    console.error("deleteUserController error:", err);

    if (err.code === "USER_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "CANNOT_DELETE_SELF") {
      return fail(res, err.message, 400);
    }
    if (err.code === "CANNOT_DELETE_OWNER") {
      return fail(res, err.message, 400);
    }
    if (err.code === "CANNOT_DELETE_SA") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to deactivate user", 500);
  }
}

/**
 * POST /api/users/:user_id/reactivate
 * Reactivate a deactivated user
 * SA only
 */
export async function reactivateUserController(req, res) {
  try {
    const { user_id } = req.params;
    const { shop_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super admin can reactivate
    if (role !== "super_admin") {
      return fail(res, "Only Super Admin can reactivate users", 403);
    }

    //  Extract audit context
    const auditContext = audit.extractRequestContext(req);

    const user = await svc.reactivateUser(
      user_id,
      shop_id,
      auditContext, //  Pass context
    );

    return success(res, { user }, "User reactivated successfully");
  } catch (err) {
    console.error("reactivateUserController error:", err);

    if (err.code === "USER_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "ALREADY_ACTIVE") {
      return fail(res, err.message, 400);
    }
    if (err.code === "BRANCH_ADMIN_EXISTS") {
      return fail(res, err.message, 400);
    }
    if (err.code === "USER_LIMIT_EXCEEDED") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to reactivate user", 500);
  }
}

/**
 * POST /api/users/:user_id/reset-password
 * Reset user's password
 */
export async function resetPasswordController(req, res) {
  try {
    const { user_id } = req.params;
    const {
      shop_id,
      role: requester_role,
      branch_id: requester_branch_id,
      user_id: requester_user_id,
    } = req.user;
    const { new_password } = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Get target user
    const targetUser = await svc.getUserById(user_id, shop_id);

    if (!targetUser) {
      return fail(res, "User not found", 404);
    }

    // ============================================
    // BRANCH ADMIN RESTRICTIONS
    // ============================================
    if (requester_role === "branch_admin") {
      // BA cannot reset their own password
      if (user_id === requester_user_id) {
        return fail(
          res,
          "You cannot reset your own password. Contact super admin.",
          403,
          { code: "CANNOT_RESET_SELF" },
        );
      }

      // BA can only reset passwords for users in their own branch
      if (targetUser.branch_id !== requester_branch_id) {
        return fail(
          res,
          "You can only reset passwords for users in your branch",
          403,
          { code: "BRANCH_RESTRICTED" },
        );
      }

      // BA can only reset staff passwords, not other BAs
      if (targetUser.role !== "staff") {
        return fail(res, "You can only reset staff passwords", 403, {
          code: "ROLE_RESTRICTED",
        });
      }
    }

    //  Extract audit context
    const auditContext = audit.extractRequestContext(req);

    // Reset password
    await svc.resetUserPassword(
      user_id,
      shop_id,
      new_password,
      auditContext, //  Pass context
    );

    return success(res, null, "Password reset successfully");
  } catch (err) {
    console.error("resetPasswordController error:", err);

    if (err.code === "USER_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "CANNOT_RESET_SA") {
      return fail(res, err.message, 403);
    }

    return fail(res, "Failed to reset password", 500);
  }
}

/**
 * POST /api/users/check-username
 * Check username availability
 */
export async function checkUsernameController(req, res) {
  try {
    const { username, exclude_user_id } = req.validated;

    const result = await svc.checkUsernameAvailability(
      username,
      exclude_user_id,
    );

    return success(res, result);
  } catch (err) {
    console.error("checkUsernameController error:", err);
    return fail(res, "Failed to check username", 500);
  }
}

/**
 * POST /api/users/check-phone
 * Check phone availability
 */
export async function checkPhoneController(req, res) {
  try {
    const { phone_number, exclude_user_id } = req.validated;

    const result = await svc.checkPhoneAvailability(
      phone_number,
      exclude_user_id,
    );

    return success(res, result);
  } catch (err) {
    console.error("checkPhoneController error:", err);
    return fail(res, "Failed to check phone", 500);
  }
}
