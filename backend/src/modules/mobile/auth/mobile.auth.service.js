// backend/src/modules/mobile/auth/mobile.auth.service.js (do not remove this comment)
// src/modules/mobile/auth/mobile.auth.service.js

import crypto from "crypto";
import prisma from "../../../config/prisma.js";
import {
  signMobileAccessToken,
  REFRESH_TOKEN_EXPIRY_MS,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from "../../../config/mobile_jwt.js";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
} from "../../../utils/otp.js";
import {
  hashPassword,
  comparePassword,
} from "../../../utils/hash.js";
import { checkSmsOtpLimit } from "../../../utils/otpLimiter.js";
import {
  msg91SendSms,
  formatPhoneNumber,
} from "../../../providers/msg91/sendSms.js";
import {
  isReviewMode,
  REVIEW_PHONE,
  REVIEW_OTP,
} from "../../../config/reviewCredentials.js";

// ── Constants ─────────────────────────────────────────────────
const OTP_LENGTH              = 6;
const OTP_VALIDITY_MS         = 5 * 60 * 1000;
const OTP_VALIDITY_SECONDS    = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS_PER_OTP    = 5;
const MAX_FAILED_CYCLES       = 3;
const LOCKOUT_DURATION_MS     = 60 * 60 * 1000;
const MAX_PASSWORD_ATTEMPTS   = 5;

// ── Review guard helper ───────────────────────────────────────
function isReviewPhone(phone) {
  if (!isReviewMode()) return false;
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, "");
  return digits === `91${REVIEW_PHONE}` || digits === REVIEW_PHONE;
}

// ── Helpers ───────────────────────────────────────────────────

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function formatUserForResponse(user) {
  return {
    id:                user.id,
    phone:             user.phone,
    phone_verified:    user.phone_verified,
    full_name:         user.full_name,
    email:             user.email,
    date_of_birth:     user.date_of_birth
                         ? user.date_of_birth.toISOString().split("T")[0]
                         : null,
    sex:               user.sex ?? null,
    profile_complete:  user.profile_complete,
    profile_image_key: user.profile_image_key,
    status:            user.status,
    referral_code:     user.referral_code,
    created_at:        user.created_at,
    last_seen_at:      user.last_seen_at,
  };
}

// ── registerMobile ────────────────────────────────────────────

export async function registerMobile({ phone, password, email, full_name, deviceInfo = {}, requestMeta = {} }) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  // 1. Check if user already exists
  const existingUser = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (existingUser) {
    if (existingUser.password_hash) {
      const err = new Error("Mobile number already registered. Please log in.");
      err.code = "ALREADY_REGISTERED";
      throw err;
    } else {
      const err = new Error("Account exists without a password. Please set your password.");
      err.code = "PASSWORD_NOT_SET";
      throw err;
    }
  }

  // 2. Validate email uniqueness
  if (email) {
    const existingEmail = await prisma.cureliMobileUser.findUnique({
      where: {
        email: email.toLowerCase().trim(),
        deleted_at: null,
      },
    });
    if (existingEmail) {
      const err = new Error("Email already registered. Please log in or use another email.");
      err.code = "EMAIL_ALREADY_REGISTERED";
      throw err;
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.cureliMobileUser.create({
    data: {
      phone,
      phone_verified:     true,
      phone_verified_at:  new Date(),
      password_hash:      hashedPassword,
      login_provider:     "password",
      email:              email ? email.toLowerCase().trim() : null,
      full_name:          full_name || null,
      status:             "active",
    },
  });

  return await _completeVerification(user, deviceInfo, requestMeta);
}

// ── loginMobileWithPassword ───────────────────────────────────

export async function loginMobileWithPassword({ identifier, password, deviceInfo = {}, requestMeta = {} }) {
  const normalizedIdentifier = identifier.trim();
  const isEmail = normalizedIdentifier.includes("@");
  let user;

  if (isEmail) {
    user = await prisma.cureliMobileUser.findUnique({
      where: {
        email: normalizedIdentifier.toLowerCase(),
        deleted_at: null,
      },
    });
  } else {
    const raw10 = normalizedIdentifier.replace(/^\+?91/, "").replace(/\s+/g, "");
    const phoneVariants = [
      normalizedIdentifier,
      `+91 ${raw10}`,
      `91${raw10}`,
      raw10,
    ];
    user = await prisma.cureliMobileUser.findFirst({
      where: {
        phone: { in: phoneVariants },
        deleted_at: null,
      },
    });
  }

  if (!user) {
    const err = new Error("Invalid phone/email or password.");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  if (user.status === "suspended") {
    const err = new Error("Your account has been suspended. Please contact support.");
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  if (user.password_locked_until && new Date(user.password_locked_until) > new Date()) {
    const minutesRemaining = Math.ceil(
      (new Date(user.password_locked_until) - new Date()) / 60000
    );
    const err = new Error(`Too many failed attempts. Try again in ${minutesRemaining} minutes.`);
    err.code = "PASSWORD_LOCKED";
    throw err;
  }

  if (!user.password_hash) {
    const err = new Error("This account is not fully migrated. Please set up a password first.");
    err.code = "PASSWORD_NOT_SET";
    throw err;
  }

  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    const newAttempts = user.password_attempts + 1;
    const shouldLock = newAttempts >= MAX_PASSWORD_ATTEMPTS;

    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        password_attempts: newAttempts,
        ...(shouldLock && {
          password_locked_until: new Date(Date.now() + LOCKOUT_DURATION_MS),
        }),
      },
    });

    if (shouldLock) {
      const err = new Error("Too many failed login attempts. Account locked for 1 hour.");
      err.code = "PASSWORD_LOCKED";
      throw err;
    }

    const err = new Error("Invalid phone/email or password.");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  await prisma.cureliMobileUser.update({
    where: { id: user.id },
    data: {
      password_attempts:     0,
      password_locked_until: null,
    },
  });

  return await _completeVerification(user, deviceInfo, requestMeta);
}

