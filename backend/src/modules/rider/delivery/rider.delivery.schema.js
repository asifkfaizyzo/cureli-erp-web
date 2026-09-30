//backend\src\modules\rider\delivery\rider.delivery.schema.js

import { z } from "zod";

export const declineDeliverySchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  note: z.string().optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum([
    "ARRIVED_AT_PHARMACY",
    "PICKED_UP",
    "EN_ROUTE",
    "ARRIVED_AT_CUSTOMER",
  ]),
  pickup_otp: z.string().length(4, "Pickup OTP must be 4 digits").optional(),
});

export const completeDeliverySchema = z.object({
  delivery_otp: z.string().length(4, "Delivery OTP must be 4 digits"),
});

// ── NEW: Delivery History query validation ──────────────────────────────────
export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
        : undefined,
    )
    .pipe(
      z
        .array(z.enum(["DELIVERED", "FAILED", "CANCELLED"]))
        .optional(),
    ),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
});