-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "batch_group_id" VARCHAR(30);

-- AlterTable
ALTER TABLE "delivery_pricing_config" ADD COLUMN     "same_day_cutoff_hour" INTEGER NOT NULL DEFAULT 15;

-- CreateIndex
CREATE INDEX "deliveries_rider_id_batch_group_id_idx" ON "deliveries"("rider_id", "batch_group_id");

-- CreateIndex
CREATE INDEX "deliveries_batch_group_id_idx" ON "deliveries"("batch_group_id");
