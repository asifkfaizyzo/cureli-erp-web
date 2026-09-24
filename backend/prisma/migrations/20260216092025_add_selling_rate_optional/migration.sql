-- backend/prisma/migrations/20260216092025_add_selling_rate_optional/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "sales_invoice_items" ADD COLUMN     "selling_rate" DECIMAL(10,2);
