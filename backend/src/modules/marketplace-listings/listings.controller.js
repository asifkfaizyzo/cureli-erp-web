// backend/src/modules/marketplace-listings/listings.controller.js (do not remove this comment)
// backend/src/modules/marketplace-listings/listings.controller.js

import * as ListingsService from "./listings.service.js";
import { success, fail } from "../../utils/response.js";

// GET /api/marketplace/listings/summary
export const getBranchSummary = async (req, res) => {
  try {
    const data = await ListingsService.getBranchSummary(
      req.user.shop_id,
      req.user
    );
    return success(res, data, "Branch summary retrieved");
  } catch (error) {
    console.error("[listings] getBranchSummary error:", error);
    return fail(res, error.message, 500);
  }
};

// GET /api/marketplace/listings/categories
export const getCategories = async (req, res) => {
  try {
    const data = await ListingsService.getCategories(
      req.user.shop_id,
      req.query.branch_id,
      req.user
    );
    return success(res, data, "Categories retrieved");
  } catch (error) {
    console.error("[listings] getCategories error:", error);
    const status = error.message.includes("Access denied") ? 403 : 500;
    return fail(res, error.message, status);
  }
};

// PATCH /api/marketplace/listings/categories
export const updateCategoryVisibility = async (req, res) => {
  try {
    const { branch_id, category_name, is_enabled } = req.body;
    const data = await ListingsService.updateCategoryVisibility(
      req.user.shop_id,
      branch_id,
      category_name,
      is_enabled,
      req.user
    );
    return success(res, data, "Category visibility updated");
  } catch (error) {
    console.error("[listings] updateCategoryVisibility error:", error);
    const status =
      error.message.includes("Access denied") ||
      error.message.includes("Staff cannot")
        ? 403
        : 500;
    return fail(res, error.message, status);
  }
};

// GET /api/marketplace/listings
export const getListings = async (req, res) => {
  try {
    const data = await ListingsService.getListings(
      req.user.shop_id,
      req.query,
      req.user
    );
    return success(res, data, "Listings retrieved");
  } catch (error) {
    console.error("[listings] getListings error:", error);
    const status =
      error.message.includes("Access denied") ||
      error.message.includes("branch_id is required")
        ? 403
        : 500;
    return fail(res, error.message, status);
  }
};

// GET /api/marketplace/listings/:listing_id/detail
export const getListingDetail = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const data = await ListingsService.getListingDetail(
      listing_id,
      req.user.shop_id,
      req.user
    );
    return success(res, data, "Listing detail retrieved");
  } catch (error) {
    console.error("[listings] getListingDetail error:", error);
    const status =
      error.message.includes("Access denied")
        ? 403
        : error.message.includes("not found")
        ? 404
        : 500;
    return fail(res, error.message, status);
  }
};

// PATCH /api/marketplace/listings/:listing_id
export const updateListing = async (req, res) => {
  try {
    const { listing_id } = req.params;
    const data = await ListingsService.updateListing(
      req.user.shop_id,
      listing_id,
      req.body,
      req.user
    );
    return success(res, data, "Listing updated");
  } catch (error) {
    console.error("[listings] updateListing error:", error);
    const status =
      error.message.includes("Access denied") ||
      error.message.includes("Staff cannot")
        ? 403
        : error.message.includes("not found")
        ? 404
        : 400;
    return fail(res, error.message, status);
  }
};

// POST /api/marketplace/listings/bulk
export const bulkUpdateListings = async (req, res) => {
  try {
    const { listing_ids, patch } = req.body;
    const data = await ListingsService.bulkUpdateListings(
      req.user.shop_id,
      listing_ids,
      patch,
      req.user
    );
    return success(res, data, "Listings updated");
  } catch (error) {
    console.error("[listings] bulkUpdateListings error:", error);
    const status =
      error.message.includes("Access denied") ||
      error.message.includes("Staff cannot")
        ? 403
        : 400;
    return fail(res, error.message, status);
  }
};

// POST /api/marketplace/listings/sync
export const syncInventory = async (req, res) => {
  try {
    const data = await ListingsService.syncInventory(
      req.user.shop_id,
      req.query.branch_id,
      req.user
    );
    return success(res, data, "Inventory synced");
  } catch (error) {
    console.error("[listings] syncInventory error:", error);
    const status =
      error.message.includes("Access denied") ||
      error.message.includes("Staff cannot")
        ? 403
        : 400;
    return fail(res, error.message, status);
  }
};