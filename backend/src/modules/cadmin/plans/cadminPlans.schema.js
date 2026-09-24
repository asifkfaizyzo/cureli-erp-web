// backend/src/modules/cadmin/plans/cadminPlans.schema.js (do not remove this comment)
import { z } from "zod";

// ============================================
// SHARED FIELD SCHEMAS
// ============================================

const nameSchema = z
  .string()
  .min(3, "Plan name must be at least 3 characters")
  .max(100, "Plan name cannot exceed 100 characters")
  .transform((val) => val.trim());

const descriptionSchema = z
  .string()
  .min(10, "Description must be at least 10 characters")
  .max(500, "Description cannot exceed 500 characters")
  .transform((val) => val.trim());

const priceSchema = z
  .number()
  .int("Price must be a whole number")
  .min(0, "Price cannot be negative");

const compareAtPriceSchema = z
  .number()
  .int("Compare-at price must be a whole number")
  .positive("Compare-at price must be positive")
  .nullable()
  .optional();

const maxUsersSchema = z
  .number()
  .int("User limit must be a whole number")
  .refine(
    (val) => val === -1 || val >= 1,
    "User limit must be at least 1 (or -1 for unlimited)"
  );

const maxBranchesSchema = z
  .number()
  .int("Branch limit must be a whole number")
  .refine(
    (val) => val === -1 || val >= 1,
    "Branch limit must be at least 1 (or -1 for unlimited)"
  );

const billingCycleMonthsSchema = z
  .number()
  .int("Billing cycle must be a whole number")
  .min(1, "Billing cycle must be at least 1 month")
  .max(36, "Billing cycle cannot exceed 36 months")
  .optional()
  .default(12);

const bonusMonthsSchema = z
  .number()
  .int("Bonus months must be a whole number")
  .min(0, "Bonus months cannot be negative")
  .max(12, "Bonus months cannot exceed 12")
  .optional()
  .default(0);

const promoFreeUntilSchema = z
  .string()
  .datetime({ message: "Invalid date format" })
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

const isFeaturedSchema = z.boolean().optional().default(false);

const planTypeSchema = z
  .enum(["PRE_MADE", "CUSTOM"])
  .optional()
  .default("PRE_MADE");

const uuidSchema = z.string().uuid("Invalid UUID format");

// ============================================
// INTRO PRICING FIELD SCHEMAS
// ============================================

const introPriceSchema = z
  .number()
  .int("Intro price must be a whole number")
  .min(0, "Intro price cannot be negative")
  .nullable()
  .optional();

const introTriggerTypeSchema = z
  .enum(["duration", "date"], {
    errorMap: () => ({ message: "Trigger type must be 'duration' or 'date'" }),
  })
  .nullable()
  .optional();

// RENAMED: intro_duration_months → intro_duration_years
// Now measured in full years of renewals (1–5), not months
const introDurationYearsSchema = z
  .number()
  .int("Intro duration must be a whole number of years")
  .min(1, "Intro duration must be at least 1 year")
  .max(5, "Intro duration cannot exceed 5 years")
  .nullable()
  .optional();

const introEndDateSchema = z
  .string()
  .datetime({ message: "Invalid intro end date format" })
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

// ============================================
// INTRO PRICING REFINEMENTS (reusable)
// Applied to both create and update schemas
// ============================================

/**
 * Validates intro pricing co-dependency and trigger-specific fields.
 * Must be called on the full object after base field parsing.
 */
function applyIntroRefinements(schema) {
  return (
    schema
      // Rule 1: intro_price and intro_trigger_type are co-dependent
      .refine(
        (data) => {
          const hasPrice =
            data.intro_price !== null && data.intro_price !== undefined;
          const hasTrigger =
            data.intro_trigger_type !== null &&
            data.intro_trigger_type !== undefined;
          // Both present or both absent
          return hasPrice === hasTrigger;
        },
        {
          message:
            "intro_price and intro_trigger_type must both be set or both be absent",
          path: ["intro_trigger_type"],
        }
      )
      // Rule 2: trigger = "duration" requires intro_duration_years
      .refine(
        (data) => {
          if (data.intro_trigger_type === "duration") {
            return (
              data.intro_duration_years !== null &&
              data.intro_duration_years !== undefined
            );
          }
          return true;
        },
        {
          message:
            "intro_duration_years is required when trigger type is 'duration'",
          path: ["intro_duration_years"],
        }
      )
      // Rule 3: trigger = "date" requires intro_end_date
      .refine(
        (data) => {
          if (data.intro_trigger_type === "date") {
            return (
              data.intro_end_date !== null &&
              data.intro_end_date !== undefined
            );
          }
          return true;
        },
        {
          message: "intro_end_date is required when trigger type is 'date'",
          path: ["intro_end_date"],
        }
      )
      // Rule 4: intro_end_date must be in the future
      .refine(
        (data) => {
          if (data.intro_end_date) {
            return new Date(data.intro_end_date) > new Date();
          }
          return true;
        },
        {
          message: "Intro end date must be in the future",
          path: ["intro_end_date"],
        }
      )
      // Rule 5: intro_end_date must be after promo_free_until if both set
      .refine(
        (data) => {
          if (data.intro_end_date && data.promo_free_until) {
            return (
              new Date(data.intro_end_date) > new Date(data.promo_free_until)
            );
          }
          return true;
        },
        {
          message:
            "Intro end date must be after promo free until date (phases cannot overlap)",
          path: ["intro_end_date"],
        }
      )
      // Rule 6 DELETED: intro_duration_years is measured in renewal cycles,
      // not months — it has no relationship to billing_cycle_months.

      // Rule 7 (was Rule 8): if no trigger type, duration and date must be absent
      .refine(
        (data) => {
          if (
            data.intro_trigger_type === null ||
            data.intro_trigger_type === undefined
          ) {
            const hasOrphanDuration =
              data.intro_duration_years !== null &&
              data.intro_duration_years !== undefined;
            const hasOrphanDate =
              data.intro_end_date !== null &&
              data.intro_end_date !== undefined;
            return !hasOrphanDuration && !hasOrphanDate;
          }
          return true;
        },
        {
          message:
            "intro_duration_years and intro_end_date must be absent when no trigger type is set",
          path: ["intro_trigger_type"],
        }
      )
  );
}

