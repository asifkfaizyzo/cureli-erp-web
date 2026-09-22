// src/modules/mobile/users/mobile.users.service.js

import prisma from "../../../config/prisma.js";
import crypto from "crypto";
import { generateOtp, hashOtp, verifyOtp } from "../../../utils/otp.js";
import {
  msg91SendSms,
  formatPhoneNumber,
} from "../../../providers/msg91/sendSms.js";
import { notifyAsync } from "../../notifications/notification.service.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";

const DELETE_OTP_EXPIRY_MINUTES = 10;

const MAX_ADDRESSES = 10;

function hashPhoneForTombstone(phone) {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

// ── Profile ───────────────────────────────────────────────────

/**
 * Update user profile fields.
 * Only updates fields that are explicitly provided.
 *
 * @param {string} userId
 * @param {Object} fields - validated subset of { full_name, email, profile_image_key }
 * @returns {Promise<Object>} updated user (safe fields)
 */
export async function updateMobileProfile(userId, fields) {
  if (!fields || Object.keys(fields).length === 0) {
    const err = new Error("No fields provided to update.");
    err.code = "NO_FIELDS";
    throw err;
  }

  // If email is being updated, check uniqueness
  if (fields.email !== undefined && fields.email !== null) {
    const existing = await prisma.cureliMobileUser.findFirst({
      where: {
        email: fields.email,
        NOT: { id: userId },
        deleted_at: null,
      },
    });

    if (existing) {
      const err = new Error(
        "This email is already associated with another account.",
      );
      err.code = "EMAIL_TAKEN";
      throw err;
    }
  }

  // ── Fetch current email BEFORE update (for welcome email detection) ──
  const currentUser = await prisma.cureliMobileUser.findUnique({
    where: { id: userId },
    select: { email: true, full_name: true },
  });
  const oldEmail = currentUser?.email ?? null;

  // Coerce date_of_birth string → Date if present
  const dataToWrite = { ...fields };
  if (dataToWrite.date_of_birth) {
    dataToWrite.date_of_birth = new Date(dataToWrite.date_of_birth);
  }

  // Write the update first
  const updated = await prisma.cureliMobileUser.update({
    where: { id: userId },
    data: {
      ...dataToWrite,
      updated_at: new Date(),
    },
    select: {
      id: true,
      phone: true,
      phone_verified: true,
      email: true,
      full_name: true,
      date_of_birth: true,
      sex: true,
      profile_complete: true,
      profile_image_key: true,
      status: true,
      referral_code: true,
      created_at: true,
      updated_at: true,
      last_seen_at: true,
    },
  });

  // Check if profile is now complete — set flag if not already set
  if (
    !updated.profile_complete &&
    updated.full_name &&
    updated.date_of_birth &&
    updated.sex
  ) {
    await prisma.cureliMobileUser.update({
      where: { id: userId },
      data: { profile_complete: true },
    });
    updated.profile_complete = true;
  }

  const newEmail = updated.email;
  if (!oldEmail && newEmail) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.MOBILE_USER_WELCOME,
      audience: [
        {
          email: newEmail,
          name: updated.full_name || "there",
        },
      ],
      context: {
        recipientName: updated.full_name || "there",
      },
    });
  }

  return updated;
}


// ── Addresses ─────────────────────────────────────────────────

/**
 * List all non-deleted addresses for a user.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function listMobileAddresses(userId) {
  return prisma.cureliMobileAddress.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
    },
    orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
  });
}

/**
 * Create a new address.
 * If is_default is true, clears default flag from all other addresses first.
 *
 * @param {string} userId
 * @param {Object} data - validated address fields
 * @returns {Promise<Object>} created address
 */
