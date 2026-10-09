import { z } from "zod";

export const refreshSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const finalizeSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const processSchema = z.object({
  manual_reference: z.string().min(1).max(100).optional(),
  manual_bank_used: z.string().max(100).optional(),
  manual_notes: z.string().max(500).optional(),
});

export const completeSchema = z.object({
  manual_payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  manual_reference: z.string().max(100).optional(),
});

export const failSchema = z.object({
  failed_reason: z.string().min(1).max(500),
});

export const adjustmentItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["ADDITION", "DEDUCTION"]),
  label: z.string().min(1).max(200),
  amount: z.number().positive(),
  note: z.string().max(500).optional(),
  by: z.string().optional(),
  at: z.string().optional(),
});

export const adjustmentsSchema = z.object({
  adjustments: z.array(adjustmentItemSchema),
});

export const noteSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const bulkProcessSchema = z.object({
  payout_ids: z.array(z.string().uuid()).min(1),
  manual_reference: z.string().max(100).optional(),
  manual_bank_used: z.string().max(100).optional(),
  manual_notes: z.string().max(500).optional(),
});

export const bulkCompleteSchema = z.object({
  payout_ids: z.array(z.string().uuid()).min(1),
  manual_payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  manual_reference: z.string().max(100).optional(),
});