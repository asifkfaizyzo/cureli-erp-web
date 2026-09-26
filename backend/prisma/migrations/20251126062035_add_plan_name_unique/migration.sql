-- backend/prisma/migrations/20251126062035_add_plan_name_unique/migration.sql (do not remove this comment)
/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `plans` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");
