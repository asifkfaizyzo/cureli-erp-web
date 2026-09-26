// backend/src/modules/pending/pending.service.js (do not remove this comment)
// backend/src/modules/pending/pending.service.js

import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import {
  msg91SendSms,
  formatPhoneNumber,
} from "../../providers/msg91/sendSms.js";
import { generateOtp, hashOtp, verifyOtp } from "../../utils/otp.js";
import { notify } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";
import * as audit from "../audit/index.js";
import {
  checkSmsOtpLimit,
  checkEmailOtpLimit,
} from "../../utils/otpLimiter.js";

// ============================================
// CONSTANTS
// ============================================
const OTP_VALIDITY_SECONDS = 300; // 5 minutes
const EMAIL_OTP_VALIDITY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 30;
const INITIAL_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

// ============================================
// CLEANUP
// ============================================

export async function cleanupExpiredPendingUsers(expiryMinutes = 10) {
  try {
    const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);

    const deleted = await prisma.pendingUser.deleteMany({
      where: {
        created_at: { lt: cutoff },
      },
    });

    return deleted;
  } catch (err) {
    console.error("cleanupExpiredPendingUsers error:", err);
    return null;
  }
}

// ============================================
// CREATE PENDING USER
// ============================================

export async function createPendingUser({
  first_name,
  last_name,
  email,
  password,
}) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const err = new Error("Email already registered. Please login.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const existingPending = await prisma.pendingUser.findUnique({
    where: { email },
  });

  if (existingPending) {
    await prisma.pendingUser.delete({
      where: { pending_id: existingPending.pending_id },
    });
  }

  const password_hash = await hashPassword(password);

  const pending = await prisma.pendingUser.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash,
    },
  });

  return pending;
}

export async function createPendingUserFromGoogle({
  google_id,
  email,
  first_name,
  last_name,
}) {
  if (google_id) {
    const existingGoogleUser = await prisma.user.findUnique({
      where: { google_id },
    });

    if (existingGoogleUser) {
      const err = new Error(
        "This Google account is already registered. Please login instead.",
      );
      err.code = "GOOGLE_ID_EXISTS";
      throw err;
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const err = new Error("Email already registered. Please login instead.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const existingPending = await prisma.pendingUser.findUnique({
    where: { email },
  });

  if (existingPending) {
    const updated = await prisma.pendingUser.update({
      where: { email },
      data: {
        google_id,
        first_name,
        last_name,
        login_provider: "google",
        email_verified: true,
      },
    });
    return updated;
  }

  const pending = await prisma.pendingUser.create({
    data: {
      google_id,
      email,
      first_name,
      last_name,
      login_provider: "google",
      email_verified: true,
    },
  });

  return pending;
}

export async function setPasswordForPending(pending_id, password) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (pending.login_provider !== "google") {
    const err = new Error("This account is not a Google signup.");
    err.code = "NOT_GOOGLE";
    throw err;
  }

  const password_hash = await hashPassword(password);

  await prisma.pendingUser.update({
    where: { pending_id },
    data: { password_hash },
  });

  return true;
}

// ============================================
// EMAIL OTP
// ============================================

export async function sendEmailOtp(pending_id, isResend = false) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Check cooldown
  if (pending.email_otp_expires) {
    const expiresAt = new Date(pending.email_otp_expires);
    const now = new Date();

    const otpSentAt = new Date(
      expiresAt.getTime() - EMAIL_OTP_VALIDITY_SECONDS * 1000,
    );
    const secondsSinceSent = (now - otpSentAt) / 1000;

    const cooldownSeconds = isResend
      ? RESEND_COOLDOWN_SECONDS
      : INITIAL_COOLDOWN_SECONDS;

    if (secondsSinceSent < cooldownSeconds) {
      const waitTime = Math.ceil(cooldownSeconds - secondsSinceSent);
      const err = new Error(
        `Please wait ${waitTime} seconds before requesting a new OTP.`,
      );
      err.code = "OTP_COOLDOWN";
      err.waitTime = waitTime;
      throw err;
    }
  }

  // Check daily email OTP limit
  const limitCheck = await checkEmailOtpLimit(pending.email);
  if (!limitCheck.allowed) {
    const err = new Error(
      "Daily OTP limit reached for this email. Please try again tomorrow.",
    );
    err.code = "OTP_DAILY_LIMIT";
    throw err;
  }

  // Generate OTP
  const otp = generateOtp();
  const hash = await hashOtp(otp);

  // Store OTP hash
  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      email_otp_hash: hash,
      email_otp_expires: new Date(
        Date.now() + EMAIL_OTP_VALIDITY_SECONDS * 1000,
      ),
      email_otp_attempts: 0,
    },
  });

  // Send email notification
  await notify({
    type: NOTIFICATION_EVENTS.EMAIL_VERIFICATION_OTP,
    context: {
      email: pending.email,
      name: pending.first_name,
      otp,
      expires_in_minutes: EMAIL_OTP_VALIDITY_SECONDS / 60,
    },
  });

  return { success: true, timeout: EMAIL_OTP_VALIDITY_SECONDS };
}

