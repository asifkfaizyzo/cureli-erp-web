-- backend/prisma/migrations/20251124095326_xx/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token" VARCHAR(500),
ADD COLUMN     "reset_token_expires" TIMESTAMPTZ(6);
