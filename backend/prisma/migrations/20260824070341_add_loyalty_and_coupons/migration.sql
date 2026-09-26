-- backend/prisma/migrations/20260824070341_add_loyalty_and_coupons/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('FLAT', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "coupon_code" VARCHAR(50),
ADD COLUMN     "coupon_discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "loyalty_discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "loyalty_points_redeemed" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "cureli_mobile_users" ADD COLUMN     "loyalty_points_balance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "coupon_code" VARCHAR(50),
ADD COLUMN     "coupon_discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "loyalty_discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "loyalty_points_earned" INTEGER,
ADD COLUMN     "loyalty_points_redeemed" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "loyalty_config" (
    "config_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "earn_rate_amount" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "earn_basis" VARCHAR(20) NOT NULL DEFAULT 'SUBTOTAL',
    "redemption_value" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "min_redeem_points" INTEGER NOT NULL DEFAULT 50,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 299,
    "max_redeem_points" INTEGER,
    "max_redeem_percent" DECIMAL(5,2),
    "points_expiry_days" INTEGER,
    "updated_by_cadmin_id" UUID,
    "updated_by_name" VARCHAR(100),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "transaction_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "order_id" UUID,
    "description" VARCHAR(300) NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "coupon_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(300),
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "max_discount" DECIMAL(10,2),
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_uses_total" INTEGER,
    "max_uses_per_user" INTEGER DEFAULT 1,
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_used" INTEGER NOT NULL DEFAULT 0,
    "created_by_cadmin_id" UUID,
    "created_by_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "usage_id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("usage_id")
);

-- CreateIndex
CREATE INDEX "loyalty_transactions_customer_id_created_at_idx" ON "loyalty_transactions"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "loyalty_transactions_customer_id_type_idx" ON "loyalty_transactions"("customer_id", "type");

-- CreateIndex
CREATE INDEX "loyalty_transactions_order_id_idx" ON "loyalty_transactions"("order_id");

-- CreateIndex
CREATE INDEX "loyalty_transactions_expires_at_is_expired_idx" ON "loyalty_transactions"("expires_at", "is_expired");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_is_active_valid_from_valid_until_idx" ON "coupons"("is_active", "valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");

-- CreateIndex
CREATE INDEX "coupon_usages_customer_id_coupon_id_idx" ON "coupon_usages"("customer_id", "coupon_id");

-- CreateIndex
CREATE INDEX "coupon_usages_order_id_idx" ON "coupon_usages"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_coupon_id_order_id_key" ON "coupon_usages"("coupon_id", "order_id");

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "cureli_mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "cureli_mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;
