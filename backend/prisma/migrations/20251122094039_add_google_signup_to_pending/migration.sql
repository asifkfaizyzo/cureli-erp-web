-- backend/prisma/migrations/20251122094039_add_google_signup_to_pending/migration.sql (do not remove this comment)
/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `pending_users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pending_users" ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "login_provider" TEXT NOT NULL DEFAULT 'password',
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pending_users_google_id_key" ON "pending_users"("google_id");
