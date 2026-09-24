// backend/src/modules/customers/customer.schema.js (do not remove this comment)
// backend/src/modules/customers/customer.schema.js

import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional().nullable(),
  address_line_1: z.string().max(500).optional().nullable(),
  address_line_2: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  gst_number: z.string().max(15).optional().nullable(),
  pan_number: z.string().max(10).optional().nullable(),
  credit_limit: z.number().min(0).default(0),
  credit_days: z.number().min(0).max(365).default(0),
  discount_percent: z.number().min(0).max(100).default(0),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional().nullable(),
  address_line_1: z.string().max(500).optional().nullable(),
  address_line_2: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  gst_number: z.string().max(15).optional().nullable(),
  pan_number: z.string().max(10).optional().nullable(),
  credit_limit: z.number().min(0).optional(),
  credit_days: z.number().min(0).max(365).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

export const searchCustomerSchema = z.object({
  q: z.string().min(2).max(100),
});