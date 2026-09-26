-- backend/prisma/migrations/20251128055906_add_file_verification_log_and_resub_count/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "shop_files" ADD COLUMN     "resubmission_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "file_verification_logs" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "cadmin_id" UUID,
    "actor_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_verification_logs_file_id_idx" ON "file_verification_logs"("file_id");
