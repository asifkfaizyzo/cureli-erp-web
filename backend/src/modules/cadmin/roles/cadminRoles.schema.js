// backend/src/modules/cadmin/roles/cadminRoles.schema.js (do not remove this comment)
// backend/src/modules/cadmin/roles/cadminRoles.schema.js

import { z } from "zod";
import { ALL_CADMIN_PERMISSION_KEYS } from "../../../config/cadminPermissions.js";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED FIELD SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("Invalid UUID format");

const roleNameSchema = z
  .string({ required_error: "Role name is required" })
  .trim()
  .min(2, "Role name must be at least 2 characters")
  .max(50, "Role name must be at most 50 characters");

const roleDescriptionSchema = z
  .string()
  .trim()
  .max(200, "Description must be at most 200 characters");

const permissionKeySchema = z
  .string()
  .refine((value) => ALL_CADMIN_PERMISSION_KEYS.includes(value), {
    message: "One or more permissions are invalid",
  });

const permissionsSchema = z
  .array(permissionKeySchema, {
    required_error: "Permissions are required",
  })
  .min(1, "At least one permission must be selected");

// Safe boolean parser for query params like "true"/"false"
const queryBooleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return value;
}, z.boolean());

// ─────────────────────────────────────────────────────────────────────────────
// ROLE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: roleNameSchema,
  description: roleDescriptionSchema.optional(),
  permissions: permissionsSchema,
});

export const updateRoleSchema = z
  .object({
    name: roleNameSchema.optional(),
    description: roleDescriptionSchema.optional(),
    permissions: permissionsSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export const listRolesQuerySchema = z.object({
  include_deleted: queryBooleanSchema.default(false),
  search: z
    .string()
    .trim()
    .max(100, "Search must be at most 100 characters")
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const assignRolesSchema = z
  .object({
    role_ids: z.array(uuidSchema).default([]),

    primary_role_id: z
      .string()
      .uuid("Invalid UUID format")
      .nullish()
      .transform((v) => v ?? null)
      .default(null),
  })
  .superRefine((data, ctx) => {
    const { role_ids, primary_role_id } = data;

    if (role_ids.length > 0) {
      // When assigning roles, primary_role_id is required
      if (!primary_role_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "primary_role_id is required when role_ids are provided",
          path: ["primary_role_id"],
        });
        return;
      }
      // primary_role_id must be one of the provided role_ids
      if (!role_ids.includes(primary_role_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "primary_role_id must be one of the provided role_ids",
          path: ["primary_role_id"],
        });
      }
    }
    // role_ids empty + primary_role_id null = remove all roles, always valid
  });

export const deleteRoleSchema = z.object({
  // Required when deleting a role that has active admins assigned
  // pharmacy-web sends this after SUPER_CADMIN confirms reassignment flow
  // If omitted, backend will check and reject if admins are still assigned
  confirm: z
    .boolean()
    .optional()
    .refine((value) => value === undefined || value === true, {
      message: "confirm must be true",
    }),
});
