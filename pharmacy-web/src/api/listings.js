// pharmacy-web/src/api/listings.js (do not remove this comment)
// src/api/listings.js

import API from "./axios";

// ─────────────────────────────────────────────
// BRANCH SUMMARY
// ─────────────────────────────────────────────

export const getBranchSummary = () =>
  API.get("/marketplace-listing/summary");

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

export const getCategories = (branch_id) =>
  API.get("/marketplace-listing/categories", {
    params: { branch_id },
  });

export const updateCategoryVisibility = (data) =>
  API.patch("/marketplace-listing/categories", data);

// ─────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────

export const getListings = (params) =>
  API.get("/marketplace-listing", { params });

export const getListingDetail = (listing_id) =>
  API.get(`/marketplace-listing/${listing_id}/detail`);

export const updateListing = (listing_id, patch) =>
  API.patch(`/marketplace-listing/${listing_id}`, patch);

export const bulkUpdateListings = (listing_ids, patch) =>
  API.post("/marketplace-listing/bulk", { listing_ids, patch });

export const syncInventory = (branch_id) =>
  API.post("/marketplace-listing/sync", null, {
    params: { branch_id },
  });