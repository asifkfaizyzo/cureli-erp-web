-- backend/prisma/migrations/20261024100715_add_delivery_tiers_json/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "delivery_pricing_config" ADD COLUMN     "delivery_tiers_json" JSONB;
