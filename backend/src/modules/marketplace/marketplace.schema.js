// backend/src/modules/marketplace/marketplace.schema.js (do not remove this comment)
// backend/src/modules/marketplace/marketplace.schema.js

import { z } from "zod";

const assetUrlSchema = z
  .string()
  .refine(
    (val) =>
      val.startsWith("/api/files/") ||
      val.startsWith("http://") ||
      val.startsWith("https://"),
    { message: "Must be a valid URL or a backend proxy path (/api/files/...)" }
  );

// Storefront Schema (Step 2)
export const storefrontSchema = z.object({
  storefront_name: z
    .string({ required_error: "Storefront name is required" })
    .min(3, "Storefront name must be at least 3 characters")
    .max(200, "Storefront name must be under 200 characters")
    .trim(),
  storefront_description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be under 1000 characters")
    .trim(),
  support_phone: z
    .string({ required_error: "Support phone is required" })
    .min(10, "Enter a valid phone number")
    .max(15, "Enter a valid phone number")
    .trim(),
  logo_url: assetUrlSchema.refine((val) => !!val, {
    message: "Logo is required",
  }),
  banner_url: assetUrlSchema.nullable().optional(),
  // ── ADDED SHOP TAGS ──────────────────────────────────────
  shop_tags: z
    .array(z.string().max(100))
    .max(5, "Maximum 5 tags allowed")
    .optional(),
  // ──────────────────────────────────────────────────────────
});

// Branch Selection Schema (Step 3)
export const branchSelectionSchema = z.object({
  branch_ids: z
    .array(z.string().uuid("Each branch ID must be a valid UUID"))
    .min(1, "Select at least one branch"),
});

// ── BANKING SCHEMA (Step 5) — All-or-Nothing ───────────────
export const bankingSchema = z
  .object({
    bank_account_holder: z.string().max(200).trim().optional().nullable(),
    bank_name: z.string().max(200).trim().optional().nullable(),
    bank_branch_name: z.string().max(200).trim().optional().nullable(),
    bank_ifsc: z.string().max(11).trim().optional().nullable(),
    bank_account_number: z.string().max(30).trim().optional().nullable(),
    bank_mmid: z.string().max(20).trim().optional().nullable(),
    bank_vpa: z.string().max(100).trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const required = [
      "bank_account_holder",
      "bank_name",
      "bank_branch_name",
      "bank_ifsc",
      "bank_account_number",
    ];

    const filled = required.filter((f) => data[f]?.trim());

    // All empty → valid skip
    if (filled.length === 0) return;

    // Partial → flag every missing field
    if (filled.length < required.length) {
      for (const f of required) {
        if (!data[f]?.trim()) {
          ctx.addIssue({
            path: [f],
            code: z.ZodIssueCode.custom,
            message: "Required when other banking fields are provided",
          });
        }
      }
      return;
    }

    // All filled → strict validation
    if (data.bank_account_holder.trim().length < 3) {
      ctx.addIssue({
        path: ["bank_account_holder"],
        code: z.ZodIssueCode.custom,
        message: "Name must be at least 3 characters",
      });
    }
    if (data.bank_name.trim().length < 2) {
      ctx.addIssue({
        path: ["bank_name"],
        code: z.ZodIssueCode.custom,
        message: "Bank name must be at least 2 characters",
      });
    }
    if (data.bank_branch_name.trim().length < 2) {
      ctx.addIssue({
        path: ["bank_branch_name"],
        code: z.ZodIssueCode.custom,
        message: "Branch name must be at least 2 characters",
      });
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bank_ifsc.trim())) {
      ctx.addIssue({
        path: ["bank_ifsc"],
        code: z.ZodIssueCode.custom,
        message:
          "Enter a valid 11-character IFSC code (e.g. UTIB0001234)",
      });
    }
    if (data.bank_account_number.trim().length < 9) {
      ctx.addIssue({
        path: ["bank_account_number"],
        code: z.ZodIssueCode.custom,
        message: "Account number must be at least 9 digits",
      });
    }
  });
// ──────────────────────────────────────────────────────────────

// Branch Config Schema (Step 4) — UPDATED with delivery_mode
export const branchConfigSchema = z
  .object({
    marketplace_enabled: z.boolean(),
    shop_image_url: assetUrlSchema.nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    google_place_id: z.string().nullable().optional(),
    formatted_address: z.string().max(500).nullable().optional(),
    opening_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format e.g. 09:00")
      .nullable()
      .optional(),
    closing_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format e.g. 21:00")
      .nullable()
      .optional(),
    is_24_hours: z.boolean().default(false),
    pickup_enabled: z.boolean().default(false),
    delivery_enabled: z.boolean().default(false),
    open_days: z.array(z.enum(["MON","TUE","WED","THU","FRI","SAT","SUN"])).optional(),
    delivery_mode: z.enum(["CURELI", "SELF"]).default("CURELI"), // <-- Added DeliveryMode configuration
    contact_override: z.string().max(20).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.marketplace_enabled) return;

    if (data.latitude == null) {
      ctx.addIssue({
        path: ["latitude"],
        code: z.ZodIssueCode.custom,
        message: "Location is required for marketplace-enabled branches",
      });
    }
    if (data.longitude == null) {
      ctx.addIssue({
        path: ["longitude"],
        code: z.ZodIssueCode.custom,
        message: "Location is required for marketplace-enabled branches",
      });
    }
    if (!data.google_place_id) {
      ctx.addIssue({
        path: ["google_place_id"],
        code: z.ZodIssueCode.custom,
        message: "Google Place ID is required",
      });
    }
    if (!data.formatted_address) {
      ctx.addIssue({
        path: ["formatted_address"],
        code: z.ZodIssueCode.custom,
        message: "Formatted address is required",
      });
    }
    if (!data.pickup_enabled && !data.delivery_enabled) {
      ctx.addIssue({
        path: ["pickup_enabled"],
        code: z.ZodIssueCode.custom,
        message: "Enable at least one: pickup or delivery",
      });
    }
    if (data.delivery_enabled && !data.delivery_mode) {
      ctx.addIssue({
        path: ["delivery_mode"],
        code: z.ZodIssueCode.custom,
        message: "Delivery Mode is required when delivery is enabled",
      });
    }
    if (!data.is_24_hours) {
      if (!data.opening_time) {
        ctx.addIssue({
          path: ["opening_time"],
          code: z.ZodIssueCode.custom,
          message: "Opening time is required when not 24 hours",
        });
      }
      if (!data.closing_time) {
        ctx.addIssue({
          path: ["closing_time"],
          code: z.ZodIssueCode.custom,
          message: "Closing time is required when not 24 hours",
        });
      }
    }
  });

// Draft Autosave Schema — step is expanded to 7
export const draftSchema = z
  .object({
    currentStep: z.number().int().min(1).max(10).optional(),
    storefront: z.any().optional(),
    selectedBranchIds: z.array(z.string()).optional().nullable(),
    branchConfigs: z.any().optional(),
    banking: z.any().optional(),
  })
  .passthrough();

// Upload Schema
export const uploadSchema = z.object({
  type: z.enum(["logo", "banner", "branch_image"]),
});

