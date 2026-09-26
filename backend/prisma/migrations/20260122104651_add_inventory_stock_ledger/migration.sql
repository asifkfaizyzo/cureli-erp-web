-- backend/prisma/migrations/20260122104651_add_inventory_stock_ledger/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'PURCHASE_RETURN', 'SALE', 'SALE_RETURN', 'OPENING_STOCK', 'STOCK_ADJUSTMENT', 'DAMAGED', 'EXPIRED', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('PHYSICAL_COUNT_VARIANCE', 'DAMAGED_GOODS', 'EXPIRED_GOODS', 'SYSTEM_CORRECTION', 'THEFT_LOSS', 'OTHER');

-- AlterTable
ALTER TABLE "purchase_invoice_items" ADD COLUMN     "inventory_id" UUID;

-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID,
    "medicine_id" UUID NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "expiry_date" DATE NOT NULL,
    "manufacturing_date" DATE,
    "current_stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reserved_stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "available_stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "minimum_stock" DECIMAL(10,2),
    "last_purchase_rate" DECIMAL(10,2),
    "last_purchase_date" DATE,
    "mrp" DECIMAL(10,2) NOT NULL,
    "selling_rate" DECIMAL(10,2),
    "rack_no" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "stock_ledger" (
    "ledger_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID,
    "medicine_id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "reference_number" VARCHAR(100),
    "batch_number" VARCHAR(50) NOT NULL,
    "expiry_date" DATE NOT NULL,
    "quantity_in" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quantity_out" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quantity_net" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "rate" DECIMAL(10,2),
    "amount" DECIMAL(12,2),
    "remarks" TEXT,
    "transaction_date" DATE NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("ledger_id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "adjustment_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID,
    "medicine_id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "batch_number" VARCHAR(50) NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "reason_notes" TEXT,
    "old_quantity" DECIMAL(10,2) NOT NULL,
    "new_quantity" DECIMAL(10,2) NOT NULL,
    "variance" DECIMAL(10,2) NOT NULL,
    "adjustment_date" DATE NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("adjustment_id")
);

-- CreateIndex
CREATE INDEX "inventory_shop_id_medicine_id_idx" ON "inventory"("shop_id", "medicine_id");

-- CreateIndex
CREATE INDEX "inventory_batch_number_idx" ON "inventory"("batch_number");

-- CreateIndex
CREATE INDEX "inventory_expiry_date_idx" ON "inventory"("expiry_date");

-- CreateIndex
CREATE INDEX "inventory_shop_id_current_stock_idx" ON "inventory"("shop_id", "current_stock");

-- CreateIndex
CREATE INDEX "inventory_is_expired_idx" ON "inventory"("is_expired");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_shop_id_medicine_id_batch_number_branch_id_key" ON "inventory"("shop_id", "medicine_id", "batch_number", "branch_id");

-- CreateIndex
CREATE INDEX "stock_ledger_shop_id_medicine_id_transaction_date_idx" ON "stock_ledger"("shop_id", "medicine_id", "transaction_date");

-- CreateIndex
CREATE INDEX "stock_ledger_inventory_id_transaction_date_idx" ON "stock_ledger"("inventory_id", "transaction_date");

-- CreateIndex
CREATE INDEX "stock_ledger_reference_type_reference_id_idx" ON "stock_ledger"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "stock_ledger_movement_type_idx" ON "stock_ledger"("movement_type");

-- CreateIndex
CREATE INDEX "stock_ledger_batch_number_idx" ON "stock_ledger"("batch_number");

-- CreateIndex
CREATE INDEX "stock_ledger_transaction_date_idx" ON "stock_ledger"("transaction_date");

-- CreateIndex
CREATE INDEX "stock_adjustments_shop_id_adjustment_date_idx" ON "stock_adjustments"("shop_id", "adjustment_date");

-- CreateIndex
CREATE INDEX "stock_adjustments_medicine_id_idx" ON "stock_adjustments"("medicine_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_inventory_id_idx" ON "stock_adjustments"("inventory_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_reason_idx" ON "stock_adjustments"("reason");

-- AddForeignKey
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
