// backend/src/modules/mobile/medicines/mobile.medicines.categories.js (do not remove this comment)
// src/modules/mobile/medicines/mobile.medicines.categories.js
//
// Curated, consumer-facing category list for the mobile Quick Categories rail.
//
// WHY THIS EXISTS:
//   Drug categories in the catalog are ALL-CAPS internal codes
//     ("ANTI INFECTIVES", "PAIN ANALGESICS", "DERMA")
//   OTC categories are already friendly
//     ("Pain Relief", "Skin Care", "Baby Care")
//   A premium consumer UI cannot show "ANTI INFECTIVES". This list maps a
//   hand-picked, high-volume subset of REAL internal categories to friendly
//   display labels. `key` is sent back to GET /mobile/medicines?category=KEY
//   verbatim, so it MUST match the catalog's primary_category exactly.
//
// `icon` values are Ionicons names (the app already uses @expo/vector-icons).
// Counts are the observed tallies at time of curation — indicative only,
// shown as soft hints in the UI, not a live aggregate.

export const CURATED_CATEGORIES = [
  // ── DRUG categories (internal ALL-CAPS keys) ──
  {
    key: "PAIN ANALGESICS",
    label: "Pain Relief",
    type: "DRUG",
    icon: "bandage-outline",
    count: 49046,
  },
  {
    key: "ANTI DIABETIC",
    label: "Diabetes",
    type: "DRUG",
    icon: "water-outline",
    count: 21453,
  },
  {
    key: "CARDIAC",
    label: "Heart Care",
    type: "DRUG",
    icon: "heart-outline",
    count: 31455,
  },
  {
    key: "RESPIRATORY",
    label: "Cold & Cough",
    type: "DRUG",
    icon: "medkit-outline",
    count: 34944,
  },
  {
    key: "DERMA",
    label: "Skin Care",
    type: "DRUG",
    icon: "sparkles-outline",
    count: 15940,
  },
  {
    key: "GASTRO INTESTINAL",
    label: "Stomach Care",
    type: "DRUG",
    icon: "nutrition-outline",
    count: 54581,
  },
  // ── OTC categories (already friendly keys) ──
  {
    key: "Vitamins & Nutrition",
    label: "Vitamins",
    type: "OTC",
    icon: "fitness-outline",
    count: 17974,
  },
  {
    key: "Ayurveda Products",
    label: "Ayurveda",
    type: "OTC",
    icon: "leaf-outline",
    count: 12083,
  },
  {
    key: "Baby Care",
    label: "Baby Care",
    type: "OTC",
    icon: "happy-outline",
    count: 845,
  },
  {
    key: "Personal Care Products",
    label: "Wellness",
    type: "OTC",
    icon: "shield-checkmark-outline",
    count: 17853,
  },
  {
    key: "Pet Care",
    label: "Pet Care",
    type: "OTC",
    icon: "paw-outline",
    count: 0,
  },
];

export default CURATED_CATEGORIES;
