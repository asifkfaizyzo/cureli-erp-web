// backend/src/modules/cadmin/app-config/cadmin.appConfig.service.js (do not remove this comment)
// backend/src/modules/cadmin/app-config/cadmin.appConfig.service.js
//
// Service layer for CAdmin App Config — category display overrides.
//
// Responsibilities:
//   - Merge registry with DB overrides for the CAdmin list view
//   - Upload image to S3 and upsert override row
//   - Delete image from S3 and clean up override row
//   - Toggle is_hidden on override row
//
// DB behaviour:
//   - A row is created on first image upload OR first hide action
//   - A row is deleted when image is removed AND is_hidden is false
//     (back to full default — no orphan rows)
//   - Upsert is used for all writes so duplicate-key errors are impossible

import prisma from "../../../config/prisma.js";
import {
  uploadFile,
  deleteFile,
} from "../../../services/fileStorage.service.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";
import {
  CATEGORY_KEY_REGISTRY,
  ALLOWED_CATEGORY_KEYS,
  CATEGORY_KEY_MAP,
} from "./categoryKeys.registry.js";

import {
  FEED_SECTION_REGISTRY,
  ALLOWED_FEED_SECTION_KEYS,
} from "./feedSection.registry.js";

// ── Validation helper ─────────────────────────────────────────────────────────

/**
 * Throws a structured error if the key is not in the allowed registry.
 * @param {string} key
 */
function assertValidKey(key) {
  if (!ALLOWED_CATEGORY_KEYS.has(key)) {
    const err = new Error(`Unknown category key: "${key}"`);
    err.code = "INVALID_CATEGORY_KEY";
    err.status = 400;
    throw err;
  }
}

