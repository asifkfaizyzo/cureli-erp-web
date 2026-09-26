// cadmin-web/src/api/cadminMarketplaceShops.js (do not remove this comment)
// cadmin-web/src/api/cadminMarketplaceShops.js

import CAdminAPI from "./axios";

// ── Shops ──────────────────────────────────────────────────────
export const getMarketplaceShops = (params = {}) =>
  CAdminAPI.get("/marketplace/shops", { params });

export const getMarketplaceShopById = (shopId) =>
  CAdminAPI.get(`/marketplace/shops/${shopId}`);

// ── Marketplace Visibility (is_live toggle) ────────────────────
export const toggleShopMarketplaceVisibility = (shopId, visible) =>
  CAdminAPI.patch(`/marketplace/shops/${shopId}/visibility`, { visible });

// ── Storefront & Bank Details ──────────────────────────────────
export const updateShopStorefront = (shopId, data) =>
  CAdminAPI.patch(`/marketplace/shops/${shopId}/storefront`, data);

// ── Branches ───────────────────────────────────────────────────
export const blockMarketplaceBranch = (shopId, branchId, block) =>
  CAdminAPI.patch(
    `/marketplace/shops/${shopId}/branches/${branchId}/block`,
    { block }
  );

export const updateBranchMarketplaceConfig = (shopId, branchId, data) =>
  CAdminAPI.patch(
    `/marketplace/shops/${shopId}/branches/${branchId}/config`,
    data
  );

// ── Branch Visibility (marketplace_enabled toggle) ─────────────
export const toggleBranchMarketplaceVisibility = (shopId, branchId, visible) =>
  CAdminAPI.patch(
    `/marketplace/shops/${shopId}/branches/${branchId}/visibility`,
    { visible }
  );

// ── Holidays ───────────────────────────────────────────────────
export const getShopHolidays = (shopId) =>
  CAdminAPI.get(`/marketplace/shops/${shopId}/holidays`);

export const createShopHoliday = (shopId, data) =>
  CAdminAPI.post(`/marketplace/shops/${shopId}/holidays`, data);

export const deleteShopHoliday = (shopId, holidayId) =>
  CAdminAPI.delete(`/marketplace/shops/${shopId}/holidays/${holidayId}`);

// ── Upload ─────────────────────────────────────────────────────
export const uploadMarketplaceAsset = (type, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return CAdminAPI.post(`/marketplace/upload/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};

// ── Places proxy ───────────────────────────────────────────────
export const searchPlaces = (query) =>
  CAdminAPI.get("/marketplace/places/search", { params: { query } });

export const getPlaceDetails = (place_id) =>
  CAdminAPI.get("/marketplace/places/details", { params: { place_id } });