/*
  Warnings:

  - A unique constraint covering the columns `[fulfillment_type]` on the table `delivery_pricing_config` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('INSTANT_DELIVERY', 'PICKUP', 'SAME_DAY', 'NEXT_DAY');

-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "fulfillment_type" VARCHAR(30) NOT NULL DEFAULT 'INSTANT_DELIVERY',
ADD COLUMN     "packing_charge" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "delivery_pricing_config" ADD COLUMN     "delivery_fee_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fulfillment_type" "FulfillmentType" NOT NULL DEFAULT 'INSTANT_DELIVERY',
ADD COLUMN     "km_surcharge_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "packing_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packing_tier_1_charge" DECIMAL(10,2) NOT NULL DEFAULT 10,
ADD COLUMN     "packing_tier_1_max" DECIMAL(10,2) NOT NULL DEFAULT 999.99,
ADD COLUMN     "packing_tier_2_charge" DECIMAL(10,2) NOT NULL DEFAULT 8,
ADD COLUMN     "packing_tier_2_max" DECIMAL(10,2) NOT NULL DEFAULT 1999.99,
ADD COLUMN     "packing_tier_3_charge" DECIMAL(10,2) NOT NULL DEFAULT 5,
ADD COLUMN     "service_charge_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "fulfillment_type" "FulfillmentType" NOT NULL DEFAULT 'INSTANT_DELIVERY',
ADD COLUMN     "packing_charge" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "delivery_pricing_config_fulfillment_type_key" ON "delivery_pricing_config"("fulfillment_type");

-- CreateIndex
CREATE INDEX "marketplace_orders_fulfillment_type_status_idx" ON "marketplace_orders"("fulfillment_type", "status");
