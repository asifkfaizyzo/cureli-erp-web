-- backend/prisma/migrations/20251215100116_add_plan_type_and_shop_link/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('PRE_MADE', 'CUSTOM');

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "created_for_shop_id" UUID,
ADD COLUMN     "type" "PlanType" NOT NULL DEFAULT 'PRE_MADE';

-- CreateIndex
CREATE INDEX "plans_type_idx" ON "plans"("type");

-- CreateIndex
CREATE INDEX "plans_created_for_shop_id_idx" ON "plans"("created_for_shop_id");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_created_for_shop_id_fkey" FOREIGN KEY ("created_for_shop_id") REFERENCES "shops"("shop_id") ON DELETE SET NULL ON UPDATE CASCADE;
