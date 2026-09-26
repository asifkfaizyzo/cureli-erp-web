// cadmin-web/src/api/cadminHomeScreen.js (do not remove this comment)
// cadmin-web/src/api/cadminHomeScreen.js

import CAdminAPI from "./axios";

// ── Home Screen Config ─────────────────────────────────────────────────────

export const getHomeScreenConfig = () =>
  CAdminAPI.get("/app-config/home-screen");

// updates: { hero_carousel_visible: "true", category_section_title: "...", ... }
// Always sends all 8 keys.
export const updateHomeScreenConfig = (updates) =>
  CAdminAPI.patch("/app-config/home-screen", { updates });

// ── Feed Sections ──────────────────────────────────────────────────────────

export const getFeedSections = () =>
  CAdminAPI.get("/app-config/feed-sections");

// orderedKeys: string[] of all 9 category keys in new display order
export const reorderFeedSections = (orderedKeys) =>
  CAdminAPI.patch("/app-config/feed-sections/reorder", { orderedKeys });

// key: category key (URI-encoded in path)
// body: { label?: string | null, isHidden?: boolean }
export const updateFeedSection = (key, data) =>
  CAdminAPI.patch(
    `/app-config/feed-sections/${encodeURIComponent(key)}`,
    data
  );