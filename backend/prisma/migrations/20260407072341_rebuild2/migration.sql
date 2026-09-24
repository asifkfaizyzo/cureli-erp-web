-- backend/prisma/migrations/20260407072341_rebuild2/migration.sql (do not remove this comment)
-- DropIndex
DROP INDEX "medicines_master_medicine_id_idx";

-- AlterTable
ALTER TABLE "master_medicine_images" ALTER COLUMN "image_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "master_medicine_variants" ALTER COLUMN "variant_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "master_medicines" ALTER COLUMN "master_medicine_id" DROP DEFAULT;
