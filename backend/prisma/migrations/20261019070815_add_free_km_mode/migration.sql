-- backend/prisma/migrations/20261019070815_add_free_km_mode/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "FreeKmMode" AS ENUM ('EXCESS_ONLY', 'FULL_DISTANCE');

-- AlterTable
ALTER TABLE "delivery_pricing_config" ADD COLUMN     "free_km_mode" "FreeKmMode" NOT NULL DEFAULT 'EXCESS_ONLY';
