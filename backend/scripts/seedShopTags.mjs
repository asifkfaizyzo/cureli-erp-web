// backend/scripts/seedShopTags.mjs (do not remove this comment)
// Seed default shop tags into the ShopTag table.
// Run: node scripts/seedShopTags.mjs

import prisma from "../src/config/prisma.js";

const DEFAULT_TAGS = [
  { slug: "allopathic",           label: "Allopathic",            description: "Standard English/allopathic medicines",                    color_hex: "#3B82F6", sort_order: 1 },
  { slug: "ayurvedic",            label: "Ayurvedic",             description: "Ayurvedic medicines and herbal remedies",                  color_hex: "#22C55E", sort_order: 2 },
  { slug: "homeopathic",          label: "Homeopathic",           description: "Homeopathic medicines and dilutions",                      color_hex: "#A855F7", sort_order: 3 },
  { slug: "unani",                label: "Unani",                 description: "Unani system of medicine",                                 color_hex: "#14B8A6", sort_order: 4 },
  { slug: "siddha",               label: "Siddha",                description: "Traditional Siddha medicine",                              color_hex: "#F59E0B", sort_order: 5 },
  { slug: "general",              label: "General",               description: "Multi-type pharmacy with a wide range of products",        color_hex: "#6B7280", sort_order: 6 },
  { slug: "pet-veterinary",       label: "Pet & Veterinary",      description: "Animal and pet medicines, supplements",                    color_hex: "#F97316", sort_order: 7 },
  { slug: "surgical",             label: "Surgical & Devices",    description: "Surgical items, bandages, BP monitors, glucometers",       color_hex: "#EF4444", sort_order: 8 },
  { slug: "cosmetic-derma",       label: "Cosmetic & Derma",      description: "Skincare, derma products, sunscreens, cosmetics",          color_hex: "#EC4899", sort_order: 9 },
  { slug: "baby-maternity",       label: "Baby & Maternity",      description: "Infant nutrition, baby care, maternity products",          color_hex: "#F472B6", sort_order: 10 },
  { slug: "wellness-supplements", label: "Wellness & Supplements", description: "Protein, vitamins, nutraceuticals, health foods",          color_hex: "#10B981", sort_order: 11 },
  { slug: "diabetic-care",        label: "Diabetic Care",         description: "Insulin, glucometers, strips, diabetic footwear",          color_hex: "#8B5CF6", sort_order: 12 },
  { slug: "ortho-physio",         label: "Ortho & Physio",        description: "Orthopedic supports, crepe bandages, physio equipment",    color_hex: "#0EA5E9", sort_order: 13 },
  { slug: "eye-optical",          label: "Eye & Optical",         description: "Eye drops, contact lens solutions, optical accessories",   color_hex: "#06B6D4", sort_order: 14 },
  { slug: "dental-care",          label: "Dental Care",           description: "Dental products and oral care specialty",                  color_hex: "#64748B", sort_order: 15 },
  { slug: "jan-aushadhi",         label: "Jan Aushadhi / Generic", description: "Government generic medicine store (PMBJP)",               color_hex: "#84CC16", sort_order: 16 },
  { slug: "24x7",                 label: "24×7",                  description: "Round-the-clock pharmacy",                                 color_hex: "#EAB308", sort_order: 17 },
  { slug: "herbal-natural",       label: "Herbal & Natural",      description: "Organic, herbal, natural health products",                 color_hex: "#4ADE80", sort_order: 18 },
];

async function main() {
  console.log(`[seedShopTags] Upserting ${DEFAULT_TAGS.length} tags...`);

  for (const tag of DEFAULT_TAGS) {
    await prisma.shopTag.upsert({
      where: { slug: tag.slug },
      update: {
        label: tag.label,
        description: tag.description,
        color_hex: tag.color_hex,
        sort_order: tag.sort_order,
      },
      create: tag,
    });
    console.log(`  ✓ ${tag.slug}`);
  }

  const count = await prisma.shopTag.count();
  console.log(`[seedShopTags] Done. Total tags in DB: ${count}`);
}

main()
  .catch((err) => {
    console.error("[seedShopTags] Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());