-- backend/prisma/migrations/20260527062256_add_requires_prescription_to_listing/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "marketplace_listings" ADD COLUMN "requires_prescription" BOOLEAN NOT NULL DEFAULT false;