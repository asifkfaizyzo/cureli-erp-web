// backend/src/modules/mobile/support/mobile.support.schema.js (do not remove this comment)
import { z } from "zod";

const CATEGORIES = [
  "WRONG_ITEM",
  "DAMAGED_PRODUCT",
  "DELIVERY_ISSUE",
  "QUALITY_ISSUE",
  "MISSING_ITEM",
  "REFUND_REQUEST",
  "OTHER",
];

export const createTicketSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Invalid ticket category" }) }),
  other_category_text: z.string().max(150).optional().nullable(),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
});

export const addReplySchema = z.object({
  message: z.string().min(2, "Message must be at least 2 characters").max(2000),
});

export const listTicketsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});