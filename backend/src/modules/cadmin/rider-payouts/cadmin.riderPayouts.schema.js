//backend\src\modules\cadmin\rider-payouts\cadmin.riderPayouts.schema.js

import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const listRiderPayoutsSchema = z.object({
  week_start: dateStr,
  rider_type: z.enum(["INDEPENDENT", "TEAM"]).optional(),
  status: z
    .enum([
      "DRAFT",
      "PENDING",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "NOT_CALCULATED",
    ])
    .optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const weekStartBodySchema = z.object({
  week_start: dateStr,
});

export const refreshAllSchema = z.object({
  week_start: dateStr,
  rider_type: z.enum(["INDEPENDENT", "TEAM"]).optional(),
});

export const processPayoutSchema = z.object({
  manual_reference: z.string().min(1).max(100),
  manual_bank_used: z.string().max(100).optional(),
  manual_notes: z.string().max(500).optional(),
});

export const completePayoutSchema = z.object({
  manual_payment_date: dateStr,
  manual_reference: z.string().max(100).optional(),
});

export const failPayoutSchema = z.object({
  failed_reason: z.string().min(1).max(500),
});

export const retryPayoutSchema = z.object({
  manual_reference: z.string().min(1).max(100),
  manual_bank_used: z.string().max(100).optional(),
});

export const updateDeductionsSchema = z.object({
  deductions: z.array(
    z.object({
      label: z.string().min(1).max(100),
      amount: z.number().min(0),
      note: z.string().max(300).optional().default(""),
    })
  ),
});

export const addNoteSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const createTeamPayoutSchema = z.object({
  rider_id: z.string().uuid(),
  week_start: dateStr,
  amount: z.number().min(0),
  notes: z.string().max(500).optional().default(""),
});

export const updateTeamAmountSchema = z.object({
  amount: z.number().min(0),
});

export const attendanceQuerySchema = z.object({
  week_start: dateStr,
});


export const bulkProcessSchema = z.object({
  payout_ids: z.array(z.string().uuid()).min(1, "Select at least one payout"),
  manual_reference: z.string().min(1).max(100),
  manual_bank_used: z.string().max(100).optional(),
  manual_notes: z.string().max(500).optional(),
});

export const bulkCompleteSchema = z.object({
  payout_ids: z.array(z.string().uuid()).min(1, "Select at least one payout"),
  manual_payment_date: dateStr,
  manual_reference: z.string().max(100).optional(),
});

export const riderHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const exportPayoutsQuerySchema = z.object({
  week_start: dateStr,
  rider_type: z.enum(["INDEPENDENT", "TEAM"]).optional(),
  status: z.string().optional(),
});