// backend/src/modules/mobile/checkout/mobile.checkout.schema.js (do not remove this comment)
// backend/src/modules/mobile/checkout/mobile.checkout.schema.js

import { z } from "zod";

export const quoteSchema = z.object({
  branch_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(20),
  distance_km: z.number().min(0).max(500),
  tip: z.number().min(0).max(1000).optional().default(0),
});

// ── Patient schema (reusable) ─────────────────────────────────
export const patientSchema = z.object({
  is_self: z.boolean(),
  name: z.string().trim().min(1).max(200),
  // Age in years — computed client-side from dob, sent as integer
  age: z.number().int().min(0).max(150),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]),
});

export const createSessionSchema = z.object({
  branch_id: z.string().uuid(),
  delivery_address_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(20),
  distance_km: z.number().min(0).max(500),
  tip: z.number().min(0).max(1000).optional().default(0),
  prescription_files: z
    .array(
      z.object({
        prescription_key: z.string(),
        original_name: z.string(),
        mime_type: z.enum([
          "image/jpeg",
          "image/jpg",
          "image/png",
          "application/pdf",
        ]),
        file_size: z.number().int().min(1),
      }),
    )
    .max(5)
    .optional()
    .default([]),
  // patient is required at checkout time
  patient: patientSchema,

  prescription_request_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v ?? null),

  prescription_recipient_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});

export const confirmSchema = z.object({
  session_id: z.string().uuid(),
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
