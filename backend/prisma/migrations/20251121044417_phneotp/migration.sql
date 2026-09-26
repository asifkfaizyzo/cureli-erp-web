-- backend/prisma/migrations/20251121044417_phneotp/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `phone_number` on the `pending_users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_otp_expires` on the `pending_users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_otp_hash` on the `pending_users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_verified` on the `pending_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pending_users" DROP COLUMN "phone_number",
DROP COLUMN "phone_otp_expires",
DROP COLUMN "phone_otp_hash",
DROP COLUMN "phone_verified",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "sms_otp_expires" TIMESTAMPTZ,
ADD COLUMN     "sms_transaction_id" TEXT,
ADD COLUMN     "sms_verification_id" TEXT,
ADD COLUMN     "sms_verified" BOOLEAN NOT NULL DEFAULT false;
