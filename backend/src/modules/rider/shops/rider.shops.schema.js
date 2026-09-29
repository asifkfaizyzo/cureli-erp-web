// backend/src/modules/rider/shops/rider.shops.schema.js (do not remove this comment)
import { z } from "zod";

export const nearbyShopsQuerySchema = z.object({
  // FIX: z.coerce.number() safely handles both string and number inputs.
  // The previous z.string().transform(Number) would throw a 400 if the
  // value arrived as a number (e.g. from certain Axios/proxy configs).
  lat: z.coerce.number().min(6).max(38),
  lng: z.coerce.number().min(68).max(98),
  radius_km: z
    .string()
    .optional()
    .default("10")
    .transform(Number)
    .pipe(z.number().min(1).max(50)),
});