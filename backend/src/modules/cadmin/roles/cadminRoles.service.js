// backend/src/modules/cadmin/roles/cadminRoles.service.js (do not remove this comment)
// backend/src/modules/cadmin/roles/cadminRoles.service.js

import prisma from "../../../config/prisma.js";
import { ALL_CADMIN_PERMISSION_KEYS } from "../../../config/cadminPermissions.js";
import * as audit from "../../audit/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Format a role row for API response
 */
function formatRole(role) {
  return {
    id: role.role_id,
    name: role.name,
    description: role.description || "",
    permissions: role.permissions,
    is_deleted: role.is_deleted,
    created_at: role.created_at,
    updated_at: role.updated_at,
    // included only when fetched with counts
    admin_count: role._count?.assignments ?? 0,
  };
}

/**
 * Format a full admin row that includes role assignments
 * Used when returning admin data after assignment changes
 */
function formatAdminRoles(assignments) {
  return assignments.map((a) => ({
    role_id: a.role.role_id,
    name: a.role.name,
    is_primary: a.is_primary,
    assigned_at: a.assigned_at,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all custom roles
 * Optionally include soft-deleted roles (for SUPER_CADMIN audit view)
 */
export async function listRolesService({
  include_deleted = false,
  search,
} = {}) {
  const where = {};

  if (!include_deleted) {
    where.is_deleted = false;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const roles = await prisma.cAdminCustomRole.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: {
          assignments: {
            where: {
              cadmin: {
                is_active: true, // ← only count active admins
              },
            },
          },
        },
      },
    },
  });

  return roles.map(formatRole);
}

/**
 * Get a single role by ID with full details including which admins have it
 */
export async function getRoleByIdService(role_id) {
  const role = await prisma.cAdminCustomRole.findUnique({
    where: { role_id },
    include: {
      _count: {
        select: { assignments: true },
      },
      assignments: {
        include: {
          cadmin: {
            select: {
              cadmin_id: true,
              name: true,
              username: true,
              is_active: true,
            },
          },
        },
        orderBy: { assigned_at: "desc" },
      },
    },
  });

  if (!role) {
    throw createError("Role not found", 404);
  }

  return {
    ...formatRole(role),
    admins: role.assignments.map((a) => ({
      cadmin_id: a.cadmin.cadmin_id,
      name: a.cadmin.name,
      username: a.cadmin.username,
      is_active: a.cadmin.is_active,
      is_primary: a.is_primary,
      assigned_at: a.assigned_at,
    })),
  };
}

/**
 * Create a new custom role
 */
export async function createRoleService(data, auditContext = {}) {
  const { name, description, permissions } = data;

  // Validate all permission strings against the registry
  const invalidPerms = permissions.filter(
    (p) => !ALL_CADMIN_PERMISSION_KEYS.includes(p),
  );
  if (invalidPerms.length > 0) {
    throw createError(`Invalid permissions: ${invalidPerms.join(", ")}`, 400);
  }

  // Check name uniqueness (across non-deleted roles)
  const existing = await prisma.cAdminCustomRole.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      is_deleted: false,
    },
  });
  if (existing) {
    throw createError("A role with this name already exists", 409);
  }

  // Deduplicate permissions before storing
  const uniquePermissions = [...new Set(permissions)];

  const role = await prisma.$transaction(async (tx) => {
    const created = await tx.cAdminCustomRole.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        permissions: uniquePermissions,
      },
    });

    await audit.log(
      {
        action: audit.AuditAction.CADMIN_ROLE_CHANGED,
        entity_type: audit.EntityType.CADMIN,
        entity_id: created.role_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          event: "role_created",
          role_name: created.name,
          permissions: uniquePermissions,
        },
      },
      { tx },
    );

    return created;
  });

  return formatRole(role);
}

/**
 * Update an existing role's name, description, or permissions
 * This immediately affects all admins assigned to this role
 * (permissions are re-computed on next request via requireCAdmin)
 */
