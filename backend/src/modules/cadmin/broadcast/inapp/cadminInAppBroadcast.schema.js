// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.schema.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.schema.js

import { z } from "zod";
import { fail } from "../../../../utils/response.js";

// ============================================
// SHARED HELPERS
// ============================================

/**
 * Accepts true/false/1/0/"true"/"false" and coerces to boolean.
 * Needed because JSON.stringify(true) is fine but some paths
 * (query strings, nested Zod transforms) can produce strings.
 */
const booleanish = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    if (val === "true" || val === 1) return true;
    if (val === "false" || val === 0) return false;
    return Boolean(val);
  });

const attachmentSchema = z.object({
  type: z.enum(["link", "image", "video"]),
  url: z.string().min(1, "URL is required"),
  label: z.string().max(100).optional().nullable(),
  filename: z.string().optional().nullable(),
  original_name: z.string().optional().nullable(),
  size: z.number().optional().nullable(),
});

/**
 * Shared target_filters shape — used in preview, send-now, draft, update-draft.
 * All fields optional; audience flags default to undefined here so the service
 * can apply its own defaults.
 */
const targetFiltersSchema = z
  .object({
    shop_ids: z.array(z.string().uuid()).optional(),
    plan_ids: z.array(z.string().uuid()).optional(),
    registration_date_from: z.string().optional(),
    registration_date_to: z.string().optional(),
    roles: z.array(z.string()).optional(),
    cadmin_roles: z.array(z.string()).optional(),
    //  Accept boolean or boolean-coercible values
    includeUsers: booleanish.optional(),
    includeCAdmins: booleanish.optional(),
  })
  .optional()
  .default({});

// ============================================
// EXPORTED ZOD SCHEMAS
// ============================================

export const previewSchema = z.object({
  target_filters: targetFiltersSchema,
  include_details: z.boolean().optional().default(true),
});

export const sendNowSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must not exceed 500 characters"),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  target_filters: targetFiltersSchema,
  attachments: z
    .array(attachmentSchema)
    .max(1, "Only 1 attachment allowed")
    .optional()
    .default([]),
  action_url: z.string().optional().nullable().default(""),
  action_label: z.string().max(100).optional().nullable().default(""),
  expires_in_hours: z
    .union([z.coerce.number().positive(), z.literal(""), z.null()])
    .optional(),
  // Top-level audience flags (also accepted inside target_filters for compatibility)
  target_users: booleanish.optional().default(true),
  target_cadmins: booleanish.optional().default(false),
});

// Draft has the exact same shape as send-now
export const draftSchema = sendNowSchema;

export const updateDraftSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  message: z.string().trim().min(10).max(500).optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  //  updateDraft also needs audience flags so recipient_count stays accurate
  target_filters: z
    .object({
      shop_ids: z.array(z.string().uuid()).optional(),
      plan_ids: z.array(z.string().uuid()).optional(),
      registration_date_from: z.string().optional(),
      registration_date_to: z.string().optional(),
      roles: z.array(z.string()).optional(),
      cadmin_roles: z.array(z.string()).optional(),
      includeUsers: booleanish.optional(),
      includeCAdmins: booleanish.optional(),
    })
    .optional(),
  attachments: z
    .array(attachmentSchema)
    .max(1, "Only 1 attachment allowed")
    .optional(),
  action_url: z.string().optional().nullable(),
  action_label: z.string().max(100).optional().nullable(),
  target_users: booleanish.optional(),
  target_cadmins: booleanish.optional(),
});

export const scheduleSchema = z.object({
  scheduled_for: z
    .string()
    .datetime({ message: "scheduled_for must be a valid ISO 8601 datetime" }),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
});

export const segmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  filters: z.record(z.any()),
});

export const templateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  title: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(500),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  attachments: z
    .array(attachmentSchema)
    .max(1, "Only 1 attachment allowed")
    .optional()
    .default([]),
});

// ============================================
// LEGACY VALIDATION MIDDLEWARE
// (kept for backward-compat; prefer validateBody() in routes)
// ============================================

export function validatePreview(req, res, next) {
  const result = previewSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Validation failed", 400, {
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validated = result.data;
  return next();
}

export function validateSendImmediate(req, res, next) {
  const result = sendNowSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Validation failed", 400, {
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validated = result.data;
  return next();
}

export function validateCreateDraft(req, res, next) {
  const result = draftSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Validation failed", 400, {
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validated = result.data;
  return next();
}

export function validateUpdateDraft(req, res, next) {
  const result = updateDraftSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Validation failed", 400, {
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validated = result.data;
  return next();
}

export function validateSchedule(req, res, next) {
  const result = scheduleSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Validation failed", 400, {
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validated = result.data;
  return next();
}

export function validatePagination(req, res, next) {
  const result = paginationSchema.safeParse(req.query);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}
