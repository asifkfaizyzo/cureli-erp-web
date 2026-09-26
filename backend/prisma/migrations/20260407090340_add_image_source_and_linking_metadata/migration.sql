-- backend/prisma/migrations/20260407090340_add_image_source_and_linking_metadata/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "ImageSource" AS ENUM ('SCRAPED', 'UPLOADED');

-- AlterTable
ALTER TABLE "master_medicine_images" ADD COLUMN     "source" "ImageSource" NOT NULL DEFAULT 'SCRAPED',
ADD COLUMN     "uploaded_by" VARCHAR(100);

-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "linked_by_id" UUID,
ADD COLUMN     "linked_by_type" VARCHAR(20),
ADD COLUMN     "normalized_name" VARCHAR(200),
ADD COLUMN     "suggested_master_id" UUID,
ADD COLUMN     "suggestion_reason" VARCHAR(200);
