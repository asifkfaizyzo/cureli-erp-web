// backend/src/modules/inventory/inventory.schema.js (do not remove this comment)
//backend\src\modules\inventory\inventory.schema.js
import { z } from "zod";

export const createAdjustmentSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  medicineId: z.string().uuid(),
  inventoryId: z.string().uuid(),
  batchNumber: z.string().max(50),
  newQuantity: z.number().min(0),
  reason: z.enum([
    "PHYSICAL_COUNT_VARIANCE",
    "DAMAGED_GOODS",
    "EXPIRED_GOODS",
    "SYSTEM_CORRECTION",
    "THEFT_LOSS",
    "OTHER",
  ]),
  reasonNotes: z.string().max(500).optional().nullable(),
  adjustmentDate: z.string().datetime().optional(),
});

//  NEW: Comprehensive inventory update schema
export const updateInventorySchema = z
  .object({
    // =====================
    // MEDICINE MASTER FIELDS
    // =====================
    name: z.string().max(200).optional(),
    manufacturer: z.string().max(150).optional(),
    category: z.string().max(100).optional().nullable(),
    hsn_code: z.string().max(20).optional().nullable(),

    // Stock thresholds (stored in Medicine)
    min_stock_level: z.number().min(0).optional().nullable(),
    max_stock_level: z.number().min(0).optional().nullable(),
    reorder_point: z.number().min(0).optional().nullable(),

    // =====================
    // INVENTORY RECORD FIELDS
    // =====================
    batch_number: z.string().max(50).optional(),
    expiry_date: z.string().optional().nullable(),

    // Pricing
    mrp: z.number().min(0).optional().nullable(),
    selling_rate: z.number().min(0).optional().nullable(),
    last_purchase_rate: z.number().min(0).optional().nullable(),

    // Location
    rack_no: z.string().max(20).optional().nullable(),

    // Inventory-level stock threshold (batch-specific override)
    minimum_stock: z.number().min(0).optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate stock level consistency
      if (
        data.min_stock_level !== undefined &&
        data.max_stock_level !== undefined &&
        data.min_stock_level !== null &&
        data.max_stock_level !== null
      ) {
        return data.min_stock_level < data.max_stock_level;
      }
      return true;
    },
    { message: "Min stock must be less than max stock" },
  );


  export const createInventoryWithMedicineSchema = z.object({
  // ── Medicine fields ──────────────────────────────────────────
  name:           z.string().min(1, "Medicine name is required").max(200).trim(),
  manufacturer:   z.string().min(1, "Manufacturer is required").max(150).trim(),
  generic_name:   z.string().max(200).trim().optional().nullable(),
  category:       z.string().max(100).trim().optional().nullable(),
  sub_category:   z.string().max(100).trim().optional().nullable(),
  schedule:       z.string().max(50).trim().optional().nullable(),
  hsn_code:       z.string().max(20).trim().optional().nullable(),
  pack_size:      z.string().max(50).trim().optional().nullable(),
  unit_of_measure: z.string().max(20).optional().default("UNIT"),
  gst_percentage:  z.number().min(0).max(28).optional().default(12),
  cgst_percentage: z.number().min(0).max(14).optional().default(6),
  sgst_percentage: z.number().min(0).max(14).optional().default(6),
  rack_no:         z.string().max(20).trim().optional().nullable(),
  min_stock_level: z.number().min(0).optional().nullable(),
  max_stock_level: z.number().min(0).optional().nullable(),
  reorder_point:   z.number().min(0).optional().nullable(),

  // ── Inventory / batch fields ─────────────────────────────────
  batch_number:   z.string().min(1, "Batch number is required").max(50).trim(),
  expiry_date:    z.string().min(1, "Expiry date is required"),
  quantity:       z.number().int().min(0, "Quantity cannot be negative"),
  mrp:            z.number().min(0, "MRP cannot be negative"),
  selling_rate:   z.number().min(0).optional().nullable(),
  purchase_rate:  z.number().min(0).optional().nullable(),
  minimum_stock:  z.number().min(0).optional().nullable(),
});