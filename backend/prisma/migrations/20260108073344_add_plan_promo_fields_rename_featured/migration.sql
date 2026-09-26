-- backend/prisma/migrations/20260108073344_add_plan_promo_fields_rename_featured/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `is_highlighted` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "is_highlighted",
ADD COLUMN     "billing_cycle_months" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "bonus_months" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "compare_at_price" BIGINT,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promo_free_until" TIMESTAMPTZ(6);
