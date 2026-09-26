// backend/src/modules/cadmin/marketplace/cadmin.marketplace.controller.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace/cadmin.marketplace.controller.js

import { success, fail } from "../../../utils/response.js";
import * as Service from "./cadmin.marketplace.service.js";
import * as PlacesService from "./cadmin.places.service.js";
import { handleCAdminMarketplaceUpload } from "./cadmin.marketplace.upload.js";

// ─────────────────────────────────────────────
// SHOPS
// ─────────────────────────────────────────────

// GET /cadmin/marketplace/shops
export const listShops = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      marketplace_status = "",
    } = req.query;

    const data = await Service.listShopsWithMarketplace({
      page: Math.max(1, parseInt(page)),
      limit: Math.min(100, parseInt(limit)),
      search: search.trim(),
      status,
      marketplace_status,
    });

    return success(res, data, "Shops fetched");
  } catch (err) {
    console.error("[cadminMarketplace] listShops:", err.message);
    return fail(res, err.message, 500);
  }
};

// GET /cadmin/marketplace/shops/:shop_id
export const getShop = async (req, res) => {
  try {
    const data = await Service.getShopDetail(req.params.shop_id);
    return success(res, data, "Shop detail fetched");
  } catch (err) {
    console.error("[cadminMarketplace] getShop:", err.message);
    return fail(
      res,
      err.message,
      err.message === "Shop not found" ? 404 : 500
    );
  }
};

// PATCH /cadmin/marketplace/shops/:shop_id/block
export const blockShop = async (req, res) => {
  try {
    const { block } = req.body;

    if (typeof block !== "boolean") {
      return fail(res, "block must be a boolean", 400);
    }

    const data = await Service.setShopBlockStatus(req.params.shop_id, block);

    return success(
      res,
      data,
      block ? "Shop blocked successfully" : "Shop unblocked successfully"
    );
  } catch (err) {
    console.error("[cadminMarketplace] blockShop:", err.message);
    return fail(
      res,
      err.message,
      err.message === "Shop not found" ? 404 : 500
    );
  }
};

// PATCH /cadmin/marketplace/shops/:shop_id/storefront
export const updateStorefront = async (req, res) => {
  try {
    const { shop_id } = req.params;
    const {
      storefront_name,
      storefront_description,
      support_phone,
      logo_url,
      banner_url,
    } = req.body;

    const data = await Service.updateShopStorefront(shop_id, {
      storefront_name,
      storefront_description,
      support_phone,
      logo_url,
      banner_url,
    });

    return success(res, data, "Storefront updated");
  } catch (err) {
    console.error("[cadminMarketplace] updateStorefront:", err.message);
    return fail(
      res,
      err.message,
      err.message.includes("not found") ? 404 : 400
    );
  }
};

// PATCH /cadmin/marketplace/shops/:shop_id/branches/:branch_id/block
export const blockBranch = async (req, res) => {
  try {
    const { block } = req.body;

    if (typeof block !== "boolean") {
      return fail(res, "block must be a boolean", 400);
    }

    const data = await Service.setBranchBlockStatus(
      req.params.shop_id,
      req.params.branch_id,
      block
    );

    return success(
      res,
      data,
      block ? "Branch blocked" : "Branch unblocked"
    );
  } catch (err) {
    console.error("[cadminMarketplace] blockBranch:", err.message);
    return fail(
      res,
      err.message,
      err.message === "Branch not found" ? 404 : 500
    );
  }
};

// PATCH /cadmin/marketplace/shops/:shop_id/branches/:branch_id/config
export const updateBranchConfig = async (req, res) => {
  try {
    const data = await Service.updateBranchMarketplaceConfig(
      req.params.shop_id,
      req.params.branch_id,
      req.body
    );

    return success(res, data, "Branch marketplace config updated");
  } catch (err) {
    console.error("[cadminMarketplace] updateBranchConfig:", err.message);
    return fail(
      res,
      err.message,
      err.message.includes("not found") ? 404 : 400
    );
  }
};

// ─────────────────────────────────────────────
// UPLOAD
// POST /cadmin/marketplace/upload/:type
// ─────────────────────────────────────────────

export const uploadAsset = handleCAdminMarketplaceUpload;

// ─────────────────────────────────────────────
// MOBILE USERS
// ─────────────────────────────────────────────

// GET /cadmin/marketplace/users
export const listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
    } = req.query;

    const data = await Service.listMobileUsers({
      page: Math.max(1, parseInt(page)),
      limit: Math.min(100, parseInt(limit)),
      search: search.trim(),
      status,
    });

    return success(res, data, "Mobile users fetched");
  } catch (err) {
    console.error("[cadminMarketplace] listUsers:", err.message);
    return fail(res, err.message, 500);
  }
};

// GET /cadmin/marketplace/users/:user_id
export const getUser = async (req, res) => {
  try {
    const data = await Service.getMobileUserDetail(req.params.user_id);
    return success(res, data, "User detail fetched");
  } catch (err) {
    console.error("[cadminMarketplace] getUser:", err.message);
    return fail(
      res,
      err.message,
      err.message === "User not found" ? 404 : 500
    );
  }
};

// PATCH /cadmin/marketplace/users/:user_id/block
export const blockUser = async (req, res) => {
  try {
    const { block, reason = "" } = req.body;

    if (typeof block !== "boolean") {
      return fail(res, "block must be a boolean", 400);
    }

    const cadmin_name = req.cadmin?.username || "CAdmin";

    const data = await Service.setMobileUserBlockStatus(
      req.params.user_id,
      block,
      reason,
      cadmin_name
    );

    return success(
      res,
      data,
      block ? "User suspended" : "User reactivated"
    );
  } catch (err) {
    console.error("[cadminMarketplace] blockUser:", err.message);

    const statusMap = {
      "User not found": 404,
      "Cannot modify a deleted account": 403,
      "User is already suspended": 409,
      "User is already active": 409,
    };

    return fail(res, err.message, statusMap[err.message] || 400);
  }
};

// ─────────────────────────────────────────────
// PLACES PROXY
// ─────────────────────────────────────────────

// GET /cadmin/marketplace/places/search?query=...
export const searchPlaces = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return fail(res, "Query must be at least 2 characters", 400);
    }

    const results = await PlacesService.searchPlaces(query.trim());
    return success(res, results, "Places results");
  } catch (err) {
    console.error("[cadminMarketplace] searchPlaces:", err.message);
    return fail(res, "Failed to search places", 500);
  }
};

// GET /cadmin/marketplace/places/details?place_id=...
export const getPlaceDetails = async (req, res) => {
  try {
    const { place_id } = req.query;

    if (!place_id) {
      return fail(res, "place_id is required", 400);
    }

    const result = await PlacesService.getPlaceDetails(place_id);
    return success(res, result, "Place details");
  } catch (err) {
    console.error("[cadminMarketplace] getPlaceDetails:", err.message);
    return fail(res, "Failed to get place details", 500);
  }
};