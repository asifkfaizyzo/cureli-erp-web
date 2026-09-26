// backend/src/config/ensureIndexes.js (do not remove this comment)
import prisma from "./prisma.js";

const TRGM_INDEXES = [
  {
    name: "idx_mmv_name_trgm",
    table: "master_medicine_variants",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_mmv_name_trgm
      ON master_medicine_variants
      USING GIN (name gin_trgm_ops)
    `,
  },
  {
    name: "idx_mmv_brand_trgm",
    table: "master_medicine_variants",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_mmv_brand_trgm
      ON master_medicine_variants
      USING GIN (brand gin_trgm_ops)
    `,
  },
  {
    name: "idx_mmv_manufacturer_trgm",
    table: "master_medicine_variants",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_mmv_manufacturer_trgm
      ON master_medicine_variants
      USING GIN (manufacturer gin_trgm_ops)
    `,
  },
  {
    name: "idx_mmv_marketer_trgm",
    table: "master_medicine_variants",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_mmv_marketer_trgm
      ON master_medicine_variants
      USING GIN (marketer gin_trgm_ops)
    `,
  },
  {
    name: "idx_mm_generic_name_trgm",
    table: "master_medicines",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_mm_generic_name_trgm
      ON master_medicines
      USING GIN (generic_name gin_trgm_ops)
    `,
  },
];

export async function ensureIndexes() {
  const startTime = Date.now();

  try {
    // Ensure pg_trgm extension exists
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm
    `);

    // Check existing trigram indexes
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
    const missingIndexes = TRGM_INDEXES.filter(
      (idx) => !existingNames.has(idx.name),
    );

    if (missingIndexes.length === 0) {
      console.log(
        `  ✓ All 5 trigram indexes present (${Date.now() - startTime}ms)`,
      );
      return {
        status: "ok",
        created: 0,
        elapsed: Date.now() - startTime,
      };
    }

    console.log(
      `  ⚠ ${missingIndexes.length} trigram index(es) missing — creating...`,
    );

    let created = 0;

    for (const idx of missingIndexes) {
      try {
        const t0 = Date.now();
        await prisma.$executeRawUnsafe(idx.sql);
        created++;
        console.log(
          `  ✓ Created ${idx.name} on ${idx.table} (${Date.now() - t0}ms)`,
        );
      } catch (err) {
        if (!err.message.includes("already exists")) {
          console.error(`  ✗ Failed to create ${idx.name}: ${err.message}`);
        }
      }
    }

    return {
      status: "created",
      created,
      elapsed: Date.now() - startTime,
    };
  } catch (err) {
    console.error("  ✗ ensureIndexes failed (non-fatal):", err.message);
    return {
      status: "error",
      error: err.message,
      elapsed: Date.now() - startTime,
    };
  }
}