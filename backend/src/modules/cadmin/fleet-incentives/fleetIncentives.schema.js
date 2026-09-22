// backend/src/modules/cadmin/fleet-incentives/fleetIncentives.schema.ts

import { z } from "zod";

const tierSchema = z.object({
  target_value: z.number().positive(),
  reward_amount: z.number().positive(),
});

export const createTemplateSchema = z.object({
  title: z.string().max(150),
  description: z.string().max(500).nullable().optional(),
  period_type: z.enum(["DAILY", "WEEKLY", "CUSTOM_PERIOD"]).default("DAILY"),
  metric_type: z.enum(["ORDER_COUNT", "BASE_EARNINGS"]).default("ORDER_COUNT"),
  min_online_hours: z.number().min(0).max(24).nullable().optional(),
  max_denial_count: z.number().int().min(0).nullable().optional(),
  max_cancellation_count: z.number().int().min(0).nullable().optional(),
  min_acceptance_rate: z.number().min(0).max(100).nullable().optional(),
  min_completion_rate: z.number().min(0).max(100).nullable().optional(),
  tiers: z.array(tierSchema).min(1).max(6),
});

export const updateTemplateSchema = z.object({
  title: z.string().max(150).optional(),
  description: z.string().max(500).nullable().optional(),
  period_type: z.enum(["DAILY", "WEEKLY", "CUSTOM_PERIOD"]).optional(),
  metric_type: z.enum(["ORDER_COUNT", "BASE_EARNINGS"]).optional(),
  min_online_hours: z.number().min(0).max(24).nullable().optional(),
  max_denial_count: z.number().int().min(0).nullable().optional(),
  max_cancellation_count: z.number().int().min(0).nullable().optional(),
  min_acceptance_rate: z.number().min(0).max(100).nullable().optional(),
  min_completion_rate: z.number().min(0).max(100).nullable().optional(),
  is_active: z.boolean().optional(),
  tiers: z.array(tierSchema).min(1).max(6).optional(),
});

export const assignScheduleSchema = z.object({
  template_id: z.string().uuid(),
  start_date: z.string().date(),
  end_date: z.string().date().optional(),
  is_featured: z.boolean().default(false),
  custom_tag: z.string().max(50).nullable().optional(),
});

export const bulkAssignSchema = z.object({
  assignments: z
    .array(
      z.object({
        date: z.string().date(),
        template_id: z.string().uuid(),
        is_featured: z.boolean().default(false),
        custom_tag: z.string().max(50).nullable().optional(),
      })
    )
    .min(1),
});

export const evaluateShiftSchema = z.object({
  shift_date: z.string().date(),
});