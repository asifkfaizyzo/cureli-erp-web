// backend/src/modules/marketplace-listings/listings.schema.js

import { z } from "zod";

// Helper to sanitize optional UUIDs (handles "" or null from URL query params)
const optionalUuid = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : String(val).trim()),
  z.string().uuid("Invalid branch ID format").optional()
);

export const getListingsSchema = z.object({
  branch_id: optionalUuid,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val).trim()),
    z.string().max(200).default("")
  ),
  category: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val).trim()),
    z.string().max(150).default("")
  ),
  visibility: z.preprocess(
    (val) => (!val ? "all" : String(val).trim()),
    z.enum(["all", "visible", "hidden"]).default("all")
  ),
  stock: z.preprocess(
    (val) => (!val ? "all" : String(val).trim()),
    z.enum(["all", "in_stock", "out_of_stock"]).default("all")
  ),
  sort: z.preprocess(
    (val) => (!val ? "name_asc" : String(val).trim()),
    z.enum(["name_asc", "name_desc", "price_asc", "price_desc", "stock_asc"]).default("name_asc")
  ),
  tab: z.preprocess(
    (val) => (!val ? "linked" : String(val).trim()),
    z.enum(["linked", "unlinked"]).default("linked")
  ),
});

export const branchIdQuerySchema = z.object({
  branch_id: optionalUuid,
});

export const listingIdParamSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
});

export const categoryVisibilitySchema = z.object({
  branch_id: optionalUuid,
  category_name: z.string().min(1, "Category name is required").max(150),
  is_enabled: z.coerce.boolean(),
});

export const updateListingSchema = z
  .object({
    is_visible: z.boolean().optional(),
    stock_status: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional(),
    marketplace_price: z.coerce.number().min(0, "Price must be >= 0").nullable().optional(),
    requires_prescription: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length >= 1, {
    message: "At least one field is required to update",
  });

export const bulkUpdateSchema = z.object({
  listing_ids: z.array(z.string().uuid("Invalid listing ID")).min(1, "Select at least one listing").max(500),
  patch: z
    .object({
      is_visible: z.boolean().optional(),
      stock_status: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional(),
      marketplace_price: z.coerce.number().min(0, "Price must be >= 0").nullable().optional(),
      requires_prescription: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length >= 1, {
      message: "At least one field in patch is required",
    }),
});