// ============================================
// CREATE PLAN SCHEMA
// ============================================

const createPlanBase = z.object({
  // Core
  name: nameSchema,
  description: descriptionSchema,
  type: planTypeSchema,

  // Pricing
  price: priceSchema,
  compare_at_price: compareAtPriceSchema,

  // Limits
  max_users: maxUsersSchema,
  max_branches: maxBranchesSchema,

  // Billing duration
  billing_cycle_months: billingCycleMonthsSchema,
  bonus_months: bonusMonthsSchema,

  // Promotional access
  promo_free_until: promoFreeUntilSchema,

  // Flags
  is_featured: isFeaturedSchema,

  // Custom plan shop link
  created_for_shop_id: uuidSchema.optional().nullable(),

  // Intro pricing
  intro_price: introPriceSchema,
  intro_trigger_type: introTriggerTypeSchema,
  intro_duration_years: introDurationYearsSchema, // renamed from intro_duration_months
  intro_end_date: introEndDateSchema,
});

export const createPlanSchema = applyIntroRefinements(createPlanBase)
  // Custom plan requires shop_id
  .refine(
    (data) => {
      if (data.type === "CUSTOM" && !data.created_for_shop_id) {
        return false;
      }
      return true;
    },
    {
      message: "Shop ID is required for custom plans",
      path: ["created_for_shop_id"],
    }
  )
  // compare_at_price must be greater than actual price
  .refine(
    (data) => {
      if (
        data.compare_at_price !== null &&
        data.compare_at_price !== undefined
      ) {
        return data.compare_at_price > data.price;
      }
      return true;
    },
    {
      message: "Compare-at price must be greater than the actual price",
      path: ["compare_at_price"],
    }
  )
  // promo_free_until must be in the future
  .refine(
    (data) => {
      if (data.promo_free_until) {
        return new Date(data.promo_free_until) > new Date();
      }
      return true;
    },
    {
      message: "Promo free until date must be in the future",
      path: ["promo_free_until"],
    }
  );

// ============================================
// UPDATE PLAN SCHEMA
// ============================================

const updatePlanBase = z.object({
  // Core
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),

  // Pricing
  price: priceSchema.optional(),
  compare_at_price: compareAtPriceSchema,

  // Limits
  max_users: maxUsersSchema.optional(),
  max_branches: maxBranchesSchema.optional(),

  // Billing duration
  billing_cycle_months: billingCycleMonthsSchema.optional(),
  bonus_months: bonusMonthsSchema.optional(),

  // Promotional access
  promo_free_until: promoFreeUntilSchema,

  // Flags
  is_featured: z.boolean().optional(),

  // Intro pricing
  intro_price: introPriceSchema,
  intro_trigger_type: introTriggerTypeSchema,
  intro_duration_years: introDurationYearsSchema, // renamed from intro_duration_months
  intro_end_date: introEndDateSchema,
});

export const updatePlanSchema = applyIntroRefinements(updatePlanBase)
  // compare_at_price validation happens in service (needs existing price)
  .refine(() => true, {});

// ============================================
// CLONE PLAN SCHEMA
// ============================================

export const clonePlanSchema = z.object({
  name: nameSchema.optional(),
});

// ============================================
// LIST PLANS QUERY SCHEMA
// ============================================

export const listPlansQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, "Page must be at least 1"),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine(
      (val) => val >= 1 && val <= 100,
      "Limit must be between 1 and 100"
    ),

  search: z.string().optional(),

  status: z
    .enum(["DRAFT", "ACTIVE", "DEPRECATED", "SUSPENDED"])
    .optional(),

  type: z.enum(["PRE_MADE", "CUSTOM"]).optional(),

  has_active_promo: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  sort_by: z
    .enum(["created_at", "name", "price", "status", "activated_at"])
    .optional()
    .default("created_at"),

  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),

  include_deleted: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});