-- backend/prisma/migrations/20260304115402_add_otp_daily_limits/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "otp_daily_limits" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_daily_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_daily_limits_date_idx" ON "otp_daily_limits"("date");

-- CreateIndex
CREATE UNIQUE INDEX "otp_daily_limits_identifier_date_key" ON "otp_daily_limits"("identifier", "date");
