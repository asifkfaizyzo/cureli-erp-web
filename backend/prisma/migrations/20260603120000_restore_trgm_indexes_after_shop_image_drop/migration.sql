-- backend/prisma/migrations/20260603120000_restore_trgm_indexes_after_shop_image_drop/migration.sql (do not remove this comment)
-- Restore trigram indexes that were dropped in
-- 20260527090008_add_branch_shop_image_url.
--
-- These indexes are intentional and required for fast medicine search.
-- IF NOT EXISTS keeps this safe on environments where they already exist.

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