// backend/src/modules/cadmin/admins/cadminAdmin.service.js (do not remove this comment)
// backend/src/modules/cadmin/admins/cadminAdmin.service.js

import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/hash.js";
import * as audit from "../../audit/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function formatStatus(isActive) {
  return isActive ? "Active" : "Inactive";
}

function formatDateTime(dt) {
  if (!dt) return "Never";
  const d = new Date(dt);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function deriveDisplayRole(admin) {
  if (admin.is_super_cadmin) return "Super Admin";

  const assignments = admin.roleAssignments ?? [];
  if (assignments.length === 0) return "No Role";

  const primary = assignments.find((a) => a.is_primary && !a.role.is_deleted);
  if (primary) return primary.role.name;

  const first = assignments.find((a) => !a.role.is_deleted);
  return first ? first.role.name : "No Role";
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD ADMIN SELECT
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_BASE_SELECT = {
  cadmin_id: true,
  name: true,
  username: true,
  phone_number: true,
  email: true,
  is_active: true,
  is_super_cadmin: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
  roleAssignments: {
    where: { role: { is_deleted: false } },
    select: {
      is_primary: true,
      assigned_at: true,
      role: {
        select: {
          role_id: true,
          name: true,
          is_deleted: true,
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminsService(query) {
  const { page, limit, search, status, role, sort, order } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (status === "active") where.is_active = true;
  if (status === "inactive") where.is_active = false;

if (role) {
  const normalized = role.toLowerCase().replace(/\s+/g, "_");

  if (normalized === "super_cadmin" || normalized === "super_admin") {
    where.is_super_cadmin = true;
  } else if (normalized === "no_role") {
    // Admins with zero active role assignments
    where.is_super_cadmin = false;
    where.roleAssignments = {
      none: {
        role: {
          is_deleted: false,
        },
      },
    };
  } else {
    where.roleAssignments = {
      some: {
        role: {
          name: { contains: role, mode: "insensitive" },
          is_deleted: false,
        },
      },
    };
  }
}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const SORT_MAP = {
    name: "name",
    username: "username",
    last_login_at: "last_login_at",
    created_at: "created_at",
  };
  const sortField = SORT_MAP[sort] ?? "created_at";
  const orderBy = { [sortField]: order ?? "desc" };

  const [total, admins] = await Promise.all([
    prisma.cAdmin.count({ where }),
    prisma.cAdmin.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: ADMIN_BASE_SELECT,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const data = admins.map((a) => ({
    id: a.cadmin_id,
    name: a.name,
    username: a.username,
    phone: a.phone_number,
    email: a.email || "",
    role: deriveDisplayRole(a),
    roles: a.roleAssignments.map((r) => ({
      role_id: r.role.role_id,
      name: r.role.name,
      is_primary: r.is_primary,
    })),
    is_super_cadmin: a.is_super_cadmin,
    status: formatStatus(a.is_active),
    lastLogin: formatDateTime(a.last_login_at),
    createdAt: formatDate(a.created_at),
  }));

  return {
    admins: data,
    meta: { total, page, limit, totalPages },
  };
}

export async function getAdminByIdService(id) {
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
    select: ADMIN_BASE_SELECT,
  });

  if (!admin) throw createError("Admin not found", 404);

  const activityLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { actor_id: id, actor_type: "cadmin" },
        { entity_id: id, entity_type: "cadmin" },
      ],
    },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      audit_id:    true,
      action:      true,
      actor_type:  true,
      actor_role:  true,
      entity_type: true,
      reason_code: true,
      metadata:    true,
      ip_address:  true,
      user_agent:  true,
      created_at:  true,
    },
  });

  return {
    id: admin.cadmin_id,
    name: admin.name,
    username: admin.username,
    phone: admin.phone_number,
    email: admin.email || "",
    role: deriveDisplayRole(admin),
    roles: admin.roleAssignments.map((r) => ({
      role_id:     r.role.role_id,
      name:        r.role.name,
      is_primary:  r.is_primary,
      assigned_at: r.assigned_at,
    })),
    is_super_cadmin: admin.is_super_cadmin,
    status:    formatStatus(admin.is_active),
    isActive:  admin.is_active,
    lastLogin: formatDateTime(admin.last_login_at),
    createdAt: formatDate(admin.created_at),
    updatedAt: formatDate(admin.updated_at),
    activityLogs: activityLogs.map((log) => ({
      id:          log.audit_id,
      action:      log.action,
      description: log.metadata?.event || log.action,
      changes:     null,          // AuditLog has no before/after changes field
      meta:        log.metadata,  // metadata goes here
      ipAddress:   log.ip_address,
      userAgent:   log.user_agent,
      createdAt:   log.created_at,
    })),
  };
}

export async function createAdminService(data, auditContext = {}) {
  const {
    name,
    username,
    phone,
    email,
    password,
    status,
    role_ids,
    primary_role_id,
  } = data;

  const existingUsername = await prisma.cAdmin.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (existingUsername) throw createError("Username already exists", 409);

  const existingEmail = await prisma.cAdmin.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingEmail) throw createError("Email already exists", 409);

  if (role_ids && role_ids.length > 0) {
    if (!primary_role_id) {
      throw createError(
        "primary_role_id is required when role_ids are provided",
        400,
      );
    }
    if (!role_ids.includes(primary_role_id)) {
      throw createError(
        "primary_role_id must be one of the role_ids provided",
        400,
      );
    }

    const validRoles = await prisma.cAdminCustomRole.findMany({
      where: { role_id: { in: role_ids }, is_deleted: false },
      select: { role_id: true },
    });
    if (validRoles.length !== role_ids.length) {
      throw createError(
        "One or more roles not found or have been deleted",
        404,
      );
    }
  }

  const password_hash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const admin = await tx.cAdmin.create({
      data: {
        name,
        username: username.toLowerCase(),
        phone_number: phone,
        email: email.toLowerCase(),
        password_hash,
        is_active: status === "Active",
        is_super_cadmin: false,
      },
      select: {
        cadmin_id:       true,
        name:            true,
        username:        true,
        phone_number:    true,
        email:           true,
        is_active:       true,
        is_super_cadmin: true,
        created_at:      true,
      },
    });

    if (role_ids && role_ids.length > 0) {
      await tx.cAdminRoleAssignment.createMany({
        data: role_ids.map((role_id) => ({
          cadmin_id:   admin.cadmin_id,
          role_id,
          is_primary:  role_id === primary_role_id,
          assigned_by: auditContext.actor_id || null,
        })),
      });
    }

    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       admin.cadmin_id,
        performed_by_id: auditContext.actor_id,
        action:          "admin_created",
        description:     "Admin account created",
        ip_address:      auditContext.ip_address,
        user_agent:      auditContext.user_agent,
      },
    });

    await audit.log(
      {
        action:      audit.AuditAction.CADMIN_CREATED,
        entity_type: audit.EntityType.CADMIN,
        entity_id:   admin.cadmin_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          username:             admin.username,
          email:                admin.email,
          role_ids_assigned:    role_ids ?? [],
          created_by_cadmin_id: auditContext.actor_id,
        },
      },
      { tx },
    );

    return admin;
  });

  return {
    id:              result.cadmin_id,
    name:            result.name,
    username:        result.username,
    phone:           result.phone_number,
    email:           result.email || "",
    is_super_cadmin: result.is_super_cadmin,
    role:            "No Role",
    status:          formatStatus(result.is_active),
    lastLogin:       "Never",
    createdAt:       formatDate(result.created_at),
  };
}

