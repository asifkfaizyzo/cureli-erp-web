-- backend/prisma/migrations/20251126095628_add_default_billing_cycle/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "shop_subscriptions" ALTER COLUMN "billing_cycle" SET DEFAULT 'monthly';
