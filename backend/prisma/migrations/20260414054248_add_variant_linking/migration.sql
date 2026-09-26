-- backend/prisma/migrations/20260414054248_add_variant_linking/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "suggested_variant_id" UUID;
