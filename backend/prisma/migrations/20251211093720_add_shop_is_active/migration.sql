-- backend/prisma/migrations/20251211093720_add_shop_is_active/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