// ── sendMobileResetOtp ────────────────────────────────────────

export async function sendMobileResetOtp(phone) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  const user = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (!user) {
    const err = new Error("No account found with this phone number.");
    err.code = "ACCOUNT_NOT_FOUND";
    throw err;
  }

  if (user.status === "suspended") {
    const err = new Error("Your account has been suspended. Please contact support.");
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  return await sendMobileOtp(phone);
}

// ── resetMobilePassword ───────────────────────────────────────

export async function resetMobilePassword(phone, otp, newPassword) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  const user = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (!user) {
    const err = new Error("User not found.");
    err.code = "ACCOUNT_NOT_FOUND";
    throw err;
  }

  if (!user.login_otp_hash || !user.login_otp_expires) {
    const err = new Error("No OTP found. Please request a new one.");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > new Date(user.login_otp_expires)) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (user.login_otp_attempts >= MAX_ATTEMPTS_PER_OTP) {
    const err = new Error("Too many failed attempts. Please request a new OTP.");
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  let isValid = false;
  if (otp === "000000" && process.env.NODE_ENV === "development") {
    isValid = true;
  } else if (isReviewPhone(user.phone) && (otp === REVIEW_OTP || otp === "123456")) {
    isValid = true;
  } else {
    isValid = await verifyOtp(otp, user.login_otp_hash);
  }

  if (!isValid) {
    const newAttempts = user.login_otp_attempts + 1;
    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: { login_otp_attempts: newAttempts },
    });

    const remaining = MAX_ATTEMPTS_PER_OTP - newAttempts;
    const err = new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
    err.code = "INVALID_OTP";
    throw err;
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.cureliMobileUser.update({
    where: { id: user.id },
    data: {
      password_hash:         hashedPassword,
      login_provider:        "password",
      phone_verified:        true,
      login_otp_hash:        null,
      login_otp_expires:     null,
      login_otp_attempts:    0,
      otp_cycle_failures:    0,
      otp_locked_until:      null,
      password_attempts:     0,
      password_locked_until: null,
      logout_all_issued_at:  new Date(),
    },
  });

  return { success: true };
}

// ── sendMobileOtp ─────────────────────────────────────────────

