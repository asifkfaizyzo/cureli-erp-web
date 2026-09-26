// backend/prisma/seeds/masterCatalog.seed.js (do not remove this comment)
/**
 * ═══════════════════════════════════════════════════════════════
 * MASTER CATALOG — SEED SCRIPT
 * backend/prisma/seeds/masterCatalog.seed.js
 * ═══════════════════════════════════════════════════════════════
 *
 * Reads CCSP output and populates:
 *   master_medicines
 *   master_medicine_variants
 *   master_medicine_images
 *
 * DB stores storage KEYS only — not full URLs.
 * Example: medicine_images/10005/img_00_high.jpg
 * Backend resolves to full CDN URL at response time via assetUrl.service.js
 *
 * ── CONFIGURATION ────────────────────────────────────────────
 * Required env vars in backend/.env:
 *
 *   DATABASE_URL    postgresql://...
 *   CCSP_DATA_DIR   E:/1mg_scrapper/ccsp_output   ← HDD path, no trailing slash
 *
 * Optional:
 *   AWS_S3_BUCKET   cureli-prod-assets  (used only for summary display)
 *   AWS_REGION      ap-south-1
 *   CDN_DOMAIN      d2w387j8f8ebzs.cloudfront.net
 *
 * ── USAGE ────────────────────────────────────────────────────
 *   cd backend
 *   node prisma/seeds/masterCatalog.seed.js
 *
 * ── RE-RUN BEHAVIOR ──────────────────────────────────────────
 * Safe to re-run. Truncates all 3 tables then re-seeds from scratch.
 * Add --force flag to skip confirmation prompt:
 *   node prisma/seeds/masterCatalog.seed.js --force
 *
 * ── FOR EC2 PROD ─────────────────────────────────────────────
 * Change DATABASE_URL in .env to point to EC2 Postgres.
 * Run seed from laptop with HDD connected.
 * CCSP_DATA_DIR stays the same (HDD path).
 * ═══════════════════════════════════════════════════════════════
 */

import { PrismaClient }    from "@prisma/client";
import fs                  from "fs-extra";
import path                from "path";
import { fileURLToPath }   from "url";
import { createWriteStream } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const prisma = new PrismaClient();

// ── Validate required env ────────────────────────────────────────────────────

const CCSP_DATA_DIR = process.env.CCSP_DATA_DIR;

if (!CCSP_DATA_DIR) {
  console.error("\n❌ Missing required env var: CCSP_DATA_DIR");
  console.error("   Add to backend/.env:");
  console.error("   CCSP_DATA_DIR=E:/1mg_scrapper/ccsp_output\n");
  process.exit(1);
}

const INDEX_FILE = path.join(CCSP_DATA_DIR, "_index.json");

// ── Config ───────────────────────────────────────────────────────────────────

const S3_PREFIX    = "medicine_images";
const FORCE        = process.argv.includes("--force");

// ── Logger ───────────────────────────────────────────────────────────────────

const LOG_DIR  = path.join(__dirname, "../../logs");
const date     = new Date().toISOString().slice(0, 10);
const LOG_FILE = path.join(LOG_DIR, `seed_${date}.log`);

let logStream = null;

async function initLogger() {
  await fs.ensureDir(LOG_DIR);
  logStream = createWriteStream(LOG_FILE, { flags: "a" });

  const header = [
    "",
    "═".repeat(70),
    `  SEED SESSION START: ${new Date().toISOString()}`,
    `  CCSP_DATA_DIR: ${CCSP_DATA_DIR}`,
    `  DATABASE_URL:  ${process.env.DATABASE_URL?.replace(/:\/\/.*@/, "://***@")}`,
    "═".repeat(70),
    "",
  ].join("\n");

  logStream.write(header + "\n");
}

function log(level, message) {
  const ts   = new Date().toISOString().replace("T", " ").slice(0, 19);
  const line = `[${ts}] ${level.padEnd(5)} ${message}`;
  if (logStream) logStream.write(line + "\n");
}

function closeLogger(summary) {
  if (!logStream) return;
  const footer = [
    "",
    "─".repeat(70),
    `  SEED SESSION END: ${new Date().toISOString()}`,
    `  ${summary}`,
    "─".repeat(70),
    "",
  ].join("\n");
  logStream.write(footer + "\n");
  logStream.end();
}