export async function createMobileAddress(userId, data) {
  // Enforce address cap
  const count = await prisma.cureliMobileAddress.count({
    where: { user_id: userId, deleted_at: null },
  });

  if (count >= MAX_ADDRESSES) {
    const err = new Error(
      `You can save a maximum of ${MAX_ADDRESSES} addresses.`,
    );
    err.code = "ADDRESS_LIMIT";
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    // If this should be default, clear existing defaults
    if (data.is_default) {
      await tx.cureliMobileAddress.updateMany({
        where: { user_id: userId, deleted_at: null },
        data: { is_default: false },
      });
    }

    // If this is the user's very first address, make it default automatically
    const isFirst = count === 0;

    return tx.cureliMobileAddress.create({
      data: {
        user_id: userId,
        label: data.label,
        custom_label: data.custom_label ?? null,
        recipient_name: data.recipient_name ?? null,
        recipient_phone: data.recipient_phone ?? null,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2 ?? null,
        landmark: data.landmark ?? null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        is_default: data.is_default || isFirst,
      },
    });
  });
}

/**
 * Update an existing address.
 * Only updates provided fields.
 *
 * @param {string} userId
 * @param {string} addressId
 * @param {Object} data - validated partial address fields
 * @returns {Promise<Object>} updated address
 */
export async function updateMobileAddress(userId, addressId, data) {
  // Confirm ownership and existence
  const address = await prisma.cureliMobileAddress.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
  });

  if (!address) {
    const err = new Error("Address not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    // If setting as default, clear other defaults first
    if (data.is_default === true) {
      await tx.cureliMobileAddress.updateMany({
        where: {
          user_id: userId,
          deleted_at: null,
          NOT: { id: addressId },
        },
        data: { is_default: false },
      });
    }

    return tx.cureliMobileAddress.update({
      where: { id: addressId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  });
}

/**
 * Set an address as default.
 * Convenience endpoint — same as updateAddress with { is_default: true }.
 *
 * @param {string} userId
 * @param {string} addressId
 * @returns {Promise<Object>} updated address
 */
export async function setDefaultMobileAddress(userId, addressId) {
  const address = await prisma.cureliMobileAddress.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
  });

  if (!address) {
    const err = new Error("Address not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    await tx.cureliMobileAddress.updateMany({
      where: { user_id: userId, deleted_at: null },
      data: { is_default: false },
    });

    return tx.cureliMobileAddress.update({
      where: { id: addressId },
      data: { is_default: true },
    });
  });
}

/**
 * Soft delete an address.
 * If the deleted address was default, promotes the oldest remaining address.
 *
 * @param {string} userId
 * @param {string} addressId
 * @returns {Promise<void>}
 */
export async function deleteMobileAddress(userId, addressId) {
  const address = await prisma.cureliMobileAddress.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
  });

  if (!address) {
    const err = new Error("Address not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    // Soft delete
    await tx.cureliMobileAddress.update({
      where: { id: addressId },
      data: { deleted_at: new Date(), is_default: false },
    });

    // If this was the default, promote the next oldest address
    if (address.is_default) {
      const next = await tx.cureliMobileAddress.findFirst({
        where: {
          user_id: userId,
          deleted_at: null,
          NOT: { id: addressId },
        },
        orderBy: { created_at: "asc" },
      });

      if (next) {
        await tx.cureliMobileAddress.update({
          where: { id: next.id },
          data: { is_default: true },
        });
      }
    }
  });
}

// ── Account Deletion ──────────────────────────────────────────

