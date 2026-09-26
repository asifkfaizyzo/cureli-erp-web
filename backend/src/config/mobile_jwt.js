// backend/src/config/mobile_jwt.js (do not remove this comment)
// src/config/mobile_jwt.js
//
// JWT configuration for Cureli Mobile customer auth.
// Completely isolated from ERP JWT (jwt.js) and CAdmin JWT (cadmin_jwt.js).
// Mobile tokens carry { sub, sessionId, type: "mobile" } — nothing else.

import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.MOBILE_JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
// Set to 3650 days (10 years) to effectively persist sessions unless user uninstalls/clears storage.
const REFRESH_TOKEN_EXPIRY_DAYS = 3650;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error("MOBILE_JWT_SECRET is not set in environment variables");
}

/**
 * Sign a mobile access token.
 *
 * Payload is intentionally minimal — no role, no phone, no PII.
 * The middleware fetches fresh user data from DB on each request.
 *
 * @param {Object} params
 * @param {string} params.userId       - CureliMobileUser.id
 * @param {string} params.sessionId    - CureliMobileSession.id
 * @returns {string} Signed JWT
 */
export function signMobileAccessToken({ userId, sessionId }) {
  return jwt.sign(
    {
      sub: userId,
      sessionId,
      type: "mobile",
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Verify a mobile access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param {string} token
 * @returns {{ sub: string, sessionId: string, type: string }}
 */
export function verifyMobileAccessToken(token) {
  const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

  // Guard: reject tokens that are not mobile type.
  // Prevents ERP tokens from being used on mobile endpoints.
  if (payload.type !== "mobile") {
    const err = new Error("Invalid token type");
    err.code = "INVALID_TOKEN_TYPE";
    throw err;
  }

  return payload;
}

/**
 * Refresh token expiry in milliseconds.
 * Used when computing CureliMobileSession.expires_at.
 */
export const REFRESH_TOKEN_EXPIRY_MS =
  REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Access token expiry in seconds.
 * Sent to client as expires_in so it knows when to refresh.
 */
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900