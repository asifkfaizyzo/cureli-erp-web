-- backend/prisma/migrations/20260130080140_add_branch_to_medicine/migration.sql (do not remove this comment)
/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,branch_id,name,manufacturer]` on the table `medicines` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "medicines_shop_id_name_manufacturer_key";

-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "branch_id" UUID;

-- CreateIndex
CREATE INDEX "medicines_shop_id_branch_id_is_active_idx" ON "medicines"("shop_id", "branch_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_shop_id_branch_id_name_manufacturer_key" ON "medicines"("shop_id", "branch_id", "name", "manufacturer");

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;
