-- backend/prisma/migrations/20260421080404_ticket_activities_unified_timeline/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the column `admin_notes` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `cancellation_reason` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `cancelled_by_id` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `reopen_reason` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `reopened_at` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `reopened_by_id` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the `ticket_status_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TicketActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'COMMENT', 'REOPENED', 'CANCELLED', 'ATTACHMENT_ADDED');

-- DropForeignKey
ALTER TABLE "ticket_status_history" DROP CONSTRAINT "ticket_status_history_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_cancelled_by_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_reopened_by_id_fkey";

-- DropIndex
DROP INDEX "tickets_branch_id_idx";

-- DropIndex
DROP INDEX "tickets_created_at_idx";

-- DropIndex
DROP INDEX "tickets_shop_id_idx";

-- DropIndex
DROP INDEX "tickets_status_idx";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "admin_notes",
DROP COLUMN "cancellation_reason",
DROP COLUMN "cancelled_by_id",
DROP COLUMN "reopen_reason",
DROP COLUMN "reopened_at",
DROP COLUMN "reopened_by_id",
ADD COLUMN     "activity_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "attachment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancelled_by_user_id" UUID,
ADD COLUMN     "closed_at" TIMESTAMPTZ(6),
ADD COLUMN     "reopened_by_user_id" UUID,
ADD COLUMN     "resolved_at" TIMESTAMPTZ(6);

-- DropTable
DROP TABLE "ticket_status_history";

-- CreateTable
CREATE TABLE "ticket_activities" (
    "activity_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "type" "TicketActivityType" NOT NULL,
    "from_status" "TicketStatus",
    "to_status" "TicketStatus",
    "actor_type" VARCHAR(20) NOT NULL,
    "actor_id" UUID NOT NULL,
    "actor_name" VARCHAR(150) NOT NULL,
    "actor_role" VARCHAR(50),
    "note" TEXT,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_activities_pkey" PRIMARY KEY ("activity_id")
);

-- CreateIndex
CREATE INDEX "ticket_activities_ticket_id_created_at_idx" ON "ticket_activities"("ticket_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "ticket_activities_type_idx" ON "ticket_activities"("type");

-- CreateIndex
CREATE INDEX "ticket_activities_actor_id_idx" ON "ticket_activities"("actor_id");

-- CreateIndex
CREATE INDEX "tickets_shop_id_status_created_at_idx" ON "tickets"("shop_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "tickets_branch_id_status_idx" ON "tickets"("branch_id", "status");

-- CreateIndex
CREATE INDEX "tickets_status_created_at_idx" ON "tickets"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "tickets_cancelled_by_user_id_idx" ON "tickets"("cancelled_by_user_id");

-- CreateIndex
CREATE INDEX "tickets_reopened_by_user_id_idx" ON "tickets"("reopened_by_user_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_cancelled_by_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reopened_by_user_id_fkey" FOREIGN KEY ("reopened_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;
