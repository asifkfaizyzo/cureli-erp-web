-- backend/prisma/migrations/20260108103829_add_grace_period/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "shop_subscriptions" ADD COLUMN     "grace_period_until" TIMESTAMPTZ(6),
ALTER COLUMN "billing_cycle" SET DEFAULT 'yearly';