export async function sendMobileOtp(phone) {
  if (!isReviewPhone(phone)) {
    const limitCheck = await checkSmsOtpLimit(`mobile:${phone}`);
    if (!limitCheck.allowed) {
      const err = new Error("Daily OTP limit reached. Please try again tomorrow.");
      err.code = "OTP_DAILY_LIMIT";
      throw err;
    }
  }

  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  let user = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (user) {
    if (user.status === "deleted") {
      const err = new Error("Account not found.");
      err.code = "ACCOUNT_DELETED";
      throw err;
    }

    if (user.status === "suspended") {
      const err = new Error("Your account has been suspended. Please contact support.");
      err.code = "ACCOUNT_SUSPENDED";
      throw err;
    }

    if (user.phone !== phone) {
      await prisma.cureliMobileUser.update({
        where: { id: user.id },
        data: { phone, updated_at: new Date() },
      });
      user = { ...user, phone };
    }

    if (!isReviewPhone(phone) && user.login_otp_expires) {
      const expiresAt        = new Date(user.login_otp_expires);
      const now              = new Date();

      if (expiresAt > now) {
        const otpSentAt        = new Date(expiresAt.getTime() - OTP_VALIDITY_MS);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
          const waitTime = RESEND_COOLDOWN_SECONDS - secondsSinceSent;
          const err = new Error(`Please wait ${waitTime} seconds before requesting a new OTP.`);
          err.code     = "OTP_COOLDOWN";
          err.waitTime = waitTime;
          throw err;
        }
      }
    }

    if (
      !isReviewPhone(phone) &&
      user.otp_locked_until &&
      new Date(user.otp_locked_until) > new Date()
    ) {
      const minutesRemaining = Math.ceil(
        (new Date(user.otp_locked_until) - new Date()) / 60000
      );
      const err = new Error(`Too many failed attempts. Try again in ${minutesRemaining} minutes.`);
      err.code = "OTP_LOCKED";
      throw err;
    }
  }

  const otp        = generateOtp(OTP_LENGTH);
  const otpHash    = await hashOtp(otp);
  const otpExpires = new Date(Date.now() + OTP_VALIDITY_MS);

  if (user) {
    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        login_otp_hash:     otpHash,
        login_otp_expires:  otpExpires,
        login_otp_attempts: 0,
      },
    });
  } else {
    user = await prisma.cureliMobileUser.create({
      data: {
        phone,
        phone_verified:     false,
        status:             "active",
        login_otp_hash:     otpHash,
        login_otp_expires:  otpExpires,
        login_otp_attempts: 0,
      },
    });
  }

  // Review mode — skip sending SMS
  if (isReviewPhone(phone)) {
    console.log("[MobileAuth] Review mode active: Skipping SMS delivery.");
    return { timeout: OTP_VALIDITY_SECONDS };
  }

  try {
    await msg91SendSms({
      templateId: process.env.MSG91_LOGIN_TEMPLATE,
      mobile:     formatPhoneNumber(phone, process.env.MC_COUNTRY || "91"),
      variables:  { number: otp },
    });
  } catch (providerErr) {
    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        login_otp_hash:     null,
        login_otp_expires:  null,
        login_otp_attempts: 0,
      },
    });
    console.error("[MobileAuth] MSG91 send failed:", providerErr.message);
    const err = new Error("Failed to send OTP. Please try again.");
    err.code = "SMS_FAILED";
    throw err;
  }

  return { timeout: OTP_VALIDITY_SECONDS };
}

// ── verifyMobileOtp ───────────────────────────────────────────

export async function verifyMobileOtp(phone, otp, deviceInfo = {}, requestMeta = {}) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  const user = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (!user) {
    const err = new Error("OTP not requested for this number.");
    err.code = "NO_OTP";
    throw err;
  }

  if (!user.login_otp_hash || !user.login_otp_expires) {
    const err = new Error("No OTP found. Please request a new one.");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > new Date(user.login_otp_expires)) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (user.login_otp_attempts >= MAX_ATTEMPTS_PER_OTP) {
    const err = new Error("Too many failed attempts. Please request a new OTP.");
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  if (otp === "000000" && process.env.NODE_ENV === "development") {
    return await _completeVerification(user, deviceInfo, requestMeta);
  }

  if (isReviewPhone(user.phone) && (otp === REVIEW_OTP || otp === "123456")) {
    console.log("[MobileAuth] Review bypass verify successful.");
    return await _completeVerification(user, deviceInfo, requestMeta);
  }

  const isValid = await verifyOtp(otp, user.login_otp_hash);

  if (!isValid) {
    const newAttempts      = user.login_otp_attempts + 1;
    const newCycleFailures =
      newAttempts >= MAX_ATTEMPTS_PER_OTP
        ? user.otp_cycle_failures + 1
        : user.otp_cycle_failures;

    const shouldLock = newCycleFailures >= MAX_FAILED_CYCLES;

    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        login_otp_attempts: newAttempts,
        otp_cycle_failures: newCycleFailures,
        ...(shouldLock && {
          otp_locked_until:  new Date(Date.now() + LOCKOUT_DURATION_MS),
          login_otp_hash:    null,
          login_otp_expires: null,
        }),
      },
    });

    if (shouldLock) {
      const err = new Error("Too many failed attempts. Account locked for 1 hour.");
      err.code = "OTP_LOCKED";
      throw err;
    }

    const remaining = MAX_ATTEMPTS_PER_OTP - newAttempts;
    const err = new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
    err.code = "INVALID_OTP";
    throw err;
  }

  return await _completeVerification(user, deviceInfo, requestMeta);
}

// ── _completeVerification ─────────────────────────────────────

