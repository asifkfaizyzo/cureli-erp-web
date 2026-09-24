// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.schema.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.schema.js

import { z } from "zod";

// ── Reusable primitives ───────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();

const inlineImageSchema = z
  .object({
    url: z.string().min(1, "URL is required"),
    filename: z.string().optional().nullable(),
    original_name: z.string().optional().nullable(),
    size: z.number().optional().nullable(),
  })
  .optional()
  .nullable();

const attachmentSchema = z.object({
  url: z.string().min(1, "URL is required"),
  filename: z.string().optional().nullable(),
  original_name: z.string().optional().nullable(),
  size: z.number().optional().nullable(),
  mime_type: z.string().optional().nullable(),
});

/**
 * target_filters shape.
 *
 * cadmin_roles is now z.array(z.string()) — no hardcoded enum.
 * Values come from CAdminCustomRole.name in the DB (dynamic).
 * The service validates them implicitly by querying the DB.
 */
const targetFiltersSchema = z
  .object({
    shop_ids: z.array(uuidSchema).optional().default([]),
    plan_ids: z.array(uuidSchema).optional().default([]),
    filter_mode: z.enum(["AND", "OR"]).optional().default("OR"),
    registration_date_from: z.string().optional().nullable(),
    registration_date_to: z.string().optional().nullable(),
    //  Dynamic — any string is accepted; DB lookup filters unknown role names out naturally
    cadmin_roles: z.array(z.string()).optional().default([]),
  })
  .optional()
  .default({});

// ── Exported schemas ──────────────────────────────────────────────────────────

export const previewSchema = z.object({
  target_filters: targetFiltersSchema,
  target_users: z.boolean().optional().default(true),
  target_cadmins: z.boolean().optional().default(false),
});

export const createDraftSchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(3, "Subject must be at least 3 characters")
      .max(200, "Subject must not exceed 200 characters"),
    message_text: z
      .string()
      .trim()
      .min(10, "Message must be at least 10 characters"),
    target_filters: targetFiltersSchema,
    target_users: z.boolean().optional().default(true),
    target_cadmins: z.boolean().optional().default(false),
    inline_image: inlineImageSchema,
    attachments: z
      .array(attachmentSchema)
      .max(5, "Maximum 5 attachments")
      .optional()
      .default([]),
    action_url: z
      .string()
      .url("Invalid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    action_label: z
      .string()
      .max(100, "Button text too long")
      .optional()
      .nullable(),
  })
  .refine((d) => d.target_users || d.target_cadmins, {
    message: "At least one of target_users or target_cadmins must be true",
    path: ["target_users"],
  })
  .refine(
    (d) => !(d.action_url && d.action_url.length > 0 && !d.action_label),
    {
      message: "Button text is required when URL is provided",
      path: ["action_label"],
    },
  );

export const updateDraftSchema = z.object({
  subject: z.string().trim().min(3).max(200).optional(),
  message_text: z.string().trim().min(10).optional(),
  target_filters: targetFiltersSchema.optional(),
  target_users: z.boolean().optional(),
  target_cadmins: z.boolean().optional(),
  inline_image: inlineImageSchema,
  attachments: z.array(attachmentSchema).max(5).optional(),
  action_url: z
    .string()
    .url("Invalid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  action_label: z.string().max(100).optional().nullable(),
});

export const sendNowSchema = z
  .object({
    subject: z.string().trim().min(3).max(200),
    message_text: z.string().trim().min(10),
    target_filters: targetFiltersSchema,
    target_users: z.boolean().optional().default(true),
    target_cadmins: z.boolean().optional().default(false),
    inline_image: inlineImageSchema,
    attachments: z.array(attachmentSchema).max(5).optional().default([]),
    action_url: z
      .string()
      .url("Invalid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    action_label: z.string().max(100).optional().nullable(),
  })
  .refine((d) => d.target_users || d.target_cadmins, {
    message: "At least one of target_users or target_cadmins must be true",
    path: ["target_users"],
  });

export const scheduleSchema = z
  .object({
    scheduled_for: z
      .string()
      .datetime({ message: "Must be valid ISO 8601 datetime" }),
  })
  .refine((d) => new Date(d.scheduled_for) > new Date(), {
    message: "Scheduled time must be in the future",
    path: ["scheduled_for"],
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().optional().default(""),
});

export const testEmailSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message_text: z.string().trim().min(10),
  inline_image: inlineImageSchema,
  attachments: z.array(attachmentSchema).max(5).optional().default([]),
  action_url: z
    .string()
    .url("Invalid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  action_label: z.string().max(100).optional().nullable(),
});

export const addToSuppressionSchema = z.object({
  email: z.string().email("Invalid email format"),
  reason: z.string().max(500).optional().nullable(),
});

export const removeFromSuppressionSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// ── File validation constants ─────────────────────────────────────────────────

export const MAX_INLINE_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB per file
export const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB total

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export const BLOCKED_EXTENSIONS = [
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".msi",
  ".dll",
  ".scr",
  ".js",
  ".vbs",
  ".ps1",
  ".jar",
  ".py",
  ".rb",
];

export function validateFileUpload(file, isInlineImage = false) {
  const errors = [];
  if (!file) {
    errors.push("No file provided");
    return { valid: false, errors };
  }

  const maxSize = isInlineImage ? MAX_INLINE_IMAGE_SIZE : MAX_ATTACHMENT_SIZE;
  const allowedTypes = isInlineImage
    ? ALLOWED_IMAGE_TYPES
    : ALLOWED_ATTACHMENT_TYPES;

  if (file.size > maxSize) {
    errors.push(`File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed`);
  }

  const ext = "." + (file.originalname?.split(".").pop()?.toLowerCase() || "");
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    errors.push(`File extension ${ext} is blocked`);
  }

  return { valid: errors.length === 0, errors };
}

export default {
  previewSchema,
  createDraftSchema,
  updateDraftSchema,
  sendNowSchema,
  scheduleSchema,
  paginationSchema,
  testEmailSchema,
  addToSuppressionSchema,
  removeFromSuppressionSchema,
  validateFileUpload,
};
