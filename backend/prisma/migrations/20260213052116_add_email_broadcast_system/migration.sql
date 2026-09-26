-- backend/prisma/migrations/20260213052116_add_email_broadcast_system/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "email_broadcast_campaigns" (
    "campaign_id" UUID NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message_text" TEXT NOT NULL,
    "message_html" TEXT NOT NULL,
    "target_filters" JSONB NOT NULL,
    "target_users" BOOLEAN NOT NULL DEFAULT true,
    "target_cadmins" BOOLEAN NOT NULL DEFAULT false,
    "recipient_count" INTEGER,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "inline_image" JSONB,
    "attachments" JSONB,
    "action_url" VARCHAR(500),
    "action_label" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "scheduled_for" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "processing" BOOLEAN NOT NULL DEFAULT false,
    "processing_started_at" TIMESTAMPTZ(6),
    "last_processed_index" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_by" UUID NOT NULL,
    "cadmin_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "email_broadcast_campaigns_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "daily_send_quotas" (
    "id" UUID NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_send_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_unsubscribes" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "user_id" UUID,
    "cadmin_id" UUID,
    "reason" TEXT,
    "token" VARCHAR(64) NOT NULL,
    "unsubscribed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_unsubscribes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_status_scheduled_for_idx" ON "email_broadcast_campaigns"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_status_processing_idx" ON "email_broadcast_campaigns"("status", "processing");

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_created_by_idx" ON "email_broadcast_campaigns"("created_by");

-- CreateIndex
CREATE INDEX "email_broadcast_campaigns_created_at_idx" ON "email_broadcast_campaigns"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_send_quotas_date_key" ON "daily_send_quotas"("date");

-- CreateIndex
CREATE INDEX "daily_send_quotas_date_idx" ON "daily_send_quotas"("date");

-- CreateIndex
CREATE UNIQUE INDEX "email_unsubscribes_email_key" ON "email_unsubscribes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_unsubscribes_token_key" ON "email_unsubscribes"("token");

-- CreateIndex
CREATE INDEX "email_unsubscribes_email_idx" ON "email_unsubscribes"("email");

-- CreateIndex
CREATE INDEX "email_unsubscribes_token_idx" ON "email_unsubscribes"("token");

-- AddForeignKey
ALTER TABLE "email_broadcast_campaigns" ADD CONSTRAINT "email_broadcast_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "cadmins"("cadmin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
