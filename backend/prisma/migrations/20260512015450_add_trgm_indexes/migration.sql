-- backend/prisma/migrations/20260512015450_add_trgm_indexes/migration.sql (do not remove this comment)
-- Migration: add_trgm_indexes
-- Adds pg_trgm extension and GIN trigram indexes on
-- master_medicine_variants for fast ILIKE search.
--
-- NOTE: CONCURRENTLY removed for Prisma shadow DB compatibility.
-- Indexes were originally created manually on local and production.
-- This file exists for migration history record only.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_mmv_name_trgm
  ON master_medicine_variants
  USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_mmv_brand_trgm
  ON master_medicine_variants
  USING GIN (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_mmv_manufacturer_trgm
  ON master_medicine_variants
  USING GIN (manufacturer gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_mmv_marketer_trgm
  ON master_medicine_variants
  USING GIN (marketer gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_mm_generic_name_trgm
  ON master_medicines
  USING GIN (generic_name gin_trgm_ops);

-- B-tree indexes defined in schema.prisma via @@index directives.
-- Added here so shadow DB replay produces the same state as the live DB.
-- IF NOT EXISTS guards make this safe on environments where they already exist.

CREATE INDEX IF NOT EXISTS "master_medicine_variants_brand_idx"
  ON "master_medicine_variants"("brand");

CREATE INDEX IF NOT EXISTS "master_medicine_variants_name_idx"
  ON "master_medicine_variants"("name");

CREATE INDEX IF NOT EXISTS "master_medicine_variants_manufacturer_idx"
  ON "master_medicine_variants"("manufacturer");

CREATE INDEX IF NOT EXISTS "master_medicine_variants_marketer_idx"
  ON "master_medicine_variants"("marketer");

CREATE INDEX IF NOT EXISTS "master_medicines_generic_name_idx"
  ON "master_medicines"("generic_name");