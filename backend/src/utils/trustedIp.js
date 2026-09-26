// backend/src/utils/trustedIp.js (do not remove this comment)
// backend/src/utils/trustedIp.js

import prisma from "../config/prisma.js";

const TRUST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Check whether a given user + IP combination is currently trusted.
 *
 * Trusted means:
 *   - A record exists for this user_id + ip_address
 *   - last_otp_verified_at is within the last 7 days
 *
 * @param {string} userId
 * @param {string} ipAddress
 * @returns {Promise<boolean>}
 */
export async function isIpTrusted(userId, ipAddress) {
  if (!ipAddress || ipAddress === "Unknown") return false;

  const record = await prisma.userTrustedIp.findUnique({
    where: {
      user_id_ip_address: {
        user_id: userId,
        ip_address: ipAddress,
      },
    },
    select: {
      last_otp_verified_at: true,
    },
  });

  if (!record) return false;

  const ageMs = Date.now() - new Date(record.last_otp_verified_at).getTime();
  return ageMs < TRUST_WINDOW_MS;
}

/**
 * Mark a user + IP combination as trusted after a successful OTP verification.
 *
 * Uses upsert so it works for both:
 *   - First time this IP is seen for this user (INSERT)
 *   - IP already exists but window has expired (UPDATE)
 *   - IP already exists and is within window (UPDATE — slides the window forward)
 *
 * @param {string} userId
 * @param {string} ipAddress
 * @returns {Promise<void>}
 */
export async function markIpAsTrusted(userId, ipAddress) {
  if (!ipAddress || ipAddress === "Unknown") return;

  await prisma.userTrustedIp.upsert({
    where: {
      user_id_ip_address: {
        user_id: userId,
        ip_address: ipAddress,
      },
    },
    create: {
      user_id: userId,
      ip_address: ipAddress,
      last_otp_verified_at: new Date(),
    },
    update: {
      last_otp_verified_at: new Date(),
    },
  });
}