-- backend/prisma/migrations/20251208060915_add_document_tracking_dates/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "shop_files" ADD COLUMN     "last_resubmitted_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejected_at" TIMESTAMPTZ(6);
