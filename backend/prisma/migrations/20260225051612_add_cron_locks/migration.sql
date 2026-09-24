-- backend/prisma/migrations/20260225051612_add_cron_locks/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "cron_locks" (
    "job_name" VARCHAR(100) NOT NULL,
    "locked_by" VARCHAR(255),
    "locked_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "last_result" VARCHAR(20),
    "last_run_at" TIMESTAMPTZ(6),

    CONSTRAINT "cron_locks_pkey" PRIMARY KEY ("job_name")
);

-- CreateIndex
CREATE INDEX "cron_locks_expires_at_idx" ON "cron_locks"("expires_at");
