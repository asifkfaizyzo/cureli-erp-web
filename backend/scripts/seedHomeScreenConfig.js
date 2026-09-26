// backend/scripts/seedHomeScreenConfig.js (do not remove this comment)
// backend/scripts/seedHomeScreenConfig.js
//
// Seeds the HomeScreenConfig table with all 8 default config rows.
// Safe to run multiple times — uses upsert so existing rows are not
// overwritten if they have been customised by a cadmin.
//
// Usage:
//   node scripts/seedHomeScreenConfig.js

import "../env.js";
import prisma from "../src/config/prisma.js";

const DEFAULTS = [
  { key: "hero_carousel_visible",       value: "true" },
  { key: "strip_banners_visible",       value: "true" },
  { key: "category_section_visible",    value: "true" },
  { key: "category_section_title",      value: "Everything for your well-being" },
  { key: "category_section_hint",       value: "View all" },
  { key: "prescription_banner_visible", value: "true" },
  { key: "prescription_banner_text",    value: "Upload prescription" },
  { key: "product_feed_visible",        value: "true" },
];

async function seed() {
  console.log("\n📦 Seeding HomeScreenConfig...\n");

  for (const { key, value } of DEFAULTS) {
    await prisma.homeScreenConfig.upsert({
      where:  { config_key: key },
      create: { config_key: key, config_value: value },
      update: {},  // Do NOT overwrite existing customised values
    });
    console.log(`  ✓ ${key}`);
  }

  console.log("\n✅ HomeScreenConfig seed complete.\n");
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  prisma.$disconnect();
  process.exit(1);
});