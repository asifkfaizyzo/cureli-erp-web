-- backend/prisma/migrations/20260207114653_add_sales_module/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "SalesReturnReason" AS ENUM ('EXPIRED_PRODUCT', 'DAMAGED_PRODUCT', 'WRONG_PRODUCT', 'CUSTOMER_REQUEST', 'QUALITY_ISSUE', 'PRICE_DISPUTE', 'OTHER');

-- DropForeignKey
ALTER TABLE "stock_ledger" DROP CONSTRAINT "stock_ledger_reference_id_fkey";

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100),
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(10),
    "gst_number" VARCHAR(15),
    "pan_number" VARCHAR(10),
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_days" INTEGER NOT NULL DEFAULT 0,
    "outstanding_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "customer_ledger" (
    "ledger_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID,
    "transaction_type" VARCHAR(50) NOT NULL,
    "reference_type" VARCHAR(50) NOT NULL,
    "reference_id" UUID,
    "reference_number" VARCHAR(100),
    "debit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "transaction_date" DATE NOT NULL,
    "remarks" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_ledger_pkey" PRIMARY KEY ("ledger_id")
);

-- CreateTable
CREATE TABLE "sales_invoices" (
    "invoice_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID,
    "walkin_name" VARCHAR(200),
    "walkin_phone" VARCHAR(20),
    "shop_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "confirmed_by" UUID,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE,
    "confirmed_at" TIMESTAMPTZ(6),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "item_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "customer_discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "customer_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bill_discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "bill_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxable_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "round_off" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_credit_sale" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "is_return" BOOLEAN NOT NULL DEFAULT false,
    "parent_invoice_id" UUID,
    "return_reason" "SalesReturnReason",
    "return_notes" TEXT,
    "prescription_number" VARCHAR(50),
    "doctor_name" VARCHAR(200),
    "remarks" TEXT,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sales_invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "sales_invoice_items" (
    "item_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "expiry_date" DATE NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_of_measure" VARCHAR(20) NOT NULL DEFAULT 'UNIT',
    "mrp" DECIMAL(10,2) NOT NULL,
    "purchase_rate" DECIMAL(10,2),
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxable_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cgst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sgst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "returned_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sales_invoice_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "sales_payments" (
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_mode" VARCHAR(20) NOT NULL,
    "reference_number" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sales_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE INDEX "customers_shop_id_is_active_idx" ON "customers"("shop_id", "is_active");

-- CreateIndex
CREATE INDEX "customers_shop_id_name_idx" ON "customers"("shop_id", "name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_shop_id_phone_key" ON "customers"("shop_id", "phone");

-- CreateIndex
CREATE INDEX "customer_ledger_customer_id_transaction_date_idx" ON "customer_ledger"("customer_id", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "customer_ledger_shop_id_transaction_date_idx" ON "customer_ledger"("shop_id", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "customer_ledger_reference_type_reference_id_idx" ON "customer_ledger"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "sales_invoices_shop_id_invoice_date_idx" ON "sales_invoices"("shop_id", "invoice_date" DESC);

-- CreateIndex
CREATE INDEX "sales_invoices_branch_id_invoice_date_idx" ON "sales_invoices"("branch_id", "invoice_date" DESC);

-- CreateIndex
CREATE INDEX "sales_invoices_customer_id_invoice_date_idx" ON "sales_invoices"("customer_id", "invoice_date" DESC);

-- CreateIndex
CREATE INDEX "sales_invoices_status_idx" ON "sales_invoices"("status");

-- CreateIndex
CREATE INDEX "sales_invoices_payment_status_idx" ON "sales_invoices"("payment_status");

-- CreateIndex
CREATE INDEX "sales_invoices_is_return_idx" ON "sales_invoices"("is_return");

-- CreateIndex
CREATE INDEX "sales_invoices_created_at_idx" ON "sales_invoices"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoices_shop_id_branch_id_invoice_number_key" ON "sales_invoices"("shop_id", "branch_id", "invoice_number");

-- CreateIndex
CREATE INDEX "sales_invoice_items_invoice_id_idx" ON "sales_invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "sales_invoice_items_medicine_id_idx" ON "sales_invoice_items"("medicine_id");

-- CreateIndex
CREATE INDEX "sales_invoice_items_inventory_id_idx" ON "sales_invoice_items"("inventory_id");

-- CreateIndex
CREATE INDEX "sales_invoice_items_batch_number_idx" ON "sales_invoice_items"("batch_number");

-- CreateIndex
CREATE INDEX "sales_payments_invoice_id_idx" ON "sales_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "sales_payments_shop_id_payment_date_idx" ON "sales_payments"("shop_id", "payment_date" DESC);

-- CreateIndex
CREATE INDEX "sales_payments_branch_id_payment_date_idx" ON "sales_payments"("branch_id", "payment_date" DESC);

-- CreateIndex
CREATE INDEX "sales_payments_customer_id_payment_date_idx" ON "sales_payments"("customer_id", "payment_date" DESC);

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_ledger" ADD CONSTRAINT "customer_ledger_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_parent_invoice_id_fkey" FOREIGN KEY ("parent_invoice_id") REFERENCES "sales_invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_payments" ADD CONSTRAINT "sales_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_payments" ADD CONSTRAINT "sales_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_payments" ADD CONSTRAINT "sales_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;
