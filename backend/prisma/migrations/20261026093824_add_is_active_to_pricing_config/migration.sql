-- backend/prisma/migrations/20261026093824_add_is_active_to_pricing_config/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "delivery_pricing_config" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