export async function updateAdminService(id, data, auditContext = {}) {
  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
  });
  if (!existing) throw createError("Admin not found", 404);

  const updateData = {};
  const changes = {};

  if (data.name !== undefined && data.name !== existing.name) {
    changes.name = { from: existing.name, to: data.name };
    updateData.name = data.name;
  }

  if (data.username !== undefined) {
    const newUsername = data.username.toLowerCase();
    if (newUsername !== existing.username) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          username: { equals: newUsername, mode: "insensitive" },
          NOT: { cadmin_id: id },
        },
      });
      if (dup) throw createError("Username already exists", 409);
      changes.username = { from: existing.username, to: newUsername };
      updateData.username = newUsername;
    }
  }

  if (data.phone !== undefined && data.phone !== existing.phone_number) {
    changes.phone = { from: existing.phone_number, to: data.phone };
    updateData.phone_number = data.phone;
  }

  if (data.email !== undefined) {
    const newEmail = data.email.toLowerCase();
    if (newEmail !== existing.email) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          email: { equals: newEmail, mode: "insensitive" },
          NOT: { cadmin_id: id },
        },
      });
      if (dup) throw createError("Email already exists", 409);
      changes.email = { from: existing.email, to: newEmail };
      updateData.email = newEmail;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError("No changes detected", 400);
  }

  const changedFields = Object.keys(changes).join(", ");

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cAdmin.update({
      where: { cadmin_id: id },
      data: updateData,
      select: ADMIN_BASE_SELECT,
    });

    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       id,
        performed_by_id: auditContext.actor_id,
        action:          "profile_updated",
        description:     `Updated: ${changedFields}`,
        changes,
        ip_address:      auditContext.ip_address,
        user_agent:      auditContext.user_agent,
      },
    });

    await audit.log(
      {
        action:      audit.AuditAction.CADMIN_PROFILE_UPDATED,
        entity_type: audit.EntityType.CADMIN,
        entity_id:   id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          changed_fields: Object.keys(changes),
          before: Object.fromEntries(
            Object.entries(changes).map(([k, v]) => [k, v.from]),
          ),
          after: Object.fromEntries(
            Object.entries(changes).map(([k, v]) => [k, v.to]),
          ),
          changed_by_cadmin_id: auditContext.actor_id,
        },
      },
      { tx },
    );

    return updated;
  });

  return {
    id:              result.cadmin_id,
    name:            result.name,
    username:        result.username,
    phone:           result.phone_number,
    email:           result.email || "",
    role:            deriveDisplayRole(result),
    roles:           result.roleAssignments.map((r) => ({
      role_id:    r.role.role_id,
      name:       r.role.name,
      is_primary: r.is_primary,
    })),
    is_super_cadmin: result.is_super_cadmin,
    status:          formatStatus(result.is_active),
    lastLogin:       formatDateTime(result.last_login_at),
    createdAt:       formatDate(result.created_at),
    updatedAt:       formatDate(result.updated_at),
  };
}

