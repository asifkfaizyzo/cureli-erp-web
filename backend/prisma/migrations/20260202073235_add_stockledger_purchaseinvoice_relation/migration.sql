-- backend/prisma/migrations/20260202073235_add_stockledger_purchaseinvoice_relation/migration.sql (do not remove this comment)
-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;
