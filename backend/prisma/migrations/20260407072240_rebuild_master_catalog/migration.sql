-- backend/prisma/migrations/20260407072240_rebuild_master_catalog/migration.sql (do not remove this comment)
-- ══════════════════════════════════════════════════════════════
-- MASTER CATALOG REBUILD MIGRATION
-- ══════════════════════════════════════════════════════════════

-- Step 1: Drop old tables (if exists)
DROP TABLE IF EXISTS "master_medicine_images" CASCADE;
DROP TABLE IF EXISTS "master_medicine_variants" CASCADE;
DROP TABLE IF EXISTS "master_medicines" CASCADE;

-- Step 2: Drop old enums (if changed)
-- (MedicineType and ImageType already exist, keep them)

-- Step 3: Create new master_medicines table
CREATE TABLE "master_medicines" (
  "master_medicine_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "master_key" VARCHAR(100) NOT NULL,
  "generic_name" VARCHAR(300) NOT NULL,
  "type" "MedicineType" NOT NULL,
  "form" VARCHAR(50),
  "composition" JSONB NOT NULL,
  "prescription_required" BOOLEAN NOT NULL DEFAULT false,
  "primary_category" VARCHAR(100),
  "variant_count" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "master_medicines_pkey" PRIMARY KEY ("master_medicine_id")
);

-- Step 4: Create master_medicine_variants table
CREATE TABLE "master_medicine_variants" (
  "variant_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "master_medicine_id" UUID NOT NULL,
  "sku_id" VARCHAR(50) NOT NULL,
  "name" VARCHAR(300) NOT NULL,
  "brand" VARCHAR(150),
  "composition" JSONB NOT NULL,
  "strength_value" DOUBLE PRECISION,
  "strength_unit" VARCHAR(20),
  "manufacturer" VARCHAR(200),
  "marketer" VARCHAR(200),
  "pack_size" VARCHAR(100),
  "mrp" DECIMAL(10,2),
  "selling_price" DECIMAL(10,2),
  "discount_percent" DOUBLE PRECISION,
  "description" TEXT,
  "images" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "master_medicine_variants_pkey" PRIMARY KEY ("variant_id")
);

-- Step 5: Create master_medicine_images table
CREATE TABLE "master_medicine_images" (
  "image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "master_medicine_id" UUID NOT NULL,
  "sku_id" VARCHAR(50) NOT NULL,
  "url" VARCHAR(500) NOT NULL,
  "type" "ImageType" NOT NULL,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "master_medicine_images_pkey" PRIMARY KEY ("image_id")
);

-- Step 6: Create unique constraints
CREATE UNIQUE INDEX "master_medicines_master_key_key" ON "master_medicines"("master_key");
CREATE UNIQUE INDEX "master_medicine_variants_sku_id_key" ON "master_medicine_variants"("sku_id");

-- Step 7: Create indexes for master_medicines
CREATE INDEX "master_medicines_master_key_idx" ON "master_medicines"("master_key");
CREATE INDEX "master_medicines_generic_name_idx" ON "master_medicines"("generic_name");
CREATE INDEX "master_medicines_type_idx" ON "master_medicines"("type");
CREATE INDEX "master_medicines_form_idx" ON "master_medicines"("form");
CREATE INDEX "master_medicines_is_active_idx" ON "master_medicines"("is_active");
CREATE INDEX "master_medicines_primary_category_idx" ON "master_medicines"("primary_category");

-- Step 8: Create indexes for master_medicine_variants
CREATE INDEX "master_medicine_variants_master_medicine_id_idx" ON "master_medicine_variants"("master_medicine_id");
CREATE INDEX "master_medicine_variants_sku_id_idx" ON "master_medicine_variants"("sku_id");
CREATE INDEX "master_medicine_variants_brand_idx" ON "master_medicine_variants"("brand");
CREATE INDEX "master_medicine_variants_name_idx" ON "master_medicine_variants"("name");

-- Step 9: Create indexes for master_medicine_images
CREATE INDEX "master_medicine_images_master_medicine_id_idx" ON "master_medicine_images"("master_medicine_id");
CREATE INDEX "master_medicine_images_sku_id_idx" ON "master_medicine_images"("sku_id");
CREATE INDEX "master_medicine_images_type_idx" ON "master_medicine_images"("type");

-- Step 10: Add foreign keys
ALTER TABLE "master_medicine_variants" 
  ADD CONSTRAINT "master_medicine_variants_master_medicine_id_fkey" 
  FOREIGN KEY ("master_medicine_id") 
  REFERENCES "master_medicines"("master_medicine_id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "master_medicine_images" 
  ADD CONSTRAINT "master_medicine_images_master_medicine_id_fkey" 
  FOREIGN KEY ("master_medicine_id") 
  REFERENCES "master_medicines"("master_medicine_id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- UPDATE SHOP MEDICINES TABLE (ADD LINKING FIELDS)
-- ══════════════════════════════════════════════════════════════

-- Step 11: Create LinkStatus enum
CREATE TYPE "LinkStatus" AS ENUM (
  'PENDING',
  'AUTO_LINKED',
  'SUGGESTED',
  'MANUAL_LINKED',
  'UNLINKED'
);

-- Step 12: Add new columns to medicines table
ALTER TABLE "medicines" 
  ADD COLUMN "link_status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "link_confidence_score" DOUBLE PRECISION,
  ADD COLUMN "link_rejected" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "linked_at" TIMESTAMPTZ(6);

-- Step 13: Create index for linking
CREATE INDEX "medicines_master_medicine_id_link_status_idx" 
  ON "medicines"("master_medicine_id", "link_status");

-- Step 14: Update existing medicines with master_medicine_id to AUTO_LINKED
UPDATE "medicines" 
SET "link_status" = 'AUTO_LINKED', 
    "linked_at" = CURRENT_TIMESTAMP 
WHERE "master_medicine_id" IS NOT NULL;