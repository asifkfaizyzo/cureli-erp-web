// backend/src/utils/otpLimiter.js (do not remove this comment)
//backend\src\utils\otpLimiter.js
import prisma from "../config/prisma.js";

// ============================================
// OTP DAILY RATE LIMITER
//
// Tracks OTP sends per identifier (phone/email)
// per calendar day. Uses PostgreSQL — no Redis needed.
//
// Limits are configurable via environment variables:
//   DAILY_SMS_OTP_LIMIT   (default: 20)
//   DAILY_EMAIL_OTP_LIMIT (default: 20)
//
// FIX: The previous implementation used a non-atomic
// check-then-increment pattern which had a race condition
// near the daily limit. Concurrent requests for the same
// phone number could both pass the limit check before
// either had incremented the counter.
//
// The fix uses a transaction that increments first, then
// checks. If the new count exceeds the limit, it decrements
// back and rejects. This is safe under concurrent load.
// ============================================

const SMS_DAILY_LIMIT = Number(process.env.DAILY_SMS_OTP_LIMIT) || 20;
const EMAIL_DAILY_LIMIT = Number(process.env.DAILY_EMAIL_OTP_LIMIT) || 20;

/**
 * Check if an SMS OTP can be sent to this phone number today.
 * If allowed, increments the counter atomically.
 *
 * @param {string} phone - Phone number
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number }>}
 */
export async function checkSmsOtpLimit(phone) {
  return checkOtpLimit(`sms:${phone}`, SMS_DAILY_LIMIT);
}

/**
 * Check if an email OTP can be sent to this email today.
 * If allowed, increments the counter atomically.
 *
 * @param {string} email
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number }>}
 */
export async function checkEmailOtpLimit(email) {
  return checkOtpLimit(`email:${email.toLowerCase()}`, EMAIL_DAILY_LIMIT);
}

/**
 * Core limiter logic.
 *
 * Uses a transaction to atomically increment then check.
 * If the resulting count exceeds the limit, we decrement
 * back and return not allowed. This prevents the race
 * condition where two concurrent requests both read the
 * same count below the limit and both get approved.
 *
 * @param {string} identifier - Unique key (e.g. "sms:+911234567890")
 * @param {number} limit - Daily maximum sends allowed
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number }>}
 */
async function checkOtpLimit(identifier, limit) {
  const today = getToday();

  try {
    // Atomically upsert-and-increment in a single transaction
    const record = await prisma.$transaction(async (tx) => {
      // Upsert: create with count 1 if new, or increment if exists
      await tx.otpDailyLimit.upsert({
        where: {
          identifier_date: {
            identifier,
            date: today,
          },
        },
        create: {
          identifier,
          date: today,
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      });

      // Read back the current count after increment
      return tx.otpDailyLimit.findUnique({
        where: {
          identifier_date: {
            identifier,
            date: today,
          },
        },
      });
    });

    // If the post-increment count exceeds the limit, roll back
    // the increment and reject the request
    if (record.count > limit) {
      await prisma.otpDailyLimit.update({
        where: {
          identifier_date: {
            identifier,
            date: today,
          },
        },
        data: {
          count: { decrement: 1 },
        },
      });

      return {
        allowed: false,
        remaining: 0,
        limit,
      };
    }

    return {
      allowed: true,
      remaining: limit - record.count,
      limit,
    };
  } catch (err) {
    // If the limiter itself fails, log it but do not block the OTP send.
    // It is better to send one extra OTP than to lock out a legitimate user
    // due to a database hiccup. Monitor these errors.
    console.error("OTP limit check failed — allowing through:", err);
    return {
      allowed: true,
      remaining: -1,
      limit,
    };
  }
}

/**
 * Get today's date at midnight UTC (for consistent daily bucketing)
 */
function getToday() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}