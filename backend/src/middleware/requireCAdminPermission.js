// backend/src/middleware/requireCAdminPermission.js (do not remove this comment)
// backend/src/middleware/requireCAdminPermission.js

import { fail } from "../utils/response.js";

/**
 * =============================================================================
 * CADMIN PERMISSION ENFORCEMENT MIDDLEWARE
 * =============================================================================
 *
 * These middleware functions MUST be used AFTER requireCAdmin in the chain.
 * requireCAdmin loads and attaches req.cadmin (including permissions[]).
 * These functions then check that array.
 *
 * SUPER_CADMIN BYPASS:
 * If req.cadmin.is_super_cadmin === true, all permission checks are bypassed.
 * Super admins have implicit access to everything with no DB check needed.
 *
 * USAGE IN ROUTE FILES:
 * ─────────────────────────────────────────────────────────────────────────────
 * import { requireCAdminPermission, requireAnyCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
 * import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
 *
 * // Single permission required:
 * router.get("/shops", requireCAdmin, requireCAdminPermission(CADMIN_PERMISSIONS.SHOPS_VIEW), handler);
 *
 * // Any one of multiple permissions required:
 * router.get("/overview", requireCAdmin, requireAnyCAdminPermission(
 *   CADMIN_PERMISSIONS.DASHBOARD_VIEW,
 *   CADMIN_PERMISSIONS.SHOPS_VIEW
 * ), handler);
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW TO ADD ENFORCEMENT TO A NEW ROUTE:
 * 1. Import requireCAdminPermission and CADMIN_PERMISSIONS
 * 2. Add the correct permission constant as middleware after requireCAdmin
 * 3. If the route genuinely needs no permission gate (e.g. profile/self routes),
 *    leave it with requireCAdmin only and add a comment explaining why
 * =============================================================================
 */

/**
 * Require a single specific permission.
 *
 * @param {string} permission - A permission string from CADMIN_PERMISSIONS
 * @returns Express middleware
 *
 * @example
 * router.delete("/plans/:id", requireCAdmin, requireCAdminPermission(CADMIN_PERMISSIONS.PLANS_DELETE), handler)
 */
export function requireCAdminPermission(permission) {
  return (req, res, next) => {
    // ── Guard: requireCAdmin must have run first ───────────────────────────
    if (!req.cadmin) {
      return fail(res, "Authentication required", 401);
    }

    // ── SUPER_CADMIN bypass ────────────────────────────────────────────────
    if (req.cadmin.is_super_cadmin) {
      return next();
    }

    // ── Permission check ───────────────────────────────────────────────────
    if (!req.cadmin.permissions.includes(permission)) {
      console.warn(
        `[CAdmin RBAC] DENIED — cadmin_id: ${req.cadmin.cadmin_id} | ` +
        `username: "${req.cadmin.username}" | ` +
        `required: "${permission}" | ` +
        `has: [${req.cadmin.permissions.join(", ")}]`
      );
      return fail(
        res,
        "You do not have permission to perform this action.",
        403,
        {
          code: "CADMIN_PERMISSION_DENIED",
          required: permission,
        }
      );
    }

    return next();
  };
}

/**
 * Require ANY ONE of the specified permissions.
 * Use this when a route is accessible by multiple permission holders.
 *
 * @param {...string} permissions - Permission strings from CADMIN_PERMISSIONS
 * @returns Express middleware
 *
 * @example
 * router.get("/dashboard", requireCAdmin, requireAnyCAdminPermission(
 *   CADMIN_PERMISSIONS.DASHBOARD_VIEW,
 *   CADMIN_PERMISSIONS.SHOPS_VIEW_STATS
 * ), handler)
 */
export function requireAnyCAdminPermission(...permissions) {
  return (req, res, next) => {
    // ── Guard: requireCAdmin must have run first ───────────────────────────
    if (!req.cadmin) {
      return fail(res, "Authentication required", 401);
    }

    // ── SUPER_CADMIN bypass ────────────────────────────────────────────────
    if (req.cadmin.is_super_cadmin) {
      return next();
    }

    // ── Any-of permission check ────────────────────────────────────────────
    const hasAny = permissions.some((p) =>
      req.cadmin.permissions.includes(p)
    );

    if (!hasAny) {
      console.warn(
        `[CAdmin RBAC] DENIED — cadmin_id: ${req.cadmin.cadmin_id} | ` +
        `username: "${req.cadmin.username}" | ` +
        `required any of: [${permissions.join(", ")}] | ` +
        `has: [${req.cadmin.permissions.join(", ")}]`
      );
      return fail(
        res,
        "You do not have permission to perform this action.",
        403,
        {
          code: "CADMIN_PERMISSION_DENIED",
          required_any: permissions,
        }
      );
    }

    return next();
  };
}