export async function sendDeleteAccountOtp(userId) {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      status: true,
    },
  });

  if (!user) {
    const err = new Error("User not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (user.status !== "active") {
    const err = new Error("Account is not active.");
    err.code = "ACCOUNT_INACTIVE";
    throw err;
  }

  const otp = generateOtp(6);
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(
    Date.now() + DELETE_OTP_EXPIRY_MINUTES * 60 * 1000,
  );

  // 🔑 Development terminal log — always visible in console
  console.log(`\n========================================`);
  console.log(`🔑 [DELETE ACCOUNT OTP] User ID: ${userId}`);
  console.log(`🔑 [OTP CODE]           : ${otp}`);
  console.log(`========================================\n`);

  // Store OTP hash on user row
  await prisma.cureliMobileUser.update({
    where: { id: userId },
    data: {
      delete_otp_hash: otpHash,
      delete_otp_expires: expiresAt,
    },
  });

  const formattedNumber = formatPhoneNumber(user.phone, process.env.MC_COUNTRY || "91");
  console.log(`📨 [MSG91] Dispatching deletion OTP to: "${formattedNumber}" using template: "${process.env.MSG91_ACC_DEL_TEMPLATE}"`);

  try {
    await msg91SendSms({
      templateId: process.env.MSG91_ACC_DEL_TEMPLATE,
      mobile: formattedNumber,
      // Provide all common MSG91 template variable keys so it matches your DLT template
      variables: {
        number: otp,
        otp:    otp,
        OTP:    otp,
        code:   otp,
        var:    otp,
        VAR1:   otp,
      },
    });
  } catch (providerErr) {
    // Clear stored hash if dispatch fails
    await prisma.cureliMobileUser.update({
      where: { id: userId },
      data: {
        delete_otp_hash: null,
        delete_otp_expires: null,
      },
    });
    console.error("❌ [DeleteAccountAuth] MSG91 send failed:", providerErr.message);
    const err = new Error("Failed to send verification code. Please try again.");
    err.code = "SMS_FAILED";
    throw err;
  }

  return { expiresIn: DELETE_OTP_EXPIRY_MINUTES * 60 };
}

/**
 * Verify the deletion OTP and permanently delete the account.
 *
 * Flow (all in one transaction):
 *   1. Verify OTP against stored hash
 *   2. Count addresses for metadata
 *   3. Create tombstone record in CureliMobileDeletedAccount
 *   4. Hard delete CureliMobileUser
 *      → cascades: CureliMobileSession, CureliMobileAddress
 *
 * @param {string} userId
 * @param {string} otp - Plain OTP entered by user
 * @returns {Promise<void>}
 */
export async function confirmDeleteAccount(userId, otp) {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      full_name: true,
      email: true,
      status: true,
      created_at: true,
      delete_otp_hash: true,
      delete_otp_expires: true,
    },
  });

  if (!user) {
    const err = new Error("User not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  // ── OTP checks ────────────────────────────────────────────

  if (!user.delete_otp_hash || !user.delete_otp_expires) {
    const err = new Error("No deletion OTP found. Please request a new one.");
    err.code = "NO_OTP";
    throw err;
  }

  if (new Date() > user.delete_otp_expires) {
    // Clear expired OTP
    await prisma.cureliMobileUser.update({
      where: { id: userId },
      data: { delete_otp_hash: null, delete_otp_expires: null },
    });
    const err = new Error("OTP has expired. Please request a new one.");
    err.code = "OTP_EXPIRED";
    throw err;
  }

  // Dev bypass
  const isDev = process.env.NODE_ENV === "development";
  const isDevBypass = isDev && otp === "000000";

  if (!isDevBypass) {
    const valid = await verifyOtp(otp, user.delete_otp_hash);
    if (!valid) {
      const err = new Error("Incorrect OTP. Please try again.");
      err.code = "OTP_INVALID";
      throw err;
    }
  }

  // ── Delete in transaction ─────────────────────────────────

  await prisma.$transaction(async (tx) => {
    // Count addresses for tombstone metadata
    const addressCount = await tx.cureliMobileAddress.count({
      where: { user_id: userId },
    });

    // Create tombstone — survives the user deletion permanently
    await tx.cureliMobileDeletedAccount.create({
      data: {
        original_user_id: user.id,
        phone_hash: hashPhoneForTombstone(user.phone),
        full_name: user.full_name ?? null,
        email: user.email ?? null,
        deletion_reason: "user_requested",
        account_created_at: user.created_at,
        address_count: addressCount,
      },
    });

    // Hard delete the user row.
    // Cascades automatically delete:
    //   - CureliMobileSession (onDelete: Cascade)
    //   - CureliMobileAddress (onDelete: Cascade)
    await tx.cureliMobileUser.delete({
      where: { id: userId },
    });
  });
}