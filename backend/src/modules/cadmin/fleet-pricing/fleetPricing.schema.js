// backend/src/modules/cadmin/fleet-pricing/fleetPricing.schema.js (do not remove this comment)
// backend/src/modules/cadmin/fleet-pricing/fleetPricing.schema.ts

import { z } from "zod";

const slabSchema = z
  .object({
    from_km: z.number().min(0),
    to_km: z.number().nullable().optional(),
    rate_type: z.enum(["FLAT_FIXED", "PER_KM"]),
    rate: z.number().min(0),
  })
  .refine(
    (data) =>
      data.to_km === null || data.to_km === undefined || data.to_km > data.from_km,
    { message: "to_km must be greater than from_km", path: ["to_km"] }
  );

export const createPricingConfigSchema = z.object({
  name: z.string().max(100).optional(),
  min_floor_payout: z.number().min(0),
  pickup_base_fee: z.number().min(0),
  drop_base_fee: z.number().min(0),
  is_immediate: z.boolean().default(true),
  effective_from: z.string().datetime({ offset: true }).nullable().optional(),
  pickup_slabs: z.array(slabSchema).min(1),
  drop_slabs: z.array(slabSchema).min(1),
});

export const simulatePricingSchema = z.object({
  pickup_distance_km: z.number().min(0),
  drop_distance_km: z.number().min(0),
  min_floor_payout: z.number().min(0),
  pickup_base_fee: z.number().min(0),
  drop_base_fee: z.number().min(0),
  pickup_slabs: z.array(slabSchema),
  drop_slabs: z.array(slabSchema),
});

export const createSurgeRuleSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(255).nullable().optional(),
  calc_type: z.enum(["MULTIPLIER", "FLAT_ADDITION"]),
  value: z.number().positive(),
});

export const toggleSurgeRuleSchema = z.object({
  is_active: z.boolean(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
});