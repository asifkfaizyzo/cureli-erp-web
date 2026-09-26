-- backend/prisma/migrations/20251127120140_add_cadmin_model/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "pending_users" (
    "pending_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "login_provider" TEXT NOT NULL DEFAULT 'password',
    "email_otp_hash" TEXT,
    "email_otp_expires" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "sms_verification_id" TEXT,
    "sms_transaction_id" TEXT,
    "sms_otp_expires" TIMESTAMPTZ,
    "sms_verified" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pending_users_pkey" PRIMARY KEY ("pending_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_users_email_key" ON "pending_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pending_users_google_id_key" ON "pending_users"("google_id");
