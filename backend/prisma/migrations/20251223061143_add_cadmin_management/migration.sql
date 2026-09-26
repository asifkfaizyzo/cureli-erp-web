-- backend/prisma/migrations/20251223061143_add_cadmin_management/migration.sql (do not remove this comment)
/*
  Warnings:

  - Added the required column `name` to the `cadmins` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CAdminRole" AS ENUM ('SUPER_ADMIN', 'ANALYST', 'ACCOUNTING');

-- AlterTable
ALTER TABLE "cadmins" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "role" "CAdminRole" NOT NULL DEFAULT 'SUPER_ADMIN';

-- CreateTable
CREATE TABLE "cadmin_activity_logs" (
    "id" UUID NOT NULL,
    "cadmin_id" UUID NOT NULL,
    "performed_by_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "changes" JSONB,
    "meta" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cadmin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cadmin_activity_logs_cadmin_id_idx" ON "cadmin_activity_logs"("cadmin_id");

-- CreateIndex
CREATE INDEX "cadmin_activity_logs_action_idx" ON "cadmin_activity_logs"("action");

-- CreateIndex
CREATE INDEX "cadmin_activity_logs_created_at_idx" ON "cadmin_activity_logs"("created_at");

-- AddForeignKey
ALTER TABLE "cadmin_activity_logs" ADD CONSTRAINT "cadmin_activity_logs_cadmin_id_fkey" FOREIGN KEY ("cadmin_id") REFERENCES "cadmins"("cadmin_id") ON DELETE CASCADE ON UPDATE CASCADE;
