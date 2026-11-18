-- CreateEnum
CREATE TYPE "MetaOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'PERMANENT_FAILURE');

-- CreateTable
CREATE TABLE "meta_outbox_events" (
    "id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_time" INTEGER NOT NULL,
    "user_id" UUID,
    "event_data" JSONB NOT NULL DEFAULT '{}',
    "user_data" JSONB NOT NULL DEFAULT '{}',
    "status" "MetaOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meta_outbox_events_event_id_key" ON "meta_outbox_events"("event_id");

-- CreateIndex
CREATE INDEX "meta_outbox_events_status_next_retry_at_idx" ON "meta_outbox_events"("status", "next_retry_at");