export async function verifyEmailOtp(pending_id, otp) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!pending.email_otp_hash || !pending.email_otp_expires) {
    const err = new Error("OTP not requested");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > new Date(pending.email_otp_expires)) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Check attempt limit
  const attempts = pending.email_otp_attempts || 0;
  if (attempts >= MAX_OTP_ATTEMPTS) {
    const err = new Error(
      "Too many failed attempts. Please request a new OTP.",
    );
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  // Verify OTP
  const isValid = await verifyOtp(otp, pending.email_otp_hash);

  if (!isValid) {
    // Increment attempt counter
    await prisma.pendingUser.update({
      where: { pending_id },
      data: { email_otp_attempts: attempts + 1 },
    });

    const err = new Error("Invalid OTP");
    err.code = "INVALID_OTP";
    throw err;
  }

  // Success - clear OTP state and mark verified
  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      email_verified: true,
      email_otp_hash: null,
      email_otp_expires: null,
      email_otp_attempts: 0,
    },
  });

  return true;
}

// ============================================
// SMS OTP
// ============================================

export async function sendSmsOtp(pending_id, phone, isResend = false) {
  

  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Check if phone already registered
  const existingUser = await prisma.user.findFirst({
    where: { phone_number: phone },
    select: { user_id: true },
  });

  if (existingUser) {
    const err = new Error(
      "This phone number is already registered. Please login or use a different number.",
    );
    err.code = "PHONE_EXISTS";
    throw err;
  }

  // Check if phone pending by another user
  const existingPending = await prisma.pendingUser.findFirst({
    where: {
      phone,
      sms_verified: true,
      NOT: { pending_id },
    },
    select: { pending_id: true },
  });

  if (existingPending) {
    const err = new Error(
      "This phone number is already in use by another signup.",
    );
    err.code = "PHONE_PENDING_EXISTS";
    throw err;
  }

  // Check cooldown
  if (pending.sms_otp_expires) {
    const expiresAt = new Date(pending.sms_otp_expires);
    const now = new Date();

    const otpSentAt = new Date(
      expiresAt.getTime() - OTP_VALIDITY_SECONDS * 1000,
    );
    const secondsSinceSent = (now - otpSentAt) / 1000;

    const cooldownSeconds = isResend
      ? RESEND_COOLDOWN_SECONDS
      : INITIAL_COOLDOWN_SECONDS;

    if (secondsSinceSent < cooldownSeconds) {
      const waitTime = Math.ceil(cooldownSeconds - secondsSinceSent);
      const err = new Error(
        `Please wait ${waitTime} seconds before requesting a new OTP.`,
      );
      err.code = "OTP_COOLDOWN";
      err.waitTime = waitTime;
      throw err;
    }
  }

  // Check daily SMS limit
  const limitCheck = await checkSmsOtpLimit(phone);
  if (!limitCheck.allowed) {
    const err = new Error(
      "Daily OTP limit reached for this phone number. Please try again tomorrow.",
    );
    err.code = "OTP_DAILY_LIMIT";
    throw err;
  }

  

  // Generate OTP
  const otpLength = Number(process.env.SMS_OTP_LENGTH || 4);
  const otp = generateOtp(otpLength);
  const otpHash = await hashOtp(otp);

  // Send via MSG91
  await msg91SendSms({
    templateId: process.env.MSG91_PHONE_VERIFY_TEMPLATE,
    mobile: formatPhoneNumber(phone, process.env.MC_COUNTRY || "91"),
    variables: {
      name: pending.first_name || "User",
      number: otp,
    },
  });



  // Store OTP hash
  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      phone,
      sms_otp_hash: otpHash,
      sms_otp_expires: new Date(Date.now() + OTP_VALIDITY_SECONDS * 1000),
      sms_otp_attempts: 0,
    },
  });

 

  return { success: true, timeout: OTP_VALIDITY_SECONDS };
}

export async function verifySmsOtp(pending_id, code) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!pending.sms_otp_hash || !pending.sms_otp_expires) {
    const err = new Error("OTP not requested");
    err.code = "NO_OTP";
    throw err;
  }

  if (!pending.phone) {
    const err = new Error("Phone number not found");
    err.code = "NO_PHONE";
    throw err;
  }

  if (new Date() > new Date(pending.sms_otp_expires)) {
    const err = new Error("OTP expired");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Check attempt limit
  const attempts = pending.sms_otp_attempts || 0;
  if (attempts >= MAX_OTP_ATTEMPTS) {
    const err = new Error(
      "Too many failed attempts. Please request a new OTP.",
    );
    err.code = "TOO_MANY_ATTEMPTS";
    throw err;
  }

  // Verify OTP
  const isValid = await verifyOtp(code, pending.sms_otp_hash);

  if (!isValid) {
    // Increment attempt counter
    await prisma.pendingUser.update({
      where: { pending_id },
      data: { sms_otp_attempts: attempts + 1 },
    });

    const err = new Error("Invalid OTP");
    err.code = "INVALID_OTP";
    throw err;
  }

  // Success - clear OTP state and mark verified
  await prisma.pendingUser.update({
    where: { pending_id },
    data: {
      sms_verified: true,
      sms_otp_hash: null,
      sms_otp_expires: null,
      sms_otp_attempts: 0,
    },
  });

  return true;
}

