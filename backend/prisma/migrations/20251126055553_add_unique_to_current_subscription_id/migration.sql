-- backend/prisma/migrations/20251126055553_add_unique_to_current_subscription_id/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `branch_seat_limit` on the `branches` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[current_subscription_id]` on the table `shops` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "branches" DROP COLUMN "branch_seat_limit";

-- CreateTable
CREATE TABLE "plans" (
    "plan_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "max_branches" INTEGER NOT NULL,
    "max_users" INTEGER NOT NULL,
    "price" BIGINT,
    "is_customizable" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "features_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "shop_subscriptions" (
    "subscription_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "billing_cycle" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "renewal_date" TIMESTAMPTZ(6) NOT NULL,
    "branch_limit_snapshot" INTEGER NOT NULL,
    "user_limit_snapshot" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shop_subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_current_subscription_id_key" ON "shops"("current_subscription_id");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_current_subscription_id_fkey" FOREIGN KEY ("current_subscription_id") REFERENCES "shop_subscriptions"("subscription_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_subscriptions" ADD CONSTRAINT "shop_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_subscriptions" ADD CONSTRAINT "shop_subscriptions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;
