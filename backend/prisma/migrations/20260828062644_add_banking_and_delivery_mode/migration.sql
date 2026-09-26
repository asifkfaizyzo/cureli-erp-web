-- backend/prisma/migrations/20260828062644_add_banking_and_delivery_mode/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('CURELI', 'SELF');

-- AlterTable
ALTER TABLE "branch_marketplace_settings" ADD COLUMN     "delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'CURELI';

-- AlterTable
ALTER TABLE "marketplace_profiles" ADD COLUMN     "bank_account_holder" VARCHAR(200),
ADD COLUMN     "bank_account_number" VARCHAR(30),
ADD COLUMN     "bank_branch_name" VARCHAR(200),
ADD COLUMN     "bank_ifsc" VARCHAR(11),
ADD COLUMN     "bank_mmid" VARCHAR(20),
ADD COLUMN     "bank_name" VARCHAR(200),
ADD COLUMN     "bank_vpa" VARCHAR(100);
