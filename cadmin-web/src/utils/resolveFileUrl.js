// cadmin-web/src/utils/resolveFileUrl.js (do not remove this comment)
// cadmin-web/src/utils/resolveFileUrl.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Resolves a stored file path to a displayable URL.
 * Stored values can be:
 *   - Already absolute: "https://..." → returned as-is
 *   - Proxy path: "/api/files/..." → prefixed with backend origin
 *   - null/undefined → returns null
 */
export function resolveFileUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/files/")) return `${API_URL}${url}`;
  return url;
}