// ============================================
// USERNAME
// ============================================

export async function setUsername(pending_id, username) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!pending.email_verified) {
    const err = new Error("Email must be verified before choosing username");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  if (!pending.sms_verified) {
    const err = new Error("Phone must be verified before choosing username");
    err.code = "PHONE_NOT_VERIFIED";
    throw err;
  }

  const existsInUsers = await prisma.user.findUnique({ where: { username } });
  if (existsInUsers) {
    const err = new Error("Username already taken");
    err.code = "USERNAME_EXISTS";
    throw err;
  }

  const existsInPending = await prisma.pendingUser.findFirst({
    where: { username, NOT: { pending_id } },
  });

  if (existsInPending) {
    const err = new Error("Username already reserved by another user");
    err.code = "USERNAME_PENDING_EXISTS";
    throw err;
  }

  await prisma.pendingUser.update({
    where: { pending_id },
    data: { username },
  });

  return true;
}

export async function checkUsernameAvailabilityWithSuggestions(username) {
  const normalizedUsername = username.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    select: { user_id: true },
  });

  const existingPending = await prisma.pendingUser.findFirst({
    where: { username: normalizedUsername },
    select: { pending_id: true },
  });

  const isTaken = !!(existingUser || existingPending);

  if (!isTaken) {
    return {
      available: true,
      username: normalizedUsername,
      suggestions: [],
    };
  }

  const suggestions = await generateAvailableUsernames(normalizedUsername, 4);

  return {
    available: false,
    username: normalizedUsername,
    suggestions,
  };
}

async function generateAvailableUsernames(baseUsername, count = 4) {
  const suggestions = [];
  const maxAttempts = 20;
  let attempts = 0;

  const generateVariations = (base) => {
    const variations = [];

    // Two digit suffix
    for (let i = 0; i < 5; i++) {
      variations.push(`${base}${Math.floor(Math.random() * 90 + 10)}`);
    }

    // Three digit suffix
    for (let i = 0; i < 5; i++) {
      variations.push(`${base}${Math.floor(Math.random() * 900 + 100)}`);
    }

    // Underscore + two digits
    for (let i = 0; i < 5; i++) {
      variations.push(`${base}_${Math.floor(Math.random() * 90 + 10)}`);
    }

    // Timestamp suffix
    const timestamp = Date.now().toString().slice(-4);
    variations.push(`${base}_${timestamp}`);

    return variations;
  };

  const variations = generateVariations(baseUsername);

  for (const variation of variations) {
    if (suggestions.length >= count || attempts >= maxAttempts) break;
    attempts++;

    const existsInUsers = await prisma.user.findUnique({
      where: { username: variation },
      select: { user_id: true },
    });

    const existsInPending = await prisma.pendingUser.findFirst({
      where: { username: variation },
      select: { pending_id: true },
    });

    if (
      !existsInUsers &&
      !existsInPending &&
      !suggestions.includes(variation)
    ) {
      suggestions.push(variation);
    }
  }

  return suggestions;
}

// ============================================
// FINALIZE SIGNUP
// ============================================

export async function finalizePendingSignup(pending_id, auditContext) {
  const pending = await prisma.pendingUser.findUnique({
    where: { pending_id },
  });

  if (!pending) {
    const err = new Error("Pending user not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!pending.email_verified) {
    const err = new Error("Email not verified");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  if (!pending.sms_verified) {
    const err = new Error("Phone not verified");
    err.code = "PHONE_NOT_VERIFIED";
    throw err;
  }

  if (!pending.username) {
    const err = new Error("Username required");
    err.code = "NO_USERNAME";
    throw err;
  }

  const userData = {
    first_name: pending.first_name,
    last_name: pending.last_name,
    full_name: `${pending.first_name} ${pending.last_name}`,
    email: pending.email,
    username: pending.username,
    phone_number: pending.phone,
    password_hash: pending.password_hash || null,
    login_provider: pending.login_provider || "password",
    role: "super_admin",
    status: "pending_setup",
    is_active: true,
  };

  if (pending.google_id) {
    userData.google_id = pending.google_id;
  }

  const user = await prisma.user.create({
    data: userData,
  });

  const shop = await prisma.shop.create({
    data: {
      owner_user_id: user.user_id,
      business_name: "",
      address_line_1: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { shop_id: shop.shop_id },
  });

  // AUDIT: Shop account created
  await audit.log({
    action: audit.AuditAction.SHOP_ACCOUNT_CREATED,
    entity_type: audit.EntityType.SHOP,
    entity_id: shop.shop_id,
    shop_id: shop.shop_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: user.user_id,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      phone_number: user.phone_number,
      login_provider: user.login_provider,
      pending_id,
    },
  });

  await prisma.pendingUser.delete({ where: { pending_id } });

  return { user, shop };
}
