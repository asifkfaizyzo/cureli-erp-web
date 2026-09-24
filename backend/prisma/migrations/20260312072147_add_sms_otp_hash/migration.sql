-- backend/prisma/migrations/20260312072147_add_sms_otp_hash/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `sms_transaction_id` on the `pending_users` table. All the data in the column will be lost.
  - You are about to drop the column `sms_verification_id` on the `pending_users` table. All the data in the column will be lost.
  - You are about to drop the column `email_change_verification_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `login_verification_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_change_verification_id` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pending_users" DROP COLUMN "sms_transaction_id",
DROP COLUMN "sms_verification_id",
ADD COLUMN     "sms_otp_hash" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email_change_verification_id",
DROP COLUMN "login_verification_id",
DROP COLUMN "phone_change_verification_id",
ADD COLUMN     "phone_change_otp_hash" TEXT;
