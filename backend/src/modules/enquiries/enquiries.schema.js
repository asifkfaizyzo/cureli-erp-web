// backend/src/modules/enquiries/enquiries.schema.js (do not remove this comment)
// backend/src/modules/enquiries/enquiries.schema.js
import { z } from "zod";

// Public: Body schema for enquiry submission - RELAXED validation
export const createEnquirySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .max(10)
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long")
    .trim(),
  recaptchaToken: z.string().optional(),
});

// Admin: Body schema for reply
export const replyEnquirySchema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject is too long")
    .trim(),
  message: z
    .string()
    .min(5, "Message must be at least 5 characters")
    .max(5000, "Message is too long")
    .trim(),
});

// Admin: Body schema for status update
export const updateEnquiryStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED"]),
});

// Admin: Query schema for listing
export const listEnquiriesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED", "ALL"]).default("ALL"),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "updated_at", "status"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Admin: Param schema for enquiry ID
export const enquiryIdParamSchema = z.object({
  enquiryId: z.string().uuid("Invalid enquiry ID"),
});