async function _completeVerification(user, deviceInfo, requestMeta) {
  const isNewUser = !user.phone_verified;
  const now       = new Date();

  const refreshTokenPlain = generateRefreshToken();
  const refreshTokenHash  = hashRefreshToken(refreshTokenPlain);
  const sessionExpiry     = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const [updatedUser, session] = await prisma.$transaction(async (tx) => {
    const updated = await tx.cureliMobileUser.update({
      where: { id: user.id },
      data: {
        phone_verified:     true,
        phone_verified_at:  user.phone_verified_at ?? now,
        login_otp_hash:     null,
        login_otp_expires:  null,
        login_otp_attempts: 0,
        otp_cycle_failures: 0,
        otp_locked_until:   null,
        last_seen_at:       now,
      },
    });

    const newSession = await tx.cureliMobileSession.create({
      data: {
        user_id:             user.id,
        refresh_token_hash:  refreshTokenHash,
        device_id:           deviceInfo?.device_id           ?? null,
        device_name:         deviceInfo?.device_name         ?? null,
        device_platform:     deviceInfo?.device_platform     ?? null,
        device_os_version:   deviceInfo?.device_os_version   ?? null,
        app_version:         deviceInfo?.app_version         ?? null,
        ip_address:          requestMeta.ip                  ?? null,
        user_agent:          requestMeta.userAgent            ?? null,
        expires_at:          sessionExpiry,
        is_active:           true,
      },
    });

    return [updated, newSession];
  });

  const accessToken = signMobileAccessToken({
    userId:    updatedUser.id,
    sessionId: session.id,
  });

  return {
    accessToken,
    refreshToken: refreshTokenPlain,
    expiresIn:    ACCESS_TOKEN_EXPIRY_SECONDS,
    isNewUser,
    requires_email: !updatedUser.email,
    user:         formatUserForResponse(updatedUser),
  };
}

// ── refreshMobileToken ────────────────────────────────────────

export async function refreshMobileToken(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);

  const session = await prisma.cureliMobileSession.findUnique({
    where:   { refresh_token_hash: tokenHash },
    include: { user: true },
  });

  if (!session) {
    const err = new Error("Invalid refresh token.");
    err.code = "INVALID_REFRESH_TOKEN";
    throw err;
  }

  if (!session.is_active || session.revoked_at) {
    const err = new Error("Session has been revoked. Please log in again.");
    err.code = "SESSION_REVOKED";
    throw err;
  }

  if (new Date() > new Date(session.expires_at)) {
    const err = new Error("Session expired. Please log in again.");
    err.code = "SESSION_EXPIRED";
    throw err;
  }

  const user = session.user;

  if (
    user.logout_all_issued_at &&
    new Date(session.created_at) < new Date(user.logout_all_issued_at)
  ) {
    const err = new Error("Session invalidated. Please log in again.");
    err.code = "SESSION_INVALIDATED";
    throw err;
  }

  if (user.deleted_at || user.status === "deleted") {
    const err = new Error("Account not found.");
    err.code = "ACCOUNT_DELETED";
    throw err;
  }

  if (user.status === "suspended") {
    await prisma.cureliMobileSession.update({
      where: { id: session.id },
      data: {
        is_active:      false,
        revoked_at:     new Date(),
        revoked_reason: "suspended",
      },
    });
    const err = new Error("Your account has been suspended. Please contact support.");
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  await prisma.cureliMobileSession.update({
    where: { id: session.id },
    data:  { last_active_at: new Date() },
  });

  const accessToken = signMobileAccessToken({
    userId:    user.id,
    sessionId: session.id,
  });

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };
}

// ── logoutMobile ──────────────────────────────────────────────

export async function logoutMobile(sessionId) {
  await prisma.cureliMobileSession.update({
    where: { id: sessionId },
    data: {
      is_active:      false,
      revoked_at:     new Date(),
      revoked_reason: "logout",
    },
  });
}

// ── logoutAllMobile ───────────────────────────────────────────

export async function logoutAllMobile(userId) {
  await prisma.cureliMobileUser.update({
    where: { id: userId },
    data:  { logout_all_issued_at: new Date() },
  });
}

// ── getMobileMe ───────────────────────────────────────────────

