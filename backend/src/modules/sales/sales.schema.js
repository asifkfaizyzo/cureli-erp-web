// backend/src/modules/sales/sales.schema.js (do not remove this comment)
// backend/src/modules/sales/sales.schema.js

import { z } from "zod";

// ============================================
// SHARED PAYMENT MODE ENUM
// ============================================
const paymentModeEnum = z.enum(["CASH", "CARD", "UPI", "CREDIT", "ONLINE"]);

// ============================================
// LINE ITEM SCHEMA
// ============================================
const salesLineItemSchema = z.object({
  medicine_id: z.string().uuid(),
  inventory_id: z.string().uuid(),
  batch_number: z.string().max(50),
  expiry_date: z.string().datetime(),
  quantity: z.number().positive(),
  unit_of_measure: z.enum(["UNIT", "STRIP", "BOX", "BOTTLE"]).default("UNIT"),
  selling_rate: z.number().positive(),
  mrp: z.number().positive(),
  purchase_rate: z.number().positive().optional().nullable(),
  discount_percent: z.number().min(0).max(100).default(0),
  cgst_percent: z.number().min(0).max(100).default(0),
  sgst_percent: z.number().min(0).max(100).default(0),
});

// ============================================
// CREATE SALES INVOICE
// ============================================
export const createSalesInvoiceSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  walkin_name: z.string().max(200).optional().nullable(),
  walkin_phone: z.string().max(20).optional().nullable(),
  invoice_date: z.string().datetime(),
  due_date: z.string().datetime().optional().nullable(),
  bill_discount_percent: z.number().min(0).max(100).default(0),
  prescription_number: z.string().max(50).optional().nullable(),
  doctor_name: z.string().max(200).optional().nullable(),
  marketplace_order_id: z.string().uuid().optional().nullable(),
  lineItems: z.array(salesLineItemSchema).min(1),
  payments: z
    .array(
      z.object({
        amount: z.number().positive(),
        payment_mode: paymentModeEnum,
        reference_number: z.string().max(100).optional().nullable(),
      }),
    )
    .optional(),
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// UPDATE SALES INVOICE (DRAFT/PARKED only)
// ============================================
export const updateSalesInvoiceSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  walkin_name: z.string().max(200).optional().nullable(),
  walkin_phone: z.string().max(20).optional().nullable(),
  invoice_date: z.string().datetime().optional(),
  due_date: z.string().datetime().optional().nullable(),
  bill_discount_percent: z.number().min(0).max(100).optional(),
  prescription_number: z.string().max(50).optional().nullable(),
  doctor_name: z.string().max(200).optional().nullable(),
  lineItems: z
    .array(
      z.object({
        medicine_id: z.string().uuid(),
        inventory_id: z.string().uuid(),
        quantity: z.number().positive(),
        unit_of_measure: z
          .enum(["UNIT", "STRIP", "BOX", "BOTTLE"])
          .default("UNIT"),
        selling_rate: z.number().positive().optional().nullable(),
        mrp: z.number().positive().optional().nullable(),
        discount_percent: z.number().min(0).max(100).default(0),
        cgst_percent: z.number().min(0).max(100).optional(),
        sgst_percent: z.number().min(0).max(100).optional(),
      }),
    )
    .optional(),
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// ADD ITEMS TO INVOICE
// ============================================
export const addItemsSchema = z.object({
  lineItems: z.array(salesLineItemSchema).min(1),
});

// ============================================
// CONFIRM INVOICE
// ============================================
export const confirmInvoiceSchema = z.object({
  marketplace_order_id: z.string().uuid().optional().nullable(),
  payments: z
    .array(
      z.object({
        amount: z.number().positive(),
        payment_mode: paymentModeEnum,
        reference_number: z.string().max(100).optional().nullable(),
      }),
    )
    .optional(),
});

// ============================================
// RECORD PAYMENT
// ============================================
export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_mode: paymentModeEnum,
  payment_date: z.string().datetime().optional(),
  reference_number: z.string().max(100).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// CANCEL INVOICE
// ============================================
export const cancelInvoiceSchema = z.object({
  reason: z.string().min(5).max(500),
});

// ============================================
// PARK INVOICE
// ============================================
export const parkInvoiceSchema = z.object({
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// SALES RETURN SCHEMAS
// ============================================
export const createSalesReturnSchema = z.object({
  parent_invoice_id: z.string().uuid(),
  return_reason: z.enum([
    "EXPIRED_PRODUCT",
    "DAMAGED_PRODUCT",
    "WRONG_PRODUCT",
    "CUSTOMER_REQUEST",
    "QUALITY_ISSUE",
    "PRICE_DISPUTE",
    "OTHER",
  ]),
  return_notes: z.string().max(500).optional().nullable(),
  lineItems: z
    .array(
      z.object({
        item_id: z.string().uuid(),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
  refund_mode: z.enum(["CASH", "CREDIT", "ADJUST_NEXT"]).default("CREDIT"),
  refund_notes: z.string().max(500).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

export const approveReturnSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejection_reason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export const cancelSalesReturnSchema = z.object({
  cancellation_reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500),
});

export const revertSalesReturnSchema = z.object({
  revert_reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500),
});

// ============================================
// CUSTOMER CREDIT SCHEMAS
// ============================================
export const applyCustomerCreditSchema = z.object({
  credit_id: z.string().uuid(),
  applied_to_invoice_id: z.string().uuid(),
  applied_amount: z.number().positive(),
  notes: z.string().max(500).optional(),
});

// ============================================
// CHECK STOCK AVAILABILITY
// ============================================
export const checkStockSchema = z.object({
  items: z
    .array(
      z.object({
        inventory_id: z.string().uuid(),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
});

// ============================================
// UPDATE PAYMENT STATUS (Super Admin only)
// ============================================
export const updatePaymentStatusSchema = z.object({
  payment_status: z.enum(["PAID", "PARTIALLY_PAID", "UNPAID"]),
  paid_amount: z.number().min(0).optional(),
  payment_mode: paymentModeEnum.optional(),
  remarks: z.string().max(500).optional(),
});