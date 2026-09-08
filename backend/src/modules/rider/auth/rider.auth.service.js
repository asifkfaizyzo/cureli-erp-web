//backend\src\modules\rider\auth\rider.auth.service.js
import crypto from "crypto";
import prisma from "../../../config/prisma.js";
import {
  signRiderAccessToken,
  signRiderTempToken,
  verifyRiderTempToken,
  RIDER_REFRESH_TOKEN_EXPIRY_MS,
  RIDER_ACCESS_TOKEN_EXPIRY_SECONDS,
} from "../../../config/rider_jwt.js";
import { generateOtp, hashOtp, verifyOtp } from "../../../utils/otp.js";
import { hashPassword, comparePassword } from "../../../utils/hash.js";
import { checkSmsOtpLimit } from "../../../utils/otpLimiter.js";
import {
  msg91SendSms,
  formatPhoneNumber,
} from "../../../providers/msg91/sendSms.js";

// ── Constants ─────────────────────────────────────────────────
const OTP_LENGTH = 6;
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const OTP_VALIDITY_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS_PER_OTP = 5;
const MAX_FAILED_CYCLES = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizePhone(phone) {
  if (!phone) return "";
  const cleaned = String(phone)
    .replace(/[^\d+]/g, "")
    .trim();
  return cleaned.replace(/^\+?91/, "");
}

function getPhoneVariants(phone) {
  const raw10 = normalizePhone(phone);
  return [phone, `+91${raw10}`, `91${raw10}`, raw10];
}

function formatRiderForResponse(rider) {
  return {
    rider_id: rider.rider_id,
    phone: rider.phone,
    rider_type: rider.rider_type,
    full_name: rider.full_name,
    email: rider.email,
    date_of_birth: rider.date_of_birth
      ? new Date(rider.date_of_birth).toISOString().split("T")[0]
      : null,
    sex: rider.sex ?? null,
    profile_photo_key: rider.profile_photo_key,
    status: rider.status,
    suspension_reason: rider.suspension_reason,
    current_city: rider.current_city,
    residential_address: rider.residential_address,
    preferred_lat: rider.preferred_lat ? Number(rider.preferred_lat) : null,
    preferred_lng: rider.preferred_lng ? Number(rider.preferred_lng) : null,
    preferred_address: rider.preferred_address,
    is_online: rider.is_online,
    rating: rider.rating,
    total_ratings: rider.total_ratings ?? 0,
    total_deliveries: rider.total_deliveries,
    vehicle_type: rider.vehicle_type,
    vehicle_number: rider.vehicle_number,
    vehicle_make_model: rider.vehicle_make_model,
    bank_holder_name: rider.bank_holder_name,
    bank_ifsc: rider.bank_ifsc,
    bank_account_last4: rider.bank_account_number
      ? rider.bank_account_number.slice(-4)
      : null,
    bank_verified: rider.bank_verified ?? false,
    terms_accepted_at: rider.terms_accepted_at,
    referral_code: rider.referral_code,
    created_at: rider.created_at,
    last_seen_at: rider.last_seen_at,
    documents: rider.documents ?? [],
    has_personal_details: !!(rider.full_name && rider.date_of_birth),
    has_location: !!(rider.current_city && rider.residential_address),
    has_vehicle_details: !!(rider.vehicle_type && rider.vehicle_number),
    has_bank_details: !!(rider.bank_account_number && rider.bank_ifsc),
    has_all_documents:
      (rider.documents ?? []).length >= 5 &&
      (rider.documents ?? []).every((d) => d.status === "APPROVED"),
    has_accepted_terms: !!rider.terms_accepted_at,
  };
}

// ── checkPhone ────────────────────────────────────────────────

export async function checkRiderPhone(phone) {
  const phoneVariants = getPhoneVariants(phone);

  const rider = await prisma.rider.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
    select: {
      rider_id: true,
      password_hash: true,
      rider_type: true,
      status: true,
    },
  });

  if (!rider) {
    return { exists: false, has_password: false, status: null };
  }

  return {
    exists: true,
    has_password: !!rider.password_hash,
    rider_type: rider.rider_type,
    status: rider.status,
  };
}

// ── sendRiderOtp ──────────────────────────────────────────────

