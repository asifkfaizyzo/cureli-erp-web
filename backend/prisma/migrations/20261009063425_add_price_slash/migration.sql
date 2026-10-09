-- CreateEnum
CREATE TYPE "SlashMode" AS ENUM ('NONE', 'NEW', 'OLD');

-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "delivery_charge_anchor" DECIMAL(10,2),
ADD COLUMN     "platform_savings" DECIMAL(10,2),
ADD COLUMN     "service_charge_anchor" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "delivery_charge_anchor" DECIMAL(10,2),
ADD COLUMN     "platform_savings" DECIMAL(10,2),
ADD COLUMN     "service_charge_anchor" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "slash_display_config" (
    "config_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "service_mode" "SlashMode" NOT NULL DEFAULT 'NONE',
    "service_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "delivery_mode" "SlashMode" NOT NULL DEFAULT 'NONE',
    "delivery_tiers" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "slash_display_config_pkey" PRIMARY KEY ("config_id")
);
