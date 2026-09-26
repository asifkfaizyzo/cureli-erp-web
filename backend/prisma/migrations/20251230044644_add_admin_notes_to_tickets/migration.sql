-- backend/prisma/migrations/20251230044644_add_admin_notes_to_tickets/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "admin_notes" TEXT;
