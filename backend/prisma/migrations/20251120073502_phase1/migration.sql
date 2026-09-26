-- backend/prisma/migrations/20251120073502_phase1/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending_setup';
