// backend/src/modules/cadmin/app-config/feedSection.registry.js (do not remove this comment)
// backend/src/modules/cadmin/app-config/feedSection.registry.js
//
// Single source of truth for the 9 curated home feed sections.
//
// This registry mirrors CURATED_CATEGORIES from
// mobile.medicines.categories.js but lives here so the cadmin
// app-config module can validate keys and build list responses
// without importing from the mobile module.
//
// Rules:
//   - category_key must exactly match primary_category values in the DB
//   - The array order defines the default display order (position index)
//   - This list is FIXED — cadmins can reorder/hide/rename but cannot
//     add or remove entries. New entries require a code change here AND
//     in mobile.medicines.categories.js simultaneously.
//   - icon is not editable by cadmin — it is display-only in the UI

export const FEED_SECTION_REGISTRY = [
  {
    key: "PAIN ANALGESICS",
    label: "Pain Relief",
    icon: "bandage-outline",
    type: "DRUG",
  },
  {
    key: "ANTI DIABETIC",
    label: "Diabetes",
    icon: "water-outline",
    type: "DRUG",
  },
  {
    key: "CARDIAC",
    label: "Heart Care",
    icon: "heart-outline",
    type: "DRUG",
  },
  {
    key: "RESPIRATORY",
    label: "Cold & Cough",
    icon: "medkit-outline",
    type: "DRUG",
  },
  {
    key: "DERMA",
    label: "Skin Care",
    icon: "sparkles-outline",
    type: "DRUG",
  },
  {
    key: "GASTRO INTESTINAL",
    label: "Stomach Care",
    icon: "nutrition-outline",
    type: "DRUG",
  },
  {
    key: "Vitamins & Nutrition",
    label: "Vitamins",
    icon: "fitness-outline",
    type: "OTC",
  },
  {
    key: "Ayurveda Products",
    label: "Ayurveda",
    icon: "leaf-outline",
    type: "OTC",
  },
  {
    key: "Baby Care",
    label: "Baby Care",
    icon: "happy-outline",
    type: "OTC",
  },
  {
    key: "Personal Care Products",
    label: "Wellness",
    icon: "shield-checkmark-outline",
    type: "OTC",
  },
  { key: "Pet Care", label: "Pet Care", icon: "paw-outline", type: "OTC" },
];

// O(1) key validation — used by service before any DB write
export const ALLOWED_FEED_SECTION_KEYS = new Set(
  FEED_SECTION_REGISTRY.map((s) => s.key),
);

// Quick lookup: key → registry entry
export const FEED_SECTION_KEY_MAP = Object.fromEntries(
  FEED_SECTION_REGISTRY.map((s) => [s.key, s]),
);
