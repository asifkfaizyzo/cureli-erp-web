// backend/src/config/reviewCredentials.js (do not remove this comment)
// src/config/reviewCredentials.js

/**
 * Checks dynamically at runtime so dotenv loading order never breaks reviewer mode.
 */
export function isReviewMode() {
  const envVal = process.env.REVIEW_MODE;
  return typeof envVal === "string" && envVal.trim().toUpperCase() === "TRUE";
}

export const REVIEW_PHONE = "1234567890";
export const REVIEW_OTP   = "123456";
export const REVIEW_PASSWORD = "123456";

// Backwards-compatible getter
export const IS_REVIEW_MODE = {
  valueOf() {
    return isReviewMode();
  },
};