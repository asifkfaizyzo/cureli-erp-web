-- backend/prisma/migrations/20260917000000_add_resubmission_tracking/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "medicines"
ADD COLUMN "last_resubmitted_at" TIMESTAMPTZ(6),
ADD COLUMN "resubmission_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "medicines_shop_id_link_status_resubmission_count_idx"
ON "medicines"("shop_id", "link_status", "resubmission_count");
