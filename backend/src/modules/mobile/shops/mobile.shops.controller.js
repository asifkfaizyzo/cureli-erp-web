// backend/src/modules/mobile/shops/mobile.shops.controller.js (do not remove this comment)
// src/modules/mobile/shops/mobile.shops.controller.js
//
// PUBLIC mobile shop discovery — controllers.
// Same pattern as mobile.medicines.controller.js.
// No auth required. Rate-limited at the /mobile mount level.

import { success, fail } from "../../../utils/response.js";
import {
  shopSearchQuerySchema,
  shopParamsSchema,
  shopProfileQuerySchema,
  branchMedicinesParamsSchema,
  branchMedicinesQuerySchema,
} from "./mobile.shops.schema.js";
import {
  searchShops,
  getShopProfile,
  getBranchMedicines,
} from "./mobile.shops.service.js";

// ── GET /mobile/shops/search ──────────────────────────────────
//
// Unified shop search. q is optional — omitting it returns all live
// shops ordered by listing count. lat/lng are optional — omitting
// them skips distance computation and sorts by listing count.
export async function handleSearchShops(req, res) {
  const parsed = shopSearchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg =
      parsed.error.issues?.[0]?.message || "Invalid query parameters";
    return fail(res, msg, 400);
  }

  try {
    const result = await searchShops(parsed.data);
    return success(res, result, "Shops fetched");
  } catch (err) {
    console.error("[mobile.shops] search error:", err);
    return fail(res, "Failed to search shops", 500);
  }
}

// ── GET /mobile/shops/:shopId ─────────────────────────────────
//
// Full shop profile with all marketplace-onboarded branches.
// Returns null → 404 if shop does not exist or is not live.
export async function handleGetShopProfile(req, res) {
  const paramsParsed = shopParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return fail(res, "Invalid shop ID", 400);
  }

  const queryParsed = shopProfileQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return fail(res, "Invalid query parameters", 400);
  }

  try {
    const { shopId } = paramsParsed.data;
    const { lat, lng } = queryParsed.data;

    const result = await getShopProfile(
      shopId,
      lat ?? null,
      lng ?? null
    );

    if (!result) {
      return fail(res, "Shop not found", 404);
    }

    return success(res, result, "Shop fetched");
  } catch (err) {
    console.error("[mobile.shops] profile error:", err);
    return fail(res, "Failed to fetch shop", 500);
  }
}

// ── GET /mobile/shops/:shopId/branches/:branchId/medicines ────
//
// Paginated medicines for a specific branch.
// Returns null → 404 if branch does not belong to the shop or
// the shop is not live.
export async function handleGetBranchMedicines(req, res) {
  const paramsParsed = branchMedicinesParamsSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    const msg =
      paramsParsed.error.issues?.[0]?.message || "Invalid parameters";
    return fail(res, msg, 400);
  }

  const queryParsed = branchMedicinesQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    const msg =
      queryParsed.error.issues?.[0]?.message || "Invalid query parameters";
    return fail(res, msg, 400);
  }

  try {
    const { shopId, branchId } = paramsParsed.data;
    const { search, page, limit } = queryParsed.data;

    const result = await getBranchMedicines(shopId, branchId, {
      search,
      page,
      limit,
    });

    if (!result) {
      return fail(res, "Branch not found", 404);
    }

    return success(res, result, "Branch medicines fetched");
  } catch (err) {
    console.error("[mobile.shops] branch medicines error:", err);
    return fail(res, "Failed to fetch branch medicines", 500);
  }
}