export async function toggleAdminAccessService(
  id,
  isActive,
  auditContext = {},
) {
  if (auditContext.actor_id === id && !isActive) {
    throw createError("Cannot deactivate your own account", 403);
  }

  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
    select: {
      cadmin_id:       true,
      name:            true,
      username:        true,
      is_active:       true,
      is_super_cadmin: true,
    },
  });
  if (!existing) throw createError("Admin not found", 404);

  if (existing.is_super_cadmin) {
    throw createError(
      "Super Admin accounts cannot be toggled through this endpoint. Use the Super Admin access endpoint.",
      403,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cAdmin.update({
      where: { cadmin_id: id },
      data: { is_active: isActive },
      select: {
        cadmin_id:       true,
        name:            true,
        username:        true,
        is_active:       true,
        is_super_cadmin: true,
      },
    });

    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       id,
        performed_by_id: auditContext.actor_id,
        action:          "status_changed",
        description:     isActive ? "Admin activated" : "Admin suspended",
        changes:         { is_active: { from: existing.is_active, to: isActive } },
        meta:            { performed_by: auditContext.actor_id },
        ip_address:      auditContext.ip_address,
        user_agent:      auditContext.user_agent,
      },
    });

    await audit.log(
      {
        action: isActive
          ? audit.AuditAction.CADMIN_ACTIVATED
          : audit.AuditAction.CADMIN_SUSPENDED,
        entity_type: audit.EntityType.CADMIN,
        entity_id:   id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          username:             updated.username,
          is_super_cadmin:      updated.is_super_cadmin,
          reason:               isActive ? "activated_by_admin" : "suspended_by_admin",
          changed_by_cadmin_id: auditContext.actor_id,
        },
      },
      { tx },
    );

    return updated;
  });

  return {
    id:       result.cadmin_id,
    name:     result.name,
    status:   formatStatus(result.is_active),
    isActive: result.is_active,
  };
}