export async function getMobileMe(userId) {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: userId },
    select: {
      id:                true,
      phone:             true,
      phone_verified:    true,
      email:             true,
      full_name:         true,
      date_of_birth:     true,
      sex:               true,
      profile_complete:  true,
      profile_image_key: true,
      status:            true,
      referral_code:     true,
      created_at:        true,
      last_seen_at:      true,
      _count: {
        select: {
          addresses: { where: { deleted_at: null } },
        },
      },
    },
  });

  if (!user) {
    const err = new Error("User not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return {
    id:                user.id,
    phone:             user.phone,
    phone_verified:    user.phone_verified,
    email:             user.email,
    full_name:         user.full_name,
    date_of_birth:     user.date_of_birth
                         ? user.date_of_birth.toISOString().split("T")[0]
                         : null,
    sex:               user.sex ?? null,
    profile_complete:  user.profile_complete,
    profile_image_key: user.profile_image_key,
    status:            user.status,
    referral_code:     user.referral_code,
    created_at:        user.created_at,
    last_seen_at:      user.last_seen_at,
    address_count:     user._count.addresses,
  };
}

// ── sendMobileRegisterOtp ─────────────────────────────────────

export async function sendMobileRegisterOtp(phone) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  const user = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (user) {
    if (user.password_hash) {
      const err = new Error("Mobile number already registered. Please log in.");
      err.code = "ALREADY_REGISTERED";
      throw err;
    }
    if (user.status === "suspended") {
      const err = new Error("Your account has been suspended. Please contact support.");
      err.code = "ACCOUNT_SUSPENDED";
      throw err;
    }
  }

  return await sendMobileOtp(phone);
}

// ── checkMobilePhone ──────────────────────────────────────────

export async function checkMobilePhone(phone) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  const user = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
    select: {
      id: true,
      phone: true,
      password_hash: true,
      login_provider: true,
      status: true,
    },
  });

  if (!user) {
    return {
      exists: false,
      has_password: false,
      login_provider: null,
    };
  }

  if (user.status === "suspended") {
    const err = new Error("Your account has been suspended. Please contact support.");
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  if (user.status === "deleted") {
    return {
      exists: false,
      has_password: false,
      login_provider: null,
    };
  }

  return {
    exists: true,
    has_password: !!user.password_hash,
    login_provider: user.login_provider,
  };
}

// ── registerMobileVerify ──────────────────────────────────────

export async function registerMobileVerify({ phone, password, email, full_name, otp, deviceInfo = {}, requestMeta = {} }) {
  const raw10 = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  const phoneVariants = [
    phone,
    `+91 ${raw10}`,
    `91${raw10}`,
    raw10,
  ];

  const user = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (!user) {
    const err = new Error("No pending registration found for this number. Please request OTP first.");
    err.code = "NO_OTP";
    throw err;
  }

  if (user.password_hash) {
    const err = new Error("Mobile number already registered. Please log in.");
    err.code = "ALREADY_REGISTERED";
    throw err;
  }

  if (!user.login_otp_hash || !user.login_otp_expires) {
    const err = new Error("No registration OTP found. Please try again.");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > new Date(user.login_otp_expires)) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (user.login_otp_attempts >= MAX_ATTEMPTS_PER_OTP) {
    const err = new Error("Too many failed attempts. Please restart registration.");
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  let isValid = false;
  if (otp === "000000" && process.env.NODE_ENV === "development") {
    isValid = true;
  } else if (isReviewPhone(user.phone) && (otp === REVIEW_OTP || otp === "123456")) {
    isValid = true;
  } else {
    isValid = await verifyOtp(otp, user.login_otp_hash);
  }

  if (!isValid) {
    const newAttempts = user.login_otp_attempts + 1;
    await prisma.cureliMobileUser.update({
      where: { id: user.id },
      data: { login_otp_attempts: newAttempts },
    });

    const remaining = MAX_ATTEMPTS_PER_OTP - newAttempts;
    const err = new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
    err.code = "INVALID_OTP";
    throw err;
  }

  if (email) {
    const existingEmail = await prisma.cureliMobileUser.findUnique({
      where: {
        email: email.toLowerCase().trim(),
        deleted_at: null,
      },
    });
    if (existingEmail) {
      const err = new Error("Email already registered. Please use another email.");
      err.code = "EMAIL_ALREADY_REGISTERED";
      throw err;
    }
  }

  const hashedPassword = await hashPassword(password);

  const updatedUser = await prisma.cureliMobileUser.update({
    where: { id: user.id },
    data: {
      password_hash:      hashedPassword,
      login_provider:     "password",
      email:              email ? email.toLowerCase().trim() : null,
      full_name:          full_name || null,
      phone_verified:     true,
      phone_verified_at:  new Date(),
      login_otp_hash:     null,
      login_otp_expires:  null,
      login_otp_attempts: 0,
      otp_cycle_failures: 0,
      otp_locked_until:   null,
    },
  });

  return await _completeVerification(updatedUser, deviceInfo, requestMeta);
}