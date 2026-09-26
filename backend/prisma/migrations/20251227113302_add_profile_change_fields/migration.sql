-- backend/prisma/migrations/20251227113302_add_profile_change_fields/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_change_expires" TIMESTAMPTZ(6),
ADD COLUMN     "email_change_new_email" TEXT,
ADD COLUMN     "email_change_otp_hash" TEXT,
ADD COLUMN     "email_change_verification_id" TEXT,
ADD COLUMN     "phone_change_expires" TIMESTAMPTZ(6),
ADD COLUMN     "phone_change_new_number" TEXT,
ADD COLUMN     "phone_change_old_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone_change_verification_id" TEXT;
