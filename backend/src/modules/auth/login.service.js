// backend/src/modules/auth/login.service.js (do not remove this comment)
// backend/src/modules/auth/login.service.js

import prisma from "../../config/prisma.js";
import { msg91SendSms, formatPhoneNumber } from "../../providers/msg91/sendSms.js";
import { generateOtp, hashOtp, verifyOtp } from "../../utils/otp.js";
import { checkSmsOtpLimit } from "../../utils/otpLimiter.js";

const OTP_VALIDITY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 30;
const INITIAL_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS_PER_OTP = 5;
const MAX_FAILED_CYCLES = 5;
const LOCKOUT_DURATION_MS = 1 * 60 * 1000; // 1 hour

/**
 * Send login OTP to user's phone
 * @param {string} user_id - User ID
 * @param {boolean} isResend - Whether this is a resend request
 * @returns {Promise<{success: boolean, timeout: number}>}
 */
export async function sendLoginOtp(user_id, isResend = false) {
  const user = await prisma.user.findUnique({ where: { user_id } });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.phone_number) {
    const err = new Error("No phone number registered");
    err.code = "NO_PHONE";
    throw err;
  }

  const now = new Date();

  // Check existing OTP validity and cooldown
  if (user.login_otp_expires) {
    const expiresAt = new Date(user.login_otp_expires);

    if (expiresAt > now) {
      const otpSentAt = new Date(expiresAt.getTime() - OTP_VALIDITY_SECONDS * 1000);
      const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

      const cooldownSeconds = isResend ? RESEND_COOLDOWN_SECONDS : INITIAL_COOLDOWN_SECONDS;

      if (secondsSinceSent < cooldownSeconds) {
        const waitTime = cooldownSeconds - secondsSinceSent;
        const err = new Error(
          isResend
            ? `Please wait ${waitTime} seconds before requesting a new OTP.`
            : "OTP already sent. Please check your phone or wait to resend."
        );
        err.code = "OTP_COOLDOWN";
        err.waitTime = waitTime;
        throw err;
      }
    }
  }

  // Check lockout
  if (user.otp_locked_until && new Date(user.otp_locked_until) > now) {
    const minutesRemaining = Math.ceil(
      (new Date(user.otp_locked_until) - now) / 60000
    );
    const err = new Error(
      `Account temporarily locked. Try again in ${minutesRemaining} minutes.`
    );
    err.code = "OTP_LOCKED";
    throw err;
  }

  // Check daily SMS limit
  const limitCheck = await checkSmsOtpLimit(user.phone_number);
  if (!limitCheck.allowed) {
    const err = new Error(
      "Daily OTP limit reached. Please try again tomorrow."
    );
    err.code = "OTP_DAILY_LIMIT";
    throw err;
  }

  // Generate OTP
  const otpLength = Number(process.env.SMS_OTP_LENGTH || 4);
  const otp = generateOtp(otpLength);
  const otpHash = await hashOtp(otp);

  try {
    // Send via MSG91
    await msg91SendSms({
      templateId: process.env.MSG91_LOGIN_TEMPLATE,
      mobile: formatPhoneNumber(user.phone_number, process.env.MC_COUNTRY || "91"),
      variables: {
        name: user.first_name || "User",
        number: otp,
      },
    });

    // Store OTP hash in DB
    await prisma.user.update({
      where: { user_id },
      data: {
        login_otp_hash: otpHash,
        login_otp_expires: new Date(Date.now() + OTP_VALIDITY_SECONDS * 1000),
        login_otp_attempts: 0,
      },
    });

    return { success: true, timeout: OTP_VALIDITY_SECONDS };
  } catch (providerError) {
    console.error("MSG91 error:", providerError);
    throw providerError;
  }
}

/**
 * Verify login OTP
 * @param {string} user_id - User ID
 * @param {string} code - OTP entered by user
 * @returns {Promise<{success: boolean}>}
 */
export async function verifyLoginOtp(user_id, code) {
  const user = await prisma.user.findUnique({ where: { user_id } });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.login_otp_hash || !user.login_otp_expires) {
    const err = new Error("OTP not requested");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > new Date(user.login_otp_expires)) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (user.login_otp_attempts >= MAX_ATTEMPTS_PER_OTP) {
    const err = new Error(
      "Too many failed attempts. Please request a new OTP."
    );
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }


  // Verify OTP
  const isValid = await verifyOtp(code, user.login_otp_hash);

  if (!isValid) {
    const newAttempts = user.login_otp_attempts + 1;
    const newCycleFailures =
      newAttempts >= MAX_ATTEMPTS_PER_OTP
        ? (user.otp_cycle_failures || 0) + 1
        : user.otp_cycle_failures || 0;

    const shouldLock = newCycleFailures >= MAX_FAILED_CYCLES;

    await prisma.user.update({
      where: { user_id },
      data: {
        login_otp_attempts: newAttempts,
        otp_cycle_failures: newCycleFailures,
        ...(shouldLock && {
          otp_locked_until: new Date(Date.now() + LOCKOUT_DURATION_MS),
        }),
      },
    });

    if (shouldLock) {
      const err = new Error(
        "Too many failed attempts. Account locked for 1 hour."
      );
      err.code = "OTP_LOCKED";
      throw err;
    }

    const err = new Error("Invalid OTP");
    err.code = "INVALID_OTP";
    throw err;
  }

  // Success - clear OTP state
  await prisma.user.update({
    where: { user_id },
    data: {
      login_otp_hash: null,
      login_otp_expires: null,
      login_otp_attempts: 0,
      last_login_at: new Date(),
      otp_cycle_failures: 0,
      otp_locked_until: null,
    },
  });

  return { success: true };
}