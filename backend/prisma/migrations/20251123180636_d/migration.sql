-- backend/prisma/migrations/20251123180636_d/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "onboarding_step" INTEGER NOT NULL DEFAULT 0;