export async function sendRiderOtp(phone) {
  // 1. Daily SMS limit
  const limitCheck = await checkSmsOtpLimit(`rider:${phone}`);
  if (!limitCheck.allowed) {
    const err = new Error(
      "Daily OTP limit reached. Please try again tomorrow.",
    );
    err.code = "OTP_DAILY_LIMIT";
    throw err;
  }

  // 2. Find existing rider
  const phoneVariants = getPhoneVariants(phone);

  let rider = await prisma.rider.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  // 3. Account state checks
  if (rider) {
    if (rider.status === "BLOCKED") {
      const err = new Error(
        "Your account has been blocked. Please contact support.",
      );
      err.code = "ACCOUNT_BLOCKED";
      throw err;
    }

    if (rider.status === "SUSPENDED") {
      const err = new Error(
        rider.suspension_reason ||
          "Your account has been suspended. Please contact support.",
      );
      err.code = "ACCOUNT_SUSPENDED";
      throw err;
    }

    // 4. Lockout check
    if (
      rider.otp_locked_until &&
      new Date(rider.otp_locked_until) > new Date()
    ) {
      const minutesRemaining = Math.ceil(
        (new Date(rider.otp_locked_until) - new Date()) / 60000,
      );
      const err = new Error(
        `Too many failed attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
      );
      err.code = "OTP_LOCKED";
      throw err;
    }

    // 5. Cooldown check
    if (rider.login_otp_expires) {
      const expiresAt = new Date(rider.login_otp_expires);
      const now = new Date();

      if (expiresAt > now) {
        const otpSentAt = new Date(expiresAt.getTime() - OTP_VALIDITY_MS);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
          const waitTime = RESEND_COOLDOWN_SECONDS - secondsSinceSent;
          const err = new Error(
            `Please wait ${waitTime} seconds before requesting a new OTP.`,
          );
          err.code = "OTP_COOLDOWN";
          err.waitTime = waitTime;
          throw err;
        }
      }
    }
  }

  // 6. Generate and store OTP
  const otp = generateOtp(OTP_LENGTH);
  const otpHash = await hashOtp(otp);
  const otpExpires = new Date(Date.now() + OTP_VALIDITY_MS);

  if (rider) {
    await prisma.rider.update({
      where: { rider_id: rider.rider_id },
      data: {
        login_otp_hash: otpHash,
        login_otp_expires: otpExpires,
        login_otp_attempts: 0,
      },
    });
  } else {
    rider = await prisma.rider.create({
      data: {
        phone: phone,
        status: "DRAFT",
        rider_type: "INDEPENDENT",
        login_otp_hash: otpHash,
        login_otp_expires: otpExpires,
        login_otp_attempts: 0,
      },
    });
  }

  // 8. Send SMS
  try {
    await msg91SendSms({
      templateId: process.env.MSG91_LOGIN_TEMPLATE,
      mobile: formatPhoneNumber(phone, process.env.MC_COUNTRY || "91"),
      variables: { number: otp },
    });
  } catch (providerErr) {
    await prisma.rider.update({
      where: { rider_id: rider.rider_id },
      data: {
        login_otp_hash: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
      },
    });
    console.error("[RiderAuth] MSG91 send failed:", providerErr.message);
    const err = new Error("Failed to send OTP. Please try again.");
    err.code = "SMS_FAILED";
    throw err;
  }

  return { timeout: OTP_VALIDITY_SECONDS };
}

// ── verifyRiderOtp ────────────────────────────────────────────

export async function verifyRiderOtp(
  phone,
  otp,
  deviceInfo = {},
  requestMeta = {},
) {
  const phoneVariants = getPhoneVariants(phone);

  const rider = await prisma.rider.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (!rider) {
    const err = new Error("OTP not requested for this number.");
    err.code = "NO_OTP";
    throw err;
  }

  if (rider.status === "BLOCKED") {
    const err = new Error(
      "Your account has been blocked. Please contact support.",
    );
    err.code = "ACCOUNT_BLOCKED";
    throw err;
  }

  if (rider.status === "SUSPENDED") {
    const err = new Error(
      rider.suspension_reason ||
        "Your account has been suspended. Please contact support.",
    );
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  if (rider.otp_locked_until && new Date(rider.otp_locked_until) > new Date()) {
    const minutesRemaining = Math.ceil(
      (new Date(rider.otp_locked_until) - new Date()) / 60000,
    );
    const err = new Error(
      `Too many failed attempts. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
    );
    err.code = "OTP_LOCKED";
    throw err;
  }

  if (!rider.login_otp_hash || !rider.login_otp_expires) {
    const err = new Error("No OTP found. Please request a new one.");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > new Date(rider.login_otp_expires)) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  if (rider.login_otp_attempts >= MAX_ATTEMPTS_PER_OTP) {
    const err = new Error(
      "Too many failed attempts. Please request a new OTP.",
    );
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  // Dev bypass
  if (otp === "000000" && process.env.NODE_ENV === "development") {
    return await _handlePostOtpVerification(rider, deviceInfo, requestMeta);
  }

  const isValid = await verifyOtp(otp, rider.login_otp_hash);

  if (!isValid) {
    const newAttempts = rider.login_otp_attempts + 1;
    const newCycleFailures =
      newAttempts >= MAX_ATTEMPTS_PER_OTP
        ? rider.otp_cycle_failures + 1
        : rider.otp_cycle_failures;

    const shouldLock = newCycleFailures >= MAX_FAILED_CYCLES;

    await prisma.rider.update({
      where: { rider_id: rider.rider_id },
      data: {
        login_otp_attempts: newAttempts,
        otp_cycle_failures: newCycleFailures,
        ...(shouldLock && {
          otp_locked_until: new Date(Date.now() + LOCKOUT_DURATION_MS),
          login_otp_hash: null,
          login_otp_expires: null,
        }),
      },
    });

    if (shouldLock) {
      const err = new Error(
        "Too many failed attempts. Account locked for 1 hour.",
      );
      err.code = "OTP_LOCKED";
      throw err;
    }

    const remaining = MAX_ATTEMPTS_PER_OTP - newAttempts;
    const err = new Error(
      `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    );
    err.code = "INVALID_OTP";
    throw err;
  }

  return await _handlePostOtpVerification(rider, deviceInfo, requestMeta);
}

// ── _handlePostOtpVerification ────────────────────────────────

async function _handlePostOtpVerification(rider, deviceInfo, requestMeta) {
  // New rider (no password set) → clear OTP state and return temp token
  if (!rider.password_hash) {
    await prisma.rider.update({
      where: { rider_id: rider.rider_id },
      data: {
        login_otp_hash: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
        otp_cycle_failures: 0,
        otp_locked_until: null,
      },
    });

    const tempToken = signRiderTempToken(rider.phone);
    return {
      is_new: true,
      temp_token: tempToken,
    };
  }

  // Existing rider — complete verification directly (transaction clears OTP fields)
  return await _completeRiderVerification(rider, deviceInfo, requestMeta);
}

// ── loginRider (password) ─────────────────────────────────────

export async function loginRider(
  phone,
  password,
  deviceInfo = {},
  requestMeta = {},
) {
  const phoneVariants = getPhoneVariants(phone);

  const rider = await prisma.rider.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (!rider) {
    const err = new Error("No account found with this number.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (rider.status === "BLOCKED") {
    const err = new Error(
      "Your account has been blocked. Please contact support.",
    );
    err.code = "ACCOUNT_BLOCKED";
    throw err;
  }

  if (rider.status === "SUSPENDED") {
    const err = new Error(
      rider.suspension_reason || "Your account has been suspended.",
    );
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  if (!rider.password_hash) {
    const err = new Error("No password set. Please login with OTP instead.");
    err.code = "NO_PASSWORD";
    throw err;
  }

  const isValid = await comparePassword(password, rider.password_hash);
  if (!isValid) {
    const err = new Error("Incorrect password.");
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  return await _completeRiderVerification(rider, deviceInfo, requestMeta);
}

// ── setRiderPassword ──────────────────────────────────────────

export async function setRiderPassword(
  tempToken,
  password,
  deviceInfo = {},
  requestMeta = {},
) {
  // 1. Verify temp token
  let payload;
  try {
    payload = verifyRiderTempToken(tempToken);
  } catch {
    const err = new Error(
      "Invalid or expired temp token. Please verify OTP again.",
    );
    err.code = "INVALID_TEMP_TOKEN";
    throw err;
  }

  const phone = payload.phone;

  // 2. Find rider
  const phoneVariants = getPhoneVariants(phone);

  const rider = await prisma.rider.findFirst({
    where: {
      phone: { in: phoneVariants },
      deleted_at: null,
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (rider.status === "BLOCKED") {
    const err = new Error(
      "Your account has been blocked. Please contact support.",
    );
    err.code = "ACCOUNT_BLOCKED";
    throw err;
  }

  if (rider.status === "SUSPENDED") {
    const err = new Error(
      rider.suspension_reason || "Your account has been suspended.",
    );
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  if (rider.password_hash) {
    const err = new Error("Password already set. Please login.");
    err.code = "ALREADY_SET";
    throw err;
  }

  // 3. Hash and save password
  const hashed = await hashPassword(password);

  const updatedRider = await prisma.rider.update({
    where: { rider_id: rider.rider_id },
    data: { password_hash: hashed },
  });

  // 4. Create session and return full tokens
  return await _completeRiderVerification(
    updatedRider,
    deviceInfo,
    requestMeta,
  );
}

// ── _completeRiderVerification ────────────────────────────────

async function _completeRiderVerification(rider, deviceInfo, requestMeta) {
  const now = new Date();
  const refreshTokenPlain = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshTokenPlain);
  const sessionExpiry = new Date(Date.now() + RIDER_REFRESH_TOKEN_EXPIRY_MS);

  const [updatedRider, session] = await prisma.$transaction(async (tx) => {
    const updated = await tx.rider.update({
      where: { rider_id: rider.rider_id },
      data: {
        login_otp_hash: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
        otp_cycle_failures: 0,
        otp_locked_until: null,
        last_seen_at: now,
      },
      // ADDED: Select all fields needed for the full profile response
      select: {
        rider_id: true,
        phone: true,
        rider_type: true,
        full_name: true,
        email: true,
        date_of_birth: true,
        sex: true,
        profile_photo_key: true,
        status: true,
        suspension_reason: true,
        current_city: true,
        residential_address: true,
        preferred_lat: true,
        preferred_lng: true,
        preferred_address: true,
        is_online: true,
        rating: true,
        total_ratings: true,
        total_deliveries: true,
        vehicle_type: true,
        vehicle_number: true,
        vehicle_make_model: true,
        bank_account_number: true,
        bank_holder_name: true,
        bank_ifsc: true,
        bank_verified: true,
        terms_accepted_at: true,
        referral_code: true,
        created_at: true,
        last_seen_at: true,
        documents: {
          select: {
            document_id: true,
            type: true,
            status: true,
            rejection_reason: true,
            uploaded_at: true,
          },
        },
      },
    });

    const newSession = await tx.riderSession.create({
      data: {
        rider_id: rider.rider_id,
        refresh_token_hash: refreshTokenHash,
        device_id: deviceInfo?.device_id ?? null,
        device_name: deviceInfo?.device_name ?? null,
        device_platform: deviceInfo?.device_platform ?? null,
        device_os_version: deviceInfo?.device_os_version ?? null,
        app_version: deviceInfo?.app_version ?? null,
        ip_address: requestMeta.ip ?? null,
        user_agent: requestMeta.userAgent ?? null,
        expires_at: sessionExpiry,
        is_active: true,
      },
    });

    return [updated, newSession];
  });

  const accessToken = signRiderAccessToken({
    riderId: updatedRider.rider_id,
    sessionId: session.id,
  });

  return {
    accessToken,
    refreshToken: refreshTokenPlain,
    expiresIn: RIDER_ACCESS_TOKEN_EXPIRY_SECONDS,
    rider: formatRiderForResponse(updatedRider),
  };
}

// ── refreshRiderToken ─────────────────────────────────────────

export async function refreshRiderToken(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);

  const session = await prisma.riderSession.findUnique({
    where: { refresh_token_hash: tokenHash },
    include: { rider: true },
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

  const rider = session.rider;

  if (
    rider.logout_all_issued_at &&
    new Date(session.created_at) < new Date(rider.logout_all_issued_at)
  ) {
    const err = new Error("Session invalidated. Please log in again.");
    err.code = "SESSION_INVALIDATED";
    throw err;
  }

  if (rider.deleted_at) {
    const err = new Error("Account not found.");
    err.code = "ACCOUNT_DELETED";
    throw err;
  }

  if (rider.status === "SUSPENDED") {
    await prisma.riderSession.update({
      where: { id: session.id },
      data: {
        is_active: false,
        revoked_at: new Date(),
        revoked_reason: "suspended",
      },
    });
    const err = new Error(rider.suspension_reason || "Account suspended.");
    err.code = "ACCOUNT_SUSPENDED";
    throw err;
  }

  if (rider.status === "BLOCKED") {
    await prisma.riderSession.update({
      where: { id: session.id },
      data: {
        is_active: false,
        revoked_at: new Date(),
        revoked_reason: "blocked",
      },
    });
    const err = new Error("Account blocked.");
    err.code = "ACCOUNT_BLOCKED";
    throw err;
  }

  await prisma.riderSession.update({
    where: { id: session.id },
    data: { last_active_at: new Date() },
  });

  const accessToken = signRiderAccessToken({
    riderId: rider.rider_id,
    sessionId: session.id,
  });

  return {
    accessToken,
    expiresIn: RIDER_ACCESS_TOKEN_EXPIRY_SECONDS,
  };
}

// ── logoutRider ───────────────────────────────────────────────

export async function logoutRider(sessionId) {
  await prisma.riderSession.updateMany({
    where: { id: sessionId, is_active: true },
    data: {
      is_active: false,
      revoked_at: new Date(),
      revoked_reason: "logout",
    },
  });
}

// ── logoutAllRider ────────────────────────────────────────────

export async function logoutAllRider(riderId) {
  await prisma.$transaction([
    prisma.rider.update({
      where: { rider_id: riderId },
      data: { logout_all_issued_at: new Date() },
    }),
    prisma.riderSession.updateMany({
      where: { rider_id: riderId, is_active: true },
      data: {
        is_active: false,
        revoked_at: new Date(),
        revoked_reason: "logout_all",
      },
    }),
  ]);
}

// ── getRiderMe ────────────────────────────────────────────────

export async function getRiderMe(riderId) {
  const rider = await prisma.rider.findUnique({
    where: { rider_id: riderId },
    select: {
      rider_id: true,
      phone: true,
      rider_type: true,
      full_name: true,
      email: true,
      date_of_birth: true,
      sex: true,
      profile_photo_key: true,
      status: true,
      suspension_reason: true,
      current_city: true,
      residential_address: true,
      preferred_lat: true,
      preferred_lng: true,
      preferred_address: true,
      is_online: true,
      rating: true,
      total_ratings: true,
      total_deliveries: true,
      vehicle_type: true,
      vehicle_number: true,
      vehicle_make_model: true,
      bank_account_number: true,
      bank_holder_name: true,
      bank_ifsc: true,
      bank_verified: true,
      terms_accepted_at: true,
      referral_code: true,
      created_at: true,
      last_seen_at: true,
      documents: {
        select: {
          document_id: true,
          type: true,
          status: true,
          rejection_reason: true,
          uploaded_at: true,
        },
      },
    },
  });

  if (!rider) {
    const err = new Error("Rider not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return {
    rider_id: rider.rider_id,
    phone: rider.phone,
    rider_type: rider.rider_type,
    full_name: rider.full_name,
    email: rider.email,
    date_of_birth: rider.date_of_birth
      ? rider.date_of_birth.toISOString().split("T")[0]
      : null,
    sex: rider.sex ?? null,
    profile_photo_key: rider.profile_photo_key,
    status: rider.status,
    suspension_reason: rider.suspension_reason,
    current_city: rider.current_city,
    residential_address: rider.residential_address,
    preferred_lat: rider.preferred_lat ? Number(rider.preferred_lat) : null,
    preferred_lng: rider.preferred_lng ? Number(rider.preferred_lng) : null,
    preferred_address: rider.preferred_address,
    is_online: rider.is_online,
    rating: rider.rating,
    total_ratings: rider.total_ratings,
    total_deliveries: rider.total_deliveries,
    vehicle_type: rider.vehicle_type,
    vehicle_number: rider.vehicle_number,
    vehicle_make_model: rider.vehicle_make_model,
    bank_holder_name: rider.bank_holder_name,
    bank_ifsc: rider.bank_ifsc,
    bank_account_last4: rider.bank_account_number
      ? rider.bank_account_number.slice(-4)
      : null,
    bank_verified: rider.bank_verified,
    terms_accepted_at: rider.terms_accepted_at,
    referral_code: rider.referral_code,
    created_at: rider.created_at,
    last_seen_at: rider.last_seen_at,
    documents: rider.documents,
    has_personal_details: !!(rider.full_name && rider.date_of_birth),
    has_location: !!(rider.current_city && rider.residential_address),
    has_vehicle_details: !!(rider.vehicle_type && rider.vehicle_number),
    has_bank_details: !!(rider.bank_account_number && rider.bank_ifsc),
    has_all_documents:
      rider.documents.length >= 5 &&
      rider.documents.every((d) => d.status === "APPROVED"),
    has_accepted_terms: !!rider.terms_accepted_at,
  };
}
