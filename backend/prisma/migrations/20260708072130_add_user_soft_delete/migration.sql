-- backend/prisma/migrations/20260708072130_add_user_soft_delete/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);
