// backend/src/config/rider_jwt.js
//
// JWT configuration for Cureli Delivery rider auth.
// Completely isolated from mobile_jwt.js, jwt.js, and cadmin_jwt.js.
// Rider tokens carry { sub, sessionId, type: "rider" } — nothing else.

import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.RIDER_JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 90;
const TEMP_TOKEN_EXPIRY = "15m";

if (!ACCESS_TOKEN_SECRET) {
  throw new Error("RIDER_JWT_SECRET is not set in environment variables");
}

export const RIDER_REFRESH_TOKEN_EXPIRY_MS =
  REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const RIDER_ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900 seconds (15m)

/**
 * Sign a rider access token.
 * Payload is minimal — no PII, no role.
 * Middleware fetches fresh rider data from DB on each request.
 *
 * @param {Object} params
 * @param {string} params.riderId
 * @param {string} params.sessionId
 * @returns {string} Signed JWT
 */
export function signRiderAccessToken({ riderId, sessionId }) {
  return jwt.sign(
    {
      sub: riderId,
      sessionId,
      type: "rider",
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Verify a rider access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 * Guards against non-rider tokens being used on rider endpoints.
 *
 * @param {string} token
 * @returns {{ sub: string, sessionId: string, type: string, iat: number, exp: number }}
 */
export function verifyRiderAccessToken(token) {
  const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

  if (payload.type !== "rider") {
    const err = new Error("Invalid token type");
    err.code = "INVALID_TOKEN_TYPE";
    throw err;
  }

  return payload;
}

// ── Temp token for registration flow ──────────────────────────
// Short-lived JWT issued after OTP verification for new riders.
// Contains only the phone number — used once to set password.

/**
 * Sign a temporary registration token for onboarding.
 *
 * @param {string} phone
 * @returns {string} Signed temporary JWT
 */
export function signRiderTempToken(phone) {
  return jwt.sign(
    {
      phone,
      type: "rider_temp",
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: TEMP_TOKEN_EXPIRY }
  );
}

/**
 * Verify a temporary registration token.
 *
 * @param {string} token
 * @returns {{ phone: string, type: string, iat: number, exp: number }}
 */
export function verifyRiderTempToken(token) {
  const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

  if (payload.type !== "rider_temp") {
    const err = new Error("Invalid temp token type");
    err.code = "INVALID_TOKEN_TYPE";
    throw err;
  }

  return payload;
}

const RESET_TOKEN_EXPIRY = "15m";

/**
 * Sign a temporary reset token for forgot-password flow.
 *
 * @param {string} phone
 * @returns {string} Signed reset JWT
 */
export function signRiderResetToken(phone) {
  return jwt.sign(
    {
      phone,
      type: "rider_reset",
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: RESET_TOKEN_EXPIRY }
  );
}

/**
 * Verify a temporary reset token.
 *
 * @param {string} token
 * @returns {{ phone: string, type: string, iat: number, exp: number }}
 */
export function verifyRiderResetToken(token) {
  const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

  if (payload.type !== "rider_reset") {
    const err = new Error("Invalid reset token type");
    err.code = "INVALID_TOKEN_TYPE";
    throw err;
  }

  return payload;
}