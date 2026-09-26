-- backend/prisma/migrations/20260805093246_strip_banners_multi/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `banner_type` on the `home_strip_banners` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "home_strip_banners_banner_type_key";

-- AlterTable
ALTER TABLE "home_strip_banners" DROP COLUMN "banner_type",
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "home_strip_banners_is_active_position_idx" ON "home_strip_banners"("is_active", "position");

-- CreateIndex
CREATE INDEX "home_strip_banners_position_idx" ON "home_strip_banners"("position");
