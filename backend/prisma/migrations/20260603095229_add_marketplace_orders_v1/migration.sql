-- backend/prisma/migrations/20260603095229_add_marketplace_orders_v1/migration.sql (do not remove this comment)
CREATE SEQUENCE IF NOT EXISTS marketplace_order_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- CreateEnum
CREATE TYPE "MarketplaceOrderStatus" AS ENUM ('PLACED', 'ACCEPTED', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED', 'CANCELLED');



-- CreateTable
CREATE TABLE "marketplace_orders" (
    "order_id" UUID NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "delivery_address_id" UUID,
    "delivery_address_snapshot" JSONB NOT NULL,
    "customer_name_snapshot" VARCHAR(200) NOT NULL,
    "customer_phone_snapshot" VARCHAR(15) NOT NULL,
    "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'PLACED',
    "payment_method" VARCHAR(30) NOT NULL DEFAULT 'COD',
    "payment_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(500),
    "rejection_reason" VARCHAR(50),
    "rejection_reason_other" VARCHAR(300),
    "cancelled_by" VARCHAR(20),
    "auto_completed" BOOLEAN NOT NULL DEFAULT false,
    "placed_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "ready_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "marketplace_order_items" (
    "item_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "medicine_name_snapshot" VARCHAR(500) NOT NULL,
    "variant_sku_snapshot" VARCHAR(50) NOT NULL,
    "brand_snapshot" VARCHAR(350),
    "pack_size_snapshot" VARCHAR(100),
    "unit_price_snapshot" DECIMAL(10,2) NOT NULL,
    "mrp_snapshot" DECIMAL(10,2) NOT NULL,
    "requires_prescription_snapshot" BOOLEAN NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "marketplace_order_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "marketplace_order_prescriptions" (
    "prescription_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_order_prescriptions_pkey" PRIMARY KEY ("prescription_id")
);

-- CreateTable
CREATE TABLE "marketplace_order_status_history" (
    "history_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "MarketplaceOrderStatus",
    "to_status" "MarketplaceOrderStatus" NOT NULL,
    "changed_by_type" VARCHAR(20) NOT NULL,
    "changed_by_id" UUID,
    "reason" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_order_status_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_orders_order_number_key" ON "marketplace_orders"("order_number");

-- CreateIndex
CREATE INDEX "marketplace_orders_shop_id_status_idx" ON "marketplace_orders"("shop_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_orders_customer_id_placed_at_idx" ON "marketplace_orders"("customer_id", "placed_at" DESC);

-- CreateIndex
CREATE INDEX "marketplace_orders_branch_id_status_placed_at_idx" ON "marketplace_orders"("branch_id", "status", "placed_at" DESC);

-- CreateIndex
CREATE INDEX "marketplace_orders_shop_id_placed_at_idx" ON "marketplace_orders"("shop_id", "placed_at" DESC);

-- CreateIndex
CREATE INDEX "marketplace_orders_status_ready_at_idx" ON "marketplace_orders"("status", "ready_at");

-- CreateIndex
CREATE INDEX "marketplace_order_items_order_id_idx" ON "marketplace_order_items"("order_id");

-- CreateIndex
CREATE INDEX "marketplace_order_items_listing_id_idx" ON "marketplace_order_items"("listing_id");

-- CreateIndex
CREATE INDEX "marketplace_order_items_medicine_id_idx" ON "marketplace_order_items"("medicine_id");

-- CreateIndex
CREATE INDEX "marketplace_order_items_variant_id_idx" ON "marketplace_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "marketplace_order_prescriptions_order_id_idx" ON "marketplace_order_prescriptions"("order_id");

-- CreateIndex
CREATE INDEX "marketplace_order_status_history_order_id_created_at_idx" ON "marketplace_order_status_history"("order_id", "created_at" ASC);

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "cureli_mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "cureli_mobile_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("listing_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "master_medicine_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_prescriptions" ADD CONSTRAINT "marketplace_order_prescriptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_status_history" ADD CONSTRAINT "marketplace_order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
