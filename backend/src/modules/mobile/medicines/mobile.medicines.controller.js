// backend/src/modules/mobile/medicines/mobile.medicines.controller.js (do not remove this comment)
// src/modules/mobile/medicines/mobile.medicines.controller.js
//
// PUBLIC mobile medicine discovery — controllers.
//
// handleGetMedicineShops:
//   GET /mobile/medicines/:variantId/shops?lat=X&lng=Y
//   Accepts sku_id or variant UUID in the path param (same dual-lookup
//   as handleGetMedicine). Resolves to variant_id before querying shops
//   so the service can join on MarketplaceListing.linked_variant_id.
//   lat/lng are optional — omit for unsorted results.
//
// categories param:
//   GET /mobile/medicines?categories=ANTI+INFECTIVES,PAIN+ANALGESICS
//   The schema validates the raw comma-separated string.
//   The controller splits it into a clean string[] before passing to
//   the service. Empty segments (e.g. trailing commas) are dropped.
//   Cannot be combined with category — schema enforces this.

import { success, fail } from "../../../utils/response.js";
import {
  listMedicinesQuerySchema,
  variantParamsSchema,
  medicineShopsQuerySchema,
} from "./mobile.medicines.schema.js";
import {
  listMobileMedicines,
  listMobileFeed,
  getMobileMedicine,
  getMedicineShops,
} from "./mobile.medicines.service.js";
import { CURATED_CATEGORIES } from "./mobile.medicines.categories.js";
import prisma from "../../../config/prisma.js";
import { getCategoryOverrideMap } from "../../cadmin/app-config/cadmin.appConfig.service.js";

// ── GET /mobile/medicines/feed ────────────────────────────────

export async function handleGetFeed(_req, res) {
  try {
    const result = await listMobileFeed(8);
    return success(res, result, "Feed fetched");
  } catch (err) {
    console.error("[mobile.medicines] feed error:", err);
    return fail(res, "Failed to fetch feed", 500);
  }
}

// ── GET /mobile/medicines ─────────────────────────────────────

export async function handleListMedicines(req, res) {
  const parsed = listMedicinesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message || "Invalid query parameters";
    return fail(res, msg, 400);
  }

  // Split the raw categories string into a clean string array.
  // Schema has already validated the raw string — we just need to split it.
  // Filter out any empty segments from trailing/leading commas.
  const rawCategories = parsed.data.categories;
  const categoriesArray = rawCategories
    ? rawCategories
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : undefined;

  try {
    const result = await listMobileMedicines({
      page: parsed.data.page,
      limit: parsed.data.limit,
      type: parsed.data.type,
      category: parsed.data.category,
      categories: categoriesArray,
      search: parsed.data.search,
      hasImage: parsed.data.hasImage,
    });
    return success(res, result, "Medicines fetched");
  } catch (err) {
    console.error("[mobile.medicines] list error:", err);
    return fail(res, "Failed to fetch medicines", 500);
  }
}

// ── GET /mobile/medicines/categories ──────────────────────────

export async function handleListCategories(_req, res) {
  try {
    const overrideMap = await getCategoryOverrideMap();

    const categories = CURATED_CATEGORIES
      .filter((cat) => {
        const override = overrideMap[cat.key];
        // No row = visible (default). Row with is_hidden = true = filtered out.
        return !override?.isHidden;
      })
      .map((cat) => {
        const override = overrideMap[cat.key];
        return {
          ...cat,
          imageUrl: override?.imageUrl ?? null,
        };
      });

    return success(res, { categories }, "Categories fetched");
  } catch (err) {
    console.error("[mobile.medicines] categories error:", err);
    return fail(res, "Failed to fetch categories", 500);
  }
}

// ── GET /mobile/medicines/:variantId ──────────────────────────

export async function handleGetMedicine(req, res) {
  const parsed = variantParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return fail(res, "Invalid medicine identifier", 400);
  }

  try {
    const result = await getMobileMedicine(parsed.data.variantId);
    if (!result) {
      return fail(res, "Medicine not found", 404);
    }
    return success(res, result, "Medicine fetched");
  } catch (err) {
    console.error("[mobile.medicines] detail error:", err);
    return fail(res, "Failed to fetch medicine", 500);
  }
}

// ── GET /mobile/medicines/:variantId/shops ────────────────────
//
// Accepts sku_id OR variant UUID.
// Performs dual lookup to resolve to variant_id (UUID) before querying
// listings — MarketplaceListing.linked_variant_id is always a UUID.

export async function handleGetMedicineShops(req, res) {
  const paramsParsed = variantParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return fail(res, "Invalid medicine identifier", 400);
  }

  const queryParsed = medicineShopsQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    const msg =
      queryParsed.error.issues?.[0]?.message || "Invalid query parameters";
    return fail(res, msg, 400);
  }

  const { variantId: idOrSku } = paramsParsed.data;
  const { lat, lng } = queryParsed.data;

  try {
    // ── Resolve sku_id / UUID → variant_id ──────────────────
    // MarketplaceListing.linked_variant_id is always a UUID.
    // The path param may be a sku_id (e.g. "10005") so we must resolve.
    let variantId = idOrSku;

    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSku
      );

    if (!looksLikeUuid) {
      const variant = await prisma.masterMedicineVariant.findUnique({
        where: { sku_id: idOrSku },
        select: { variant_id: true },
      });
      if (!variant) {
        return fail(res, "Medicine not found", 404);
      }
      variantId = variant.variant_id;
    }

    const shops = await getMedicineShops(variantId, lat ?? null, lng ?? null);
    return success(res, { shops }, "Medicine shops fetched");
  } catch (err) {
    console.error("[mobile.medicines] shops error:", err);
    return fail(res, "Failed to fetch medicine shops", 500);
  }
}