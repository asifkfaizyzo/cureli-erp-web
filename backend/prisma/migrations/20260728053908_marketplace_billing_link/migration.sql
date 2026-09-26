-- backend/prisma/migrations/20260728053908_marketplace_billing_link/migration.sql (do not remove this comment)
/*
  Warnings:

  - A unique constraint covering the columns `[sales_invoice_id]` on the table `marketplace_orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "invoice_generated_at" TIMESTAMPTZ(6),
ADD COLUMN     "invoice_pdf_key" VARCHAR(500),
ADD COLUMN     "sales_invoice_id" UUID;

-- AlterTable
ALTER TABLE "sales_invoices" ADD COLUMN     "sale_channel" VARCHAR(20) NOT NULL DEFAULT 'COUNTER';

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_orders_sales_invoice_id_key" ON "marketplace_orders"("sales_invoice_id");

-- CreateIndex
CREATE INDEX "sales_invoices_sale_channel_idx" ON "sales_invoices"("sale_channel");

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_sales_invoice_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "sales_invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;
