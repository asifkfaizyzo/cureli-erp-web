-- backend/prisma/migrations/20260131094245_add_stock_level_thresholds_to_medicine/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "max_stock_level" DECIMAL(10,2),
ADD COLUMN     "min_stock_level" DECIMAL(10,2),
ADD COLUMN     "reorder_point" DECIMAL(10,2);
