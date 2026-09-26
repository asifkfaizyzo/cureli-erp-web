// backend/src/modules/mobile/medicines/mobile.medicines.schema.js (do not remove this comment)
// src/modules/mobile/medicines/mobile.medicines.schema.js
//
// Validation schemas for the PUBLIC mobile medicine discovery endpoints.
//
// medicineShopsQuerySchema (new):
//   Validates optional lat/lng query params for the shops endpoint.
//   Both must be present together or both absent — partial coords are
//   rejected because a single coordinate produces no useful distance.
//
// categories param (new):
//   Accepts a comma-separated string of primary_category values.
//   e.g. ?categories=ANTI+INFECTIVES,PAIN+ANALGESICS,CARDIAC
//   Parsed by the controller into a string array before passing to the service.
//   Cannot be combined with category — one or the other.

import { z } from "zod";

// ── Shared primitives ─────────────────────────────────────────

const pageParam = z.coerce
  .number()
  .int()
  .min(1, { message: "page must be >= 1" })
  .default(1);

const limitParam = z.coerce
  .number()
  .int()
  .min(1)
  .max(50, { message: "limit must be <= 50" })
  .default(20);

const typeParam = z
  .enum(["DRUG", "OTC"], {
    errorMap: () => ({ message: "type must be DRUG or OTC" }),
  })
  .optional();

const categoryParam = z.string().trim().min(1).max(100).optional();
const searchParam = z.string().trim().min(1).max(100).optional();

const hasImageParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return value;
}, z.boolean().optional());

// ── categories param ──────────────────────────────────────────
// Comma-separated string. Controller splits it into string[].
// Each segment must be non-empty after trimming.
// Max 50 categories — a sanity guard against abuse.

const categoriesParam = z.string().trim().min(1).max(2000).optional();

// ── Feed (list) query ─────────────────────────────────────────

export const listMedicinesQuerySchema = z
  .object({
    page: pageParam,
    limit: limitParam,
    type: typeParam,
    category: categoryParam,
    categories: categoriesParam,
    search: searchParam,
    hasImage: hasImageParam,
  })
  .refine((data) => !(data.category && data.categories), {
    message: "category and categories cannot both be provided",
    path: ["category"],
  });

// ── Single variant params ─────────────────────────────────────

export const variantParamsSchema = z.object({
  variantId: z.string().trim().min(1).max(100),
});

// ── Medicine shops query ──────────────────────────────────────
// lat and lng are both optional. If one is present the other must
// also be present — partial coords are meaningless for distance sort.

const latParam = z.coerce
  .number()
  .min(-90, { message: "lat must be >= -90" })
  .max(90, { message: "lat must be <= 90" })
  .optional();

const lngParam = z.coerce
  .number()
  .min(-180, { message: "lng must be >= -180" })
  .max(180, { message: "lng must be <= 180" })
  .optional();

export const medicineShopsQuerySchema = z
  .object({
    lat: latParam,
    lng: lngParam,
  })
  .refine(
    (data) => {
      const hasLat = data.lat !== undefined;
      const hasLng = data.lng !== undefined;
      return hasLat === hasLng;
    },
    {
      message: "lat and lng must both be provided or both omitted",
    },
  );
