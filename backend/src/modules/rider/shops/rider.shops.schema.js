import { z } from "zod";

export const nearbyShopsQuerySchema = z.object({
  lat: z
    .string()
    .transform(Number)
    .pipe(z.number().min(6).max(38)),
  lng: z
    .string()
    .transform(Number)
    .pipe(z.number().min(68).max(98)),
  radius_km: z
    .string()
    .optional()
    .default("10")
    .transform(Number)
    .pipe(z.number().min(1).max(50)),
});