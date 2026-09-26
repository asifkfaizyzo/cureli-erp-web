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