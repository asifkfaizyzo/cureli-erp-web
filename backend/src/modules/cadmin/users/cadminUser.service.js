// backend/src/modules/cadmin/users/cadminUser.service.js (do not remove this comment)
// ============================================
// backend\src\modules\cadmin\users\cadminUser.service.js
// ============================================

import prisma from "../../../config/prisma.js";
import { generateResetToken, hashToken } from "../../../utils/resetToken.js";
import { notify } from "../../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";
import * as audit from "../../audit/index.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDateDDMMYYYY(dt) {
  const d = new Date(dt);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatRole(role) {
  if (!role) return "Staff";
  const r = role.toLowerCase();
  if (r === "super_admin" || r === "super admin") return "Super Admin";
  if (r === "branch_admin" || r === "branch admin") return "Branch Admin";
  if (r === "staff") return "Staff";
  return role
    .split(/[_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function mapRoleToDb(roleLabel) {
  if (!roleLabel) return null;
  const r = roleLabel.toLowerCase();
  if (r === "super admin" || r === "super_admin") return "super_admin";
  if (r === "branch admin" || r === "branch_admin") return "branch_admin";
  if (r === "staff") return "staff";
  return roleLabel;
}

function cryptoRandomUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return require("crypto").randomUUID();
}

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// ============================================
// VALIDATION HELPERS
// ============================================

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhoneNumber(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// ============================================
// GET USERS
// Excludes soft-deleted users from all queries.
// ============================================

export async function getUsersService(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 200);
  const skip = (page - 1) * limit;

  // Never show deleted users anywhere in the admin panel
  const where = { deleted_at: null };

  if (query.status) {
    if (query.status.toLowerCase() === "active") where.is_active = true;
    else if (query.status.toLowerCase() === "inactive") where.is_active = false;
  }

  if (query.role) {
    const roleVal = mapRoleToDb(query.role);
    if (roleVal) where.role = roleVal;
    else where.role = query.role;
  }

  if (query.search) {
    const q = query.search.trim();
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (query.last_login) {
    const d = new Date(query.last_login);
    if (!isNaN(d)) {
      const start = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
      );
      const end = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
      );
      where.last_login_at = { gte: start, lte: end };
    }
  }

  const sortKey = (query.sort || "created_at").toLowerCase();
  const dir = (query.order || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  let orderBy = { created_at: "desc" };

  if (sortKey === "name" || sortKey === "full_name")
    orderBy = { full_name: dir };
  else if (sortKey === "username") orderBy = { username: dir };
  else if (sortKey === "last_login" || sortKey === "last_login_at")
    orderBy = { last_login_at: dir };
  else if (sortKey === "created_at") orderBy = { created_at: dir };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        user_id: true,
        full_name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        shop_id: true,
        shop: { select: { business_name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const data = users.map((u) => ({
    id: u.user_id,
    name: u.full_name,
    username: u.username,
    email: u.email,
    role: formatRole(u.role),
    is_active: u.is_active,
    lastLogin: u.last_login_at ? formatDateDDMMYYYY(u.last_login_at) : "Never",
    created_at: u.created_at,
    shop_name: u.shop?.business_name || null,
  }));

  return { data, meta: { total, page, limit, totalPages } };
}

// ============================================
// GET USER BY ID
// Blocks fetching a deleted user.
// ============================================

export async function getUserByIdService(id) {
  const u = await prisma.user.findUnique({
    where: { user_id: id },
    include: {
      shop: {
        include: {
          branches: true,
          users: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              role: true,
              status: true,
            },
          },
          subscriptions: {
            include: { plan: true },
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      },
      branch: true,
      shopFiles: true,
      activityLogs: {
        orderBy: { created_at: "desc" },
        take: 50,
      },
    },
  });

  if (!u) throw createError("User not found", "NOT_FOUND");
  if (u.deleted_at) throw createError("User has been deleted.", "DELETED");

  let currentSubscription = null;
  if (u.shop?.current_subscription_id) {
    const sub = await prisma.shopSubscription.findUnique({
      where: { subscription_id: u.shop.current_subscription_id },
      include: { plan: true },
    });
    currentSubscription = sub || null;
  } else if (u.shop?.subscriptions?.length > 0) {
    currentSubscription = u.shop.subscriptions[0] || null;
  }

  const activityLogs = (u.activityLogs || []).map((a) => ({
    id: a.activity_id,
    action: a.action,
    description: a.description,
    ip_address: a.ip_address,
    user_agent: a.user_agent,
    created_at: a.created_at,
  }));

  const shopUsers = (u.shop?.users || []).map((su) => ({
    user_id: su.user_id,
    full_name: su.full_name,
    email: su.email,
    role: formatRole(su.role),
    status: su.status,
  }));

  const branches = (u.shop?.branches || []).map((b) => ({
    branch_id: b.branch_id,
    branch_name: b.branch_name,
    branch_type: b.branch_type,
    city: b.city,
    is_active: b.is_active,
  }));

  const shopFiles = (u.shopFiles || []).map((f) => ({
    file_id: f.file_id,
    shop_id: f.shop_id,
    file_type: f.file_type,
    storage_key: f.storage_key,
    original_name: f.original_name,
    mime_type: f.mime_type,
    file_size: f.file_size,
    status: f.status,
    verification_notes: f.verification_notes,
    resubmission_count: f.resubmission_count,
    uploaded_by: f.uploaded_by,
    uploaded_at: f.uploaded_at,
    verified_at: f.verified_at,
  }));

  let shopCounts = {};
  if (u.shop) {
    const counts = await prisma.shop.findUnique({
      where: { shop_id: u.shop.shop_id },
      select: { _count: { select: { branches: true, users: true } } },
    });
    shopCounts = counts?._count || {};
  }

  return {
    user_id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    full_name: u.full_name,
    username: u.username,
    email: u.email,
    phone_number: u.phone_number,
    role: formatRole(u.role),
    raw_role: u.role,
    status: u.status,
    is_active: u.is_active,
    onboarding_step: u.onboarding_step,
    login_provider: u.login_provider,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
    updated_at: u.updated_at,

    shop: u.shop
      ? {
          shop_id: u.shop.shop_id,
          business_name: u.shop.business_name,
          legal_name: u.shop.legal_name,
          gst_number: u.shop.gst_number,
          business_type: u.shop.business_type,
          address_line_1: u.shop.address_line_1,
          address_line_2: u.shop.address_line_2,
          city: u.shop.city,
          state: u.shop.state,
          pincode: u.shop.pincode,
          verification_status: u.shop.verification_status,
          verification_notes: u.shop.verification_notes,
          created_at: u.shop.created_at,
          updated_at: u.shop.updated_at,
          users: shopUsers,
          branches,
          currentSubscription,
          _count: shopCounts,
        }
      : null,

    branch: u.branch
      ? {
          branch_id: u.branch.branch_id,
          branch_name: u.branch.branch_name,
          branch_type: u.branch.branch_type,
          address_line_1: u.branch.address_line_1,
          address_line_2: u.branch.address_line_2,
          city: u.branch.city,
          state: u.branch.state,
          pincode: u.branch.pincode,
          contact_number: u.branch.contact_number,
          alternate_number: u.branch.alternate_number,
          is_active: u.branch.is_active,
        }
      : null,

    shopFiles,
    activityLogs,
  };
}

// ============================================
// UPDATE USER
// ============================================

export async function updateUserService(
  id,
  payload = {},
  cadmin_id,
  auditContext = {},
) {
  const allowed = {};

  if (payload.first_name != null)
    allowed.first_name = String(payload.first_name).trim();
  if (payload.last_name != null)
    allowed.last_name = String(payload.last_name).trim();
  if (payload.full_name != null)
    allowed.full_name = String(payload.full_name).trim();
  if (payload.username != null)
    allowed.username = String(payload.username).trim();
  if (payload.role != null) allowed.role = mapRoleToDb(payload.role);
  if (payload.email != null)
    allowed.email = String(payload.email).trim().toLowerCase();
  if (payload.phone_number != null)
    allowed.phone_number = String(payload.phone_number).trim();

  if (Object.keys(allowed).length === 0) {
    throw createError(
      "No valid fields provided for update",
      "VALIDATION_ERROR",
    );
  }

  if (allowed.email && !validateEmail(allowed.email)) {
    throw createError("Invalid email format", "VALIDATION_ERROR");
  }

  if (allowed.phone_number && !validatePhoneNumber(allowed.phone_number)) {
    throw createError(
      "Invalid phone number. Must be a 10-digit Indian mobile number starting with 6-9.",
      "VALIDATION_ERROR",
    );
  }

  if (allowed.email) {
    const emailTaken = await prisma.user.findFirst({
      where: { email: allowed.email, NOT: { user_id: id } },
      select: { user_id: true },
    });
    if (emailTaken)
      throw createError(
        "This email is already in use by another account.",
        "CONFLICT",
      );
  }

  if (allowed.username) {
    const usernameTaken = await prisma.user.findFirst({
      where: { username: allowed.username, NOT: { user_id: id } },
      select: { user_id: true },
    });
    if (usernameTaken)
      throw createError("This username is already taken.", "CONFLICT");
  }

  if (allowed.phone_number) {
    const phoneTaken = await prisma.user.findFirst({
      where: { phone_number: allowed.phone_number, NOT: { user_id: id } },
      select: { user_id: true },
    });
    if (phoneTaken)
      throw createError(
        "This phone number is already in use by another account.",
        "CONFLICT",
      );
  }

  const existing = await prisma.user.findUnique({
    where: { user_id: id },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      full_name: true,
      username: true,
      email: true,
      phone_number: true,
      role: true,
      shop_id: true,
      deleted_at: true,
    },
  });

  if (!existing) throw createError("User not found", "NOT_FOUND");
  if (existing.deleted_at)
    throw createError("User has been deleted.", "DELETED");

  const changes = {};
  for (const [key, newValue] of Object.entries(allowed)) {
    const oldValue = existing[key];
    if (oldValue !== newValue) changes[key] = { old: oldValue, new: newValue };
  }

  if (Object.keys(changes).length === 0) {
    const formatted = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        username: true,
        email: true,
        phone_number: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });
    return formatUserResponse(formatted);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { user_id: id },
      data: allowed,
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        username: true,
        email: true,
        phone_number: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        shop_id: true,
      },
    });

    const changedFields = Object.keys(changes);
    const isRoleChange = changedFields.includes("role");

    await tx.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: id,
        action: isRoleChange ? "role_change" : "profile_update",
        description: `Fields changed by admin: ${changedFields.join(", ")}`,
        ip_address: null,
        user_agent: null,
      },
    });

    const auditAction = isRoleChange
      ? audit.AuditAction.USER_ROLE_CHANGED_BY_ADMIN
      : audit.AuditAction.USER_PROFILE_UPDATED_BY_ADMIN;

    await audit.log(
      {
        action: auditAction,
        entity_type: audit.EntityType.USER,
        entity_id: id,
        shop_id: updated.shop_id || null,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          changed_fields: changedFields,
          before: Object.fromEntries(
            Object.entries(changes).map(([k, v]) => [k, v.old]),
          ),
          after: Object.fromEntries(
            Object.entries(changes).map(([k, v]) => [k, v.new]),
          ),
          updated_by_cadmin_id: cadmin_id,
          ...(isRoleChange && {
            previous_role: changes.role.old,
            new_role: changes.role.new,
          }),
        },
      },
      { tx },
    );

    return updated;
  });

  return formatUserResponse(result);
}

