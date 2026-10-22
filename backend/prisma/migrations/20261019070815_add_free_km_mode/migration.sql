-- CreateEnum
CREATE TYPE "FreeKmMode" AS ENUM ('EXCESS_ONLY', 'FULL_DISTANCE');

-- AlterTable
ALTER TABLE "delivery_pricing_config" ADD COLUMN     "free_km_mode" "FreeKmMode" NOT NULL DEFAULT 'EXCESS_ONLY';
