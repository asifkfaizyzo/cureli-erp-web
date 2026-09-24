-- backend/prisma/migrations/20260106091349_subscription_status_standardization/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `is_active` on the `shop_subscriptions` table. All the data in the column will be lost.
  - The `status` column on the `shop_subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_status` column on the `shop_subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- DropIndex
DROP INDEX "shop_subscriptions_is_active_idx";

-- AlterTable
ALTER TABLE "shop_subscriptions" DROP COLUMN "is_active",
ADD COLUMN     "activated_at" TIMESTAMPTZ(6),
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "billing_cycle" SET DEFAULT 'yearly',
DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "shop_subscriptions_status_idx" ON "shop_subscriptions"("status");


