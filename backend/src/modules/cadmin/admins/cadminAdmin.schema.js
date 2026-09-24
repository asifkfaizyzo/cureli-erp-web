// backend/src/modules/cadmin/admins/cadminAdmin.schema.js (do not remove this comment)
// backend/src/modules/cadmin/admins/cadminAdmin.schema.js

import { z } from "zod";
import { fail } from "../../../utils/response.js";

// ============================================
// CONSTANTS
// ============================================

const ALLOWED_SORT_FIELDS = ["name", "username", "created_at", "last_login_at"];
const ALLOWED_SORT_ORDER = ["asc", "desc"];
const ALLOWED_STATUS = ["", "active", "inactive"];

// ============================================
// ZOD SCHEMAS
// ============================================

const getAdminsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().default(""),

  status: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => ALLOWED_STATUS.includes(v), {
      message: "Invalid status filter",
    })
    .default(""),

  role: z.string().trim().default(""),

  sort: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => !v || ALLOWED_SORT_FIELDS.includes(v), {
      message: `Sort must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`,
    })
    .default("created_at"),

  order: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => ALLOWED_SORT_ORDER.includes(v), {
      message: "Order must be 'asc' or 'desc'",
    })
    .default("desc"),
});

// ============================================
// SHARED PRIMITIVES
// ============================================

const uuidSchema = z.string().uuid("Invalid UUID format");

// ============================================
// ADMIN CRUD SCHEMAS
// ============================================

const createAdminSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    username: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
    email: z.string().trim().email(),
    password: z.string().min(8).max(50),
    status: z.enum(["Active", "Inactive"]).default("Active"),

    // Optional role assignment at creation time
    role_ids: z.array(uuidSchema).optional(),
    primary_role_id: uuidSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.role_ids && data.role_ids.length > 0) {
        return !!data.primary_role_id;
      }
      return true;
    },
    {
      message: "primary_role_id is required when role_ids are provided",
      path: ["primary_role_id"],
    },
  )
  .refine(
    (data) => {
      if (data.role_ids && data.primary_role_id) {
        return data.role_ids.includes(data.primary_role_id);
      }
      return true;
    },
    {
      message: "primary_role_id must be one of the role_ids provided",
      path: ["primary_role_id"],
    },
  );

const updateAdminSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/)
      .optional(),
    email: z.string().trim().email().optional(),
    // role is intentionally removed — use PUT /admins/:id/roles instead
  })
  .refine(
    (data) => Object.keys(data).filter((k) => data[k] !== undefined).length > 0,
    { message: "At least one field must be provided for update" },
  );

const toggleAccessSchema = z.object({
  is_active: z.boolean({ required_error: "is_active (boolean) is required" }),
});

const getActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().trim().default(""),
});

// ============================================
// ROLE ASSIGNMENT SCHEMA
// ============================================
// Handles both:
//   - Assigning roles  → role_ids: [uuid, ...], primary_role_id: uuid
//   - Removing all roles → role_ids: [],         primary_role_id: null
// ============================================

const assignAdminRolesSchema = z
  .object({
    role_ids: z
      .array(uuidSchema)
      .default([]),

    // z.preprocess avoids the union branch ambiguity where Zod tries the
    // uuidSchema branch first on a null value, fails, then may not fall
    // through to z.null() cleanly depending on Zod version.
    // This makes null unambiguously null before any type check runs.
    primary_role_id: z
      .preprocess(
        (val) => (val === undefined ? null : val),
        z.string().uuid("primary_role_id must be a valid UUID").nullable(),
      )
      .default(null),
  })
  .superRefine((data, ctx) => {
    const { role_ids, primary_role_id } = data;

    // Only enforce primary rules when roles are actually being assigned
    if (role_ids.length > 0) {
      if (!primary_role_id) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          message: "primary_role_id is required when role_ids are provided",
          path:    ["primary_role_id"],
        });
        return;
      }
      if (!role_ids.includes(primary_role_id)) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          message: "primary_role_id must be one of the provided role_ids",
          path:    ["primary_role_id"],
        });
      }
    }

    // role_ids is empty → removing all roles
    // primary_role_id: null is valid — no issue added
  });

// ============================================
// SUPER ADMIN SCHEMAS
// ============================================

// For creating a super admin — no role_ids, super admins don't use roles
const createSuperAdminSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  email: z.string().trim().email(),
  password: z.string().min(8).max(50),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

// For deactivating a super admin — requires secret confirmation
const toggleSuperAdminAccessSchema = z.object({
  is_active: z.boolean({ required_error: "is_active (boolean) is required" }),
  secret: z.string().min(1, "Secret is required"),
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export function validateGetAdminsQuery(req, res, next) {
  const result = getAdminsQuerySchema.safeParse(req.query);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateCreateAdmin(req, res, next) {
  const result = createAdminSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return fail(res, "Validation failed", 400, { errors });
  }
  req.validated = result.data;
  return next();
}

export function validateUpdateAdmin(req, res, next) {
  const result = updateAdminSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return fail(res, "Validation failed", 400, { errors });
  }
  req.validated = result.data;
  return next();
}

export function validateToggleAccess(req, res, next) {
  const result = toggleAccessSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateGetActivityQuery(req, res, next) {
  const result = getActivityQuerySchema.safeParse(req.query);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateAssignAdminRoles(req, res, next) {
  console.log("🟧 [SCHEMA] validateAssignAdminRoles input:");
  console.log("🟧 [SCHEMA] raw body:", JSON.stringify(req.body, null, 2));
  console.log("🟧 [SCHEMA] role_ids:", req.body.role_ids, "| type:", typeof req.body.role_ids, "| isArray:", Array.isArray(req.body.role_ids));
  console.log("🟧 [SCHEMA] primary_role_id:", req.body.primary_role_id, "| type:", typeof req.body.primary_role_id);

  const result = assignAdminRolesSchema.safeParse(req.body);

  if (!result.success) {
    
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join("."),
      message: e.message,
    }));
    return fail(res, "Validation failed", 400, { errors });
  }

  console.log("🟢 [SCHEMA] Zod validation PASSED");
  console.log("🟢 [SCHEMA] parsed result:", JSON.stringify(result.data, null, 2));
  req.validated = result.data;
  return next();
}

export function validateCreateSuperAdmin(req, res, next) {
  const result = createSuperAdminSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return fail(res, "Validation failed", 400, { errors });
  }
  req.validated = result.data;
  return next();
}

export function validateToggleSuperAdminAccess(req, res, next) {
  const result = toggleSuperAdminAccessSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}
