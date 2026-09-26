// backend/src/middleware/rbac.js (do not remove this comment)
// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\middleware\rbac.js

import { fail } from "../utils/response.js";
import {
  roleHasPermission,
  roleHasAnyPermission,
} from "../config/permissions.js";

/**
 * ============================================
 * ROLE-BASED MIDDLEWARE
 * ============================================
 */

/**
 * Require user to have one of the specified roles
 *
 * Usage:
 *   router.get("/admin-only", requireAuth, requireRole("super_admin"), handler)
 *   router.get("/managers", requireAuth, requireRole("super_admin", "branch_admin"), handler)
 *
 * @param  {...string} allowedRoles - Roles that are allowed access
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Ensure requireAuth ran first
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      console.warn(
        `🚫 Role denied: User ${req.user.user_id} with role "${role}" tried to access route requiring [${allowedRoles.join(", ")}]`,
      );
      return fail(
        res,
        "Access denied. You don't have permission to perform this action.",
        403,
        { code: "INSUFFICIENT_ROLE" },
      );
    }

    return next();
  };
}

/**
 * ============================================
 * PERMISSION-BASED MIDDLEWARE
 * ============================================
 */

/**
 * Require user to have a specific permission
 *
 * Usage:
 *   router.post("/bills", requireAuth, requirePermission("billing:create"), handler)
 *   router.get("/reports", requireAuth, requirePermission("reports:sales"), handler)
 *
 * @param {string} permission - Required permission string
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const { role, user_id } = req.user;

    if (!roleHasPermission(role, permission)) {
      console.warn(
        `🚫 Permission denied: User ${user_id} with role "${role}" lacks permission "${permission}"`,
      );
      return fail(
        res,
        "Access denied. You don't have permission to perform this action.",
        403,
        { code: "INSUFFICIENT_PERMISSION", required: permission },
      );
    }

    return next();
  };
}

/**
 * Require user to have ANY of the specified permissions
 *
 * Usage:
 *   router.get("/data", requireAuth, requireAnyPermission("billing:view", "purchase:view"), handler)
 *
 * @param  {...string} permissions - At least one of these permissions is required
 */
export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const { role, user_id } = req.user;

    if (!roleHasAnyPermission(role, permissions)) {
      console.warn(
        `🚫 Permission denied: User ${user_id} with role "${role}" lacks any of [${permissions.join(", ")}]`,
      );
      return fail(
        res,
        "Access denied. You don't have permission to perform this action.",
        403,
        { code: "INSUFFICIENT_PERMISSION", required_any: permissions },
      );
    }

    return next();
  };
}

/**
 * ============================================
 * BRANCH ACCESS MIDDLEWARE
 * ============================================
 */

/**
 * Ensure user can only access their own branch's data
 *
 * For super_admin: Allows access to any branch (or uses query param/body for branch selection)
 * For branch_admin/staff: Restricts to their assigned branch only
 *
 * This middleware:
 * 1. Checks if branch_id is provided in request (params, query, or body)
 * 2. For non-super_admin, validates it matches their assigned branch
 * 3. Attaches the effective branch_id to req.branchContext
 *
 * Usage:
 *   router.get("/sales/:branch_id", requireAuth, requireBranchAccess(), handler)
 *   router.post("/invoice", requireAuth, requireBranchAccess(), handler) // branch_id in body
 *
 * @param {Object} options
 * @param {string} options.paramName - Name of the branch_id param (default: "branch_id")
 * @param {boolean} options.allowSuperAdminOverride - Allow SA to access any branch (default: true)
 */
export function requireBranchAccess(options = {}) {
  const { paramName = "branch_id", allowSuperAdminOverride = true } = options;

  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const { role, branch_id: userBranchId, user_id } = req.user;

    // Get requested branch_id from params, query, or body
    const requestedBranchId =
      req.params[paramName] ||
      req.query[paramName] ||
      req.query.branch_id ||
      req.body?.[paramName] ||
      req.body?.branch_id;

    // ============================================
    // SUPER ADMIN LOGIC
    // ============================================
    if (role === "super_admin") {
      if (allowSuperAdminOverride) {
        // SA can access any branch — use requested or null for "all branches"
        req.branchContext = {
          branch_id: requestedBranchId || null,
          accessLevel: "all", // SA can see all branches
        };
        return next();
      }
    }

    // ============================================
    // BRANCH ADMIN / STAFF LOGIC
    // ============================================

    // User must have a branch assigned
    if (!userBranchId) {
      console.error(`🚫 User ${user_id} has no branch assigned`);
      return fail(
        res,
        "You are not assigned to any branch. Please contact your administrator.",
        403,
        { code: "NO_BRANCH_ASSIGNED" },
      );
    }

    // If a specific branch was requested, validate it matches user's branch
    if (requestedBranchId && requestedBranchId !== userBranchId) {
      console.warn(
        `🚫 Branch access denied: User ${user_id} tried to access branch ${requestedBranchId} but belongs to ${userBranchId}`,
      );
      return fail(
        res,
        "Access denied. You can only access data from your assigned branch.",
        403,
        { code: "BRANCH_ACCESS_DENIED" },
      );
    }

    // Attach branch context for downstream use
    req.branchContext = {
      branch_id: userBranchId,
      accessLevel: "own", // Can only see own branch
    };

    return next();
  };
}

/**
 * ============================================
 * SHOP ACCESS MIDDLEWARE
 * ============================================
 */