export async function getAdminActivityService(adminId, query) {
  const { page, limit, action } = query;
  const skip = (page - 1) * limit;

  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: adminId },
    select: { cadmin_id: true },
  });
  if (!admin) throw createError("Admin not found", 404);

  const where = {
    OR: [
      { actor_id: adminId,  actor_type: "cadmin"  },
      { entity_id: adminId, entity_type: "cadmin" },
    ],
  };

  if (action) {
    where.action = {
      contains: action,
      mode: "insensitive",
    };
  }

  const [total, activities] = await Promise.all([
    prisma.auditLog.count({ where }),
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
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    activities: activities.map((a) => ({
      id:          a.audit_id,
      action:      a.action,
      actor_type:  a.actor_type,
      actor_role:  a.actor_role,
      entity_type: a.entity_type,
      entity_id:   a.entity_id,
      reason_code: a.reason_code,
      description: a.metadata?.event || a.action,
      changes:     null,          // AuditLog has no before/after changes field
      meta:        a.metadata,    // metadata goes here
      ipAddress:   a.ip_address,
      userAgent:   a.user_agent,
      createdAt:   a.created_at,
    })),
    meta: { total, page, limit, totalPages },
  };
}

export async function createSuperAdminService(data, auditContext = {}) {
  const { name, username, phone, email, password, status } = data;

  const existingUsername = await prisma.cAdmin.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (existingUsername) throw createError("Username already exists", 409);

  const existingEmail = await prisma.cAdmin.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingEmail) throw createError("Email already exists", 409);

  const password_hash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const admin = await tx.cAdmin.create({
      data: {
        name,
        username:        username.toLowerCase(),
        phone_number:    phone,
        email:           email.toLowerCase(),
        password_hash,
        is_active:       status === "Active",
        is_super_cadmin: true,
      },
      select: {
        cadmin_id:       true,
        name:            true,
        username:        true,
        phone_number:    true,
        email:           true,
        is_active:       true,
        is_super_cadmin: true,
        created_at:      true,
      },
    });

    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       admin.cadmin_id,
        performed_by_id: auditContext.actor_id,
        action:          "super_admin_created",
        description:     "Super Admin account created",
        ip_address:      auditContext.ip_address,
        user_agent:      auditContext.user_agent,
      },
    });

    await audit.log(
      {
        action:      audit.AuditAction.CADMIN_CREATED,
        entity_type: audit.EntityType.CADMIN,
        entity_id:   admin.cadmin_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          username:             admin.username,
          email:                admin.email,
          is_super_cadmin:      true,
          created_by_cadmin_id: auditContext.actor_id,
        },
      },
      { tx },
    );

    return admin;
  });

  return {
    id:              result.cadmin_id,
    name:            result.name,
    username:        result.username,
    phone:           result.phone_number,
    email:           result.email || "",
    is_super_cadmin: true,
    role:            "Super Admin",
    status:          formatStatus(result.is_active),
    lastLogin:       "Never",
    createdAt:       formatDate(result.created_at),
  };
}

export async function toggleSuperAdminAccessService(
  id,
  isActive,
  secret,
  auditContext = {},
) {
  if (auditContext.actor_id === id && !isActive) {
    throw createError("Cannot deactivate your own account", 403);
  }

  const expectedSecret = process.env.SUPER_ADMIN_DEACTIVATE_SECRET;
  if (!expectedSecret) {
    throw createError(
      "Super Admin access control is not configured. Contact your system administrator.",
      500,
    );
  }
  if (secret !== expectedSecret) {
    throw createError("Invalid secret. Access denied.", 403);
  }

  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
    select: {
      cadmin_id:       true,
      name:            true,
      username:        true,
      is_active:       true,
      is_super_cadmin: true,
    },
  });
  if (!existing) throw createError("Admin not found", 404);

  if (!existing.is_super_cadmin) {
    throw createError(
      "This endpoint is only for Super Admin accounts. Use the standard toggle endpoint.",
      400,
    );
  }

  if (!isActive) {
    const activeSuperAdmins = await prisma.cAdmin.count({
      where: { is_super_cadmin: true, is_active: true },
    });
    if (activeSuperAdmins <= 1) {
      throw createError("Cannot deactivate the last active Super Admin.", 400);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cAdmin.update({
      where: { cadmin_id: id },
      data: { is_active: isActive },
      select: {
        cadmin_id:       true,
        name:            true,
        username:        true,
        is_active:       true,
        is_super_cadmin: true,
      },
    });

    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       id,
        performed_by_id: auditContext.actor_id,
        action:          "super_admin_status_changed",
        description:     isActive
          ? "Super Admin account activated"
          : "Super Admin account deactivated",
        changes: { is_active: { from: existing.is_active, to: isActive } },
        meta: {
          performed_by:    auditContext.actor_id,
          required_secret: true,
        },
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
      },
    });

    await audit.log(
      {
        action: isActive
          ? audit.AuditAction.CADMIN_ACTIVATED
          : audit.AuditAction.CADMIN_SUSPENDED,
        entity_type: audit.EntityType.CADMIN,
        entity_id:   id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          username:             updated.username,
          is_super_cadmin:      true,
          reason:               isActive
            ? "super_admin_activated_with_secret"
            : "super_admin_deactivated_with_secret",
          changed_by_cadmin_id: auditContext.actor_id,
        },
      },
      { tx },
    );

    return updated;
  });

  return {
    id:       result.cadmin_id,
    name:     result.name,
    status:   formatStatus(result.is_active),
    isActive: result.is_active,
  };
}

