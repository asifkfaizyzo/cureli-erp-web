// backend/src/modules/medicines/medicine.schema.js (do not remove this comment)
// backend/src/modules/medicines/medicine.schema.js

import { z } from "zod";

export const createMedicineSchema = z.object({
  name: z.string().max(200),
  generic_name: z.string().max(200).optional().nullable(),
  manufacturer: z.string().max(150),
  category: z.string().max(100).optional().nullable(),
  sub_category: z.string().max(100).optional().nullable(),
  schedule: z.string().max(50).optional().nullable(),
  hsn_code: z.string().max(20).optional().nullable(),
  pack_size: z.string().max(50).optional().nullable(),
  unit_of_measure: z.enum(["UNIT", "BOX", "STRIP", "BOTTLE"]).default("UNIT"),
  gst_percentage: z.number().min(0).max(100).default(12),
  cgst_percentage: z.number().min(0).max(100).default(6),
  sgst_percentage: z.number().min(0).max(100).default(6),
  rack_no: z.string().max(20).optional().nullable(),

  //  NEW: Stock level thresholds
  min_stock_level: z.number().min(0).optional().nullable(),
  max_stock_level: z.number().min(0).optional().nullable(),
  reorder_point: z.number().min(0).optional().nullable(),
});

export const updateMedicineSchema = z.object({
  name: z.string().max(200).optional(),
  generic_name: z.string().max(200).optional().nullable(),
  manufacturer: z.string().max(150).optional(),
  category: z.string().max(100).optional().nullable(),
  sub_category: z.string().max(100).optional().nullable(),
  schedule: z.string().max(50).optional().nullable(),
  hsn_code: z.string().max(20).optional().nullable(),
  pack_size: z.string().max(50).optional().nullable(),
  rack_no: z.string().max(20).optional().nullable(),
  is_active: z.boolean().optional(),
  is_discontinued: z.boolean().optional(),

  //  NEW: Stock level thresholds
  min_stock_level: z.number().min(0).optional().nullable(),
  max_stock_level: z.number().min(0).optional().nullable(),
  reorder_point: z.number().min(0).optional().nullable(),
});

export const bulkCreateSchema = z.object({
  medicines: z.array(createMedicineSchema).min(1),
});
