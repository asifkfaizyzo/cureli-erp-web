-- backend/prisma/migrations/20260829093232_add_password_auth_to_mobile_users/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "cureli_mobile_users" ADD COLUMN     "login_provider" VARCHAR(20) NOT NULL DEFAULT 'otp',
ADD COLUMN     "password_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password_hash" VARCHAR(500),
ADD COLUMN     "password_locked_until" TIMESTAMPTZ(6);
