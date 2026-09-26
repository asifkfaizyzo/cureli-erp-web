-- backend/prisma/migrations/20260720060040_prescription_request_marketplace/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "PrescriptionRequestStatus" AS ENUM ('PENDING', 'PARTIALLY_RESPONDED', 'FULLY_RESPONDED', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PrescriptionRecipientStatus" AS ENUM ('SENT', 'QUOTE_SENT', 'DECLINED', 'ACCEPTED', 'CONVERTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "prescription_requests" (
    "request_id" UUID NOT NULL,
    "request_number" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "delivery_address_id" UUID,
    "delivery_address_snapshot" JSONB NOT NULL,
    "search_latitude" DECIMAL(10,8),
    "search_longitude" DECIMAL(11,8),
    "status" "PrescriptionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "prescription_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "prescription_request_files" (
    "file_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6),
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_request_files_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "prescription_request_recipients" (
    "recipient_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "branch_name_snapshot" VARCHAR(200) NOT NULL,
    "shop_name_snapshot" VARCHAR(200) NOT NULL,
    "branch_distance_km" DECIMAL(10,2),
    "status" "PrescriptionRecipientStatus" NOT NULL DEFAULT 'SENT',
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quote_sent_at" TIMESTAMPTZ(6),
    "quote_expires_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "converted_at" TIMESTAMPTZ(6),
    "declined_at" TIMESTAMPTZ(6),
    "expired_at" TIMESTAMPTZ(6),
    "decline_reason" VARCHAR(300),
    "converted_order_id" UUID,

    CONSTRAINT "prescription_request_recipients_pkey" PRIMARY KEY ("recipient_id")
);

-- CreateTable
CREATE TABLE "prescription_quote_items" (
    "quote_item_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
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
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_substitute" BOOLEAN NOT NULL DEFAULT false,
    "substitute_note" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_quote_items_pkey" PRIMARY KEY ("quote_item_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prescription_requests_request_number_key" ON "prescription_requests"("request_number");

-- CreateIndex
CREATE INDEX "prescription_requests_customer_id_status_idx" ON "prescription_requests"("customer_id", "status");

-- CreateIndex
CREATE INDEX "prescription_requests_customer_id_created_at_idx" ON "prescription_requests"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "prescription_requests_status_created_at_idx" ON "prescription_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "prescription_requests_status_expires_at_idx" ON "prescription_requests"("status", "expires_at");

-- CreateIndex
CREATE INDEX "prescription_request_files_request_id_idx" ON "prescription_request_files"("request_id");

-- CreateIndex
CREATE INDEX "prescription_request_files_deleted_at_idx" ON "prescription_request_files"("deleted_at");

-- CreateIndex
CREATE INDEX "prescription_request_files_uploaded_at_deleted_at_idx" ON "prescription_request_files"("uploaded_at", "deleted_at");

-- CreateIndex
CREATE INDEX "prescription_request_recipients_request_id_status_idx" ON "prescription_request_recipients"("request_id", "status");

-- CreateIndex
CREATE INDEX "prescription_request_recipients_shop_id_status_idx" ON "prescription_request_recipients"("shop_id", "status");

-- CreateIndex
CREATE INDEX "prescription_request_recipients_branch_id_status_idx" ON "prescription_request_recipients"("branch_id", "status");

-- CreateIndex
CREATE INDEX "prescription_request_recipients_status_quote_expires_at_idx" ON "prescription_request_recipients"("status", "quote_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_request_recipients_request_id_branch_id_key" ON "prescription_request_recipients"("request_id", "branch_id");

-- CreateIndex
CREATE INDEX "prescription_quote_items_recipient_id_idx" ON "prescription_quote_items"("recipient_id");

-- CreateIndex
CREATE INDEX "prescription_quote_items_listing_id_idx" ON "prescription_quote_items"("listing_id");

-- AddForeignKey
ALTER TABLE "prescription_requests" ADD CONSTRAINT "prescription_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "cureli_mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_requests" ADD CONSTRAINT "prescription_requests_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "cureli_mobile_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_request_files" ADD CONSTRAINT "prescription_request_files_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "prescription_requests"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_request_recipients" ADD CONSTRAINT "prescription_request_recipients_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "prescription_requests"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_request_recipients" ADD CONSTRAINT "prescription_request_recipients_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_request_recipients" ADD CONSTRAINT "prescription_request_recipients_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_quote_items" ADD CONSTRAINT "prescription_quote_items_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "prescription_request_recipients"("recipient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_quote_items" ADD CONSTRAINT "prescription_quote_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("listing_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_quote_items" ADD CONSTRAINT "prescription_quote_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_quote_items" ADD CONSTRAINT "prescription_quote_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "master_medicine_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
