-- backend/prisma/migrations/20260905080053_add_rider_auth_fields_remove_zone/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `zone_id` on the `riders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `riders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RiderType" AS ENUM ('INDEPENDENT', 'TEAM');

-- DropForeignKey
ALTER TABLE "riders" DROP CONSTRAINT "riders_zone_id_fkey";

-- DropIndex
DROP INDEX "riders_zone_id_is_online_status_idx";

-- AlterTable
ALTER TABLE "riders" DROP COLUMN "zone_id",
ADD COLUMN     "current_city" VARCHAR(100),
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "password_hash" VARCHAR(255),
ADD COLUMN     "preferred_address" VARCHAR(500),
ADD COLUMN     "preferred_lat" DECIMAL(10,8),
ADD COLUMN     "preferred_lng" DECIMAL(11,8),
ADD COLUMN     "residential_address" VARCHAR(500),
ADD COLUMN     "rider_type" "RiderType" NOT NULL DEFAULT 'INDEPENDENT',
ADD COLUMN     "terms_accepted_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "riders_email_key" ON "riders"("email");

-- CreateIndex
CREATE INDEX "riders_is_online_status_idx" ON "riders"("is_online", "status");

-- CreateIndex
CREATE INDEX "riders_rider_type_status_idx" ON "riders"("rider_type", "status");
