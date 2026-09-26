-- backend/prisma/migrations/20251121093123_shop_files_init/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "shop_files" (
    "file_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "file_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "verification_notes" TEXT,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ(6),

    CONSTRAINT "shop_files_pkey" PRIMARY KEY ("file_id")
);

-- AddForeignKey
ALTER TABLE "shop_files" ADD CONSTRAINT "shop_files_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_files" ADD CONSTRAINT "shop_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