export async function updateRoleService(role_id, data, auditContext = {}) {
  const existing = await prisma.cAdminCustomRole.findUnique({
    where: { role_id },
  });

  if (!existing) throw createError("Role not found", 404);
  if (existing.is_deleted)
    throw createError("Cannot update a deleted role", 400);

  const updateData = {};
  const changes = {};

  if (data.name !== undefined && data.name.trim() !== existing.name) {
    // Check name uniqueness excluding this role
    const dup = await prisma.cAdminCustomRole.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: "insensitive" },
        is_deleted: false,
        NOT: { role_id },
      },
    });
    if (dup) throw createError("A role with this name already exists", 409);

    changes.name = { from: existing.name, to: data.name.trim() };
    updateData.name = data.name.trim();
  }

  if (data.description !== undefined) {
    const newDesc = data.description?.trim() || null;
    if (newDesc !== existing.description) {
      changes.description = { from: existing.description, to: newDesc };
      updateData.description = newDesc;
    }
  }

  if (data.permissions !== undefined) {
    // Validate
    const invalidPerms = data.permissions.filter(
      (p) => !ALL_CADMIN_PERMISSION_KEYS.includes(p),
    );
    if (invalidPerms.length > 0) {
      throw createError(`Invalid permissions: ${invalidPerms.join(", ")}`, 400);
    }

    const uniquePermissions = [...new Set(data.permissions)];
    const currentSorted = [...existing.permissions].sort().join(",");
    const newSorted = [...uniquePermissions].sort().join(",");

    if (currentSorted !== newSorted) {
      changes.permissions = {
        from: existing.permissions,
        to: uniquePermissions,
      };
      updateData.permissions = uniquePermissions;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError("No changes detected", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.cAdminCustomRole.update({
      where: { role_id },
      data: updateData,
    });

    await audit.log(
      {
        action: audit.AuditAction.CADMIN_ROLE_CHANGED,
        entity_type: audit.EntityType.CADMIN,
        entity_id: role_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          event: "role_updated",
          role_name: result.name,
          changed_fields: Object.keys(changes),
          changes,
        },
      },
      { tx },
    );

    return result;
  });

  return formatRole(updated);
}

/**
 * Delete a role (soft delete)
 *
 * RULES:
 * - Cannot delete if any ACTIVE admin still has this role assigned
 * - If the role has assignments on inactive/deleted admins only, allow
 * - Soft-deleted roles no longer grant permissions (enforced in requireCAdmin)
 */
export async function deleteRoleService(role_id, auditContext = {}) {
  const existing = await prisma.cAdminCustomRole.findUnique({
    where: { role_id },
    include: {
      assignments: {
        include: {
          cadmin: {
            select: {
              cadmin_id: true,
              name: true,
              username: true,
              is_active: true,
            },
          },
        },
      },
    },
  });

  if (!existing) throw createError("Role not found", 404);
  if (existing.is_deleted) throw createError("Role is already deleted", 400);

  // Block if any ACTIVE admin still has this role
  const activeAssignments = existing.assignments.filter(
    (a) => a.cadmin.is_active,
  );

  if (activeAssignments.length > 0) {
    throw createError(
      `Cannot delete role. ${activeAssignments.length} active admin(s) are assigned to it. ` +
        `Reassign or deactivate them first.`,
      409,
      // Pass the list so the pharmacy-web can show who needs reassignment
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.cAdminCustomRole.update({
      where: { role_id },
      data: { is_deleted: true },
    });

    await audit.log(
      {
        action: audit.AuditAction.CADMIN_ROLE_CHANGED,
        entity_type: audit.EntityType.CADMIN,
        entity_id: role_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          event: "role_deleted",
          role_name: existing.name,
        },
      },
      { tx },
    );
  });

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all role assignments for a specific CAdmin
 */
export async function getAdminRolesService(cadmin_id) {
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id },
    select: {
      cadmin_id: true,
      name: true,
      username: true,
      is_super_cadmin: true,
      is_active: true,
      roleAssignments: {
        include: {
          role: {
            select: {
              role_id: true,
              name: true,
              permissions: true,
              is_deleted: true,
            },
          },
        },
        orderBy: { assigned_at: "desc" },
      },
    },
  });

  if (!admin) throw createError("Admin not found", 404);

  return {
    cadmin_id: admin.cadmin_id,
    name: admin.name,
    username: admin.username,
    is_super_cadmin: admin.is_super_cadmin,
    roles: formatAdminRoles(admin.roleAssignments),
  };
}

/**
 * Assign roles to a CAdmin — full replacement strategy
 *
 * This replaces ALL existing role assignments with the new set.
 * The primary_role_id must be one of the role_ids provided.
 *
 * RULES:
 * - Cannot assign roles to a SUPER_CADMIN (they are outside the system)
 * - All role_ids must exist and not be soft-deleted
 * - primary_role_id must be in role_ids
 */
