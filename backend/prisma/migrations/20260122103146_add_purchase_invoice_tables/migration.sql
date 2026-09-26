-- backend/prisma/migrations/20260122103146_add_purchase_invoice_tables/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "purchase_invoices" (
    "invoice_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "supplier_invoice_no" VARCHAR(50),
    "shop_id" UUID NOT NULL,
    "branch_id" UUID,
    "supplier_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "confirmed_by" UUID,
    "parent_invoice_id" UUID,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE,
    "received_date" DATE,
    "confirmed_at" TIMESTAMPTZ(6),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxable_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "round_off" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_mode" VARCHAR(50),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "is_return" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "transport_charges" DECIMAL(10,2),
    "other_charges" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "purchase_invoice_items" (
    "item_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "expiry_date" DATE NOT NULL,
    "manufacturing_date" DATE,
    "quantity" DECIMAL(10,2) NOT NULL,
    "free_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pack_size" VARCHAR(50),
    "unit_of_measure" TEXT NOT NULL DEFAULT 'UNIT',
    "purchase_rate" DECIMAL(10,2) NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "scheme_discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "trade_discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxable_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cgst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sgst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "igst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "selling_rate" DECIMAL(10,2),
    "margin_percent" DECIMAL(5,2),
    "rack_no" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_invoice_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "purchase_payments" (
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_mode" VARCHAR(50) NOT NULL,
    "reference_number" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE INDEX "purchase_invoices_shop_id_invoice_date_idx" ON "purchase_invoices"("shop_id", "invoice_date");

-- CreateIndex
CREATE INDEX "purchase_invoices_supplier_id_invoice_date_idx" ON "purchase_invoices"("supplier_id", "invoice_date");

-- CreateIndex
CREATE INDEX "purchase_invoices_shop_id_status_idx" ON "purchase_invoices"("shop_id", "status");

-- CreateIndex
CREATE INDEX "purchase_invoices_shop_id_payment_status_idx" ON "purchase_invoices"("shop_id", "payment_status");

-- CreateIndex
CREATE INDEX "purchase_invoices_branch_id_idx" ON "purchase_invoices"("branch_id");

-- CreateIndex
CREATE INDEX "purchase_invoices_created_at_idx" ON "purchase_invoices"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoices_shop_id_invoice_number_key" ON "purchase_invoices"("shop_id", "invoice_number");

-- CreateIndex
CREATE INDEX "purchase_invoice_items_invoice_id_idx" ON "purchase_invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "purchase_invoice_items_medicine_id_idx" ON "purchase_invoice_items"("medicine_id");

-- CreateIndex
CREATE INDEX "purchase_invoice_items_batch_number_idx" ON "purchase_invoice_items"("batch_number");

-- CreateIndex
CREATE INDEX "purchase_invoice_items_expiry_date_idx" ON "purchase_invoice_items"("expiry_date");

-- CreateIndex
CREATE INDEX "purchase_payments_invoice_id_idx" ON "purchase_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "purchase_payments_shop_id_payment_date_idx" ON "purchase_payments"("shop_id", "payment_date");

-- CreateIndex
CREATE INDEX "purchase_payments_supplier_id_idx" ON "purchase_payments"("supplier_id");

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_parent_invoice_id_fkey" FOREIGN KEY ("parent_invoice_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