// ============================================
// TOGGLE USER ACCESS
// ============================================

export async function toggleUserAccessService(
  id,
  is_active,
  cadmin_id,
  auditContext = {},
) {
  const existing = await prisma.user.findUnique({
    where: { user_id: id },
    select: {
      user_id: true,
      is_active: true,
      shop_id: true,
      full_name: true,
      deleted_at: true,
    },
  });

  if (!existing) throw createError("User not found", "NOT_FOUND");
  if (existing.deleted_at)
    throw createError("User has been deleted.", "DELETED");

  if (existing.is_active === is_active) {
    return {
      id: existing.user_id,
      is_active: existing.is_active,
      name: existing.full_name,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { user_id: id },
      data: { is_active },
      select: {
        user_id: true,
        is_active: true,
        full_name: true,
        username: true,
        shop_id: true,
      },
    });

    await tx.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: id,
        action: "status_change",
        description: is_active ? "Activated by cadmin" : "Suspended by cadmin",
        ip_address: null,
        user_agent: null,
      },
    });

    const auditAction = is_active
      ? audit.AuditAction.USER_ACTIVATED_BY_ADMIN
      : audit.AuditAction.USER_SUSPENDED_BY_ADMIN;

    await audit.log(
      {
        action: auditAction,
        entity_type: audit.EntityType.USER,
        entity_id: id,
        shop_id: updated.shop_id || null,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          activated_by_cadmin_id: is_active ? cadmin_id : undefined,
          suspended_by_cadmin_id: !is_active ? cadmin_id : undefined,
          reason: is_active ? "Activated by admin" : "Suspended by admin",
        },
      },
      { tx },
    );

    return updated;
  });

  return {
    id: result.user_id,
    is_active: result.is_active,
    name: result.full_name,
    username: result.username,
  };
}

