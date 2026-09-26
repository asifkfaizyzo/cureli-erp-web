-- backend/prisma/migrations/20260217074125_add_email_broadcast_tables/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED', 'SENT', 'PARTIAL_FAILURE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailRecipientStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "email_broadcast_campaigns" (
    "campaign_id" UUID NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT,
    "from_name" VARCHAR(100) NOT NULL,
    "from_email" VARCHAR(100) NOT NULL,
    "reply_to" VARCHAR(100),
    "target_filters" JSONB NOT NULL,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "inline_image" JSONB,
    "attachments" JSONB,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduled_for" TIMESTAMPTZ(6),
    "processing" BOOLEAN NOT NULL DEFAULT false,
    "processing_started_at" TIMESTAMPTZ(6),
    "last_processed_index" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "bounced_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "clicked_count" INTEGER NOT NULL DEFAULT 0,
    "unsubscribed_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_by_cadmin" UUID NOT NULL,
    "cadmin_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "email_broadcast_campaigns_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "email_broadcast_recipients" (
    "recipient_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(200),
    "user_id" UUID,
    "shop_id" UUID,
    "status" "EmailRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "opened_at" TIMESTAMPTZ(6),
    "clicked_at" TIMESTAMPTZ(6),
    "bounced_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "provider_message_id" VARCHAR(255),
    "error_message" TEXT,
    "bounce_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_broadcast_recipients_pkey" PRIMARY KEY ("recipient_id")
);

-- CreateTable
CREATE TABLE "daily_send_quota" (
    "date" VARCHAR(10) NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_send_quota_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "email_unsubscribes" (
    "unsubscribe_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "user_id" UUID,
    "shop_id" UUID,
    "reason" VARCHAR(100),
    "unsubscribed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_unsubscribes_pkey" PRIMARY KEY ("unsubscribe_id")
);

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_status_scheduled_for_idx" ON "email_broadcast_campaigns"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_created_by_cadmin_idx" ON "email_broadcast_campaigns"("created_by_cadmin");

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_created_at_idx" ON "email_broadcast_campaigns"("created_at" DESC);

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_processing_status_idx" ON "email_broadcast_campaigns"("processing", "status");

-- CreateIndex
CREATE INDEX "email_broadcast_recipients_campaign_id_status_idx" ON "email_broadcast_recipients"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "email_broadcast_recipients_email_idx" ON "email_broadcast_recipients"("email");

-- CreateIndex
CREATE INDEX "email_broadcast_recipients_status_idx" ON "email_broadcast_recipients"("status");

-- CreateIndex
CREATE INDEX "daily_send_quota_date_idx" ON "daily_send_quota"("date");

-- CreateIndex
CREATE UNIQUE INDEX "email_unsubscribes_email_key" ON "email_unsubscribes"("email");

-- CreateIndex
CREATE INDEX "email_unsubscribes_email_idx" ON "email_unsubscribes"("email");

-- AddForeignKey
ALTER TABLE "email_broadcast_campaigns" ADD CONSTRAINT "email_broadcast_campaigns_created_by_cadmin_fkey" FOREIGN KEY ("created_by_cadmin") REFERENCES "cadmins"("cadmin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_broadcast_recipients" ADD CONSTRAINT "email_broadcast_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_broadcast_campaigns"("campaign_id") ON DELETE CASCADE ON UPDATE CASCADE;
