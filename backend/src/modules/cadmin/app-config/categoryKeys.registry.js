// backend/src/modules/cadmin/app-config/categoryKeys.registry.js (do not remove this comment)
// backend/src/modules/cadmin/app-config/categoryKeys.registry.js
//
// Single source of truth for all displayable category card keys.
//
// These are the only keys the app-config system recognises.
// The backend validates all incoming category_key values against
// ALLOWED_CATEGORY_KEYS before any DB read or write.
//
// scope:
//   "curated"   — appears in the All Categories grid and Quick Categories
//                 rail on the home screen. Driven by CURATED_CATEGORIES
//                 in mobile.medicines.categories.js.
//   "top_level" — appears as a hero card on the home screen top row.
//                 Defined in the mobile app's topLevelCategories.ts.
//
// Label values mirror the mobile app's display labels.
// They are used by the CAdmin UI only — never sent to the mobile app.

export const CATEGORY_KEY_REGISTRY = [
  // ── Curated categories ────────────────────────────────────────────────────
  // Filtered out of /mobile/medicines/categories when is_hidden = true.
  // Disappears from both home rail and All Categories grid.
  {
    key: "PAIN ANALGESICS",
    label: "Pain Relief",
    scope: "curated",
  },
  {
    key: "ANTI DIABETIC",
    label: "Diabetes",
    scope: "curated",
  },
  {
    key: "CARDIAC",
    label: "Heart Care",
    scope: "curated",
  },
  {
    key: "RESPIRATORY",
    label: "Cold & Cough",
    scope: "curated",
  },
  {
    key: "DERMA",
    label: "Skin Care",
    scope: "curated",
  },
  {
    key: "GASTRO INTESTINAL",
    label: "Stomach Care",
    scope: "curated",
  },
  {
    key: "Vitamins & Nutrition",
    label: "Vitamins",
    scope: "curated",
  },
  {
    key: "Baby Care",
    label: "Baby Care",
    scope: "curated",
  },
  {
    key: "Personal Care Products",
    label: "Wellness",
    scope: "curated",
  },

  // ── Top-level hero categories ─────────────────────────────────────────────
  // Filtered out of /mobile/app-config/marketplace-display when is_hidden = true.
  // Disappears from the home screen top row.
  //
  // ENGLISH_MEDICINE: virtual frontend key — no matching primary_category in DB.
  //   Triggers multi-category filtering in the mobile app.
  //
  // Ayurveda Products: real OTC category. Intentionally NOT in CURATED_CATEGORIES
  //   to avoid duplication (it shows at top level). scope is top_level only.
  //
  // Pet Care: real OTC category. Only appears at top level.
  {
    key: "ENGLISH_MEDICINE",
    label: "English Medicine",
    scope: "top_level",
  },
  {
    key: "Ayurveda Products",
    label: "Ayurvedic",
    scope: "top_level",
  },
  {
    key: "Pet Care",
    label: "Pet Care",
    scope: "top_level",
  },
];

// Flat array of valid key strings — used for O(1) validation
export const ALLOWED_CATEGORY_KEYS = new Set(
  CATEGORY_KEY_REGISTRY.map((c) => c.key)
);

// Quick lookup: key → registry entry
export const CATEGORY_KEY_MAP = Object.fromEntries(
  CATEGORY_KEY_REGISTRY.map((c) => [c.key, c])
);