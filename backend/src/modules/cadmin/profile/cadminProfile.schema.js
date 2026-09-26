// backend/src/modules/cadmin/profile/cadminProfile.schema.js (do not remove this comment)
// backend/src/modules/cadmin/profile/cadminProfile.schema.js

import { z } from "zod";
import { fail } from "../../../utils/response.js";

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const updateContactSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").optional(),
    phone_number: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Must be 10 digits starting with 6-9")
      .optional(),
  })
  .refine(
    (data) => data.email !== undefined || data.phone_number !== undefined,
    { message: "At least one of email or phone_number must be provided" },
  );

const updateIdentitySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.username !== undefined, {
    message: "At least one of name or username must be provided",
  });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(50),
});

const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(15),
  action: z.string().trim().default(""),
});

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION MIDDLEWARE
// Same pattern as cadminAdmin.schema.js — safeParse → req.validated
// ─────────────────────────────────────────────────────────────────────────────

export function validateUpdateContact(req, res, next) {
  const result = updateContactSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateUpdateIdentity(req, res, next) {
  const result = updateIdentitySchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateChangePassword(req, res, next) {
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateActivityQuery(req, res, next) {
  const result = activityQuerySchema.safeParse(req.query);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  // page and limit are now guaranteed JS integers from z.coerce.number()
  req.validated = result.data;
  return next();
}
