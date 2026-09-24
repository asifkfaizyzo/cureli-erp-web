-- backend/prisma/migrations/20260921105308_init_fleet_pricing_and_incentives/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `base_fee` on the `deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `bonus_fee` on the `deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `distance_fee` on the `deliveries` table. All the data in the column will be lost.
  - You are about to drop the `delivery_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `delivery_incentives` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `delivery_shifts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `delivery_surge_rules` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "IncentiveMetricType" AS ENUM ('ORDER_COUNT', 'BASE_EARNINGS');

-- CreateEnum
CREATE TYPE "IncentivePeriodType" AS ENUM ('DAILY', 'WEEKLY', 'CUSTOM_PERIOD');

-- CreateEnum
CREATE TYPE "SurgeCalculationType" AS ENUM ('MULTIPLIER', 'FLAT_ADDITION');

-- CreateEnum
CREATE TYPE "DistanceLegType" AS ENUM ('LEG_1_PICKUP', 'LEG_2_DROP');

-- CreateEnum
CREATE TYPE "SlabRateType" AS ENUM ('FLAT_FIXED', 'PER_KM');

-- CreateEnum
CREATE TYPE "PricingConfigStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "deliveries" DROP COLUMN "base_fee",
DROP COLUMN "bonus_fee",
DROP COLUMN "distance_fee",
ADD COLUMN     "drop_distance_km" DECIMAL(10,2),
ADD COLUMN     "drop_fee" DECIMAL(10,2),
ADD COLUMN     "floor_topup_fee" DECIMAL(10,2),
ADD COLUMN     "pickup_distance_km" DECIMAL(10,2),
ADD COLUMN     "pickup_fee" DECIMAL(10,2),
ADD COLUMN     "pricing_config_id" UUID,
ADD COLUMN     "surge_rule_id" UUID;

-- DropTable
DROP TABLE "delivery_config";

-- DropTable
DROP TABLE "delivery_incentives";

-- DropTable
DROP TABLE "delivery_shifts";

-- DropTable
DROP TABLE "delivery_surge_rules";

-- CreateTable
CREATE TABLE "rider_pricing_configs" (
    "config_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR(100) NOT NULL,
    "status" "PricingConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "min_floor_payout" DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    "pickup_base_fee" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "drop_base_fee" DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    "effective_from" TIMESTAMPTZ(6) NOT NULL,
    "effective_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "rider_pricing_configs_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "pricing_distance_slabs" (
    "slab_id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "leg_type" "DistanceLegType" NOT NULL,
    "from_km" DECIMAL(6,2) NOT NULL,
    "to_km" DECIMAL(6,2),
    "rate_type" "SlabRateType" NOT NULL DEFAULT 'PER_KM',
    "rate" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_distance_slabs_pkey" PRIMARY KEY ("slab_id")
);

-- CreateTable
CREATE TABLE "rider_surge_rules" (
    "rule_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "calc_type" "SurgeCalculationType" NOT NULL DEFAULT 'MULTIPLIER',
    "value" DECIMAL(10,2) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "activated_at" TIMESTAMPTZ(6),
    "activated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rider_surge_rules_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "incentive_templates" (
    "template_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "period_type" "IncentivePeriodType" NOT NULL DEFAULT 'DAILY',
    "metric_type" "IncentiveMetricType" NOT NULL DEFAULT 'ORDER_COUNT',
    "min_online_hours" DECIMAL(4,2),
    "max_denial_count" INTEGER,
    "max_cancellation_count" INTEGER,
    "min_acceptance_rate" DECIMAL(5,2),
    "min_completion_rate" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "incentive_templates_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "incentive_tiers" (
    "tier_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "tier_level" INTEGER NOT NULL,
    "target_value" DECIMAL(10,2) NOT NULL,
    "reward_amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "incentive_tiers_pkey" PRIMARY KEY ("tier_id")
);

-- CreateTable
CREATE TABLE "incentive_schedules" (
    "schedule_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "custom_tag" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "incentive_schedules_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateIndex
CREATE INDEX "rider_pricing_configs_status_effective_from_idx" ON "rider_pricing_configs"("status", "effective_from");

-- CreateIndex
CREATE INDEX "pricing_distance_slabs_config_id_leg_type_idx" ON "pricing_distance_slabs"("config_id", "leg_type");

-- CreateIndex
CREATE INDEX "rider_surge_rules_is_active_idx" ON "rider_surge_rules"("is_active");

-- CreateIndex
CREATE INDEX "incentive_templates_is_active_period_type_idx" ON "incentive_templates"("is_active", "period_type");

-- CreateIndex
CREATE INDEX "incentive_tiers_template_id_idx" ON "incentive_tiers"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "incentive_tiers_template_id_tier_level_key" ON "incentive_tiers"("template_id", "tier_level");

-- CreateIndex
CREATE INDEX "incentive_schedules_start_date_end_date_is_active_idx" ON "incentive_schedules"("start_date", "end_date", "is_active");

-- AddForeignKey
ALTER TABLE "pricing_distance_slabs" ADD CONSTRAINT "pricing_distance_slabs_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "rider_pricing_configs"("config_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_tiers" ADD CONSTRAINT "incentive_tiers_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "incentive_templates"("template_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_schedules" ADD CONSTRAINT "incentive_schedules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "incentive_templates"("template_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_pricing_config_id_fkey" FOREIGN KEY ("pricing_config_id") REFERENCES "rider_pricing_configs"("config_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_surge_rule_id_fkey" FOREIGN KEY ("surge_rule_id") REFERENCES "rider_surge_rules"("rule_id") ON DELETE SET NULL ON UPDATE CASCADE;
