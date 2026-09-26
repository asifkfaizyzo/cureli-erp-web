-- backend/prisma/migrations/20260224084535_add_attachment_tables/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "EmailAttachmentType" AS ENUM ('INLINE', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "BroadcastAttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'LINK');

-- CreateTable
CREATE TABLE "email_broadcast_attachments" (
    "attachment_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "file_type" "EmailAttachmentType" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "content_id" VARCHAR(100),
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_broadcast_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "broadcast_attachments" (
    "attachment_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "attachment_type" "BroadcastAttachmentType" NOT NULL,
    "storage_key" TEXT,
    "original_name" VARCHAR(255),
    "mime_type" VARCHAR(100),
    "file_size" INTEGER,
    "link_url" VARCHAR(500),
    "link_label" VARCHAR(100),
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateIndex
CREATE INDEX "email_broadcast_attachments_campaign_id_idx" ON "email_broadcast_attachments"("campaign_id");

-- CreateIndex
CREATE INDEX "email_broadcast_attachments_file_type_idx" ON "email_broadcast_attachments"("file_type");

-- CreateIndex
CREATE INDEX "broadcast_attachments_campaign_id_idx" ON "broadcast_attachments"("campaign_id");

-- CreateIndex
CREATE INDEX "broadcast_attachments_attachment_type_idx" ON "broadcast_attachments"("attachment_type");

-- AddForeignKey
ALTER TABLE "email_broadcast_attachments" ADD CONSTRAINT "email_broadcast_attachments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_broadcast_campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_attachments" ADD CONSTRAINT "broadcast_attachments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "broadcast_campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;
