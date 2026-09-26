// backend/src/modules/cadmin/app-config/cadmin.appConfig.controller.js (do not remove this comment)
// backend/src/modules/cadmin/app-config/cadmin.appConfig.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  listCategoryDisplayOverrides,
  uploadCategoryImage,
  deleteCategoryImage,
  setCategoryVisibility,
  listFeedSectionOverrides,
  setFeedSectionVisibility,
  updateFeedSectionLabel,
  reorderFeedSections,
  getHomeScreenConfig,
  updateHomeScreenConfig,
} from "./cadmin.appConfig.service.js";
import { ALLOWED_CATEGORY_KEYS } from "./categoryKeys.registry.js";

import {
  ALLOWED_FEED_SECTION_KEYS,
} from "./feedSection.registry.js";

// ── Helper — extract actor from CAdmin JWT payload ────────────────────────────
// req.cadmin is attached by requireCAdmin middleware.
// Shape confirmed from existing cadmin controllers.

function getActor(req) {
  return {
    cadminId: req.cadmin?.cadmin_id ?? null,
    cadminName: req.cadmin?.name ?? req.cadmin?.username ?? "Unknown",
  };
}

function validateFeedSectionKey(req, res) {
  const key = decodeURIComponent(req.params.key ?? "");
  if (!ALLOWED_FEED_SECTION_KEYS.has(key)) {
    fail(res, `Unknown feed section key: "${key}"`, 400);
    return null;
  }
  return key;
}

// ── Helper — validate :key param ──────────────────────────────────────────────

function validateKey(req, res) {
  const key = decodeURIComponent(req.params.key ?? "");
  if (!ALLOWED_CATEGORY_KEYS.has(key)) {
    fail(res, `Unknown category key: "${key}"`, 400);
    return null;
  }
  return key;
}

// ── GET /cadmin/app-config/categories ─────────────────────────────────────────

export async function handleListCategories(req, res) {
  try {
    const categories = await listCategoryDisplayOverrides();
    return success(res, { categories }, "Category display overrides fetched");
  } catch (err) {
    console.error("[appConfig] list error:", err);
    return fail(res, "Failed to fetch category display overrides", 500);
  }
}

// ── POST /cadmin/app-config/categories/:key/image ─────────────────────────────

export async function handleUploadCategoryImage(req, res) {
  const key = validateKey(req, res);
  if (!key) return;

  if (!req.file) {
    return fail(res, "No file uploaded", 400);
  }

  try {
    const result = await uploadCategoryImage(key, req.file, getActor(req));
    return success(res, result, "Category image uploaded");
  } catch (err) {
    console.error("[appConfig] upload error:", err);

    if (err.code === "INVALID_MIME_TYPE") {
      return fail(res, err.message, 415);
    }
    if (err.code === "FILE_TOO_LARGE") {
      return fail(res, err.message, 413);
    }
    if (err.code === "INVALID_CATEGORY_KEY") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to upload category image", 500);
  }
}

// ── DELETE /cadmin/app-config/categories/:key/image ───────────────────────────

export async function handleDeleteCategoryImage(req, res) {
  const key = validateKey(req, res);
  if (!key) return;

  try {
    await deleteCategoryImage(key, getActor(req));
    return success(res, null, "Category image removed");
  } catch (err) {
    console.error("[appConfig] delete image error:", err);

    if (err.code === "INVALID_CATEGORY_KEY") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to remove category image", 500);
  }
}

// ── PATCH /cadmin/app-config/categories/:key/visibility ───────────────────────

