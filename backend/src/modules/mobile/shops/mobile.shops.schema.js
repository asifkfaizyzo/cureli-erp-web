// backend/src/modules/mobile/shops/mobile.shops.schema.js (do not remove this comment)
// src/modules/mobile/shops/mobile.shops.schema.js
//
// Validation schemas for the PUBLIC mobile shop discovery endpoints.
// Same pattern as mobile.medicines.schema.js — zod, coerced, length-bounded.
// No auth required on these endpoints.

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

const latParam = z.coerce
  .number()
  .min(-90)
  .max(90)
  .optional();

const lngParam = z.coerce
  .number()
  .min(-180)
  .max(180)
  .optional();

// ── Shop search query ─────────────────────────────────────────
// q is optional — if absent or < 2 chars, returns all live shops
// ordered by listing count descending.

export const shopSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  lat: latParam,
  lng: lngParam,
  page: pageParam,
  limit: limitParam,
});

// ── Shop profile params ───────────────────────────────────────

export const shopParamsSchema = z.object({
  shopId: z.string().uuid("shopId must be a valid UUID"),
});

// ── Shop profile query (optional location for distance) ───────

export const shopProfileQuerySchema = z.object({
  lat: latParam,
  lng: lngParam,
});

// ── Branch medicines params ───────────────────────────────────

export const branchMedicinesParamsSchema = z.object({
  shopId: z.string().uuid("shopId must be a valid UUID"),
  branchId: z.string().uuid("branchId must be a valid UUID"),
});

// ── Branch medicines query ────────────────────────────────────

export const branchMedicinesQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  page: pageParam,
  limit: limitParam,
});