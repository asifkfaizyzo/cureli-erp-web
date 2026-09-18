// backend/src/modules/cadmin/broadcast/mobile-email/cadminMobileEmailBroadcast.schema.js

import { z } from "zod";

export const mobileEmailAudienceFiltersSchema = z.object({
  target_all: z.boolean().default(true),
  user_ids: z.array(z.string().uuid()).optional(),
  registered_from: z.string().optional(),
  registered_to: z.string().optional(),
  has_orders: z.boolean().optional(),
}).optional();

export const sendMobileEmailSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(300),
  message_text: z.string().min(10, "Message must be at least 10 characters"),
  target_filters: mobileEmailAudienceFiltersSchema.default({ target_all: true }),
  inline_image: z.any().optional().nullable(),
  attachments: z.array(z.any()).default([]),
  action_url: z.string().url().optional().nullable().or(z.literal("")),
  action_label: z.string().max(100).optional().nullable().or(z.literal("")),
});

export const scheduleMobileEmailSchema = z.object({
  scheduled_for: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO date string for scheduled_for",
  }),
});

export const sendTestMobileEmailSchema = z.object({
  subject: z.string().min(3),
  message_text: z.string().min(10),
  inline_image: z.any().optional().nullable(),
  attachments: z.array(z.any()).default([]),
  action_url: z.string().url().optional().nullable().or(z.literal("")),
  action_label: z.string().max(100).optional().nullable().or(z.literal("")),
});