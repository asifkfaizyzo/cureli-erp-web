// backend/src/services/assetUrl.service.js (do not remove this comment)
// ============================================================
// ASSET URL SERVICE
// backend/services/assetUrl.service.js
// ============================================================
//
// Single responsibility: convert storage keys to public URLs.
//
// DB stores keys only:
//   medicine_images/10005/img_00_high.jpg
//
// This service resolves them to full public URLs:
//   https://d2w387j8f8ebzs.cloudfront.net/medicine_images/10005/img_00_high.jpg
//
// Usage:
//   import { resolveAssetUrl, resolveAssetUrls } from '../../services/assetUrl.service.js';
//
//   resolveAssetUrl('medicine_images/10005/img_00_high.jpg')
//   // → "https://cdn.../medicine_images/10005/img_00_high.jpg"
//
//   resolveAssetUrls(['medicine_images/10005/img_00_high.jpg', ...])
//   // → ["https://cdn.../...", ...]
//
// ── ENV VARS ─────────────────────────────────────────────────
//   CDN_DOMAIN    d2w387j8f8ebzs.cloudfront.net   (no https://)
//   AWS_S3_BUCKET cureli-prod-assets               (fallback if no CDN)
//   AWS_REGION    ap-south-1                       (fallback if no CDN)
// ============================================================

const CDN_DOMAIN    = process.env.CDN_DOMAIN    || null;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || null;
const AWS_REGION    = process.env.AWS_REGION    || "ap-south-1";

// Validate at startup — warn but do not crash
if (!CDN_DOMAIN && !AWS_S3_BUCKET) {
  console.warn(
    "[assetUrl] WARNING: Neither CDN_DOMAIN nor AWS_S3_BUCKET is set. " +
    "Image URLs will be returned as storage keys only."
  );
}

// ── Base URL (computed once at startup) ───────────────────────────────────────

const BASE_URL = CDN_DOMAIN
  ? `https://${CDN_DOMAIN}`
  : AWS_S3_BUCKET
    ? `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`
    : null;

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Convert a storage key to a full public URL.
 *
 * @param {string|null} storageKey  e.g. "medicine_images/10005/img_00_high.jpg"
 * @returns {string|null}           e.g. "https://cdn.../medicine_images/10005/img_00_high.jpg"
 *
 * Returns null if input is null/undefined/empty.
 * Returns input unchanged if it already starts with "http" (safe for already-resolved values).
 */
export function resolveAssetUrl(storageKey) {
  if (!storageKey) return null;

  // Already a full URL — return as-is (handles manually uploaded images
  // that may have been stored with full paths during transition period)
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }

  if (!BASE_URL) return storageKey; // No config — return key as fallback

  // Remove any leading slash to avoid double slashes
  const cleanKey = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;

  return `${BASE_URL}/${cleanKey}`;
}

/**
 * Convert an array of storage keys to full public URLs.
 * Null/undefined entries are preserved as null.
 *
 * @param {Array<string|null>} storageKeys
 * @returns {Array<string|null>}
 */
export function resolveAssetUrls(storageKeys) {
  if (!Array.isArray(storageKeys)) return [];
  return storageKeys.map(resolveAssetUrl);
}

/**
 * Get the configured base URL (useful for health checks / debug).
 */
export function getAssetBaseUrl() {
  return BASE_URL;
}

export default { resolveAssetUrl, resolveAssetUrls, getAssetBaseUrl };