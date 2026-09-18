-- AlterTable
ALTER TABLE "medicines"
ADD COLUMN "last_resubmitted_at" TIMESTAMPTZ(6),
ADD COLUMN "resubmission_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "medicines_shop_id_link_status_resubmission_count_idx"
ON "medicines"("shop_id", "link_status", "resubmission_count");
