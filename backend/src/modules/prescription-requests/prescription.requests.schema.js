// backend/src/modules/prescription-requests/prescription.requests.schema.js (do not remove this comment)
// backend/src/modules/prescription-requests/prescription.requests.schema.js

import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();

const pageParam = z.coerce.number().int().min(1).default(1);
const limitParam = z.coerce.number().int().min(1).max(50).default(20);

// ── Upload (single file key shape returned from upload endpoint) ──────────────

export const uploadedFileSchema = z.object({
  file_key:      z.string().min(1).max(500),
  original_name: z.string().min(1).max(255),
  mime_type:     z.string().min(1).max(100),
  file_size:     z.number().int().positive(),
});

// ── Submit prescription request ───────────────────────────────────────────────

export const submitRequestSchema = z.object({
  files: z
    .array(uploadedFileSchema)
    .min(1, 'At least one prescription file is required')
    .max(5, 'Maximum 5 prescription files allowed'),

  delivery_address_id: uuidSchema,

  search_latitude:  z.number().min(-90).max(90),
  search_longitude: z.number().min(-180).max(180),

  branch_ids: z
    .array(uuidSchema)
    .min(1, 'Select at least one pharmacy')
    .max(10, 'Maximum 10 pharmacies allowed'),
});

// ── Mobile list query ─────────────────────────────────────────────────────────

export const mobileListQuerySchema = z.object({
  page:  pageParam,
  limit: limitParam,
});

// ── ERP list query ────────────────────────────────────────────────────────────

export const erpListQuerySchema = z.object({
  status: z
    .enum(['SENT', 'QUOTE_SENT', 'ACCEPTED', 'CONVERTED', 'DECLINED', 'EXPIRED'])
    .optional(),
  page:  pageParam,
  limit: limitParam,
});

// ── Submit quote (ERP pharmacy) ───────────────────────────────────────────────

export const quoteItemSchema = z.object({
  listing_id:     uuidSchema,
  quantity:       z.number().int().min(1).max(9999),
  is_available:   z.boolean().default(true),
  is_substitute:  z.boolean().default(false),
  substitute_note: z
    .string()
    .max(300)
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});

export const submitQuoteSchema = z.object({
  items: z
    .array(quoteItemSchema)
    .min(1, 'Quote must contain at least one item'),
});

// ── Decline request (ERP pharmacy) ───────────────────────────────────────────

export const declineRequestSchema = z.object({
  reason: z
    .string()
    .max(300)
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});