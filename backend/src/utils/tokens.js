// backend/src/utils/tokens.js (do not remove this comment)
import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * Generate a secure random token for password reset
 * @returns {string} - Random 64-character hex string
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token for database storage
 * @param {string} token 
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}