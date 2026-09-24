-- backend/prisma/migrations/20260207071210_add_purchase_return_fields/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED_GOODS', 'EXPIRED_GOODS', 'WRONG_ITEM_RECEIVED', 'QUALITY_ISSUE', 'EXCESS_STOCK', 'PRICE_DIFFERENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentAdjustmentType" AS ENUM ('CASH_REFUND', 'CREDIT_NOTE', 'OFFSET_NEXT_PURCHASE');

-- CreateEnum
CREATE TYPE "ReturnApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "purchase_invoices" ADD COLUMN     "adjustment_type" "PaymentAdjustmentType",
ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "credit_note_number" VARCHAR(50),
ADD COLUMN     "refund_amount" DECIMAL(12,2),
ADD COLUMN     "refund_notes" TEXT,
ADD COLUMN     "rejected_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejected_by" UUID,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "return_approval_status" "ReturnApprovalStatus",
ADD COLUMN     "return_reason" "ReturnReason",
ADD COLUMN     "return_reason_notes" TEXT;

-- CreateTable
CREATE TABLE "supplier_credits" (
    "credit_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "return_invoice_id" UUID NOT NULL,
    "credit_note_number" VARCHAR(50) NOT NULL,
    "credit_amount" DECIMAL(12,2) NOT NULL,
    "utilized_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "issued_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "supplier_credits_pkey" PRIMARY KEY ("credit_id")
);

-- CreateTable
CREATE TABLE "credit_applications" (
    "application_id" UUID NOT NULL,
    "credit_id" UUID NOT NULL,
    "applied_to_invoice_id" UUID NOT NULL,
    "applied_amount" DECIMAL(12,2) NOT NULL,
    "applied_date" DATE NOT NULL,
    "applied_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_applications_pkey" PRIMARY KEY ("application_id")
);

-- CreateIndex
CREATE INDEX "supplier_credits_shop_id_supplier_id_status_idx" ON "supplier_credits"("shop_id", "supplier_id", "status");

-- CreateIndex
CREATE INDEX "supplier_credits_expiry_date_idx" ON "supplier_credits"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_credits_credit_note_number_key" ON "supplier_credits"("credit_note_number");

-- CreateIndex
CREATE INDEX "credit_applications_credit_id_idx" ON "credit_applications"("credit_id");

-- CreateIndex
CREATE INDEX "credit_applications_applied_to_invoice_id_idx" ON "credit_applications"("applied_to_invoice_id");

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_credits" ADD CONSTRAINT "supplier_credits_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_credits" ADD CONSTRAINT "supplier_credits_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_credits" ADD CONSTRAINT "supplier_credits_return_invoice_id_fkey" FOREIGN KEY ("return_invoice_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "supplier_credits"("credit_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_applied_to_invoice_id_fkey" FOREIGN KEY ("applied_to_invoice_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_applied_by_fkey" FOREIGN KEY ("applied_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
