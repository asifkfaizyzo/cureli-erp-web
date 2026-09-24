-- backend/prisma/migrations/20260414053809_add_variant_linking/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "linked_variant_id" UUID,
ADD COLUMN     "linked_variant_sku" VARCHAR(50);

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_master_medicine_id_fkey" FOREIGN KEY ("master_medicine_id") REFERENCES "master_medicines"("master_medicine_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_linked_variant_id_fkey" FOREIGN KEY ("linked_variant_id") REFERENCES "master_medicine_variants"("variant_id") ON DELETE SET NULL ON UPDATE CASCADE;
