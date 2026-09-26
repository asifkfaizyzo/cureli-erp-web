-- backend/prisma/migrations/20260526000000_baseline_existing_marketplace_profile_tables/migration.sql (do not remove this comment)
-- Baseline migration for existing marketplace objects already present in DB
-- Confirmed existing objects:
--   - enum MarketplaceStatus
--   - table marketplace_profiles
--   - table branch_marketplace_settings
--
-- This migration is added so Prisma shadow DB can replay history correctly.
-- It is intentionally idempotent.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'MarketplaceStatus'
  ) THEN
    CREATE TYPE "MarketplaceStatus" AS ENUM ('NOT_STARTED', 'DRAFT', 'LIVE', 'SUSPENDED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "marketplace_profiles" (
    "marketplace_profile_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "storefront_name" VARCHAR(200),
    "storefront_description" TEXT,
    "support_phone" VARCHAR(20),
    "logo_url" VARCHAR(500),
    "banner_url" VARCHAR(500),
    "marketplace_status" "MarketplaceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_draft" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marketplace_profiles_pkey" PRIMARY KEY ("marketplace_profile_id")
);

CREATE TABLE IF NOT EXISTS "branch_marketplace_settings" (
    "branch_marketplace_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "marketplace_profile_id" UUID NOT NULL,
    "marketplace_enabled" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "google_place_id" VARCHAR(500),
    "formatted_address" VARCHAR(500),
    "opening_time" VARCHAR(5),
    "closing_time" VARCHAR(5),
    "is_24_hours" BOOLEAN NOT NULL DEFAULT false,
    "pickup_enabled" BOOLEAN NOT NULL DEFAULT false,
    "delivery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "contact_override" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "branch_marketplace_settings_pkey" PRIMARY KEY ("branch_marketplace_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_profiles_shop_id_key"
  ON "marketplace_profiles"("shop_id");

CREATE INDEX IF NOT EXISTS "marketplace_profiles_shop_id_idx"
  ON "marketplace_profiles"("shop_id");

CREATE INDEX IF NOT EXISTS "marketplace_profiles_marketplace_status_idx"
  ON "marketplace_profiles"("marketplace_status");

CREATE UNIQUE INDEX IF NOT EXISTS "branch_marketplace_settings_branch_id_key"
  ON "branch_marketplace_settings"("branch_id");

CREATE INDEX IF NOT EXISTS "branch_marketplace_settings_marketplace_profile_id_idx"
  ON "branch_marketplace_settings"("marketplace_profile_id");

CREATE INDEX IF NOT EXISTS "branch_marketplace_settings_branch_id_idx"
  ON "branch_marketplace_settings"("branch_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'marketplace_profiles_shop_id_fkey'
  ) THEN
    ALTER TABLE "marketplace_profiles"
    ADD CONSTRAINT "marketplace_profiles_shop_id_fkey"
    FOREIGN KEY ("shop_id")
    REFERENCES "shops"("shop_id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branch_marketplace_settings_branch_id_fkey'
  ) THEN
    ALTER TABLE "branch_marketplace_settings"
    ADD CONSTRAINT "branch_marketplace_settings_branch_id_fkey"
    FOREIGN KEY ("branch_id")
    REFERENCES "branches"("branch_id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branch_marketplace_settings_marketplace_profile_id_fkey'
  ) THEN
    ALTER TABLE "branch_marketplace_settings"
    ADD CONSTRAINT "branch_marketplace_settings_marketplace_profile_id_fkey"
    FOREIGN KEY ("marketplace_profile_id")
    REFERENCES "marketplace_profiles"("marketplace_profile_id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;