export async function handleSetVisibility(req, res) {
  const key = validateKey(req, res);
  if (!key) return;

  const { isHidden } = req.body;

  if (typeof isHidden !== "boolean") {
    return fail(res, "isHidden must be a boolean", 400);
  }

  try {
    const result = await setCategoryVisibility(key, isHidden, getActor(req));
    return success(
      res,
      result,
      isHidden ? "Category hidden from mobile" : "Category visible on mobile",
    );
  } catch (err) {
    console.error("[appConfig] visibility error:", err);

    if (
      err.code === "INVALID_CATEGORY_KEY" ||
      err.code === "VALIDATION_ERROR"
    ) {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to update category visibility", 500);
  }
}

// ── GET /cadmin/app-config/feed-sections ──────────────────────────────────────

export async function handleListFeedSections(req, res) {
  try {
    const sections = await listFeedSectionOverrides();
    return success(res, { sections }, "Feed sections fetched");
  } catch (err) {
    console.error("[appConfig] feed sections list error:", err);
    return fail(res, "Failed to fetch feed sections", 500);
  }
}

// ── PATCH /cadmin/app-config/feed-sections/reorder ───────────────────────────

export async function handleReorderFeedSections(req, res) {
  const { orderedKeys } = req.body;

  if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) {
    return fail(res, "orderedKeys must be a non-empty array", 400);
  }

  try {
    await reorderFeedSections(orderedKeys, getActor(req));
    return success(res, null, "Feed sections reordered");
  } catch (err) {
    console.error("[appConfig] feed sections reorder error:", err);
    if (
      err.code === "VALIDATION_ERROR" ||
      err.code === "INVALID_FEED_SECTION_KEY"
    ) {
      return fail(res, err.message, 400);
    }
    return fail(res, "Failed to reorder feed sections", 500);
  }
}

// ── PATCH /cadmin/app-config/feed-sections/:key ───────────────────────────────
//
// Accepts body: { label?: string | null, isHidden?: boolean }
// Either field is optional — send only what you want to update.
// But at least one must be present.

export async function handleUpdateFeedSection(req, res) {
  const key = validateFeedSectionKey(req, res);
  if (!key) return;

  const { label, isHidden } = req.body;

  if (label === undefined && isHidden === undefined) {
    return fail(res, "Provide at least one of: label, isHidden", 400);
  }

  try {
    const results = {};

    if (isHidden !== undefined) {
      if (typeof isHidden !== "boolean") {
        return fail(res, "isHidden must be a boolean", 400);
      }
      const visResult = await setFeedSectionVisibility(
        key,
        isHidden,
        getActor(req),
      );
      results.isHidden = visResult.isHidden;
    }

    if (label !== undefined) {
      // null is valid — it clears the override
      if (
        label !== null &&
        (typeof label !== "string" || label.trim().length === 0)
      ) {
        return fail(res, "label must be a non-empty string or null", 400);
      }
      const labelResult = await updateFeedSectionLabel(
        key,
        label,
        getActor(req),
      );
      results.label = labelResult.label;
    }

    return success(res, { key, ...results }, "Feed section updated");
  } catch (err) {
    console.error("[appConfig] feed section update error:", err);
    if (
      err.code === "VALIDATION_ERROR" ||
      err.code === "INVALID_FEED_SECTION_KEY"
    ) {
      return fail(res, err.message, 400);
    }
    return fail(res, "Failed to update feed section", 500);
  }
}

// ── GET /cadmin/app-config/home-screen ────────────────────────────────────────

export async function handleGetHomeScreenConfig(req, res) {
  try {
    const config = await getHomeScreenConfig();
    return success(res, { config }, "Home screen config fetched");
  } catch (err) {
    console.error("[appConfig] home screen config fetch error:", err);
    return fail(res, "Failed to fetch home screen config", 500);
  }
}

// ── PATCH /cadmin/app-config/home-screen ──────────────────────────────────────

export async function handleUpdateHomeScreenConfig(req, res) {
  const { updates } = req.body;

  if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
    return fail(res, "updates must be a non-null object", 400);
  }

  if (Object.keys(updates).length === 0) {
    return fail(res, "updates must contain at least one key", 400);
  }

  try {
    const config = await updateHomeScreenConfig(updates, getActor(req));
    return success(res, { config }, "Home screen config updated");
  } catch (err) {
    console.error("[appConfig] home screen config update error:", err);
    if (err.code === "VALIDATION_ERROR") {
      return fail(res, err.message, 400);
    }
    return fail(res, "Failed to update home screen config", 500);
  }
}
