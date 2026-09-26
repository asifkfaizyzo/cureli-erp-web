-- backend/prisma/migrations/20260922100700_add_rider_presence_and_tips/migration.sql (do not remove this comment)
-- AlterEnum
ALTER TYPE "EarningType" ADD VALUE 'TIP';

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "tip_amount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "rider_online_sessions" (
    "session_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "went_online_at" TIMESTAMPTZ(6) NOT NULL,
    "went_offline_at" TIMESTAMPTZ(6),
    "duration_minutes" DECIMAL(8,2),
    "shift_date" DATE NOT NULL,
    "closed_by" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_online_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE INDEX "rider_online_sessions_rider_id_shift_date_idx" ON "rider_online_sessions"("rider_id", "shift_date");

-- CreateIndex
CREATE INDEX "rider_online_sessions_rider_id_went_online_at_idx" ON "rider_online_sessions"("rider_id", "went_online_at" DESC);

-- CreateIndex
CREATE INDEX "rider_online_sessions_went_offline_at_idx" ON "rider_online_sessions"("went_offline_at");

-- AddForeignKey
ALTER TABLE "rider_online_sessions" ADD CONSTRAINT "rider_online_sessions_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE CASCADE ON UPDATE CASCADE;
