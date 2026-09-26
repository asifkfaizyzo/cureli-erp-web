// backend/src/modules/cadmin/customer-support/cadmin.customerSupport.schema.js (do not remove this comment)
import { z } from "zod";

export const listCustomerTicketsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  category: z.string().optional(),
  shop_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.string().default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  note: z.string().optional(),
});

export const addReplySchema = z.object({
  message: z.string().min(2, "Message must be at least 2 characters"),
  is_internal: z.boolean().default(false),
});