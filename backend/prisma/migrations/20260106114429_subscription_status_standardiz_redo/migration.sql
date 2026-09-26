-- backend/prisma/migrations/20260106114429_subscription_status_standardiz_redo/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `activated_at` on the `shop_subscriptions` table. All the data in the column will be lost.
  - Changed the type of `status` on the `shop_subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_status` on the `shop_subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "shop_subscriptions_status_idx";

-- AlterTable
ALTER TABLE "shop_subscriptions" DROP COLUMN "activated_at",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "billing_cycle" SET DEFAULT 'monthly',
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" TEXT NOT NULL;

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- CreateIndex
CREATE INDEX "shop_subscriptions_is_active_idx" ON "shop_subscriptions"("is_active");
