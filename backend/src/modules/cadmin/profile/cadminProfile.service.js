// backend/src/modules/cadmin/profile/cadminProfile.service.js (do not remove this comment)
// backend/src/modules/cadmin/profile/cadminProfile.service.js

import prisma from "../../../config/prisma.js";
import { hashPassword, comparePassword } from "../../../utils/hash.js";
import * as audit from "../../audit/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function logActivity({
  cadminId,
  performedById = null,
  action,
  description,
  changes = null,
  meta = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await prisma.cAdminActivityLog.create({
      data: {
        cadmin_id:       cadminId,
        performed_by_id: performedById,
        action,
        description,
        changes,
        meta,
        ip_address:      ipAddress,
        user_agent:      userAgent,
      },
    });
  } catch (err) {
    console.error("[activityLog] Failed to write log:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET MY PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyProfileService(cadminId) {
  const cadmin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: cadminId },
    select: {
      cadmin_id:       true,
      name:            true,
      username:        true,
      email:           true,
      phone_number:    true,
      is_active:       true,
      is_super_cadmin: true,
      last_login_at:   true,
      created_at:      true,
      roleAssignments: {
        where: { role: { is_deleted: false } },
        select: {
          is_primary: true,
          role: {
            select: {
              role_id:     true,
              name:        true,
              permissions: true,
            },
          },
        },
        orderBy: { assigned_at: "desc" },
      },
    },
  });

  if (!cadmin) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }

  let permissions = [];
  if (!cadmin.is_super_cadmin) {
    const permSet = new Set();
    for (const a of cadmin.roleAssignments) {
      for (const p of a.role.permissions) permSet.add(p);
    }
    permissions = Array.from(permSet);
  }

  let primary_role = "Super Admin";
  if (!cadmin.is_super_cadmin) {
    const primary = cadmin.roleAssignments.find((a) => a.is_primary);
    primary_role = primary
      ? primary.role.name
      : cadmin.roleAssignments[0]?.role.name ?? "No Role";
  }

  const roles = cadmin.roleAssignments.map((a) => ({
    role_id:    a.role.role_id,
    name:       a.role.name,
    is_primary: a.is_primary,
  }));

  const pendingCounts = await getPendingCountsService();

  return {
    profile: {
      id:              cadmin.cadmin_id,
      name:            cadmin.name,
      username:        cadmin.username,
      email:           cadmin.email,
      phone:           cadmin.phone_number,
      is_super_cadmin: cadmin.is_super_cadmin,
      primary_role,
      roles,
      permissions,
      isActive:        cadmin.is_active,
      lastLogin:       cadmin.last_login_at,
      createdAt:       cadmin.created_at,
    },
    pendingCounts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PENDING COUNTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingCountsService() {
  const now              = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    pendingDocuments,
    rejectedDocuments,
    expiringSubscriptions,
    pendingShops,
    overduePayments,
  ] = await Promise.all([
    prisma.shopFile.count({ where: { status: "uploaded" } }),
    prisma.shopFile.count({ where: { status: "rejected" } }),
    prisma.shopSubscription.count({
      where: {
        is_active: true,
        end_date:  { gte: now, lte: sevenDaysFromNow },
      },
    }),
    prisma.shop.count({ where: { verification_status: "pending_review" } }),
    prisma.paymentTransaction.count({
      where: { status: { in: ["failed", "pending"] } },
    }),
  ]);

  return {
    total:
      pendingDocuments + expiringSubscriptions + pendingShops + overduePayments,
    documents: {
      pending:  pendingDocuments,
      rejected: rejectedDocuments,
      total:    pendingDocuments + rejectedDocuments,
    },
    subscriptions: { expiringSoon: expiringSubscriptions },
    shops:         { pendingVerification: pendingShops },
    payments:      { overdue: overduePayments },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CONTACT INFO  (email + phone)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateContactService(cadminId, data, meta = {}) {
  const existing = await prisma.cAdmin.findUnique({
    where:  { cadmin_id: cadminId },
    select: { cadmin_id: true, email: true, phone_number: true },
  });
  if (!existing) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }

  const updateData = {};
  const changes    = {};

  if (data.email !== undefined) {
    const newEmail = data.email.trim().toLowerCase();
    if (newEmail !== (existing.email ?? "").toLowerCase()) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          email: { equals: newEmail, mode: "insensitive" },
          NOT:   { cadmin_id: cadminId },
        },
      });
      if (dup) {
        const err = new Error("Email already in use");
        err.status = 409;
        throw err;
      }
      changes.email      = { from: existing.email, to: newEmail };
      updateData.email   = newEmail;
    }
  }

  if (data.phone_number !== undefined && data.phone_number !== existing.phone_number) {
    changes.phone_number    = { from: existing.phone_number, to: data.phone_number };
    updateData.phone_number = data.phone_number;
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error("No changes detected");
    err.status = 400;
    throw err;
  }

  await prisma.cAdmin.update({
    where: { cadmin_id: cadminId },
    data:  updateData,
  });

  await logActivity({
    cadminId,
    performedById: cadminId,
    action:        "UPDATE_CONTACT",
    description:   `Updated contact info: ${Object.keys(changes).join(", ")}`,
    changes,
    ipAddress:     meta.ip,
    userAgent:     meta.ua,
  });

  await audit.log({
    action:      audit.AuditAction.CADMIN_PROFILE_UPDATED,
    entity_type: audit.EntityType.CADMIN,
    entity_id:   cadminId,
    actor_type:  "cadmin",
    actor_id:    cadminId,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    ip_address:  meta.ip ?? null,
    user_agent:  meta.ua ?? null,
    metadata: {
      changed_fields: Object.keys(changes),
      before: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.from])
      ),
      after: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.to])
      ),
      self_update: true,
    },
  });

  return { updated: Object.keys(updateData) };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE IDENTITY  (name + username)  — super admin only