export async function assignRolesService(cadmin_id, data, auditContext = {}) {
  const { role_ids, primary_role_id } = data;

  // Load target admin
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id },
    select: {
      cadmin_id: true,
      name: true,
      is_super_cadmin: true,
      is_active: true,
    },
  });

  if (!admin) throw createError("Admin not found", 404);

  if (admin.is_super_cadmin) {
    throw createError(
      "Cannot assign roles to a Super Admin — they have full access by default",
      400,
    );
  }

  // Only validate roles if we're actually assigning some
  if (role_ids.length > 0) {
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

    const roles = await prisma.cAdminCustomRole.findMany({
      where: { role_id: { in: role_ids }, is_deleted: false },
      select: { role_id: true, name: true },
    });

    if (roles.length !== role_ids.length) {
      const foundIds = roles.map((r) => r.role_id);
      const missingIds = role_ids.filter((id) => !foundIds.includes(id));
      throw createError(
        `Some roles not found or have been deleted: ${missingIds.join(", ")}`,
        404,
      );
    }
  }

  // Snapshot previous state for audit
  const previousAssignments = await prisma.cAdminRoleAssignment.findMany({
    where: { cadmin_id },
    select: { role_id: true, is_primary: true },
  });

  await prisma.$transaction(async (tx) => {
    // Delete all existing assignments
    await tx.cAdminRoleAssignment.deleteMany({ where: { cadmin_id } });

    // Only create new ones if role_ids is non-empty
    if (role_ids.length > 0) {
      await tx.cAdminRoleAssignment.createMany({
        data: role_ids.map((role_id) => ({
          cadmin_id,
          role_id,
          is_primary: role_id === primary_role_id,
          assigned_by: auditContext.actor_id || null,
        })),
      });
    }

    await audit.log(
      {
        action: audit.AuditAction.CADMIN_ROLE_CHANGED,
        entity_type: audit.EntityType.CADMIN,
        entity_id: cadmin_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          event: role_ids.length === 0 ? "all_roles_removed" : "roles_assigned",
          admin_name: admin.name,
          previous_role_ids: previousAssignments.map((a) => a.role_id),
          new_role_ids: role_ids,
          primary_role_id: primary_role_id ?? null,
        },
      },
      { tx },
    );
  });

  return getAdminRolesService(cadmin_id);
}

/**
 * Remove all role assignments from a CAdmin
 * Used when deactivating or before reassignment
 */
export async function removeAllRolesService(cadmin_id, auditContext = {}) {
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id },
    select: { cadmin_id: true, is_super_cadmin: true },
  });

  if (!admin) throw createError("Admin not found", 404);
  if (admin.is_super_cadmin) {
    throw createError("Cannot modify roles of a Super Admin", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.cAdminRoleAssignment.deleteMany({ where: { cadmin_id } });

    await audit.log(
      {
        action: audit.AuditAction.CADMIN_ROLE_CHANGED,
        entity_type: audit.EntityType.CADMIN,
        entity_id: cadmin_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          event: "all_roles_removed",
          cadmin_id,
        },
      },
      { tx },
    );
  });

  return { success: true };
}

/**
 * Get admins that would be affected if a role is deleted
 * Used by pharmacy-web to show the reassignment warning modal
 */
export async function getRoleDeletionImpactService(role_id) {
  const role = await prisma.cAdminCustomRole.findUnique({
    where: { role_id },
    select: {
      role_id: true,
      name: true,
      is_deleted: true,
      assignments: {
        include: {
          cadmin: {
            select: {
              cadmin_id: true,
              name: true,
              username: true,
              is_active: true,
            },
          },
        },
      },
    },
  });

  if (!role) throw createError("Role not found", 404);
  if (role.is_deleted) throw createError("Role is already deleted", 400);

  const active = role.assignments.filter((a) => a.cadmin.is_active);
  const inactive = role.assignments.filter((a) => !a.cadmin.is_active);

  return {
    role_id: role.role_id,
    role_name: role.name,
    can_delete: active.length === 0,
    active_admins: active.map((a) => ({
      cadmin_id: a.cadmin.cadmin_id,
      name: a.cadmin.name,
      username: a.cadmin.username,
    })),
    inactive_admins: inactive.map((a) => ({
      cadmin_id: a.cadmin.cadmin_id,
      name: a.cadmin.name,
      username: a.cadmin.username,
    })),
  };
}
