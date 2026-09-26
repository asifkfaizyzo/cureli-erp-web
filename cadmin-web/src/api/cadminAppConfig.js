// cadmin-web/src/api/cadminAppConfig.js (do not remove this comment)
// cadmin-web/src/api/cadminAppConfig.js
//
// CAdmin API calls for App Config — category display overrides.
//
// Follows the exact pattern of cadminMarketplaceShops.js:
//   - Uses CAdminAPI (axios instance)
//   - Category keys may contain spaces — always URI-encode in path segments
//   - Image upload uses multipart/form-data with upload progress callback

import CAdminAPI from "./axios";

// ── GET /cadmin/app-config/categories ────────────────────────────────────────
// Returns all 12 categories merged with current override state.

export const getCategoryDisplayOverrides = () =>
  CAdminAPI.get("/app-config/categories");

// ── POST /cadmin/app-config/categories/:key/image ─────────────────────────────
// Upload or replace the image for a category.
// key is URI-encoded so spaces become %20 in the path.

export const uploadCategoryImage = (key, file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return CAdminAPI.post(
    `/app-config/categories/${encodeURIComponent(key)}/image`,
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

// ── DELETE /cadmin/app-config/categories/:key/image ───────────────────────────
// Remove a category image. Mobile falls back to the Ionicons icon.

export const deleteCategoryImage = (key) =>
  CAdminAPI.delete(`/app-config/categories/${encodeURIComponent(key)}/image`);

// ── PATCH /cadmin/app-config/categories/:key/visibility ───────────────────────
// Body: { isHidden: boolean }

export const setCategoryVisibility = (key, isHidden) =>
  CAdminAPI.patch(
    `/app-config/categories/${encodeURIComponent(key)}/visibility`,
    { isHidden }
  );