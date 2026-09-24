-- backend/prisma/migrations/20260202055024_remove_stockledger_purchaseinvoice_fk/migration.sql (do not remove this comment)
-- DropForeignKey
ALTER TABLE "stock_ledger" DROP CONSTRAINT "stock_ledger_reference_id_fkey";