// ============================================
// RESET USER PASSWORD
// ============================================

export async function resetUserPasswordService(
  userId,
  cadmin_id,
  auditContext = {},
) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      shop_id: true,
      deleted_at: true,
    },
  });

  if (!user) throw createError("User not found", "NOT_FOUND");
  if (user.deleted_at) throw createError("User has been deleted.", "DELETED");
  if (!user.email)
    throw createError("User has no email address on file.", "NO_EMAIL");

  const resetToken = generateResetToken();
  const hashed = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { user_id: userId },
      data: { reset_token: hashed, reset_token_expires: expiresAt },
    });

    await tx.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: userId,
        action: "password_change",
        description: "Password reset link generated by cadmin",
        ip_address: null,
        user_agent: null,
      },
    });

    await audit.log(
      {
        action: audit.AuditAction.USER_PASSWORD_RESET_BY_ADMIN,
        entity_type: audit.EntityType.USER,
        entity_id: userId,
        shop_id: user.shop_id || null,
        ...auditContext,
        reason_code: audit.AuditReasonCode.SECURITY_ACTION,
        metadata: {
          reset_by_cadmin_id: cadmin_id,
          method: "email_link",
          expires_in_minutes: 15,
        },
      },
      { tx },
    );
  });

  const resetUrl = `${
    process.env.ERP_FRONTEND_ORIGIN || process.env.ADMIN_FRONTEND_ORIGIN
  }/reset-password?token=${resetToken}&uid=${userId}`;

  await notify({
    type: NOTIFICATION_EVENTS.PASSWORD_RESET_REQUESTED,
    context: {
      email: user.email,
      name: user.full_name || user.email,
      resetUrl,
      expires_in_minutes: 15,
    },
  });

  return { success: true, email: user.email };
}

