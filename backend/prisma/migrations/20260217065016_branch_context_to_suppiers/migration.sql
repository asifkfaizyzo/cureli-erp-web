-- backend/prisma/migrations/20260217065016_branch_context_to_suppiers/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the `daily_send_quotas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_broadcast_campaigns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_unsubscribes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "email_broadcast_campaigns" DROP CONSTRAINT "email_broadcast_campaigns_created_by_fkey";

-- DropTable
DROP TABLE "daily_send_quotas";

-- DropTable
DROP TABLE "email_broadcast_campaigns";

-- DropTable
DROP TABLE "email_unsubscribes";
