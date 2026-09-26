-- backend/prisma/migrations/20251123182721_f/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_login_after_verification" BOOLEAN NOT NULL DEFAULT false;
