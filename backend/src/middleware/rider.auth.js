// backend/src/middleware/rider.auth.js (do not remove this comment)
// backend/src/middleware/rider.auth.js
//
// Authentication middleware for Cureli Delivery rider API endpoints.
// Mirrors mobile.auth.js exactly — different model, different token type.
//
// Attaches to req:
//   req.rider        — Rider row (fresh from DB)
//   req.riderSession — RiderSession row
//
// NEVER attaches req.user or req.mobileUser.

import { verifyRiderAccessToken } from "../config/rider_jwt.js";
import prisma from "../config/prisma.js";
import { fail } from "../utils/response.js";

export async function riderAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(res, "Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];

  // ── Step 1: Verify JWT signature and expiry ──────────────
  let payload;
  try {
    payload = verifyRiderAccessToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return fail(res, "Access token expired", 401);
    }
    if (err.name === "JsonWebTokenError" || err.code === "INVALID_TOKEN_TYPE") {
      return fail(res, "Invalid token", 401);
    }
    return fail(res, "Authentication failed", 401);
  }

  const { sub: riderId, sessionId } = payload;

  // ── Step 2: Load session + rider in one query ────────────
  let session;
  try {
    session = await prisma.riderSession.findUnique({
      where: { id: sessionId },
      include: { rider: true },
    });
  } catch {
    return fail(res, "Authentication failed", 401);
  }

  if (!session) {
    return fail(res, "Session not found", 401);
  }

  // ── Step 3: Session validity checks ──────────────────────
  if (session.rider_id !== riderId) {
    return fail(res, "Invalid session", 401);
  }

  if (!session.is_active || session.revoked_at) {
    return fail(res, "Session has been revoked", 401);
  }

  if (new Date() > new Date(session.expires_at)) {
    return fail(res, "Session expired", 401);
  }

  const rider = session.rider;

  // ── Step 4: Logout-all check ─────────────────────────────
  if (
    rider.logout_all_issued_at &&
    new Date(session.created_at) < new Date(rider.logout_all_issued_at)
  ) {
    return fail(res, "Session invalidated. Please log in again.", 401);
  }

  // ── Step 5: Account state checks ─────────────────────────
  if (rider.deleted_at) {
    return fail(res, "Account not found", 404);
  }

  if (rider.status === "SUSPENDED") {
    return fail(res, rider.suspension_reason || "Your account has been suspended. Please contact support.", 403);
  }

  if (rider.status === "BLOCKED") {
    return fail(res, "Your account has been blocked. Please contact support.", 403);
  }

  // ── Step 6: Attach to request ────────────────────────────
  req.rider = rider;
  req.riderSession = session;

  next();
}