// ── Storage Key Builder ───────────────────────────────────────────────────────
//
// DB stores KEYS only — never full URLs.
// Backend resolves keys to CloudFront URLs via assetUrl.service.js
//
// Key format: medicine_images/{skuId}/{filename}
// Example:    medicine_images/10005/img_00_high.jpg

function buildStorageKey(skuId, filename) {
  return `${S3_PREFIX}/${skuId}/${filename}`;
}

// ── Formatting ────────────────────────────────────────────────────────────────

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ── Master key → master_medicine_id cache ─────────────────────────────────────
// Populated during master insert phase.
// Used during variant/image insert phase without extra DB lookups.

const masterIdCache = new Map(); // master_key → master_medicine_id

// ── Prepare image rows ────────────────────────────────────────────────────────

function prepareImages(variant, masterMedicineId) {
  const rows = [];

  if (!variant.images || variant.images.length === 0) return rows;

  let sequence = 0;

  // Primary: phase1_main.jpg if present, else img_00_high.jpg
  const hasMain    = variant.images.some(img => img.filename === "phase1_main.jpg");
  const hasImg00   = variant.images.some(img => img.filename === "img_00_high.jpg");

  if (hasMain) {
    rows.push({
      master_medicine_id: masterMedicineId,
      sku_id:             String(variant.sku_id),
      url:                buildStorageKey(variant.sku_id, "phase1_main.jpg"),
      type:               "PRIMARY",
      sequence:           sequence++,
    });
  } else if (hasImg00) {
    rows.push({
      master_medicine_id: masterMedicineId,
      sku_id:             String(variant.sku_id),
      url:                buildStorageKey(variant.sku_id, "img_00_high.jpg"),
      type:               "PRIMARY",
      sequence:           sequence++,
    });
  }

  // Gallery: all img_*_high.jpg except img_00 (already used as primary fallback)
  const gallery = variant.images.filter(
    img => /^img_\d{2}_high\.jpg$/.test(img.filename) && img.filename !== "img_00_high.jpg"
  );

  for (const img of gallery) {
    rows.push({
      master_medicine_id: masterMedicineId,
      sku_id:             String(variant.sku_id),
      url:                buildStorageKey(variant.sku_id, img.filename),
      type:               "GALLERY",
      sequence:           sequence++,
    });
  }

  return rows;
}

// ── Prepare variant row ───────────────────────────────────────────────────────

function prepareVariantData(variant, masterMedicineId) {
  const manufacturer = variant.manufacturer
    ? (typeof variant.manufacturer === "string"
        ? variant.manufacturer
        : variant.manufacturer?.name || null)
    : null;

  const marketer = variant.marketer
    ? (typeof variant.marketer === "string"
        ? variant.marketer
        : variant.marketer?.name || null)
    : null;

  // Build storage key array — keys only, no full URLs
  const imageKeys = [];

  if (variant.images && variant.images.length > 0) {
    if (variant.images.some(img => img.filename === "phase1_main.jpg")) {
      imageKeys.push(buildStorageKey(variant.sku_id, "phase1_main.jpg"));
    }

    const highRes = variant.images.filter(
      img => /^img_\d{2}_high\.jpg$/.test(img.filename)
    );
    for (const img of highRes) {
      imageKeys.push(buildStorageKey(variant.sku_id, img.filename));
    }
  }

  return {
    master_medicine_id: masterMedicineId,
    sku_id:             String(variant.sku_id),
    name:               variant.name,
    brand:              variant.brand              || null,
    composition:        variant.composition        || [],
    strength_value:     variant.strength?.value    || null,
    strength_unit:      variant.strength?.unit     || null,
    manufacturer,
    marketer,
    pack_size:          variant.pack_size          || null,
    mrp:                variant.price?.mrp         || null,
    selling_price:      variant.price?.selling_price    || null,
    discount_percent:   variant.price?.discount_percent || null,
    description:        variant.description        || null,
    images:             imageKeys,
  };
}

// ── Truncate tables ───────────────────────────────────────────────────────────