// Add to cadminAdmin.service.js

export async function getAdminRolesService(id) {
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
    select: {
      cadmin_id:       true,
      is_super_cadmin: true,
      roleAssignments: {
        where: { role: { is_deleted: false } },
        select: {
          is_primary:  true,
          assigned_at: true,
          role: {
            select: {
              role_id: true,
              name:    true,
            },
          },
        },
        orderBy: { assigned_at: "asc" },
      },
    },
  });

  if (!admin) throw createError("Admin not found", 404);

  return {
    roles: admin.roleAssignments.map((a) => ({
      role_id:     a.role.role_id,
      name:        a.role.name,
      is_primary:  a.is_primary,
      assigned_at: a.assigned_at,
    })),
  };
}

export async function assignAdminRolesService(id, data, auditContext = {}) {
  const { role_ids, primary_role_id } = data;

  // Verify admin exists
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
    select: {
      cadmin_id:       true,
      is_super_cadmin: true,
      roleAssignments: {
        select: {
          role_id:    true,
          is_primary: true,
        },
      },
    },
  });
  if (!admin) throw createError("Admin not found", 404);

  // Super admins don't use role assignments
  if (admin.is_super_cadmin) {
    throw createError(
      "Super Admins cannot have custom role assignments.",
      400,
    );
  }

  // If assigning roles, verify they all exist and aren't deleted
  if (role_ids.length > 0) {
    const validRoles = await prisma.cAdminCustomRole.findMany({
      where: { role_id: { in: role_ids }, is_deleted: false },
      select: { role_id: true },
    });
    if (validRoles.length !== role_ids.length) {
      throw createError(
        "One or more roles not found or have been deleted.",
        404,
      );
    }
  }

  // Snapshot previous state for audit
  const previousRoleIds = admin.roleAssignments.map((a) => a.role_id);

  await prisma.$transaction(async (tx) => {
    // ── Delete ALL existing assignments for this admin ──────────────────
    await tx.cAdminRoleAssignment.deleteMany({
      where: { cadmin_id: id },
    });

    // ── Insert new assignments (skip if empty — removing all roles) ──────
    if (role_ids.length > 0) {
      await tx.cAdminRoleAssignment.createMany({
        data: role_ids.map((role_id) => ({
          cadmin_id:   id,
          role_id,
          is_primary:  role_id === primary_role_id,
          assigned_by: auditContext.actor_id ?? null,
        })),
      });
    }

    // ── Activity log ─────────────────────────────────────────────────────
    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       id,
        performed_by_id: auditContext.actor_id,
        action:          "roles_updated",
        description:
          role_ids.length === 0
            ? "All roles removed"
            : `Roles updated: ${role_ids.length} role(s) assigned`,
        changes: {
          before: previousRoleIds,
          after:  role_ids,
        },
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
      },
    });

    // ── Audit log ─────────────────────────────────────────────────────────
    await audit.log(
      {
        action:      audit.AuditAction.CADMIN_PROFILE_UPDATED,
        entity_type: audit.EntityType.CADMIN,
        entity_id:   id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          changed_fields:       ["roles"],
          previous_role_ids:    previousRoleIds,
          new_role_ids:         role_ids,
          new_primary_role_id:  primary_role_id ?? null,
          changed_by_cadmin_id: auditContext.actor_id,
        },
      },
      { tx },
    );
  });

  // Return fresh role list
  return getAdminRolesService(id);
}