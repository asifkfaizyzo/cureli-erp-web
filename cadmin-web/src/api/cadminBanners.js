// cadmin-web/src/api/cadminBanners.js (do not remove this comment)
// cadmin-web/src/api/cadminBanners.js

import CAdminAPI from "./axios";

// ── Slides ─────────────────────────────────────────────────────────────────

export const getBannerSlides = () =>
  CAdminAPI.get("/app-config/banners/slides");

export const createBannerSlide = (data) =>
  CAdminAPI.post("/app-config/banners/slides", data);

export const updateBannerSlide = (slideId, data) =>
  CAdminAPI.patch(`/app-config/banners/slides/${slideId}`, data);

export const reorderBannerSlides = (orderedIds) =>
  CAdminAPI.patch("/app-config/banners/slides/reorder", { orderedIds });

export const deleteBannerSlide = (slideId) =>
  CAdminAPI.delete(`/app-config/banners/slides/${slideId}`);

export const uploadBannerSlideImage = (slideId, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return CAdminAPI.post(
    `/app-config/banners/slides/${slideId}/image`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );
};

export const deleteBannerSlideImage = (slideId) =>
  CAdminAPI.delete(`/app-config/banners/slides/${slideId}/image`);

// ── Strips ─────────────────────────────────────────────────────────────────

export const getStrips = () =>
  CAdminAPI.get("/app-config/banners/strips");

export const createStrip = (data) =>
  CAdminAPI.post("/app-config/banners/strips", data);

export const updateStrip = (stripId, data) =>
  CAdminAPI.patch(`/app-config/banners/strips/${stripId}`, data);

export const reorderStrips = (data) =>
  CAdminAPI.patch("/app-config/banners/strips/reorder", data);

export const deleteStrip = (stripId) =>
  CAdminAPI.delete(`/app-config/banners/strips/${stripId}`);

export const uploadStripImage = (stripId, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return CAdminAPI.post(
    `/app-config/banners/strips/${stripId}/image`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );
};

export const deleteStripImage = (stripId) =>
  CAdminAPI.delete(`/app-config/banners/strips/${stripId}/image`);