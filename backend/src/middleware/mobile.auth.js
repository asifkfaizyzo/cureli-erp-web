// backend/src/middleware/mobile.auth.js (do not remove this comment)
// src/middleware/mobile.auth.js
//
// Authentication middleware for Cureli Mobile API endpoints.
// Verifies mobile JWT access tokens ONLY.
//
// Attaches to req:
//   req.mobileUser    — CureliMobileUser row (fresh from DB)
//   req.mobileSession — CureliMobileSession row
//
// Uses req.mobileUser / req.mobileSession intentionally (not req.user)
// to prevent any accidental mixing with ERP auth context.

import { verifyMobileAccessToken } from "../config/mobile_jwt.js";
import prisma from "../config/prisma.js";
import { fail } from "../utils/response.js";

// ── 1. Named Export (supports: import { mobileAuth } from '...') ──
export async function mobileAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(res, "Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];

  // ── Step 1: Verify JWT signature and expiry ──────────────
  let payload;
  try {
    payload = verifyMobileAccessToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return fail(res, "Access token expired", 401);
    }
    if (err.name === "JsonWebTokenError" || err.code === "INVALID_TOKEN_TYPE") {
      return fail(res, "Invalid token", 401);
    }
    return fail(res, "Authentication failed", 401);
  }

  const { sub: userId, sessionId } = payload;

  // ── Step 2: Load session from DB ─────────────────────────
  // We check the session exists, is active, not expired, and not revoked.
  // We also load the user via the session relation to keep it one query.
  let session;
  try {
    session = await prisma.cureliMobileSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
      },
    });
  } catch {
    return fail(res, "Authentication failed", 401);
  }

  if (!session) {
    return fail(res, "Session not found", 401);
  }

  // ── Step 3: Session validity checks ──────────────────────

  // Session must belong to the token's subject
  if (session.user_id !== userId) {
    return fail(res, "Invalid session", 401);
  }

  // Session must not be explicitly revoked
  if (!session.is_active || session.revoked_at) {
    return fail(res, "Session has been revoked", 401);
  }

  // Session must not be expired
  if (new Date() > new Date(session.expires_at)) {
    return fail(res, "Session expired", 401);
  }

  const user = session.user;

  // ── Step 4: Logout-all check ─────────────────────────────
  // If the user triggered logout-all, any session created before that
  // moment is invalid — even if the session row looks active.
  if (
    user.logout_all_issued_at &&
    new Date(session.created_at) < new Date(user.logout_all_issued_at)
  ) {
    return fail(res, "Session invalidated. Please log in again.", 401);
  }

  // ── Step 5: Account state checks ─────────────────────────

  if (user.deleted_at || user.status === "deleted") {
    return fail(res, "Account not found", 404);
  }

  if (user.status === "suspended") {
    return fail(
      res,
      "Your account has been suspended. Please contact support.",
      403
    );
  }

  // ── Step 6: Attach to request ────────────────────────────
  req.mobileUser = user;
  req.mobileSession = session;

  next();
}

// ── 2. Default Export (supports: import mobileAuth from '...') ──
// This ensures any legacy or third-party router integrations do not break
export default mobileAuth;