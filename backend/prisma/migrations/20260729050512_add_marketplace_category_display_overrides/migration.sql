-- backend/prisma/migrations/20260729050512_add_marketplace_category_display_overrides/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "marketplace_category_display_overrides" (
    "id" UUID NOT NULL,
    "category_key" VARCHAR(150) NOT NULL,
    "image_storage_key" VARCHAR(500),
    "image_original_name" VARCHAR(255),
    "image_mime_type" VARCHAR(100),
    "image_file_size" INTEGER,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_cadmin_id" UUID,
    "updated_by_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marketplace_category_display_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_category_display_overrides_category_key_key" ON "marketplace_category_display_overrides"("category_key");

-- CreateIndex
CREATE INDEX "marketplace_category_display_overrides_category_key_idx" ON "marketplace_category_display_overrides"("category_key");