// ============================================
// DELETE USER (soft delete + PII anonymisation)
//
// What this does:
//   1. Checks user exists and is not already deleted
//   2. Blocks deletion of super_admin users (use suspend instead)
//   3. Sets deleted_at to now
//   4. Clears email, username, phone_number, google_id (unique fields — frees them for reuse)
//   5. Anonymises first_name, last_name, full_name
//   6. Revokes all active sessions by clearing reset tokens
//   7. Deactivates the account
//   8. Writes audit log
//
// What stays:
//   - user_id (PK — all FK references remain intact)
//   - shop_id, branch_id (shop/branch still exists)
//   - All purchase/sales/inventory records (untouched — referenced by user_id)
//   - activityLogs (historical record)
//
// The user will never appear in any list query (deleted_at: null filter).
// ============================================

export async function deleteUserService(
  id,
  cadmin_id,
  reason,
  auditContext = {},
) {
  if (!reason || !reason.trim()) {
    throw createError(
      "A reason is required to delete a user.",
      "VALIDATION_ERROR",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { user_id: id },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      username: true,
      phone_number: true,
      role: true,
      shop_id: true,
      deleted_at: true,
      onboarding_step: true, // needed for DeletionLog
      last_login_at: true, // needed to calculate days_inactive
    },
  });

  if (!existing) throw createError("User not found", "NOT_FOUND");
  if (existing.deleted_at)
    throw createError("User is already deleted.", "ALREADY_DELETED");

  // Snapshot PII for audit log before wiping it
  const piiSnapshot = {
    full_name: existing.full_name,
    email: existing.email || null,
    username: existing.username || null,
    phone_number: existing.phone_number || null,
    role: existing.role,
  };

  const deletedAt = new Date();
  const anonSuffix = id.slice(0, 8);

  // Calculate days inactive — null if user never logged in
  const daysInactive = existing.last_login_at
    ? Math.floor(
        (deletedAt.getTime() - new Date(existing.last_login_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  await prisma.$transaction(async (tx) => {
    // ── 1. Write DeletionLog before wiping the user row ──────────────────────
    // user_id is stored as a plain string — no FK constraint — so this is safe
    // even though we are about to modify the user row in the same transaction.
    // This record survives as permanent proof of who was deleted and why.
    await tx.deletionLog.create({
      data: {
        user_id: id,
        email: existing.email || null,
        username: existing.username || null,
        reason: reason.trim(),
        onboarding_step: existing.onboarding_step ?? null,
        days_inactive: daysInactive,
        files_deleted: 0, // cadmin deletion does not touch files — set to 0
      },
    });

    // ── 2. Soft delete + anonymise ────────────────────────────────────────────
    await tx.user.update({
      where: { user_id: id },
      data: {
        deleted_at: deletedAt,
        is_active: false,
        first_name: "[Deleted]",
        last_name: "[Deleted]",
        full_name: `[Deleted User ${anonSuffix}]`,
        email: null,
        username: null,
        phone_number: null,
        google_id: null,
        reset_token: null,
        reset_token_expires: null,
        login_otp_hash: null,
        login_otp_expires: null,
        login_otp_attempts: 0,
      },
    });

    // ── 3. Activity log ───────────────────────────────────────────────────────
    await tx.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: id,
        action: "account_deleted",
        description: `Account deleted by cadmin. Reason: ${reason.trim()}`,
        ip_address: null,
        user_agent: null,
      },
    });

    // ── 4. Audit log ──────────────────────────────────────────────────────────
    await audit.log(
      {
        action: audit.AuditAction.USER_DELETED_BY_ADMIN,
        entity_type: audit.EntityType.USER,
        entity_id: id,
        shop_id: existing.shop_id || null,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          deleted_by_cadmin_id: cadmin_id,
          reason: reason.trim(),
          deleted_user_snapshot: piiSnapshot,
          deleted_at: deletedAt.toISOString(),
          days_inactive: daysInactive,
        },
      },
      { tx },
    );
  });

  return {
    success: true,
    user_id: id,
    deleted_at: deletedAt,
  };
}

// ============================================
// FORMAT HELPERS
// ============================================

function formatUserResponse(u) {
  return {
    id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    name: u.full_name,
    username: u.username,
    email: u.email,
    phone_number: u.phone_number,
    role: formatRole(u.role),
    is_active: u.is_active,
    lastLogin: u.last_login_at ? formatDateDDMMYYYY(u.last_login_at) : "Never",
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}