function assertValidFeedSectionKey(key) {
  if (!ALLOWED_FEED_SECTION_KEYS.has(key)) {
    const err = new Error(`Unknown feed section key: "${key}"`);
    err.code = "INVALID_FEED_SECTION_KEY";
    err.status = 400;
    throw err;
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * Returns all 12 registry entries merged with their current DB overrides.
 * Used by GET /cadmin/app-config/categories.
 *
 * @returns {Array<{
 *   key: string,
 *   label: string,
 *   scope: "curated"|"top_level",
 *   isHidden: boolean,
 *   hasImage: boolean,
 *   imageUrl: string|null,
 *   imageOriginalName: string|null,
 *   imageFileSize: number|null,
 *   updatedByName: string|null,
 *   updatedAt: Date|null,
 * }>}
 */
export async function listCategoryDisplayOverrides() {
  // Fetch all existing override rows in one query
  const rows = await prisma.marketplaceCategoryDisplayOverride.findMany();

  // Index by category_key for O(1) merge
  const rowByKey = Object.fromEntries(rows.map((r) => [r.category_key, r]));

  return CATEGORY_KEY_REGISTRY.map((entry) => {
    const row = rowByKey[entry.key] ?? null;

    const imageStorageKey = row?.image_storage_key ?? null;
    const imageUrl = imageStorageKey ? resolveAssetUrl(imageStorageKey) : null;

    return {
      key: entry.key,
      label: entry.label,
      scope: entry.scope,
      isHidden: row?.is_hidden ?? false,
      hasImage: imageStorageKey !== null,
      imageUrl,
      imageOriginalName: row?.image_original_name ?? null,
      imageFileSize: row?.image_file_size ?? null,
      updatedByName: row?.updated_by_name ?? null,
      updatedAt: row?.updated_at ?? null,
    };
  });
}

// ── Upload image ──────────────────────────────────────────────────────────────

/**
 * Upload or replace a category image.
 * Deletes the old S3 object if one already exists for this key.
 *
 * @param {string} categoryKey
 * @param {{ buffer, originalname, mimetype, size }} file  Multer file object
 * @param {{ cadminId: string, cadminName: string }} actor
 * @returns {{ imageUrl: string }}
 */
export async function uploadCategoryImage(categoryKey, file, actor) {
  assertValidKey(categoryKey);

  // Check if there is an existing image to delete first
  const existing = await prisma.marketplaceCategoryDisplayOverride.findUnique({
    where: { category_key: categoryKey },
    select: { image_storage_key: true },
  });

  if (existing?.image_storage_key) {
    // Best-effort delete — do not throw if S3 delete fails
    try {
      await deleteFile({
        folder: "category_images",
        filename: existing.image_storage_key.replace("category_images/", ""),
      });
    } catch (err) {
      console.warn(
        `[appConfig] Failed to delete old category image for "${categoryKey}":`,
        err.message,
      );
    }
  }

  // Upload new file to S3
  const uploaded = await uploadFile({
    buffer: file.buffer,
    folder: "category_images",
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // storage_key from uploadFile is filename only (e.g. "1234-abc.png")
  // We store the full S3 key path so resolveAssetUrl can build the CDN URL
  const fullStorageKey = `category_images/${uploaded.storage_key}`;

  // Upsert override row
  await prisma.marketplaceCategoryDisplayOverride.upsert({
    where: { category_key: categoryKey },
    create: {
      category_key: categoryKey,
      image_storage_key: fullStorageKey,
      image_original_name: file.originalname,
      image_mime_type: file.mimetype,
      image_file_size: file.size,
      is_hidden: false,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
    update: {
      image_storage_key: fullStorageKey,
      image_original_name: file.originalname,
      image_mime_type: file.mimetype,
      image_file_size: file.size,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
  });

  return {
    imageUrl: resolveAssetUrl(fullStorageKey),
  };
}

// ── Delete image ──────────────────────────────────────────────────────────────

/**
 * Remove a category image.
 * Falls back to icon rendering on mobile.
 * If the row has no other overrides (is_hidden = false), the row is deleted.
 *
 * @param {string} categoryKey
 * @param {{ cadminId: string, cadminName: string }} actor
 */
export async function deleteCategoryImage(categoryKey, actor) {
  assertValidKey(categoryKey);

  const row = await prisma.marketplaceCategoryDisplayOverride.findUnique({
    where: { category_key: categoryKey },
  });

  if (!row || !row.image_storage_key) {
    // Nothing to delete — idempotent
    return;
  }

  // Delete from S3
  try {
    await deleteFile({
      folder: "category_images",
      filename: row.image_storage_key.replace("category_images/", ""),
    });
  } catch (err) {
    console.warn(
      `[appConfig] S3 delete failed for "${categoryKey}":`,
      err.message,
    );
    // Do not throw — proceed to clear DB reference regardless
  }

  // If row has no remaining overrides, remove the row entirely
  if (!row.is_hidden) {
    await prisma.marketplaceCategoryDisplayOverride.delete({
      where: { category_key: categoryKey },
    });
    return;
  }

  // Row still has is_hidden = true — keep row, clear image fields only
  await prisma.marketplaceCategoryDisplayOverride.update({
    where: { category_key: categoryKey },
    data: {
      image_storage_key: null,
      image_original_name: null,
      image_mime_type: null,
      image_file_size: null,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
  });
}

// ── Toggle visibility ─────────────────────────────────────────────────────────

/**
 * Show or hide a category on mobile.
 * Creates the override row if it does not exist yet.
 * Deletes the row if hiding is reversed AND no image is set.
 *
 * @param {string} categoryKey
 * @param {boolean} isHidden
 * @param {{ cadminId: string, cadminName: string }} actor
 * @returns {{ isHidden: boolean }}
 */
export async function setCategoryVisibility(categoryKey, isHidden, actor) {
  assertValidKey(categoryKey);

  if (typeof isHidden !== "boolean") {
    const err = new Error("isHidden must be a boolean");
    err.code = "VALIDATION_ERROR";
    err.status = 400;
    throw err;
  }

  // If un-hiding and no image exists, delete the row (back to full default)
  if (!isHidden) {
    const row = await prisma.marketplaceCategoryDisplayOverride.findUnique({
      where: { category_key: categoryKey },
      select: { image_storage_key: true },
    });

    if (row && !row.image_storage_key) {
      await prisma.marketplaceCategoryDisplayOverride.delete({
        where: { category_key: categoryKey },
      });
      return { isHidden: false };
    }
  }

  // Upsert visibility
  await prisma.marketplaceCategoryDisplayOverride.upsert({
    where: { category_key: categoryKey },
    create: {
      category_key: categoryKey,
      is_hidden: isHidden,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
    update: {
      is_hidden: isHidden,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
  });

  return { isHidden };
}

// ── Mobile helpers ────────────────────────────────────────────────────────────
// Used by mobile.appConfig.controller and mobile.medicines.controller
// to avoid duplicating the DB query + merge logic.

/**
 * Returns a map of category_key → { imageUrl, isHidden } for all rows that
 * have at least one override (image or hidden flag).
 * Keys with no row are absent from the map — callers treat absence as defaults.
 *
 * @returns {Record<string, { imageUrl: string|null, isHidden: boolean }>}
 */
export async function getCategoryOverrideMap() {
  const rows = await prisma.marketplaceCategoryDisplayOverride.findMany();

  return Object.fromEntries(
    rows.map((r) => [
      r.category_key,
      {
        imageUrl: r.image_storage_key
          ? resolveAssetUrl(r.image_storage_key)
          : null,
        isHidden: r.is_hidden,
      },
    ]),
  );
}

export async function listFeedSectionOverrides() {
  const rows = await prisma.homeFeedSectionOverride.findMany();
  const rowByKey = Object.fromEntries(rows.map((r) => [r.category_key, r]));

  const merged = FEED_SECTION_REGISTRY.map((entry, registryIndex) => {
    const row = rowByKey[entry.key] ?? null;

    return {
      key: entry.key,
      defaultLabel: entry.label,
      label: row?.label_override ?? entry.label,
      icon: entry.icon,
      type: entry.type,
      position: row?.position ?? registryIndex,
      isHidden: row?.is_hidden ?? false,
      hasOverride: row !== null,
      updatedByName: row?.updated_by_name ?? null,
      updatedAt: row?.updated_at ?? null,
    };
  });

  // Sort by resolved position ascending
  merged.sort((a, b) => a.position - b.position);

  return merged;
}

// ── Set visibility ────────────────────────────────────────────────────────────
//
// Hide or show a feed section.
// If un-hiding and no other override exists (label = null, position = null),
// the row is deleted to keep the table clean.

export async function setFeedSectionVisibility(key, isHidden, actor) {
  assertValidFeedSectionKey(key);

  if (typeof isHidden !== "boolean") {
    const err = new Error("isHidden must be a boolean");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // If un-hiding, check whether the row has any other overrides worth keeping
  if (!isHidden) {
    const row = await prisma.homeFeedSectionOverride.findUnique({
      where: { category_key: key },
      select: { label_override: true, position: true },
    });

    if (row && row.label_override === null && row.position === null) {
      // Row has no other data — delete it (back to full default)
      await prisma.homeFeedSectionOverride.delete({
        where: { category_key: key },
      });
      return { key, isHidden: false };
    }
  }

  await prisma.homeFeedSectionOverride.upsert({
    where: { category_key: key },
    create: {
      category_key: key,
      is_hidden: isHidden,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
    update: {
      is_hidden: isHidden,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
  });

  return { key, isHidden };
}

// ── Update label ──────────────────────────────────────────────────────────────
//
// Set or clear the label override for a section.
// label = null → clears the override, falls back to registry default.
// If clearing and no other override exists, the row is deleted.

export async function updateFeedSectionLabel(key, label, actor) {
  assertValidFeedSectionKey(key);

  // Validate label if provided
  if (label !== null) {
    if (typeof label !== "string" || label.trim().length === 0) {
      const err = new Error("label must be a non-empty string or null");
      err.code = "VALIDATION_ERROR";
      throw err;
    }
    if (label.trim().length > 100) {
      const err = new Error("label must be 100 characters or fewer");
      err.code = "VALIDATION_ERROR";
      throw err;
    }
  }

  const normalizedLabel = label === null ? null : label.trim();

  // If clearing label, check whether row has other overrides worth keeping
  if (normalizedLabel === null) {
    const row = await prisma.homeFeedSectionOverride.findUnique({
      where: { category_key: key },
      select: { is_hidden: true, position: true },
    });

    if (row && !row.is_hidden && row.position === null) {
      await prisma.homeFeedSectionOverride.delete({
        where: { category_key: key },
      });
      return { key, label: null };
    }
  }

  await prisma.homeFeedSectionOverride.upsert({
    where: { category_key: key },
    create: {
      category_key: key,
      label_override: normalizedLabel,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
    update: {
      label_override: normalizedLabel,
      updated_by_cadmin_id: actor.cadminId,
      updated_by_name: actor.cadminName,
    },
  });

  return { key, label: normalizedLabel };
}

// ── Reorder ───────────────────────────────────────────────────────────────────
//
// Receives an ordered array of all 9 category keys.
// Writes position = array index for each key in a single transaction.
// All 9 keys must be present — partial reorder is not supported.

export async function reorderFeedSections(orderedKeys, actor) {
  // Validate length
  if (orderedKeys.length !== FEED_SECTION_REGISTRY.length) {
    const err = new Error(
      `orderedKeys must contain all ${FEED_SECTION_REGISTRY.length} section keys`,
    );
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // Validate each key
  for (const key of orderedKeys) {
    assertValidFeedSectionKey(key);
  }

  // Check for duplicates
  const keySet = new Set(orderedKeys);
  if (keySet.size !== orderedKeys.length) {
    const err = new Error("orderedKeys contains duplicate keys");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // Upsert position for every key in a transaction
  await prisma.$transaction(
    orderedKeys.map((key, index) =>
      prisma.homeFeedSectionOverride.upsert({
        where: { category_key: key },
        create: {
          category_key: key,
          position: index,
          updated_by_cadmin_id: actor.cadminId,
          updated_by_name: actor.cadminName,
        },
        update: {
          position: index,
          updated_by_cadmin_id: actor.cadminId,
          updated_by_name: actor.cadminName,
        },
      }),
    ),
  );
}

// ── Mobile helper — resolved feed sections ────────────────────────────────────
//
// Used by mobile.medicines.service.js → listMobileFeed.
// Returns the 9 sections in resolved display order, filtered to visible only.
// Shape matches what listMobileFeed needs: key, label, icon, type.

export async function getResolvedFeedSections() {
  const rows = await prisma.homeFeedSectionOverride.findMany();
  const rowByKey = Object.fromEntries(rows.map((r) => [r.category_key, r]));

  const resolved = FEED_SECTION_REGISTRY.map((entry, registryIndex) => {
    const row = rowByKey[entry.key] ?? null;

    return {
      key: entry.key,
      label: row?.label_override ?? entry.label,
      icon: entry.icon,
      type: entry.type,
      position: row?.position ?? registryIndex,
      isHidden: row?.is_hidden ?? false,
    };
  });

  return resolved
    .filter((s) => !s.isHidden)
    .sort((a, b) => a.position - b.position);
}

// ════════════════════════════════════════════════════════════════════════════
// HOME SCREEN CONFIG
// ════════════════════════════════════════════════════════════════════════════

// Canonical set of valid config keys.
// Any key not in this set is rejected by the service.

export const HOME_SCREEN_CONFIG_KEYS = new Set([
  "hero_carousel_visible",
  "strip_banners_visible",
  "category_section_visible",
  "category_section_title",
  "category_section_hint",
  "prescription_banner_visible",
  "prescription_banner_text",
  "product_feed_visible",
]);

// Keys whose values must be "true" or "false" (boolean-as-string)
const BOOLEAN_CONFIG_KEYS = new Set([
  "hero_carousel_visible",
  "strip_banners_visible",
  "category_section_visible",
  "prescription_banner_visible",
  "product_feed_visible",
]);

// ── Get all config ────────────────────────────────────────────────────────────
//
// Returns the current value of all 8 config keys.
// For any key not yet seeded/present in the DB, falls back to hardcoded
// defaults so the endpoint never returns incomplete data.

const HOME_SCREEN_DEFAULTS = {
  hero_carousel_visible: "true",
  strip_banners_visible: "true",
  category_section_visible: "true",
  category_section_title: "Everything for your well-being",
  category_section_hint: "View all",
  prescription_banner_visible: "true",
  prescription_banner_text: "Upload prescription",
  product_feed_visible: "true",
};

export async function getHomeScreenConfig() {
  const rows = await prisma.homeScreenConfig.findMany();
  const rowByKey = Object.fromEntries(
    rows.map((r) => [r.config_key, r.config_value]),
  );

  // Build complete config — merge DB values with defaults
  const raw = {};
  for (const key of HOME_SCREEN_CONFIG_KEYS) {
    raw[key] = rowByKey[key] ?? HOME_SCREEN_DEFAULTS[key];
  }

  return raw;
}

// ── Update config ─────────────────────────────────────────────────────────────
//
// Receives all 8 keys always (frontend sends full state).
// Validates each key and value, then upserts all rows in a transaction.

export async function updateHomeScreenConfig(updates, actor) {
  // Validate all incoming keys
  for (const key of Object.keys(updates)) {
    if (!HOME_SCREEN_CONFIG_KEYS.has(key)) {
      const err = new Error(`Unknown config key: "${key}"`);
      err.code = "VALIDATION_ERROR";
      throw err;
    }
  }

  // Validate values
  for (const [key, value] of Object.entries(updates)) {
    if (BOOLEAN_CONFIG_KEYS.has(key)) {
      if (value !== "true" && value !== "false") {
        const err = new Error(`Config key "${key}" must be "true" or "false"`);
        err.code = "VALIDATION_ERROR";
        throw err;
      }
    } else {
      // String keys — must be non-empty string, max 300 chars
      if (typeof value !== "string" || value.trim().length === 0) {
        const err = new Error(`Config key "${key}" must be a non-empty string`);
        err.code = "VALIDATION_ERROR";
        throw err;
      }
      if (value.trim().length > 300) {
        const err = new Error(`Config key "${key}" exceeds maximum length`);
        err.code = "VALIDATION_ERROR";
        throw err;
      }
    }
  }

  // Upsert all rows in one transaction
  await prisma.$transaction(
    Object.entries(updates).map(([key, value]) =>
      prisma.homeScreenConfig.upsert({
        where: { config_key: key },
        create: {
          config_key: key,
          config_value: typeof value === "string" ? value.trim() : value,
          updated_by_cadmin_id: actor.cadminId,
          updated_by_name: actor.cadminName,
        },
        update: {
          config_value: typeof value === "string" ? value.trim() : value,
          updated_by_cadmin_id: actor.cadminId,
          updated_by_name: actor.cadminName,
        },
      }),
    ),
  );

  // Return the full resolved config after update
  return getHomeScreenConfig();
}

// ── Mobile helper — parsed config ─────────────────────────────────────────────
//
// Used by mobile.appConfig.controller.js.
// Returns config with boolean keys parsed to actual booleans.

export async function getHomeScreenConfigForMobile() {
  const raw = await getHomeScreenConfig();

  return {
    heroCarouselVisible: raw.hero_carousel_visible === "true",
    stripBannersVisible: raw.strip_banners_visible === "true",
    categorySectionVisible: raw.category_section_visible === "true",
    categorySectionTitle: raw.category_section_title,
    categorySectionHint: raw.category_section_hint,
    prescriptionBannerVisible: raw.prescription_banner_visible === "true",
    prescriptionBannerText: raw.prescription_banner_text,
    productFeedVisible: raw.product_feed_visible === "true",
  };
}
