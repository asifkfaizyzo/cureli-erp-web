-- backend/prisma/migrations/20251120071419_j/migration.sql (do not remove this comment)
/*
  Warnings:

  - Made the column `branch_type` on table `branches` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "branches" ALTER COLUMN "branch_type" SET NOT NULL;

-- AlterTable
ALTER TABLE "shops" ALTER COLUMN "business_type" DROP NOT NULL;
