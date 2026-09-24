// pharmacy-web/src/api/marketplace.js (do not remove this comment)
// pharmacy-web/src/api/marketplace.js

import API from "./axios";

// ─────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────
export const getMarketplaceStatus = () =>
  API.get("/marketplace/status");

// ─────────────────────────────────────────────
// DRAFT AUTOSAVE
// ─────────────────────────────────────────────
export const saveDraft = (payload) =>
  API.post("/marketplace/onboarding/draft", payload);

// ─────────────────────────────────────────────
// ONBOARDING STEPS
// ─────────────────────────────────────────────
export const saveStorefront = (data) =>
  API.post("/marketplace/onboarding/storefront", data);

export const saveBranchSelections = (branch_ids) =>
  API.post("/marketplace/onboarding/branches", { branch_ids });

export const saveBranchConfig = (branch_id, data) =>
  API.post(`/marketplace/onboarding/branch-config/${branch_id}`, data);

// ── BANKING API EXPORTS ───────────────────────
export const saveBanking = (data) =>
  API.post("/marketplace/onboarding/banking", data);

export const updateBankingDetails = (data) =>
  API.patch("/marketplace/banking", data);
// ─────────────────────────────────────────────

export const goLive = () =>
  API.post("/marketplace/onboarding/go-live");

// ─────────────────────────────────────────────
// POST-ONBOARDING MANAGEMENT
// ─────────────────────────────────────────────
export const getStorefront = () =>
  API.get("/marketplace/storefront");

export const updateStorefront = (data) =>
  API.patch("/marketplace/storefront", data);

export const getBranchSettings = () =>
  API.get("/marketplace/branches");

export const updateBranchSettings = (branch_id, data) =>
  API.patch(`/marketplace/branches/${branch_id}`, data);

export const suspendMarketplace = () =>
  API.post("/marketplace/suspend");

export const resumeMarketplace = () =>
  API.post("/marketplace/resume");

// ─────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────
export const uploadMarketplaceAsset = (type, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post(`/marketplace/upload/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

export const uploadBranchImage = (branch_id, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post(`/marketplace/upload/branch_image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

// ─────────────────────────────────────────────
// PLACES PROXY
// ─────────────────────────────────────────────
export const searchPlaces = (query) =>
  API.get("/marketplace/places/search", { params: { query } });

export const getPlaceDetails = (place_id) =>
  API.get("/marketplace/places/details", { params: { place_id } });

// ─────────────────────────────────────────────
// HOLIDAYS
// ─────────────────────────────────────────────
export const listHolidays = (branchId) =>
  API.get('/marketplace/holidays', { params: { branch_id: branchId } })
    .then((r) => r.data);

export const createHoliday = (data) =>
  API.post('/marketplace/holidays', data).then((r) => r.data);

export const deleteHoliday = (holidayId) =>
  API.delete(`/marketplace/holidays/${holidayId}`).then((r) => r.data);