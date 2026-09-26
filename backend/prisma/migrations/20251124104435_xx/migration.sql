-- backend/prisma/migrations/20251124104435_xx/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "login_otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "login_otp_expires" TIMESTAMPTZ(6),
ADD COLUMN     "login_verification_id" TEXT;
