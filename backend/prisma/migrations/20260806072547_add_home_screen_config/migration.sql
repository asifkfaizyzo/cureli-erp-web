-- backend/prisma/migrations/20260806072547_add_home_screen_config/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "home_feed_section_overrides" (
    "id" UUID NOT NULL,
    "category_key" VARCHAR(150) NOT NULL,
    "label_override" VARCHAR(100),
    "position" INTEGER,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_cadmin_id" UUID,
    "updated_by_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "home_feed_section_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_screen_config" (
    "config_id" UUID NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT NOT NULL,
    "updated_by_cadmin_id" UUID,
    "updated_by_name" VARCHAR(100),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "home_screen_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_feed_section_overrides_category_key_key" ON "home_feed_section_overrides"("category_key");

-- CreateIndex
CREATE INDEX "home_feed_section_overrides_category_key_idx" ON "home_feed_section_overrides"("category_key");

-- CreateIndex
CREATE UNIQUE INDEX "home_screen_config_config_key_key" ON "home_screen_config"("config_key");

-- CreateIndex
CREATE INDEX "home_screen_config_config_key_idx" ON "home_screen_config"("config_key");
