-- backend/prisma/migrations/20260210064231_add_sales_return_approval/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "SalesReturnApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesRefundMode" AS ENUM ('CASH', 'CREDIT', 'ADJUST_NEXT');

-- AlterTable
ALTER TABLE "sales_invoices" ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "credit_note_number" VARCHAR(50),
ADD COLUMN     "refund_amount" DECIMAL(12,2),
ADD COLUMN     "refund_mode" "SalesRefundMode",
ADD COLUMN     "refund_notes" TEXT,
ADD COLUMN     "rejected_at" TIMESTAMPTZ(6),
ADD COLUMN     "rejected_by" UUID,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "return_approval_status" "SalesReturnApprovalStatus";

-- CreateTable
CREATE TABLE "customer_credits" (
    "credit_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
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

    CONSTRAINT "customer_credits_pkey" PRIMARY KEY ("credit_id")
);

-- CreateTable
CREATE TABLE "customer_credit_applications" (
    "application_id" UUID NOT NULL,
    "credit_id" UUID NOT NULL,
    "applied_to_invoice_id" UUID NOT NULL,
    "applied_amount" DECIMAL(12,2) NOT NULL,
    "applied_date" DATE NOT NULL,
    "applied_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_credit_applications_pkey" PRIMARY KEY ("application_id")
);

-- CreateIndex
CREATE INDEX "customer_credits_shop_id_customer_id_status_idx" ON "customer_credits"("shop_id", "customer_id", "status");

-- CreateIndex
CREATE INDEX "customer_credits_expiry_date_idx" ON "customer_credits"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credits_credit_note_number_key" ON "customer_credits"("credit_note_number");

-- CreateIndex
CREATE INDEX "customer_credit_applications_credit_id_idx" ON "customer_credit_applications"("credit_id");

-- CreateIndex
CREATE INDEX "customer_credit_applications_applied_to_invoice_id_idx" ON "customer_credit_applications"("applied_to_invoice_id");

-- CreateIndex
CREATE INDEX "sales_invoices_return_approval_status_idx" ON "sales_invoices"("return_approval_status");

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credits" ADD CONSTRAINT "customer_credits_return_invoice_id_fkey" FOREIGN KEY ("return_invoice_id") REFERENCES "sales_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_applications" ADD CONSTRAINT "customer_credit_applications_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "customer_credits"("credit_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_applications" ADD CONSTRAINT "customer_credit_applications_applied_to_invoice_id_fkey" FOREIGN KEY ("applied_to_invoice_id") REFERENCES "sales_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_applications" ADD CONSTRAINT "customer_credit_applications_applied_by_fkey" FOREIGN KEY ("applied_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
