-- backend/prisma/migrations/20251127074524_add_cadmin_model/migration.sql (do not remove this comment)
/*
  Warnings:

  - You are about to drop the `pending_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "cadmins" ADD COLUMN     "reset_token" VARCHAR(500),
ADD COLUMN     "reset_token_expires" TIMESTAMPTZ(6);

-- DropTable
DROP TABLE "pending_users";
