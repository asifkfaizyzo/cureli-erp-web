-- backend/prisma/migrations/20251215092025_consolidate_plans_add_activity_log/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `features_json` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `is_visible` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `price_monthly` on the `plans` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `plans` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - Made the column `price` on table `plans` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "features_json",
DROP COLUMN "is_visible",
ADD COLUMN     "activated_at" TIMESTAMPTZ(6),
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "suspended_at" TIMESTAMPTZ(6),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "price" SET NOT NULL;

-- CreateTable
CREATE TABLE "plan_activity_logs" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "cadmin_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "from_status" VARCHAR(20),
    "to_status" VARCHAR(20),
    "changes" JSONB,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_activity_logs_plan_id_idx" ON "plan_activity_logs"("plan_id");

-- CreateIndex
CREATE INDEX "plan_activity_logs_cadmin_id_idx" ON "plan_activity_logs"("cadmin_id");

-- CreateIndex
CREATE INDEX "plan_activity_logs_action_idx" ON "plan_activity_logs"("action");

-- CreateIndex
CREATE INDEX "plan_activity_logs_created_at_idx" ON "plan_activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "plans_status_idx" ON "plans"("status");

-- CreateIndex
CREATE INDEX "plans_deleted_at_idx" ON "plans"("deleted_at");

-- CreateIndex
CREATE INDEX "shop_subscriptions_plan_id_idx" ON "shop_subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "shop_subscriptions_shop_id_idx" ON "shop_subscriptions"("shop_id");

-- CreateIndex
CREATE INDEX "shop_subscriptions_is_active_idx" ON "shop_subscriptions"("is_active");

-- CreateIndex
CREATE INDEX "shop_subscriptions_end_date_idx" ON "shop_subscriptions"("end_date");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "cadmins"("cadmin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_activity_logs" ADD CONSTRAINT "plan_activity_logs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_activity_logs" ADD CONSTRAINT "plan_activity_logs_cadmin_id_fkey" FOREIGN KEY ("cadmin_id") REFERENCES "cadmins"("cadmin_id") ON DELETE SET NULL ON UPDATE CASCADE;
