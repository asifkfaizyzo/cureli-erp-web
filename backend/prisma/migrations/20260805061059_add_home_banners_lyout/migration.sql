-- backend/prisma/migrations/20260805061059_add_home_banners_lyout/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "home_banner_slides" ADD COLUMN     "layout_mode" VARCHAR(20) NOT NULL DEFAULT 'TEXT_WITH_IMAGE';
