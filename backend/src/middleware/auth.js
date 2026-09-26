// backend/src/middleware/auth.js (do not remove this comment)
// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\middleware\auth.js

import jwt from "jsonwebtoken";
import { ACCESS_SECRET } from "../config/jwt.js";
import { fail } from "../utils/response.js";
import { validateUserSession } from "../utils/session.js";

/**
 * Require authentication middleware
 * 
 * Validates JWT token and active session.
 * Attaches user context to req.user for downstream use.
 * 
 * req.user shape after this middleware:
 * {
 *   user_id: string,
 *   shop_id: string | null,
 *   branch_id: string | null,   ← NEW in Phase 1
 *   role: "super_admin" | "branch_admin" | "staff",
 *   status: string,
 *   session_id: string
 * }
 */
export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return fail(res, "Missing authorization", 401);
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);

    // Validate session is still active in database
    if (payload.session_id) {
      const session = await validateUserSession(
        payload.user_id,
        payload.session_id
      );

      if (!session) {
        return fail(
          res,
          "Session expired or logged in from another device",
          401,
          { code: "SESSION_INVALIDATED" }
        );
      }
    }

    // ============================================
    // UPDATED: Attach user info including branch_id
    // ============================================
    req.user = {
      user_id: payload.user_id,
      shop_id: payload.shop_id,
      branch_id: payload.branch_id || null, // NEW
      role: payload.role,
      status: payload.status,
      session_id: payload.session_id,
    };

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return fail(res, "Token expired", 401, { code: "TOKEN_EXPIRED" });
    }
    return fail(res, "Invalid or expired token", 401);
  }
};

/**
 * Optional auth middleware
 * 
 * Doesn't fail if no token present, just sets req.user to null.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);

    if (payload.session_id) {
      const session = await validateUserSession(
        payload.user_id,
        payload.session_id
      );
      if (!session) {
        req.user = null;
        return next();
      }
    }

    // ============================================
    // UPDATED: Include branch_id
    // ============================================
    req.user = {
      user_id: payload.user_id,
      shop_id: payload.shop_id,
      branch_id: payload.branch_id || null, // NEW
      role: payload.role,
      status: payload.status,
      session_id: payload.session_id,
    };
  } catch (err) {
    req.user = null;
  }

  return next();
};