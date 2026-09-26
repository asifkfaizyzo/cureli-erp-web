// backend/src/modules/purchase/purchase.schema.js (do not remove this comment)
// backend/src/modules/purchase/purchase.schema.js
import { z } from "zod";

const lineItemSchema = z.object({
  medicine_id: z.string().uuid(),
  batch_number: z.string().max(50),
  expiry_date: z.string().datetime(),
  manufacturing_date: z.string().datetime().optional().nullable(),
  quantity: z.number().positive(),
  free_quantity: z.number().min(0).default(0),
  pack_size: z.string().max(50).optional().nullable(),
  unit_of_measure: z.enum(["UNIT", "BOX", "STRIP", "BOTTLE"]).default("UNIT"),
  purchase_rate: z.number().positive(),
  mrp: z.number().positive(),
  scheme_discount: z.number().min(0).max(100).default(0),
  trade_discount: z.number().min(0).max(100).default(0),
  cgst_percent: z.number().min(0).max(100).default(0),
  sgst_percent: z.number().min(0).max(100).default(0),
  igst_percent: z.number().min(0).max(100).default(0),
  selling_rate: z.number().positive().optional().nullable(),
  margin_percent: z.number().min(0).max(100).optional().nullable(),
  rack_no: z.string().max(20).optional().nullable(),
  is_free_item: z.boolean().optional().default(false),
});

export const createPurchaseInvoiceSchema = z.object({
  supplier_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  supplier_invoice_no: z.string().max(50).optional().nullable(),
  invoice_date: z.string().datetime(),
  due_date: z.string().datetime().optional().nullable(),
  received_date: z.string().datetime().optional().nullable(),
  payment_mode: z
    .enum(["CASH", "CARD", "UPI", "CHEQUE", "BANK_TRANSFER", "CREDIT"])
    .optional()
    .nullable(),
  paid_amount: z.number().min(0).optional().nullable(),
  transport_charges: z.number().min(0).optional().nullable(),
  other_charges: z.number().min(0).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1),
});

export const updatePurchaseInvoiceSchema = z.object({
  supplier_invoice_no: z.string().max(50).optional().nullable(),
  invoice_date: z.string().datetime().optional(),
  due_date: z.string().datetime().optional().nullable(),
  received_date: z.string().datetime().optional().nullable(),
  payment_mode: z
    .enum(["CASH", "CARD", "UPI", "CHEQUE", "BANK_TRANSFER", "CREDIT"])
    .optional()
    .nullable(),
  paid_amount: z.number().min(0).optional().nullable(),
  transport_charges: z.number().min(0).optional().nullable(),
  other_charges: z.number().min(0).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
  lineItems: z.array(lineItemSchema).optional(),
});

export const cancelInvoiceSchema = z.object({
  reason: z.string().max(500),
});

export const updatePaymentStatusSchema = z.object({
  payment_status: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]),
  paid_amount: z.number().min(0).optional(),
  payment_mode: z
    .enum(["CASH", "CARD", "UPI", "CHEQUE", "BANK_TRANSFER", "CREDIT"])
    .optional()
    .nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_mode: z.enum([
    "CASH",
    "CARD",
    "UPI",
    "CHEQUE",
    "BANK_TRANSFER",
    "CREDIT",
  ]),
  payment_date: z.string().datetime().optional(),
  reference_number: z.string().max(100).optional().nullable(),
  bank_name: z.string().max(100).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

export const createReturnInvoiceSchema = z.object({
  parent_invoice_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),

  return_reason: z.enum([
    "DAMAGED_GOODS",
    "EXPIRED_GOODS",
    "WRONG_ITEM_RECEIVED",
    "QUALITY_ISSUE",
    "EXCESS_STOCK",
    "PRICE_DIFFERENCE",
    "OTHER",
  ]),
  return_reason_notes: z.string().max(500).optional().nullable(),

  adjustment_type: z.enum([
    "CASH_REFUND",
    "CREDIT_NOTE",
    "OFFSET_NEXT_PURCHASE",
  ]),
  refund_amount: z.number().min(0).optional().nullable(),
  refund_notes: z.string().max(500).optional().nullable(),

  invoice_date: z.string().datetime(),
  remarks: z.string().max(500).optional().nullable(),

  lineItems: z
    .array(
      z.object({
        medicine_id: z.string().uuid(),
        batch_number: z.string().max(50),
        expiry_date: z.string().datetime(),
        quantity: z.number().positive(),
        purchase_rate: z.number().positive(),
        mrp: z.number().positive(),
        cgst_percent: z.number().min(0).max(100).default(0),
        sgst_percent: z.number().min(0).max(100).default(0),
      }),
    )
    .min(1),
});

export const approveReturnSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejection_reason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export const applyCreditNoteSchema = z.object({
  credit_id: z.string().uuid(),
  applied_to_invoice_id: z.string().uuid(),
  applied_amount: z.number().positive(),
  notes: z.string().max(500).optional(),
});

// ════════════════════════════════════════════════════════════════════════════
//  NEW SCHEMAS FOR CANCEL & REVERT
// ════════════════════════════════════════════════════════════════════════════

export const cancelApprovedReturnSchema = z.object({
  cancellation_reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500),
  refund_action: z
    .enum(["REVERSE_REFUND", "ADJUST_NEXT_BILL"])
    .optional()
    .nullable(),
});

export const revertReturnToPendingSchema = z.object({
  revert_reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500),
});
