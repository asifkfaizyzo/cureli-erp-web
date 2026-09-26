-- backend/prisma/migrations/20260508080211_increase_medicine_name_lengths/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "master_medicine_variants" ALTER COLUMN "name" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "brand" SET DATA TYPE VARCHAR(350);

-- AlterTable
ALTER TABLE "master_medicines" ALTER COLUMN "master_key" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "generic_name" SET DATA TYPE VARCHAR(500);
