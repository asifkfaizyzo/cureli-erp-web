-- backend/prisma/migrations/20260312073224_add_login_otp_hash/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "login_otp_hash" TEXT;