/**
 * Ensure user belongs to the shop being accessed
 *
 * Useful for routes that include shop_id in params
 *
 * Usage:
 *   router.get("/shops/:shop_id/data", requireAuth, requireShopAccess(), handler)
 *
 * @param {Object} options
 * @param {string} options.paramName - Name of the shop_id param (default: "shop_id")
 */
export function requireShopAccess(options = {}) {
  const { paramName = "shop_id" } = options;

  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const { shop_id: userShopId, user_id } = req.user;

    // Get requested shop_id from params, query, or body
    const requestedShopId =
      req.params[paramName] ||
      req.query[paramName] ||
      req.query.shop_id ||
      req.body?.[paramName] ||
      req.body?.shop_id;

    // If no specific shop requested, use user's shop
    if (!requestedShopId) {
      req.shopContext = { shop_id: userShopId };
      return next();
    }

    // Validate user belongs to this shop
    if (requestedShopId !== userShopId) {
      console.warn(
        `🚫 Shop access denied: User ${user_id} tried to access shop ${requestedShopId} but belongs to ${userShopId}`,
      );
      return fail(
        res,
        "Access denied. You don't have access to this shop.",
        403,
        { code: "SHOP_ACCESS_DENIED" },
      );
    }

    req.shopContext = { shop_id: userShopId };
    return next();
  };
}

/**
 * ============================================
 * COMBINED MIDDLEWARE FACTORY
 * ============================================
 */

/**
 * Create a combined guard with permission + branch access
 *
 * Usage:
 *   router.post("/sales", requireAuth, createGuard({
 *     permission: "billing:create",
 *     requireBranch: true
 *   }), handler)
 *
 * @param {Object} config
 * @param {string} config.permission - Required permission
 * @param {string[]} config.permissions - Required any of these permissions
 * @param {string[]} config.roles - Required roles (alternative to permission)
 * @param {boolean} config.requireBranch - Enforce branch access (default: true)
 */
export function createGuard(config = {}) {
  const { permission, permissions, roles, requireBranch = true } = config;

  return async (req, res, next) => {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const { role, branch_id: userBranchId, user_id } = req.user;

    // ============================================
    // ROLE CHECK (if specified)
    // ============================================
    if (roles && roles.length > 0) {
      if (!roles.includes(role)) {
        console.warn(
          `🚫 Role denied: User ${user_id} with role "${role}" tried to access route requiring [${roles.join(", ")}]`,
        );
        return fail(
          res,
          "Access denied. You don't have permission to perform this action.",
          403,
          { code: "INSUFFICIENT_ROLE" },
        );
      }
    }

    // ============================================
    // PERMISSION CHECK (if specified)
    // ============================================
    if (permission) {
      if (!roleHasPermission(role, permission)) {
        console.warn(
          `🚫 Permission denied: User ${user_id} with role "${role}" lacks permission "${permission}"`,
        );
        return fail(
          res,
          "Access denied. You don't have permission to perform this action.",
          403,
          { code: "INSUFFICIENT_PERMISSION", required: permission },
        );
      }
    }

    if (permissions && permissions.length > 0) {
      if (!roleHasAnyPermission(role, permissions)) {
        console.warn(
          `🚫 Permission denied: User ${user_id} with role "${role}" lacks any of [${permissions.join(", ")}]`,
        );
        return fail(
          res,
          "Access denied. You don't have permission to perform this action.",
          403,
          { code: "INSUFFICIENT_PERMISSION", required_any: permissions },
        );
      }
    }

    // ============================================
    // BRANCH ACCESS (if required)
    // ============================================
    if (requireBranch) {
      const requestedBranchId =
        req.params.branch_id || req.query.branch_id || req.body?.branch_id;

      if (role === "super_admin") {
        // SA can access all
        req.branchContext = {
          branch_id: requestedBranchId || null,
          accessLevel: "all",
        };
      } else {
        // Must have branch assigned
        if (!userBranchId) {
          return fail(res, "You are not assigned to any branch.", 403, {
            code: "NO_BRANCH_ASSIGNED",
          });
        }

        // Validate branch match
        if (requestedBranchId && requestedBranchId !== userBranchId) {
          return fail(
            res,
            "Access denied. You can only access your assigned branch.",
            403,
            { code: "BRANCH_ACCESS_DENIED" },
          );
        }

        req.branchContext = {
          branch_id: userBranchId,
          accessLevel: "own",
        };
      }
    }

    return next();
  };
}

/**
 * ============================================
 * UTILITY: Get user permissions endpoint
 * ============================================
 *
 * Use this in a route to return user's permissions to pharmacy-web
 */
export function getUserPermissionsHandler(req, res) {
  if (!req.user) {
    return fail(res, "Authentication required", 401);
  }

  const { role, branch_id, shop_id } = req.user;
  const permissions = ROLE_PERMISSIONS[role] || [];

  // Expand wildcard
  const effectivePermissions = permissions.includes("*")
    ? Object.values(PERMISSIONS)
    : permissions;

  return res.json({
    success: true,
    data: {
      role,
      branch_id,
      shop_id,
      permissions: effectivePermissions,
      is_super_admin: role === "super_admin",
      can_switch_branches: role === "super_admin",
    },
  });
}

// Import PERMISSIONS and ROLE_PERMISSIONS for getUserPermissionsHandler
import { PERMISSIONS, ROLE_PERMISSIONS } from "../config/permissions.js";
