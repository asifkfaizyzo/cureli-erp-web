-- backend/prisma/migrations/20260706110928_add_inventory_import/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'PARSING', 'AWAITING_REVIEW', 'CONFIRMING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventorySource" AS ENUM ('MANUAL', 'PURCHASE', 'IMPORT');

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'INVENTORY_IMPORT';

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "import_job_id" UUID,
ADD COLUMN     "source" "InventorySource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "inventory_import_jobs" (
    "import_job_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "original_file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "processing_phase" VARCHAR(50),
    "processing_progress" INTEGER NOT NULL DEFAULT 0,
    "column_mapping" JSONB,
    "detected_software" VARCHAR(100),
    "resolutions" JSONB,
    "conflict_decisions" JSONB,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "new_medicines_created" INTEGER NOT NULL DEFAULT 0,
    "existing_batches_merged" INTEGER NOT NULL DEFAULT 0,
    "parsed_row_count" INTEGER,
    "error_log" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "parsing_started_at" TIMESTAMPTZ(6),
    "parsing_completed_at" TIMESTAMPTZ(6),
    "confirmed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_import_jobs_pkey" PRIMARY KEY ("import_job_id")
);

-- CreateIndex
CREATE INDEX "inventory_import_jobs_shop_id_status_created_at_idx" ON "inventory_import_jobs"("shop_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_import_jobs_branch_id_status_idx" ON "inventory_import_jobs"("branch_id", "status");

-- CreateIndex
CREATE INDEX "inventory_import_jobs_created_by_idx" ON "inventory_import_jobs"("created_by");

-- CreateIndex
CREATE INDEX "inventory_import_jobs_file_hash_shop_id_idx" ON "inventory_import_jobs"("file_hash", "shop_id");

-- CreateIndex
CREATE INDEX "inventory_import_jobs_status_expires_at_idx" ON "inventory_import_jobs"("status", "expires_at");

-- CreateIndex
CREATE INDEX "inventory_import_jobs_created_at_idx" ON "inventory_import_jobs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_import_job_id_idx" ON "inventory"("import_job_id");

-- CreateIndex
CREATE INDEX "inventory_source_idx" ON "inventory"("source");

-- AddForeignKey
ALTER TABLE "inventory_import_jobs" ADD CONSTRAINT "inventory_import_jobs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_import_jobs" ADD CONSTRAINT "inventory_import_jobs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_import_jobs" ADD CONSTRAINT "inventory_import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
