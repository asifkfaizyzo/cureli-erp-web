-- backend/prisma/migrations/20260202052019_new_inapp_boadcast_template/migration.sql (do not remove this comment)
-- AlterTable
ALTER TABLE "broadcast_campaigns" ADD COLUMN     "action_label" VARCHAR(100),
ADD COLUMN     "action_url" VARCHAR(500),
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "target_cadmins" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "target_users" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "broadcast_segments" (
    "segment_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "created_by_cadmin" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broadcast_segments_pkey" PRIMARY KEY ("segment_id")
);

-- CreateTable
CREATE TABLE "broadcast_templates" (
    "template_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "attachments" JSONB,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_cadmin" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broadcast_templates_pkey" PRIMARY KEY ("template_id")
);

-- CreateIndex
CREATE INDEX "broadcast_segments_created_by_cadmin_idx" ON "broadcast_segments"("created_by_cadmin");

-- CreateIndex
CREATE INDEX "broadcast_templates_created_by_cadmin_idx" ON "broadcast_templates"("created_by_cadmin");

-- CreateIndex
CREATE INDEX "broadcast_templates_usage_count_idx" ON "broadcast_templates"("usage_count" DESC);

-- AddForeignKey
ALTER TABLE "broadcast_segments" ADD CONSTRAINT "broadcast_segments_created_by_cadmin_fkey" FOREIGN KEY ("created_by_cadmin") REFERENCES "cadmins"("cadmin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_templates" ADD CONSTRAINT "broadcast_templates_created_by_cadmin_fkey" FOREIGN KEY ("created_by_cadmin") REFERENCES "cadmins"("cadmin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
