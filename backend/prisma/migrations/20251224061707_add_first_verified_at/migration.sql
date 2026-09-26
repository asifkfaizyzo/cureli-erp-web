-- backend/prisma/migrations/20251224061707_add_first_verified_at/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_verified_at" TIMESTAMPTZ(6);
