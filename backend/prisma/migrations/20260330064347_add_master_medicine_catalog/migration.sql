-- backend/prisma/migrations/20260330064347_add_master_medicine_catalog/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "MedicineType" AS ENUM ('DRUG', 'OTC');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('PRIMARY', 'GALLERY');

-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "master_medicine_id" UUID;

-- CreateTable
CREATE TABLE "master_medicines" (
    "master_medicine_id" UUID NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "normalized_name" VARCHAR(300) NOT NULL,
    "composition" VARCHAR(500),
    "type" "MedicineType" NOT NULL,
    "manufacturer" VARCHAR(200),
    "marketer" VARCHAR(200),
    "pack_size" VARCHAR(100),
    "prescription_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "master_medicines_pkey" PRIMARY KEY ("master_medicine_id")
);

-- CreateTable
CREATE TABLE "master_medicine_images" (
    "image_id" UUID NOT NULL,
    "master_medicine_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "type" "ImageType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_medicine_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateIndex
CREATE INDEX "master_medicines_normalized_name_idx" ON "master_medicines"("normalized_name");

-- CreateIndex
CREATE INDEX "master_medicines_name_idx" ON "master_medicines"("name");

-- CreateIndex
CREATE INDEX "master_medicines_type_idx" ON "master_medicines"("type");

-- CreateIndex
CREATE INDEX "master_medicines_is_active_idx" ON "master_medicines"("is_active");

-- CreateIndex
CREATE INDEX "master_medicine_images_master_medicine_id_idx" ON "master_medicine_images"("master_medicine_id");

-- CreateIndex
CREATE INDEX "master_medicine_images_type_idx" ON "master_medicine_images"("type");

-- CreateIndex
CREATE INDEX "medicines_master_medicine_id_idx" ON "medicines"("master_medicine_id");

-- AddForeignKey
ALTER TABLE "master_medicine_images" ADD CONSTRAINT "master_medicine_images_master_medicine_id_fkey" FOREIGN KEY ("master_medicine_id") REFERENCES "master_medicines"("master_medicine_id") ON DELETE CASCADE ON UPDATE CASCADE;
