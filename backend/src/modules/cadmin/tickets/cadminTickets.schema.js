// backend/src/modules/cadmin/tickets/cadminTickets.schema.js (do not remove this comment)
// backend/src/modules/cadmin/tickets/cadminTickets.schema.js

import { z } from "zod";

/**
 * ============================================
 * QUERY FILTERS SCHEMA (GET TICKETS)
 * ============================================
 */
export const getTicketsQuerySchema = z.object({
  status: z
    .enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED", "CLOSED"])
    .optional(),

  category: z
    .enum([
      "TECHNICAL_ISSUE",
      "BILLING_ISSUE",
      "FEATURE_REQUEST",
      "ACCOUNT_ISSUE",
      "OTHER",
    ])
    .optional(),

  // NEW: Priority filter (computed from reopen_count)
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),

  shop_name: z.string().max(100).optional(),

  search: z.string().max(100).optional(),

  date_from: z.string().optional(),

  date_to: z.string().optional(),

  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),

  sort_by: z
    .enum(["created_at", "updated_at", "ticket_number", "status", "reopen_count"])
    .optional()
    .default("created_at"),

  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * ============================================
 * UPDATE TICKET STATUS SCHEMA
 * ============================================
 */
export const updateTicketStatusSchema = z.object({
  status:      z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  note:        z.string().max(500).optional().nullable()
                 .transform((v) => v?.trim() || null),
  is_internal: z.boolean().optional().default(false),
});

export const addCommentSchema = z.object({
  note:        z.string().min(2).max(1000).transform((v) => v.trim()),
  is_internal: z.boolean().optional().default(false),
});