// backend/src/modules/cadmin/mobile-users/cadminMobileUsers.service.js (do not remove this comment)
// backend/src/modules/cadmin/mobile-users/cadminMobileUsers.service.js

import prisma from "../../../config/prisma.js";
import crypto from "crypto";

function hashPhoneForTombstone(phone) {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

// ── Phone search helper ───────────────────────────────────────
/**
 * Given any phone input, returns all stored-format variants to
 * match against the DB. Handles:
 *   "8086415357"      → raw 10-digit
 *   "918086415357"    → with 91 prefix
 *   "+918086415357"   → with +91 prefix
 *   "+91 8086415357"  → with space (legacy bad saves)
 *
 * Returns null if the input doesn't look like a phone number.
 */
function expandPhoneVariants(query) {
  // Strip all spaces, dashes, parens first
  const cleaned = query.replace(/[\s\-()]/g, "");

  // Must look like a phone (digits only, optionally leading +)
  if (!/^\+?\d{7,15}$/.test(cleaned)) return null;

  // Extract raw 10-digit portion
  const raw10 = cleaned.replace(/^\+?91/, "");

  // Must be a valid Indian mobile number
  if (!/^[6-9]\d{9}$/.test(raw10)) return null;

  return [
    raw10,                  // 8086415357
    `+91${raw10}`,          // +918086415357   ← canonical stored format
    `91${raw10}`,           // 918086415357
    `+91 ${raw10}`,         // +91 8086415357  ← legacy bad saves
  ];
}

// ─────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────

export const listMobileUsers = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
}) => {
  const skip = (page - 1) * limit;

  // ── Build search WHERE ──
  let searchWhere = {};
  if (search) {
    const phoneVariants = expandPhoneVariants(search);

    if (phoneVariants) {
      // Phone search — match any stored format exactly,
      // OR partial contains for incomplete numbers typed by admin
      searchWhere = {
        OR: [
          { phone: { in: phoneVariants } },
          { phone: { contains: search.replace(/[\s\-()]/g, "") } },
        ],
      };
    } else {
      // Name / email search
      searchWhere = {
        OR: [
          { full_name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          // Also allow partial phone search for non-standard inputs
          { phone: { contains: search } },
        ],
      };
    }
  }

  const where = {
    deleted_at: null,
    ...searchWhere,
    ...(status === "active" ? { status: "active" } : {}),
    ...(status === "suspended" ? { status: "suspended" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.cureliMobileUser.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        phone: true,
        full_name: true,
        email: true,
        status: true,
        phone_verified: true,
        created_at: true,
        last_seen_at: true,
        suspended_at: true,
        suspension_reason: true,
        suspended_by: true,
        _count: {
          select: {
            sessions: true,
            addresses: true,
          },
        },
      },
    }),
    prisma.cureliMobileUser.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

// ─────────────────────────────────────────────
// GET DETAIL
// ─────────────────────────────────────────────

export const getMobileUserDetail = async (user_id) => {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: {
      id: true,
      phone: true,
      phone_verified: true,
      full_name: true,
      email: true,
      status: true,
      profile_image_key: true,
      referral_code: true,
      referred_by_code: true,
      suspended_at: true,
      suspension_reason: true,
      suspended_by: true,
      deleted_at: true,
      created_at: true,
      updated_at: true,
      last_seen_at: true,
      addresses: {
        where: { deleted_at: null },
        orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
        select: {
          id: true,
          label: true,
          custom_label: true,
          recipient_name: true,
          recipient_phone: true,
          address_line_1: true,
          address_line_2: true,
          landmark: true,
          city: true,
          state: true,
          pincode: true,
          is_default: true,
          created_at: true,
        },
      },
      sessions: {
        where: {
          is_active: true,
          expires_at: { gt: new Date() },
        },
        orderBy: { last_active_at: "desc" },
        select: {
          id: true,
          device_name: true,
          device_platform: true,
          device_os_version: true,
          app_version: true,
          ip_address: true,
          created_at: true,
          last_active_at: true,
          expires_at: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  return user;
};

// ─────────────────────────────────────────────
// EDIT PROFILE
// ─────────────────────────────────────────────

export const editMobileUser = async (user_id, data) => {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: { id: true, deleted_at: true },
  });

  if (!user) throw new Error("User not found");
  if (user.deleted_at) throw new Error("Cannot edit a deleted account");

  const updateData = {};

  if (data.full_name !== undefined) {
    const name = data.full_name?.trim();
    if (!name || name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }
    updateData.full_name = name;
  }

  if (data.email !== undefined) {
    const email = data.email?.trim() || null;

    if (email) {
      const taken = await prisma.cureliMobileUser.findFirst({
        where: {
          email,
          NOT: { id: user_id },
          deleted_at: null,
        },
        select: { id: true },
      });

      if (taken) {
        const err = new Error(
          "This email is already associated with another account"
        );
        err.code = "EMAIL_TAKEN";
        throw err;
      }
    }

    updateData.email = email;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields provided to update");
  }

  return prisma.cureliMobileUser.update({
    where: { id: user_id },
    data: { ...updateData, updated_at: new Date() },
    select: {
      id: true,
      phone: true,
      full_name: true,
      email: true,
      status: true,
      updated_at: true,
    },
  });
};

// ─────────────────────────────────────────────
// EDIT PHONE
// ─────────────────────────────────────────────

export const editMobileUserPhone = async (user_id, new_phone) => {
  const phone = new_phone?.trim();

  if (!phone) throw new Error("Phone number is required");

  const stripped = phone.replace(/^\+?91/, "").replace(/\s+/g, "");
  if (!/^[6-9]\d{9}$/.test(stripped)) {
    throw new Error("Invalid Indian mobile number");
  }

  const normalized = `+91${stripped}`;

  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: { id: true, deleted_at: true, phone: true },
  });

  if (!user) throw new Error("User not found");
  if (user.deleted_at) throw new Error("Cannot edit a deleted account");

  // Normalize existing stored phone too before comparing
  const currentNormalized = user.phone?.replace(/\s+/g, "");
  if (currentNormalized === normalized) {
    throw new Error("New phone number is the same as current");
  }

  // Check all variants aren't taken by another user
  const variants = expandPhoneVariants(normalized) || [normalized];
  const taken = await prisma.cureliMobileUser.findFirst({
    where: {
      phone: { in: variants },
      NOT: { id: user_id },
      deleted_at: null,
    },
    select: { id: true },
  });

  if (taken) {
    const err = new Error(
      "This phone number is already registered to another account"
    );
    err.code = "PHONE_TAKEN";
    throw err;
  }

  return prisma.cureliMobileUser.update({
    where: { id: user_id },
    data: {
      phone: normalized,
      phone_verified: false,
      phone_change_new: null,
      phone_change_otp_hash: null,
      phone_change_expires: null,
      updated_at: new Date(),
    },
    select: {
      id: true,
      phone: true,
      phone_verified: true,
      updated_at: true,
    },
  });
};

// ─────────────────────────────────────────────
// BLOCK / UNBLOCK
// ─────────────────────────────────────────────

export const setBlockStatus = async (
  user_id,
  block,
  reason = "",
  cadmin_name = "CAdmin"
) => {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: { id: true, status: true, deleted_at: true },
  });

  if (!user) throw new Error("User not found");
  if (user.deleted_at) throw new Error("Cannot modify a deleted account");

  if (block && user.status === "suspended") {
    const err = new Error("User is already suspended");
    err.code = "ALREADY_SUSPENDED";
    throw err;
  }

  if (!block && user.status === "active") {
    const err = new Error("User is already active");
    err.code = "ALREADY_ACTIVE";
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.cureliMobileUser.update({
      where: { id: user_id },
      data: {
        status: block ? "suspended" : "active",
        suspended_at: block ? new Date() : null,
        suspension_reason: block ? (reason || null) : null,
        suspended_by: block ? cadmin_name : null,
        updated_at: new Date(),
      },
      select: {
        id: true,
        full_name: true,
        phone: true,
        status: true,
        suspended_at: true,
        suspension_reason: true,
        suspended_by: true,
      },
    });

    if (block) {
      await tx.cureliMobileSession.updateMany({
        where: { user_id, is_active: true },
        data: {
          is_active: false,
          revoked_at: new Date(),
          revoked_reason: "cadmin_suspension",
        },
      });
    }

    return updated;
  });
};

