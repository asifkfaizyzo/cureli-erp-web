// backend/src/middleware/requireCAdmin.js (do not remove this comment)
// backend/src/middleware/requireCAdmin.js

import jwt from "jsonwebtoken";
import { ADMIN_ACCESS_SECRET, ADMIN_REFRESH_SECRET } from "../config/cadmin_jwt.js";
import { fail } from "../utils/response.js";
import prisma from "../config/prisma.js";

export const requireCAdmin = async (req, res, next) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Validate JWT (Header -> Query Param -> Cookie)
  // ─────────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query?.token) {
    // Allows EventSource (SSE) connections to authenticate
    token = req.query.token;
  } else if (req.cookies?.cadmin_refresh_token) {
    token = req.cookies.cadmin_refresh_token;
  }

  if (!token) {
    return fail(res, "Missing authorization", 401);
  }

  let payload;
  try {
    // Try Access Secret first
    payload = jwt.verify(token, ADMIN_ACCESS_SECRET);
  } catch (accessErr) {
    try {
      // Fallback: Try Refresh Secret (for persistent SSE connections)
      payload = jwt.verify(token, ADMIN_REFRESH_SECRET);
    } catch (refreshErr) {
      if (accessErr.name === "TokenExpiredError" || refreshErr.name === "TokenExpiredError") {
        return fail(res, "Token expired", 401, { code: "TOKEN_EXPIRED" });
      }
      return fail(res, "Invalid or expired token", 401);
    }
  }

  const { cadmin_id } = payload;

  if (!cadmin_id) {
    return fail(res, "Invalid token payload", 401);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Load CAdmin from DB
  // ─────────────────────────────────────────────────────────────────────────
  let cadmin;
  try {
    cadmin = await prisma.cAdmin.findUnique({
      where: { cadmin_id },
      select: {
        cadmin_id:       true,
        username:        true,
        is_active:       true,
        is_super_cadmin: true,
        roleAssignments: {
          select: {
            is_primary: true,
            role: {
              select: {
                role_id:     true,
                name:        true,
                permissions: true,
                is_deleted:  true,
              },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("requireCAdmin: DB error loading admin:", err);
    return fail(res, "Internal server error", 500);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Validate account exists and is active
  // ─────────────────────────────────────────────────────────────────────────
  if (!cadmin) {
    return fail(res, "Admin account not found", 401);
  }

  if (!cadmin.is_active) {
    return fail(res, "Account has been deactivated", 403, {
      code: "ACCOUNT_DEACTIVATED",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Compute effective permissions
  // ─────────────────────────────────────────────────────────────────────────
  let effectivePermissions = [];

  if (!cadmin.is_super_cadmin) {
    const permissionSet = new Set();

    for (const assignment of cadmin.roleAssignments) {
      if (assignment.role.is_deleted) continue;

      for (const permission of assignment.role.permissions) {
        permissionSet.add(permission);
      }
    }

    effectivePermissions = Array.from(permissionSet);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5: Attach to request
  // ─────────────────────────────────────────────────────────────────────────
  req.cadmin = {
    cadmin_id:       cadmin.cadmin_id,
    username:        cadmin.username,
    is_super_cadmin: cadmin.is_super_cadmin,
    permissions:     effectivePermissions,
  };

  return next();
};