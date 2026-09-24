-- backend/prisma/migrations/20260617043235_plan_non_uniyuq_name/migration.sql (do not remove this comment)
/*
  Warnings:

  - A unique constraint covering the columns `[plan_code]` on the table `plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `plan_code` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "plans_name_key";

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "plan_code" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "plans_plan_code_key" ON "plans"("plan_code");

-- CreateIndex
CREATE INDEX "plans_name_idx" ON "plans"("name");
