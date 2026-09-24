-- backend/prisma/migrations/20251124103118_xx/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "deletion_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "reason" TEXT NOT NULL,
    "onboarding_step" INTEGER,
    "days_inactive" INTEGER,
    "files_deleted" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_logs_pkey" PRIMARY KEY ("id")
);