async function truncateTables() {
  console.log("🗑️  Truncating existing data...\n");
  log("INFO", "Truncating master_medicine_images, master_medicine_variants, master_medicines");

  // Order matters — FK constraints
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE master_medicine_images CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE master_medicine_variants CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE master_medicines CASCADE`);

  console.log("   ✓ Tables cleared\n");
  log("INFO", "Tables truncated successfully");
}

// ── Confirmation prompt ───────────────────────────────────────────────────────

async function confirmTruncate(existingMasters, existingVariants) {
  if (FORCE) {
    console.log("   --force flag set — skipping confirmation\n");
    return true;
  }

  console.log(`\n⚠️  Database already contains data:\n`);
  console.log(`   Masters:  ${existingMasters}`);
  console.log(`   Variants: ${existingVariants}\n`);
  console.log(`   Running this seed will DELETE all existing master catalog data`);
  console.log(`   and re-seed from CCSP output.\n`);
  console.log(`   To confirm, re-run with --force flag:\n`);
  console.log(`   node prisma/seeds/masterCatalog.seed.js --force\n`);

  return false;
}

// ── Main seed ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║                                                           ║");
  console.log("║       🌱 MASTER CATALOG — DATABASE SEED                   ║");
  console.log("║                                                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`   CCSP source:  ${CCSP_DATA_DIR}`);
  console.log(`   DB:           ${process.env.DATABASE_URL?.replace(/:\/\/.*@/, "://***@")}`);
  console.log(`   CDN:          ${process.env.CDN_DOMAIN || "none (keys only in DB)"}`);
  console.log(`   Log file:     ${LOG_FILE}\n`);

  await initLogger();
  log("INFO", `Seed started | CCSP: ${CCSP_DATA_DIR}`);

  const startTime = Date.now();

  const stats = {
    masters:       0,
    variants:      0,
    images:        0,
    masterErrors:  [],
    variantErrors: [],
    imageErrors:   [],
  };

  try {
    // ── Step 1: Check CCSP index ────────────────────────────────────────────
    if (!await fs.pathExists(INDEX_FILE)) {
      throw new Error(
        `CCSP index not found: ${INDEX_FILE}\n` +
        `   Check CCSP_DATA_DIR in backend/.env\n` +
        `   Current value: ${CCSP_DATA_DIR}`
      );
    }

    const ccspIndex  = await fs.readJson(INDEX_FILE);
    const totalPages = ccspIndex.files.length;
    const totalItems = ccspIndex.total_items;

    console.log(`📂 CCSP: ${totalPages} pages, ${totalItems} total SKUs\n`);
    log("INFO", `CCSP index loaded — ${totalPages} pages, ${totalItems} SKUs`);

    // ── Step 2: Safety check — ask before truncating ────────────────────────
    const existingMasters  = await prisma.masterMedicine.count();
    const existingVariants = await prisma.masterMedicineVariant.count();

    if (existingMasters > 0 || existingVariants > 0) {
      const confirmed = await confirmTruncate(existingMasters, existingVariants);
      if (!confirmed) {
        await prisma.$disconnect();
        closeLogger("Aborted — user did not confirm truncate");
        process.exit(0);
      }
      await truncateTables();
    } else {
      console.log("✓ Database is empty — safe to proceed\n");
      log("INFO", "Database empty — no truncation needed");
    }

    console.log("─".repeat(60) + "\n");

    // ── Step 3: Stream CCSP pages — build masters map ───────────────────────
    //
    // Pass 1: Read all pages to build the master_key → master data map.
    // We need the full picture before inserting masters because a master_key
    // may span multiple CCSP pages (same molecule, different SKUs).
    //
    // Memory note: we store only master-level data in Pass 1 (not full variants).
    // Full variant data is held only one page at a time in Pass 2.

    console.log("🔑 Pass 1 — Building master key map...\n");
    log("INFO", "Pass 1 started — building master key map");

    const masterMap = new Map(); // master_key → master metadata

    let pagesRead = 0;

    for (const pageFile of ccspIndex.files) {
      const filePath = path.join(CCSP_DATA_DIR, pageFile);

      if (!await fs.pathExists(filePath)) {
        log("WARN", `Page not found: ${pageFile} — skipped`);
        continue;
      }

      const medicines = await fs.readJson(filePath);

      for (const med of medicines) {
        const key = med.master_key;
        if (!key) {
          log("WARN", `SKU ${med.sku_id} has no master_key — skipped`);
          continue;
        }

        if (!masterMap.has(key)) {
          // Build generic name
          let genericName = null;

          if (med.composition && med.composition.length > 0) {
            genericName = med.composition.map(c => c.name).join(" + ");
          }

          if (!genericName) genericName = med.brand || med.name;
          if (med.form)     genericName = `${genericName} ${med.form}`;

          masterMap.set(key, {
            master_key:            key,
            generic_name:          genericName,
            type:                  med.type  || "OTC",
            form:                  med.form  || null,
            composition:           med.composition || [],
            prescription_required: med.prescription_required || false,
            primary_category:      med.primary_category || null,
            variant_count:         0,
          });
        }

        const master = masterMap.get(key);
        master.variant_count++;

        // Escalate type and prescription
        if (med.type === "DRUG")           master.type = "DRUG";
        if (med.prescription_required)     master.prescription_required = true;
      }

      pagesRead++;

      if (pagesRead % 500 === 0 || pagesRead === totalPages) {
        process.stdout.write(
          `\r   Pages read: ${pagesRead}/${totalPages} | Masters found: ${masterMap.size}   `
        );
      }
    }

    console.log(`\n\n   ✓ ${masterMap.size} unique masters identified\n`);
    log("INFO", `Pass 1 complete — ${masterMap.size} unique masters`);

    // ── Step 4: Insert masters ───────────────────────────────────────────────
    console.log("💾 Inserting masters...\n");
    log("INFO", "Inserting master records");

    const masterEntries = Array.from(masterMap.entries());

    for (let i = 0; i < masterEntries.length; i++) {
      const [key, master] = masterEntries[i];

      try {
        const created = await prisma.masterMedicine.create({
          data: {
            master_key:            master.master_key,
            generic_name:          master.generic_name,
            type:                  master.type,
            form:                  master.form,
            composition:           master.composition,
            prescription_required: master.prescription_required,
            primary_category:      master.primary_category,
            variant_count:         master.variant_count,
          },
          select: { master_medicine_id: true, master_key: true },
        });

        masterIdCache.set(key, created.master_medicine_id);
        stats.masters++;

      } catch (err) {
        stats.masterErrors.push({ key, error: err.message });
        log("ERROR", `Master insert failed | key: ${key} | ${err.message}`);
      }

      if ((i + 1) % 1000 === 0 || i === masterEntries.length - 1) {
        process.stdout.write(
          `\r   ${stats.masters}/${masterEntries.length} masters inserted   `
        );
      }
    }

    console.log(`\n\n   ✓ ${stats.masters} masters inserted\n`);
    log("INFO", `Masters complete — inserted: ${stats.masters} | errors: ${stats.masterErrors.length}`);

    // ── Step 5: Stream CCSP pages again — insert variants and images ─────────
    //
    // Pass 2: Re-read pages one at a time.
    // For each SKU, insert variant row + image rows.
    // masterIdCache gives O(1) master_medicine_id lookup.

    console.log("💾 Pass 2 — Inserting variants and images...\n");
    log("INFO", "Pass 2 started — inserting variants and images");

    let pass2Pages = 0;

    for (const pageFile of ccspIndex.files) {
      const filePath = path.join(CCSP_DATA_DIR, pageFile);

      if (!await fs.pathExists(filePath)) continue;

      const medicines = await fs.readJson(filePath);

      for (const med of medicines) {
        const masterMedicineId = masterIdCache.get(med.master_key);

        if (!masterMedicineId) {
          log("WARN", `SKU ${med.sku_id} — master not in cache (master_key: ${med.master_key})`);
          continue;
        }

        // Insert variant
        try {
          const variantData = prepareVariantData(med, masterMedicineId);
          await prisma.masterMedicineVariant.create({ data: variantData });
          stats.variants++;
        } catch (err) {
          stats.variantErrors.push({ sku: med.sku_id, error: err.message });
          log("ERROR", `Variant insert failed | SKU ${med.sku_id} | ${err.message}`);
          continue; // skip images if variant failed
        }

        // Insert image rows
        const imageRows = prepareImages(med, masterMedicineId);

        for (const img of imageRows) {
          try {
            await prisma.masterMedicineImage.create({ data: img });
            stats.images++;
          } catch (err) {
            // Ignore duplicate key errors — safe re-run guard
            if (!err.message.includes("Unique constraint")) {
              stats.imageErrors.push({ sku: med.sku_id, error: err.message });
              log("ERROR", `Image insert failed | SKU ${med.sku_id} | ${err.message}`);
            }
          }
        }
      }

      pass2Pages++;

      if (pass2Pages % 100 === 0 || pass2Pages === totalPages) {
        process.stdout.write(
          `\r   Pages: ${pass2Pages}/${totalPages} | ` +
          `Variants: ${stats.variants} | ` +
          `Images: ${stats.images} | ` +
          `Errors: ${stats.variantErrors.length}   `
        );
      }
    }

    console.log("\n\n   ✓ Variants and images inserted\n");
    log("INFO", `Pass 2 complete — variants: ${stats.variants} | images: ${stats.images} | variant errors: ${stats.variantErrors.length} | image errors: ${stats.imageErrors.length}`);

    console.log("─".repeat(60) + "\n");

    // ── Step 6: Verify ───────────────────────────────────────────────────────
    console.log("🔍 Verifying database...\n");

    const [finalMasters, finalVariants, finalImages] = await Promise.all([
      prisma.masterMedicine.count(),
      prisma.masterMedicineVariant.count(),
      prisma.masterMedicineImage.count(),
    ]);

    console.log(`   Masters in DB:  ${finalMasters.toLocaleString()}`);
    console.log(`   Variants in DB: ${finalVariants.toLocaleString()}`);
    console.log(`   Images in DB:   ${finalImages.toLocaleString()}\n`);

    log("INFO", `DB verification — masters: ${finalMasters} | variants: ${finalVariants} | images: ${finalImages}`);

    // ── Step 7: Sample ───────────────────────────────────────────────────────
    const sample = await prisma.masterMedicine.findFirst({
      where:   { variant_count: { gt: 1 } },
      include: {
        variants: {
          take: 2,
          select: { sku_id: true, name: true, mrp: true, images: true },
        },
        images: { take: 1 },
      },
    });

    if (sample) {
      console.log("🔍 Sample record:\n");
      console.log(`   Master:  ${sample.generic_name}`);
      console.log(`   Key:     ${sample.master_key}`);
      console.log(`   Type:    ${sample.type}`);

      if (sample.images[0]) {
        console.log(`   Image key: ${sample.images[0].url}`);
      }

      if (sample.variants[0]?.images?.length > 0) {
        console.log(`   Variant image key: ${sample.variants[0].images[0]}`);
      }

      console.log("");
    }

    // ── Step 8: Summary ──────────────────────────────────────────────────────
    const duration    = Date.now() - startTime;
    const totalErrors = stats.masterErrors.length + stats.variantErrors.length + stats.imageErrors.length;

    console.log("═".repeat(60));
    console.log("   ✅ SEED COMPLETE");
    console.log("═".repeat(60));
    console.log("\n📊 Summary:\n");
    console.log(`   Masters inserted:  ${stats.masters.toLocaleString()}`);
    console.log(`   Variants inserted: ${stats.variants.toLocaleString()}`);
    console.log(`   Images inserted:   ${stats.images.toLocaleString()}`);
    console.log(`   Total errors:      ${totalErrors}`);
    console.log(`   Duration:          ${formatDuration(duration)}\n`);

    if (totalErrors > 0) {
      console.log("⚠️  Errors (first 5 per type):\n");

      if (stats.masterErrors.length > 0) {
        console.log("   Master errors:");
        stats.masterErrors.slice(0, 5).forEach(e => {
          console.log(`     ${e.key}: ${e.error}`);
        });
      }

      if (stats.variantErrors.length > 0) {
        console.log("   Variant errors:");
        stats.variantErrors.slice(0, 5).forEach(e => {
          console.log(`     SKU ${e.sku}: ${e.error}`);
        });
      }

      console.log(`\n   Full error log: ${LOG_FILE}\n`);
    }

    console.log(`   Log file: ${LOG_FILE}\n`);

    if (totalErrors === 0) {
      console.log("🎉 Master catalog seeded successfully with zero errors!\n");
      console.log("   Next steps:\n");
      console.log("   1. Start the backend: npm run dev");
      console.log("   2. Open cadmin → Master Medicines");
      console.log("   3. Verify images load from CloudFront\n");
    }

    const summaryLine = `masters: ${stats.masters} | variants: ${stats.variants} | images: ${stats.images} | errors: ${totalErrors} | duration: ${formatDuration(duration)}`;
    log("INFO", `Seed complete — ${summaryLine}`);
    closeLogger(summaryLine);

  } catch (err) {
    console.error("\n❌ SEED FAILED:\n");
    console.error(err.message);
    log("ERROR", `Fatal: ${err.message}`);
    closeLogger(`FATAL: ${err.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(err => {
  console.error("\n❌ Unhandled error:\n", err);
  process.exit(1);
});