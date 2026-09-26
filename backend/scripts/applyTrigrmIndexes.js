// backend/scripts/applyTrigrmIndexes.js (do not remove this comment)
// backend/scripts/applyTrigrmIndexes.js
//
// One-time script to create trigram indexes on an existing database.
// Safe to run multiple times — all statements use IF NOT EXISTS.
//
// Usage (local):
//   node scripts/applyTrigrmIndexes.js
//
// Usage (EC2):
//   cd /path/to/backend
//   node scripts/applyTrigrmIndexes.js

import "../env.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INDEXES = [
  {
    name: "pg_trgm extension",
    sql: `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  },
  {
    name: "idx_mmv_name_trgm",
    sql: `CREATE INDEX IF NOT EXISTS idx_mmv_name_trgm
          ON master_medicine_variants USING GIN (name gin_trgm_ops)`,
  },
  {
    name: "idx_mmv_brand_trgm",
    sql: `CREATE INDEX IF NOT EXISTS idx_mmv_brand_trgm
          ON master_medicine_variants USING GIN (brand gin_trgm_ops)`,
  },
  {
    name: "idx_mmv_manufacturer_trgm",
    sql: `CREATE INDEX IF NOT EXISTS idx_mmv_manufacturer_trgm
          ON master_medicine_variants USING GIN (manufacturer gin_trgm_ops)`,
  },
  {
    name: "idx_mmv_marketer_trgm",
    sql: `CREATE INDEX IF NOT EXISTS idx_mmv_marketer_trgm
          ON master_medicine_variants USING GIN (marketer gin_trgm_ops)`,
  },
  {
    name: "idx_mm_generic_name_trgm",
    sql: `CREATE INDEX IF NOT EXISTS idx_mm_generic_name_trgm
          ON master_medicines USING GIN (generic_name gin_trgm_ops)`,
  },
];

async function run() {
  console.log("\n═══════════════════════════════════════════");
  console.log("  TRIGRAM INDEX SETUP");
  console.log("═══════════════════════════════════════════\n");

  console.log(
    `  DB: ${process.env.DATABASE_URL?.replace(/:\/\/.*@/, "://***@")}\n`
  );

  // Check which already exist
  const existing = await prisma.$queryRaw`
    SELECT indexname::text
    FROM pg_indexes
    WHERE indexname IN (
      'idx_mmv_name_trgm',
      'idx_mmv_brand_trgm',
      'idx_mmv_manufacturer_trgm',
      'idx_mmv_marketer_trgm',
      'idx_mm_generic_name_trgm'
    )
  `;

  const existingNames = new Set(existing.map((r) => r.indexname));

  console.log("  Status before:\n");
  for (const idx of INDEXES) {
    if (idx.name === "pg_trgm extension") continue;
    const status = existingNames.has(idx.name) ? "✓ exists" : "✗ missing";
    console.log(`    ${status}  ${idx.name}`);
  }
  console.log("");

  // Create all (IF NOT EXISTS makes this safe)
  let created = 0;
  let skipped = 0;

  for (const idx of INDEXES) {
    const t0 = Date.now();
    try {
      await prisma.$executeRawUnsafe(idx.sql);
      const elapsed = Date.now() - t0;

      if (idx.name === "pg_trgm extension") {
        console.log(`  ✓ ${idx.name} (${elapsed}ms)`);
        continue;
      }

      if (existingNames.has(idx.name)) {
        console.log(`  ↷ ${idx.name} already existed (${elapsed}ms)`);
        skipped++;
      } else {
        console.log(`  ✓ ${idx.name} CREATED (${elapsed}ms)`);
        created++;
      }
    } catch (err) {
      console.error(`  ✗ ${idx.name} FAILED: ${err.message}`);
    }
  }

  console.log("\n───────────────────────────────────────────");
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped} (already existed)`);
  console.log("───────────────────────────────────────────");
  console.log("\n  ✅ Done. Catalog linking will now be fast.\n");

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("\n❌ Script failed:", err.message);
  process.exit(1);
});