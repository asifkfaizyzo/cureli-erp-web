-- backend/prisma/migrations/20260714052301_add_checkout_session_and_pricing_config/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "checkout_session_id" UUID,
ADD COLUMN     "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "distance_km" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "km_surcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "razorpay_order_id" VARCHAR(100),
ADD COLUMN     "razorpay_payment_id" VARCHAR(100),
ADD COLUMN     "razorpay_signature" VARCHAR(500),
ADD COLUMN     "service_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tip" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "session_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "razorpay_order_id" VARCHAR(100) NOT NULL,
    "cart_snapshot" JSONB NOT NULL,
    "delivery_address_id" UUID,
    "delivery_address_snapshot" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "service_charge" DECIMAL(10,2) NOT NULL,
    "delivery_fee" DECIMAL(10,2) NOT NULL,
    "km_surcharge" DECIMAL(10,2) NOT NULL,
    "tip" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(10,2) NOT NULL,
    "distance_km" DECIMAL(10,2) NOT NULL,
    "prescription_files" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'created',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),
    "order_id" UUID,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "delivery_pricing_config" (
    "config_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "service_tier_1_max" DECIMAL(10,2) NOT NULL DEFAULT 999.99,
    "service_tier_1_charge" DECIMAL(10,2) NOT NULL DEFAULT 20,
    "service_tier_2_max" DECIMAL(10,2) NOT NULL DEFAULT 1999.99,
    "service_tier_2_charge" DECIMAL(10,2) NOT NULL DEFAULT 15,
    "service_tier_3_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_tier_1_max" DECIMAL(10,2) NOT NULL DEFAULT 299.99,
    "delivery_tier_1_charge" DECIMAL(10,2) NOT NULL DEFAULT 60,
    "delivery_tier_2_max" DECIMAL(10,2) NOT NULL DEFAULT 999.99,
    "delivery_tier_2_charge" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "delivery_tier_3_max" DECIMAL(10,2) NOT NULL DEFAULT 1999.99,
    "delivery_tier_3_charge" DECIMAL(10,2) NOT NULL DEFAULT 40,
    "delivery_tier_4_charge" DECIMAL(10,2) NOT NULL DEFAULT 30,
    "free_km_radius" DECIMAL(10,2) NOT NULL DEFAULT 3.0,
    "per_km_tier_1_max" DECIMAL(10,2) NOT NULL DEFAULT 999.99,
    "per_km_tier_1_rate" DECIMAL(10,2) NOT NULL DEFAULT 15,
    "per_km_tier_2_rate" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "max_delivery_km" DECIMAL(10,2),
    "tip_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "delivery_pricing_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_razorpay_order_id_key" ON "checkout_sessions"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_order_id_key" ON "checkout_sessions"("order_id");

-- CreateIndex
CREATE INDEX "checkout_sessions_customer_id_status_idx" ON "checkout_sessions"("customer_id", "status");

-- CreateIndex
CREATE INDEX "checkout_sessions_razorpay_order_id_idx" ON "checkout_sessions"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "checkout_sessions_status_expires_at_idx" ON "checkout_sessions"("status", "expires_at");

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "cureli_mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;
