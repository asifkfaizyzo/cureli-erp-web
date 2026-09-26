-- backend/prisma/migrations/20260805054652_add_home_banners/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "BannerCtaAction" AS ENUM ('NONE', 'ROUTE', 'CATEGORY', 'EXTERNAL_URL');

-- CreateTable
CREATE TABLE "home_banner_slides" (
    "slide_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "title" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(300),
    "image_storage_key" VARCHAR(500),
    "image_original_name" VARCHAR(255),
    "image_mime_type" VARCHAR(100),
    "image_file_size" INTEGER,
    "cta_label" VARCHAR(80),
    "cta_action" "BannerCtaAction" NOT NULL DEFAULT 'NONE',
    "cta_action_value" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "gradient_index" INTEGER NOT NULL DEFAULT 0,
    "placeholder_icon" VARCHAR(100) NOT NULL DEFAULT 'medkit-outline',
    "updated_by_cadmin_id" UUID,
    "updated_by_name" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "home_banner_slides_pkey" PRIMARY KEY ("slide_id")
);

-- CreateTable
CREATE TABLE "home_strip_banners" (
    "strip_id" UUID NOT NULL,
    "banner_type" VARCHAR(50) NOT NULL DEFAULT 'HOME_STRIP',
    "image_storage_key" VARCHAR(500),
    "image_original_name" VARCHAR(255),
    "image_mime_type" VARCHAR(100),
    "image_file_size" INTEGER,
    "cta_action" "BannerCtaAction" NOT NULL DEFAULT 'NONE',
    "cta_action_value" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_cadmin_id" UUID,
    "updated_by_name" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "home_strip_banners_pkey" PRIMARY KEY ("strip_id")
);

-- CreateIndex
CREATE INDEX "home_banner_slides_is_active_position_idx" ON "home_banner_slides"("is_active", "position");

-- CreateIndex
CREATE INDEX "home_banner_slides_position_idx" ON "home_banner_slides"("position");

-- CreateIndex
CREATE UNIQUE INDEX "home_strip_banners_banner_type_key" ON "home_strip_banners"("banner_type");
