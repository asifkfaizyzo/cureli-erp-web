// backend/src/services/assetUrl.service.js (do not remove this comment)
// ============================================================
// ASSET URL SERVICE
// backend/services/assetUrl.service.js
// ============================================================

const CDN_DOMAIN    = process.env.CDN_DOMAIN    || null;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || null;
const AWS_REGION    = process.env.AWS_REGION    || "ap-south-1";

// Validate at startup — warn but do not crash
if (!CDN_DOMAIN && !AWS_S3_BUCKET) {
  console.warn(
    "[assetUrl] WARNING: Neither CDN_DOMAIN nor AWS_S3_BUCKET is set. " +
    "Image URLs will be returned as local API proxy paths."
  );
}

// ── Base URL (computed once at startup) ───────────────────────────────────────

const BASE_URL = CDN_DOMAIN
  ? `https://${CDN_DOMAIN}`
  : AWS_S3_BUCKET
    ? `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`
    : null;

/**
 * Convert a storage key to a full public URL.
 *
 * @param {string|null} storageKey  e.g. "medicine_images/10005/img_00_high.jpg"
 * @returns {string|null}           e.g. "https://cdn.../medicine_images/10005/img_00_high.jpg"
 */
export function resolveAssetUrl(storageKey) {
  if (!storageKey) return null;

  // Already a full URL — return as-is
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }

  // Remove any leading slash to avoid double slashes
  const cleanKey = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;

  // 1. Production Mode: Direct S3/CloudFront URL
  if (BASE_URL) {
    return `${BASE_URL}/${cleanKey}`;
  }

  // 2. Local Dev Fallback: Return a fully qualified local API Proxy URL
  const appUrl = process.env.APP_URL || "http://localhost:5000";
  return `${appUrl}/api/files/${cleanKey}`;
}

export function resolveAssetUrls(storageKeys) {
  if (!Array.isArray(storageKeys)) return [];
  return storageKeys.map(resolveAssetUrl);
}

export function getAssetBaseUrl() {
  return BASE_URL;
}

export default { resolveAssetUrl, resolveAssetUrls, getAssetBaseUrl };