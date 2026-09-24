// backend/src/modules/branches/branches.schema.js (do not remove this comment)
// src/modules/branches/branches.schema.js

import { z } from "zod";

/**
 * Existing schemas
 */
export const getBranchesSchema = z.object({
  include_inactive: z
    .boolean()
    .optional()
    .default(false),
});

export const switchBranchSchema = z.object({
  branch_id: z
    .string()
    .uuid(),
});

/**
 * ============================================
 * NEW: Create branch schema
 * ============================================
 */
export const createBranchSchema = z.object({
  branch_name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be at most 100 characters")
    .transform((val) => val.trim()),

  address_line_1: z
    .string()
    .max(255, "Address must be at most 255 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  address_line_2: z
    .string()
    .max(255, "Address must be at most 255 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  city: z
    .string()
    .max(100, "City must be at most 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  state: z
    .string()
    .max(100, "State must be at most 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  pincode: z
    .string()
    .regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => val || null),

  contact_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Contact number must be exactly 10 digits")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => val || null),

  alternate_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Alternate number must be exactly 10 digits")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => val || null),
});

/**
 * ============================================
 * NEW: Update branch schema
 * ============================================
 */
export const updateBranchSchema = z.object({
  branch_name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be at most 100 characters")
    .transform((val) => val.trim())
    .optional(),

  address_line_1: z
    .string()
    .max(255, "Address must be at most 255 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  address_line_2: z
    .string()
    .max(255, "Address must be at most 255 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  city: z
    .string()
    .max(100, "City must be at most 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  state: z
    .string()
    .max(100, "State must be at most 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  pincode: z
    .string()
    .regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => val || null),

  contact_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Contact number must be exactly 10 digits")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => val || null),

  alternate_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Alternate number must be exactly 10 digits")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => val || null),
}).refine(
  (data) => Object.keys(data).some((key) => data[key] !== undefined),
  { message: "At least one field must be provided for update" }
);