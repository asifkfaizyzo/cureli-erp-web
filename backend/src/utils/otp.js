// backend/src/utils/otp.js (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\utils\otp.js
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Generate numeric OTP
 * @param {number} length - OTP length (default: 4)
 * @returns {string} Generated OTP
 */
export function generateOtp(length = 4) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(crypto.randomInt(min, max + 1));
}

/**
 * Hash OTP using bcrypt
 * @param {string} otp - Plain OTP
 * @returns {Promise<string>} Hashed OTP
 */
export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against hash
 * @param {string} plain - Plain OTP entered by user
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} Whether OTP matches
 */
export async function verifyOtp(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}