// ─────────────────────────────────────────────
// FORCE REVOKE ALL SESSIONS
// ─────────────────────────────────────────────

export const forceRevokeAllSessions = async (user_id) => {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: { id: true, deleted_at: true },
  });

  if (!user) throw new Error("User not found");
  if (user.deleted_at) throw new Error("Cannot modify a deleted account");

  const result = await prisma.cureliMobileSession.updateMany({
    where: { user_id, is_active: true },
    data: {
      is_active: false,
      revoked_at: new Date(),
      revoked_reason: "cadmin_force_logout",
    },
  });

  await prisma.cureliMobileUser.update({
    where: { id: user_id },
    data: {
      logout_all_issued_at: new Date(),
      updated_at: new Date(),
    },
  });

  return { sessions_revoked: result.count };
};

// ─────────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────────

export const deleteMobileUserAccount = async (user_id, reason = "") => {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: {
      id: true,
      phone: true,
      full_name: true,
      email: true,
      created_at: true,
      deleted_at: true,
    },
  });

  if (!user) throw new Error("User not found");
  if (user.deleted_at) throw new Error("Account is already deleted");

  await prisma.$transaction(async (tx) => {
    const addressCount = await tx.cureliMobileAddress.count({
      where: { user_id },
    });

    await tx.cureliMobileDeletedAccount.create({
      data: {
        original_user_id: user.id,
        phone_hash: hashPhoneForTombstone(user.phone),
        full_name: user.full_name ?? null,
        email: user.email ?? null,
        deletion_reason: reason?.trim() || "cadmin_initiated",
        account_created_at: user.created_at,
        address_count: addressCount,
      },
    });

    await tx.cureliMobileUser.delete({
      where: { id: user_id },
    });
  });

  return { deleted: true, original_user_id: user_id };
};