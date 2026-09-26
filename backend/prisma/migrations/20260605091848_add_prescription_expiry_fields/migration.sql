-- backend/prisma/migrations/20260605091848_add_prescription_expiry_fields/migration.sql (do not remove this comment)
-- DropIndex
DROP INDEX "idx_mmv_brand_trgm";

-- DropIndex
DROP INDEX "idx_mmv_manufacturer_trgm";

-- DropIndex
DROP INDEX "idx_mmv_marketer_trgm";

-- DropIndex
DROP INDEX "idx_mmv_name_trgm";

-- DropIndex
DROP INDEX "idx_mm_generic_name_trgm";

-- AlterTable
ALTER TABLE "marketplace_order_prescriptions" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "expires_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "marketplace_order_prescriptions_expires_at_deleted_at_idx" ON "marketplace_order_prescriptions"("expires_at", "deleted_at");
