-- backend/prisma/migrations/20260606113041_add_mobile_push_notifications/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "cureli_mobile_push_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "master_enabled" BOOLEAN NOT NULL DEFAULT true,
    "order_updates" BOOLEAN NOT NULL DEFAULT true,
    "promotions" BOOLEAN NOT NULL DEFAULT true,
    "prescription_updates" BOOLEAN NOT NULL DEFAULT true,
    "system_messages" BOOLEAN NOT NULL DEFAULT true,
    "cart_abandonment" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cureli_mobile_push_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cureli_mobile_notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "push_sent" BOOLEAN NOT NULL DEFAULT false,
    "push_ticket_id" VARCHAR(200),
    "campaign_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cureli_mobile_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cureli_mobile_broadcast_campaigns" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'promotions',
    "tap_action" VARCHAR(50) NOT NULL DEFAULT 'home',
    "tap_params" JSONB,
    "target_all" BOOLEAN NOT NULL DEFAULT true,
    "target_user_ids" UUID[],
    "audience_filters" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "scheduled_for" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "targeted_count" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_cadmin" UUID NOT NULL,
    "cadmin_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cureli_mobile_broadcast_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cureli_mobile_push_preferences_user_id_key" ON "cureli_mobile_push_preferences"("user_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_push_preferences_user_id_idx" ON "cureli_mobile_push_preferences"("user_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_notifications_user_id_is_read_created_at_idx" ON "cureli_mobile_notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cureli_mobile_notifications_user_id_created_at_idx" ON "cureli_mobile_notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cureli_mobile_notifications_category_idx" ON "cureli_mobile_notifications"("category");

-- CreateIndex
CREATE INDEX "cureli_mobile_notifications_campaign_id_idx" ON "cureli_mobile_notifications"("campaign_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_notifications_created_at_idx" ON "cureli_mobile_notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "cureli_mobile_broadcast_campaigns_status_scheduled_for_idx" ON "cureli_mobile_broadcast_campaigns"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "cureli_mobile_broadcast_campaigns_created_by_cadmin_idx" ON "cureli_mobile_broadcast_campaigns"("created_by_cadmin");

-- CreateIndex
CREATE INDEX "cureli_mobile_broadcast_campaigns_created_at_idx" ON "cureli_mobile_broadcast_campaigns"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "cureli_mobile_push_preferences" ADD CONSTRAINT "cureli_mobile_push_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cureli_mobile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cureli_mobile_notifications" ADD CONSTRAINT "cureli_mobile_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cureli_mobile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cureli_mobile_broadcast_campaigns" ADD CONSTRAINT "cureli_mobile_broadcast_campaigns_created_by_cadmin_fkey" FOREIGN KEY ("created_by_cadmin") REFERENCES "cadmins"("cadmin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
