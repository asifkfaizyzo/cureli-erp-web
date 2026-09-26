-- backend/prisma/migrations/20260130112211_add_broadcast_campaigns/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "broadcast_campaigns" (
    "campaign_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "target_filters" JSONB NOT NULL,
    "recipient_count" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "scheduled_for" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "delivered_count" INTEGER,
    "read_count" INTEGER,
    "created_by_cadmin" UUID NOT NULL,
    "cadmin_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broadcast_campaigns_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateIndex
CREATE INDEX "broadcast_campaigns_status_scheduled_for_idx" ON "broadcast_campaigns"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "broadcast_campaigns_created_by_cadmin_idx" ON "broadcast_campaigns"("created_by_cadmin");

-- CreateIndex
CREATE INDEX "broadcast_campaigns_created_at_idx" ON "broadcast_campaigns"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_created_by_cadmin_fkey" FOREIGN KEY ("created_by_cadmin") REFERENCES "cadmins"("cadmin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