// ─────────────────────────────────────────────────────────────────────────────

export async function updateIdentityService(cadminId, data, meta = {}) {
  const existing = await prisma.cAdmin.findUnique({
    where:  { cadmin_id: cadminId },
    select: { cadmin_id: true, name: true, username: true, is_super_cadmin: true },
  });
  if (!existing) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }

  if (!existing.is_super_cadmin) {
    const err = new Error("Only super admins can change name and username");
    err.status = 403;
    throw err;
  }

  const updateData = {};
  const changes    = {};

  if (data.name !== undefined) {
    const newName = data.name.trim();
    if (newName !== existing.name) {
      changes.name    = { from: existing.name, to: newName };
      updateData.name = newName;
    }
  }

  if (data.username !== undefined) {
    const newUsername = data.username.toLowerCase();
    if (newUsername !== existing.username) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          username: { equals: newUsername, mode: "insensitive" },
          NOT:      { cadmin_id: cadminId },
        },
      });
      if (dup) {
        const err = new Error("Username already taken");
        err.status = 409;
        throw err;
      }
      changes.username    = { from: existing.username, to: newUsername };
      updateData.username = newUsername;
    }
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error("No changes detected");
    err.status = 400;
    throw err;
  }

  await prisma.cAdmin.update({
    where: { cadmin_id: cadminId },
    data:  updateData,
  });

  await logActivity({
    cadminId,
    performedById: cadminId,
    action:        "UPDATE_IDENTITY",
    description:   `Updated identity: ${Object.keys(changes).join(", ")}`,
    changes,
    ipAddress:     meta.ip,
    userAgent:     meta.ua,
  });

  await audit.log({
    action:      audit.AuditAction.CADMIN_PROFILE_UPDATED,
    entity_type: audit.EntityType.CADMIN,
    entity_id:   cadminId,
    actor_type:  "cadmin",
    actor_id:    cadminId,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    ip_address:  meta.ip ?? null,
    user_agent:  meta.ua ?? null,
    metadata: {
      changed_fields: Object.keys(changes),
      before: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.from])
      ),
      after: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.to])
      ),
      self_update:      true,
      super_admin_only: true,
    },
  });

  return { updated: Object.keys(updateData) };
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

export async function changeMyPasswordService(
  cadminId,
  currentPassword,
  newPassword,
  meta = {}
) {
  const cadmin = await prisma.cAdmin.findUnique({
    where:  { cadmin_id: cadminId },
    select: { cadmin_id: true, password_hash: true },
  });
  if (!cadmin) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }

  const isValid = await comparePassword(currentPassword, cadmin.password_hash);
  if (!isValid) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }

  if (currentPassword === newPassword) {
    const err = new Error("New password must be different from current password");
    err.status = 400;
    throw err;
  }

  const newHash = await hashPassword(newPassword);
  await prisma.cAdmin.update({
    where: { cadmin_id: cadminId },
    data:  { password_hash: newHash },
  });

  await logActivity({
    cadminId,
    performedById: cadminId,
    action:        "CHANGE_PASSWORD",
    description:   "Password changed successfully",
    ipAddress:     meta.ip,
    userAgent:     meta.ua,
  });

  await audit.log({
    action:      audit.AuditAction.CADMIN_PASSWORD_RESET_COMPLETED,
    entity_type: audit.EntityType.CADMIN,
    entity_id:   cadminId,
    actor_type:  "cadmin",
    actor_id:    cadminId,
    reason_code: audit.AuditReasonCode.SECURITY_ACTION,
    ip_address:  meta.ip ?? null,
    user_agent:  meta.ua ?? null,
    metadata: {
      reset_method: "self_change",
      self_update:  true,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ACTIVITY LOGS  — reads from AuditLog (fixes missing login/logout events)
// ─────────────────────────────────────────────────────────────────────────────

export async function getActivityLogsService(cadminId, query) {
  const page  = Math.max(1,   parseInt(query.page,  10) || 1);
  const limit = Math.min(100, parseInt(query.limit, 10) || 15);
  const skip  = (page - 1) * limit;

  // Show events WHERE this cadmin is the actor OR the entity being acted upon
  const where = {
    OR: [
      { actor_id: cadminId, actor_type: "cadmin" },
      { entity_id: cadminId, entity_type: "cadmin" },
    ],
  };

  if (query.action && query.action.trim().length > 0) {
    where.action = {
      contains: query.action.trim(),
      mode:     "insensitive",
    };
  }

  if (query.from || query.to) {
    where.created_at = {};
    if (query.from) where.created_at.gte = new Date(query.from);
    if (query.to)   where.created_at.lte = new Date(query.to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      select: {
        audit_id:    true,
        action:      true,
        actor_type:  true,
        actor_role:  true,
        entity_type: true,
        entity_id:   true,
        reason_code: true,
        metadata:    true,
        ip_address:  true,
        user_agent:  true,
        created_at:  true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((l) => ({
      id:          l.audit_id,
      action:      l.action,
      actor_type:  l.actor_type,
      actor_role:  l.actor_role,
      entity_type: l.entity_type,
      entity_id:   l.entity_id,
      reason_code: l.reason_code,
      metadata:    l.metadata,
      ipAddress:   l.ip_address,
      userAgent:   l.user_agent,
      createdAt:   l.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext:    page * limit < total,
      hasPrev:    page > 1,
    },
  };
}