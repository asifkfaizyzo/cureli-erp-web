// backend/src/modules/subscription/subscription.schema.js (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\subscription\subscription.schema.js
import { z } from "zod";

// Schema for selecting a plan (creates order for paid, activates for free)
export const selectPlanSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID"),
});

// Schema for confirming payment after Razorpay checkout
export const confirmPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  subscription_id: z.string().uuid("Invalid subscription ID"),
});

export const changePlanSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID"),
  
  users_to_disable: z
    .array(z.string().uuid("Invalid user ID"))
    .optional()
    .default([]),
  
  branches_to_deactivate: z
    .array(z.string().uuid("Invalid branch ID"))
    .optional()
    .default([]),
  
  // NEW: User reassignments
  user_reassignments: z
    .array(
      z.object({
        userId: z.string().uuid("Invalid user ID"),
        fromBranchId: z.string().uuid("Invalid branch ID"),
        toBranchId: z.string().uuid("Invalid branch ID"),
      })
    )
    .optional()
    .default([]),
});

/**
 * Schema for plan change preview
 */
export const previewPlanChangeSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID"),
});