-- backend/prisma/migrations/20251230054840_add_reopen_reason_to_tickets/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "reopen_reason" TEXT;
