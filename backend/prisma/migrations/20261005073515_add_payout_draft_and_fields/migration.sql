/*
  Warnings:

  - The values [PHARMACY_CONFIRMED] on the enum `DeliveryStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[rider_id,week_start]` on the table `rider_payouts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `net_amount` to the `rider_payouts` table without a default value. This is not possible if the table is not empty.

*/

-- AlterEnum: Safely recreate DeliveryStatus to drop PHARMACY_CONFIRMED
BEGIN;
CREATE TYPE "DeliveryStatus_new" AS ENUM ('PENDING_ASSIGNMENT', 'RIDER_NOTIFIED', 'ACCEPTED', 'ARRIVED_AT_PHARMACY', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED_AT_CUSTOMER', 'DELIVERED', 'FAILED', 'CANCELLED');
ALTER TABLE "public"."deliveries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "deliveries" ALTER COLUMN "status" TYPE "DeliveryStatus_new" USING ("status"::text::"DeliveryStatus_new");
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
ALTER TYPE "DeliveryStatus_new" RENAME TO "DeliveryStatus";
DROP TYPE "public"."DeliveryStatus_old";
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DEFAULT 'PENDING_ASSIGNMENT';
COMMIT;

-- AlterEnum: Safely recreate PayoutStatus to add DRAFT (prevents unsafe transactional enum usage crash)
BEGIN;
CREATE TYPE "PayoutStatus_new" AS ENUM ('DRAFT', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
ALTER TABLE "rider_payouts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "rider_payouts" ALTER COLUMN "status" TYPE "PayoutStatus_new" USING ("status"::text::"PayoutStatus_new");
ALTER TYPE "PayoutStatus" RENAME TO "PayoutStatus_old";
ALTER TYPE "PayoutStatus_new" RENAME TO "PayoutStatus";
DROP TYPE "PayoutStatus_old";
COMMIT;

-- AlterTable: Apply table updates with safe column addition and status defaults
ALTER TABLE "rider_payouts" ADD COLUMN     "breakdown_snapshot" JSONB,
ADD COLUMN     "deductions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "finalized_at" TIMESTAMPTZ(6),
ADD COLUMN     "internal_notes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "is_finalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_refreshed_at" TIMESTAMPTZ(6),
ADD COLUMN     "net_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "refreshed_by" UUID,
ALTER COLUMN "status" SET DEFAULT 'DRAFT',
ALTER COLUMN "bank_snapshot" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rider_payouts_rider_id_week_start_key" ON "rider_payouts"("rider_id", "week_start");