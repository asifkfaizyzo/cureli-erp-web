-- backend/prisma/migrations/20260731084423_add_rider_delivery_module/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "RiderStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiderDocumentType" AS ENUM ('PROFILE_PHOTO', 'AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN_FRONT', 'DRIVING_LICENSE_FRONT', 'DRIVING_LICENSE_BACK', 'VEHICLE_RC');

-- CreateEnum
CREATE TYPE "RiderDocumentStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING_ASSIGNMENT', 'RIDER_NOTIFIED', 'ACCEPTED', 'ARRIVED_AT_PHARMACY', 'PHARMACY_CONFIRMED', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED_AT_CUSTOMER', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentAction" AS ENUM ('NOTIFIED', 'ACCEPTED', 'REJECTED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "DeliveryFailureReason" AS ENUM ('CUSTOMER_UNAVAILABLE', 'CUSTOMER_REFUSED', 'WRONG_ADDRESS', 'SAFETY_CONCERN', 'OTHER');

-- CreateEnum
CREATE TYPE "EarningType" AS ENUM ('BASE_FEE', 'DISTANCE_FEE', 'SURGE_BONUS', 'SHIFT_BONUS', 'STREAK_BONUS', 'WEEKLY_CHALLENGE', 'REFERRAL_BONUS', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('MANUAL', 'RAZORPAY_X');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ROAD_ACCIDENT', 'BIKE_BREAKDOWN', 'THEFT_ROBBERY', 'MEDICAL_EMERGENCY', 'SOS', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ZoneChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiderTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RiderTicketCategory" AS ENUM ('EARNINGS_PAYOUT', 'ORDER_ISSUE', 'APP_TECHNICAL', 'DOCUMENT_ACCOUNT', 'SAFETY_INCIDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ChatSenderType" AS ENUM ('RIDER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "TrainingContentType" AS ENUM ('ONBOARDING_SLIDE', 'FAQ', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "IncentivePeriod" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "IncentiveType" AS ENUM ('DAILY_STREAK', 'WEEKLY_CHALLENGE');

-- CreateTable
CREATE TABLE "delivery_zones" (
    "zone_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("zone_id")
);

-- CreateTable
CREATE TABLE "delivery_config" (
    "config_id" UUID NOT NULL,
    "base_fee_per_delivery" DECIMAL(10,2) NOT NULL DEFAULT 30,
    "per_km_rate" DECIMAL(10,2) NOT NULL DEFAULT 5,
    "accept_timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "max_cascade_attempts" INTEGER NOT NULL DEFAULT 5,
    "min_payout_amount" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "payout_day_of_week" INTEGER NOT NULL DEFAULT 1,
    "low_rating_threshold" DECIMAL(3,2) NOT NULL DEFAULT 3.5,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "delivery_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "delivery_shifts" (
    "shift_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "min_deliveries" INTEGER NOT NULL,
    "bonus_amount" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "delivery_shifts_pkey" PRIMARY KEY ("shift_id")
);

-- CreateTable
CREATE TABLE "delivery_surge_rules" (
    "rule_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "days_of_week" TEXT[],
    "multiplier" DECIMAL(4,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "delivery_surge_rules_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "delivery_incentives" (
    "incentive_id" UUID NOT NULL,
    "type" "IncentiveType" NOT NULL,
    "target_count" INTEGER NOT NULL,
    "reward_amount" DECIMAL(10,2) NOT NULL,
    "period" "IncentivePeriod" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "delivery_incentives_pkey" PRIMARY KEY ("incentive_id")
);

-- CreateTable
CREATE TABLE "riders" (
    "rider_id" UUID NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "full_name" VARCHAR(200),
    "date_of_birth" DATE,
    "sex" "UserSex",
    "profile_photo_key" VARCHAR(500),
    "vehicle_type" VARCHAR(20),
    "vehicle_number" VARCHAR(20),
    "vehicle_make_model" VARCHAR(100),
    "status" "RiderStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "zone_id" UUID,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "current_lat" DECIMAL(10,8),
    "current_lng" DECIMAL(11,8),
    "last_location_at" TIMESTAMPTZ(6),
    "bank_account_number" VARCHAR(30),
    "bank_ifsc" VARCHAR(15),
    "bank_holder_name" VARCHAR(200),
    "bank_name" VARCHAR(100),
    "bank_verified" BOOLEAN NOT NULL DEFAULT false,
    "emergency_contact_name" VARCHAR(200),
    "emergency_contact_phone" VARCHAR(15),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ratings" INTEGER NOT NULL DEFAULT 0,
    "total_deliveries" INTEGER NOT NULL DEFAULT 0,
    "referral_code" VARCHAR(20),
    "referred_by_code" VARCHAR(20),
    "suspension_reason" VARCHAR(500),
    "suspended_at" TIMESTAMPTZ(6),
    "suspended_by" UUID,
    "login_otp_hash" TEXT,
    "login_otp_expires" TIMESTAMPTZ(6),
    "login_otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "otp_cycle_failures" INTEGER NOT NULL DEFAULT 0,
    "otp_locked_until" TIMESTAMPTZ(6),
    "logout_all_issued_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "deletion_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6),

    CONSTRAINT "riders_pkey" PRIMARY KEY ("rider_id")
);

-- CreateTable
CREATE TABLE "rider_sessions" (
    "id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
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

    CONSTRAINT "rider_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_documents" (
    "document_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "type" "RiderDocumentType" NOT NULL,
    "storage_key" VARCHAR(500),
    "back_storage_key" VARCHAR(500),
    "status" "RiderDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" VARCHAR(500),
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "resubmission_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rider_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "zone_change_requests" (
    "request_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "from_zone_id" UUID,
    "to_zone_id" UUID NOT NULL,
    "reason" VARCHAR(500),
    "status" "ZoneChangeStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_note" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zone_change_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "delivery_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "rider_id" UUID,
    "zone_id" UUID,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "assigned_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "assignment_attempts" INTEGER NOT NULL DEFAULT 0,
    "arrived_at_pharmacy_at" TIMESTAMPTZ(6),
    "pharmacy_confirmed_at" TIMESTAMPTZ(6),
    "pharmacy_confirmed_by" UUID,
    "picked_up_at" TIMESTAMPTZ(6),
    "arrived_at_customer_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "failure_reason" "DeliveryFailureReason",
    "failure_note" VARCHAR(500),
    "masked_call_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pickup_lat" DECIMAL(10,8),
    "pickup_lng" DECIMAL(11,8),
    "drop_lat" DECIMAL(10,8),
    "drop_lng" DECIMAL(11,8),
    "total_distance_km" DECIMAL(10,2),
    "base_fee" DECIMAL(10,2),
    "distance_fee" DECIMAL(10,2),
    "surge_fee" DECIMAL(10,2),
    "bonus_fee" DECIMAL(10,2),
    "total_rider_earning" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "delivery_assignment_logs" (
    "log_id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "action" "AssignmentAction" NOT NULL,
    "reason" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_assignment_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "delivery_chats" (
    "message_id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "sender_type" "ChatSenderType" NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_chats_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "rider_earning_ledger" (
    "ledger_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "delivery_id" UUID,
    "payout_id" UUID,
    "type" "EarningType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" VARCHAR(300),
    "week_start" DATE NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_earning_ledger_pkey" PRIMARY KEY ("ledger_id")
);

-- CreateTable
CREATE TABLE "rider_payouts" (
    "payout_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PayoutMethod" NOT NULL DEFAULT 'MANUAL',
    "manual_reference" VARCHAR(100),
    "manual_notes" VARCHAR(500),
    "manual_payment_date" DATE,
    "manual_bank_used" VARCHAR(100),
    "provider_payload" JSONB,
    "bank_snapshot" JSONB NOT NULL,
    "processed_by" UUID,
    "processed_at" TIMESTAMPTZ(6),
    "failed_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rider_payouts_pkey" PRIMARY KEY ("payout_id")
);

-- CreateTable
CREATE TABLE "rider_ratings" (
    "rating_id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_ratings_pkey" PRIMARY KEY ("rating_id")
);

-- CreateTable
CREATE TABLE "rider_gives_ratings" (
    "rating_id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL,
    "reason" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_gives_ratings_pkey" PRIMARY KEY ("rating_id")
);

-- CreateTable
CREATE TABLE "rider_incidents" (
    "incident_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "type" "IncidentType" NOT NULL,
    "is_sos" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(1000),
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "delivery_id" UUID,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_incidents_pkey" PRIMARY KEY ("incident_id")
);

-- CreateTable
CREATE TABLE "rider_appeals" (
    "appeal_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" VARCHAR(500),
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_appeals_pkey" PRIMARY KEY ("appeal_id")
);

-- CreateTable
CREATE TABLE "rider_tickets" (
    "ticket_id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "category" "RiderTicketCategory" NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "status" "RiderTicketStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rider_tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "rider_ticket_replies" (
    "reply_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "sender_type" VARCHAR(10) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_ticket_replies_pkey" PRIMARY KEY ("reply_id")
);

-- CreateTable
CREATE TABLE "rider_notifications" (
    "id" UUID NOT NULL,
    "rider_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "push_sent" BOOLEAN NOT NULL DEFAULT false,
    "push_ticket_id" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rider_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_training_content" (
    "content_id" UUID NOT NULL,
    "type" "TrainingContentType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "target_zone_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rider_training_content_pkey" PRIMARY KEY ("content_id")
);

-- CreateIndex
CREATE INDEX "delivery_zones_city_is_active_idx" ON "delivery_zones"("city", "is_active");

-- CreateIndex
CREATE INDEX "delivery_zones_is_active_idx" ON "delivery_zones"("is_active");

-- CreateIndex
CREATE INDEX "delivery_shifts_is_active_idx" ON "delivery_shifts"("is_active");

-- CreateIndex
CREATE INDEX "delivery_surge_rules_is_active_idx" ON "delivery_surge_rules"("is_active");

-- CreateIndex
CREATE INDEX "delivery_incentives_is_active_idx" ON "delivery_incentives"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "riders_phone_key" ON "riders"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "riders_referral_code_key" ON "riders"("referral_code");

-- CreateIndex
CREATE INDEX "riders_phone_idx" ON "riders"("phone");

-- CreateIndex
CREATE INDEX "riders_status_idx" ON "riders"("status");

-- CreateIndex
CREATE INDEX "riders_zone_id_is_online_status_idx" ON "riders"("zone_id", "is_online", "status");

-- CreateIndex
CREATE INDEX "riders_referral_code_idx" ON "riders"("referral_code");

-- CreateIndex
CREATE INDEX "riders_deleted_at_idx" ON "riders"("deleted_at");

-- CreateIndex
CREATE INDEX "riders_created_at_idx" ON "riders"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "rider_sessions_refresh_token_hash_key" ON "rider_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "rider_sessions_rider_id_idx" ON "rider_sessions"("rider_id");

-- CreateIndex
CREATE INDEX "rider_sessions_refresh_token_hash_idx" ON "rider_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "rider_sessions_rider_id_is_active_idx" ON "rider_sessions"("rider_id", "is_active");

-- CreateIndex
CREATE INDEX "rider_sessions_expires_at_idx" ON "rider_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "rider_documents_rider_id_idx" ON "rider_documents"("rider_id");

-- CreateIndex
CREATE INDEX "rider_documents_rider_id_type_idx" ON "rider_documents"("rider_id", "type");

-- CreateIndex
CREATE INDEX "rider_documents_status_idx" ON "rider_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rider_documents_rider_id_type_key" ON "rider_documents"("rider_id", "type");

-- CreateIndex
CREATE INDEX "zone_change_requests_rider_id_idx" ON "zone_change_requests"("rider_id");

-- CreateIndex
CREATE INDEX "zone_change_requests_status_created_at_idx" ON "zone_change_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_order_id_key" ON "deliveries"("order_id");

-- CreateIndex
CREATE INDEX "deliveries_order_id_idx" ON "deliveries"("order_id");

-- CreateIndex
CREATE INDEX "deliveries_rider_id_status_idx" ON "deliveries"("rider_id", "status");

-- CreateIndex
CREATE INDEX "deliveries_status_created_at_idx" ON "deliveries"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "deliveries_zone_id_status_idx" ON "deliveries"("zone_id", "status");

-- CreateIndex
CREATE INDEX "delivery_assignment_logs_delivery_id_idx" ON "delivery_assignment_logs"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_assignment_logs_rider_id_idx" ON "delivery_assignment_logs"("rider_id");

-- CreateIndex
CREATE INDEX "delivery_chats_delivery_id_created_at_idx" ON "delivery_chats"("delivery_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "rider_earning_ledger_rider_id_is_paid_idx" ON "rider_earning_ledger"("rider_id", "is_paid");

-- CreateIndex
CREATE INDEX "rider_earning_ledger_rider_id_week_start_idx" ON "rider_earning_ledger"("rider_id", "week_start");

-- CreateIndex
CREATE INDEX "rider_earning_ledger_payout_id_idx" ON "rider_earning_ledger"("payout_id");

-- CreateIndex
CREATE INDEX "rider_payouts_rider_id_status_idx" ON "rider_payouts"("rider_id", "status");

-- CreateIndex
CREATE INDEX "rider_payouts_status_created_at_idx" ON "rider_payouts"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rider_payouts_week_start_idx" ON "rider_payouts"("week_start");

-- CreateIndex
CREATE UNIQUE INDEX "rider_ratings_delivery_id_key" ON "rider_ratings"("delivery_id");

-- CreateIndex
CREATE INDEX "rider_ratings_rider_id_idx" ON "rider_ratings"("rider_id");

-- CreateIndex
CREATE UNIQUE INDEX "rider_gives_ratings_delivery_id_key" ON "rider_gives_ratings"("delivery_id");

-- CreateIndex
CREATE INDEX "rider_gives_ratings_rider_id_idx" ON "rider_gives_ratings"("rider_id");

-- CreateIndex
CREATE INDEX "rider_incidents_rider_id_idx" ON "rider_incidents"("rider_id");

-- CreateIndex
CREATE INDEX "rider_incidents_is_sos_status_idx" ON "rider_incidents"("is_sos", "status");

-- CreateIndex
CREATE INDEX "rider_incidents_status_created_at_idx" ON "rider_incidents"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rider_appeals_rider_id_idx" ON "rider_appeals"("rider_id");

-- CreateIndex
CREATE INDEX "rider_appeals_status_created_at_idx" ON "rider_appeals"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rider_tickets_rider_id_status_idx" ON "rider_tickets"("rider_id", "status");

-- CreateIndex
CREATE INDEX "rider_tickets_status_created_at_idx" ON "rider_tickets"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rider_ticket_replies_ticket_id_created_at_idx" ON "rider_ticket_replies"("ticket_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "rider_notifications_rider_id_is_read_created_at_idx" ON "rider_notifications"("rider_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rider_notifications_rider_id_created_at_idx" ON "rider_notifications"("rider_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rider_training_content_type_is_active_idx" ON "rider_training_content"("type", "is_active");

-- CreateIndex
CREATE INDEX "rider_training_content_target_zone_id_idx" ON "rider_training_content"("target_zone_id");

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "delivery_zones"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_sessions" ADD CONSTRAINT "rider_sessions_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_documents" ADD CONSTRAINT "rider_documents_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_change_requests" ADD CONSTRAINT "zone_change_requests_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_change_requests" ADD CONSTRAINT "zone_change_requests_to_zone_id_fkey" FOREIGN KEY ("to_zone_id") REFERENCES "delivery_zones"("zone_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignment_logs" ADD CONSTRAINT "delivery_assignment_logs_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("delivery_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignment_logs" ADD CONSTRAINT "delivery_assignment_logs_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_chats" ADD CONSTRAINT "delivery_chats_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("delivery_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_earning_ledger" ADD CONSTRAINT "rider_earning_ledger_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_earning_ledger" ADD CONSTRAINT "rider_earning_ledger_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "rider_payouts"("payout_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_payouts" ADD CONSTRAINT "rider_payouts_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_ratings" ADD CONSTRAINT "rider_ratings_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("delivery_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_ratings" ADD CONSTRAINT "rider_ratings_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_gives_ratings" ADD CONSTRAINT "rider_gives_ratings_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("delivery_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_gives_ratings" ADD CONSTRAINT "rider_gives_ratings_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_incidents" ADD CONSTRAINT "rider_incidents_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_appeals" ADD CONSTRAINT "rider_appeals_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_tickets" ADD CONSTRAINT "rider_tickets_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_ticket_replies" ADD CONSTRAINT "rider_ticket_replies_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "rider_tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_notifications" ADD CONSTRAINT "rider_notifications_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("rider_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_training_content" ADD CONSTRAINT "rider_training_content_target_zone_id_fkey" FOREIGN KEY ("target_zone_id") REFERENCES "delivery_zones"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;
