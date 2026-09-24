import { z } from "zod";

// ── POST /rider/location ─────────────────────────────────────
export const updateLocationSchema = z.object({
  lat: z
    .number({ required_error: "Latitude is required" })
    .min(6, "Latitude out of India bounds")
    .max(38, "Latitude out of India bounds"),
  lng: z
    .number({ required_error: "Longitude is required" })
    .min(68, "Longitude out of India bounds")
    .max(98, "Longitude out of India bounds"),
  accuracy: z.number().min(0).optional(),
  speed: z.number().min(0).optional(),
});

// ── PUT /rider/availability ──────────────────────────────────
export const toggleAvailabilitySchema = z
  .object({
    is_online: z.boolean({ required_error: "is_online is required" }),
    lat: z.number().min(6).max(38).optional(),
    lng: z.number().min(68).max(98).optional(),
  })
  .superRefine((data, ctx) => {
    // Going online requires a current GPS fix
    if (data.is_online && (data.lat == null || data.lng == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current location (lat, lng) is required to go online",
        path: ["lat"],
      });
    }
  });