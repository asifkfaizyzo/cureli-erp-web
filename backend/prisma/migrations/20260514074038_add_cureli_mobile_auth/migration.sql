-- backend/prisma/migrations/20260514074038_add_cureli_mobile_auth/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "cureli_mobile_users" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified_at" TIMESTAMPTZ(6),
    "email" VARCHAR(255),
    "full_name" VARCHAR(200),
    "profile_image_key" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "suspended_at" TIMESTAMPTZ(6),
    "suspension_reason" VARCHAR(500),
    "suspended_by" VARCHAR(100),
    "deleted_at" TIMESTAMPTZ(6),
    "deletion_reason" VARCHAR(500),
    "login_otp_hash" TEXT,
    "login_otp_expires" TIMESTAMPTZ(6),
    "login_otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "otp_cycle_failures" INTEGER NOT NULL DEFAULT 0,
    "otp_locked_until" TIMESTAMPTZ(6),
    "phone_change_new" VARCHAR(15),
    "phone_change_otp_hash" TEXT,
    "phone_change_expires" TIMESTAMPTZ(6),
    "logout_all_issued_at" TIMESTAMPTZ(6),
    "referral_code" VARCHAR(20),
    "referred_by_code" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6),

    CONSTRAINT "cureli_mobile_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cureli_mobile_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(500) NOT NULL,
    "device_id" VARCHAR(255),
    "device_name" VARCHAR(200),
    "device_platform" VARCHAR(20),
    "device_os_version" VARCHAR(50),
    "app_version" VARCHAR(20),
    "push_token" VARCHAR(500),
    "push_token_type" VARCHAR(20),
    "push_token_updated_at" TIMESTAMPTZ(6),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" VARCHAR(50),

    CONSTRAINT "cureli_mobile_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cureli_mobile_addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "custom_label" VARCHAR(100),
    "recipient_name" VARCHAR(200),
    "recipient_phone" VARCHAR(15),
    "address_line_1" VARCHAR(300) NOT NULL,
    "address_line_2" VARCHAR(300),
    "landmark" VARCHAR(200),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cureli_mobile_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cureli_mobile_users_phone_key" ON "cureli_mobile_users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "cureli_mobile_users_email_key" ON "cureli_mobile_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cureli_mobile_users_referral_code_key" ON "cureli_mobile_users"("referral_code");

-- CreateIndex
CREATE INDEX "cureli_mobile_users_phone_idx" ON "cureli_mobile_users"("phone");

-- CreateIndex
CREATE INDEX "cureli_mobile_users_status_idx" ON "cureli_mobile_users"("status");

-- CreateIndex
CREATE INDEX "cureli_mobile_users_deleted_at_idx" ON "cureli_mobile_users"("deleted_at");

-- CreateIndex
CREATE INDEX "cureli_mobile_users_created_at_idx" ON "cureli_mobile_users"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "cureli_mobile_sessions_refresh_token_hash_key" ON "cureli_mobile_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "cureli_mobile_sessions_user_id_idx" ON "cureli_mobile_sessions"("user_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_sessions_refresh_token_hash_idx" ON "cureli_mobile_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "cureli_mobile_sessions_user_id_is_active_idx" ON "cureli_mobile_sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "cureli_mobile_sessions_expires_at_idx" ON "cureli_mobile_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "cureli_mobile_sessions_device_id_idx" ON "cureli_mobile_sessions"("device_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_addresses_user_id_idx" ON "cureli_mobile_addresses"("user_id");

-- CreateIndex
CREATE INDEX "cureli_mobile_addresses_user_id_is_default_idx" ON "cureli_mobile_addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "cureli_mobile_addresses_deleted_at_idx" ON "cureli_mobile_addresses"("deleted_at");

-- AddForeignKey
ALTER TABLE "cureli_mobile_sessions" ADD CONSTRAINT "cureli_mobile_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cureli_mobile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cureli_mobile_addresses" ADD CONSTRAINT "cureli_mobile_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cureli_mobile_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;