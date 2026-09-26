//backend\src\modules\cadmin\delivery\cadmin.delivery.schema.js
import { z } from "zod";

export const getAvailableRidersSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  rider_type: z.enum(["TEAM", "INDEPENDENT"]).default("TEAM"),
  search: z.string().optional(),
});

export const assignRiderSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  rider_id: z.string().uuid("Invalid rider ID"),
});