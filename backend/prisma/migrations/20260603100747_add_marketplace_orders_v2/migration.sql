-- backend/prisma/migrations/20260603100747_add_marketplace_orders_v2/migration.sql (do not remove this comment)
-- DropIndex
DROP INDEX IF EXISTS "idx_mmv_brand_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_mmv_manufacturer_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_mmv_marketer_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_mmv_name_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_mm_generic_name_trgm";
