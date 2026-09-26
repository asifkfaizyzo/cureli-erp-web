-- backend/prisma/migrations/20251127072924_add_cadmin_model/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "cadmins" (
    "cadmin_id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone_number" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "verification_id" TEXT,
    "otp_expires" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cadmins_pkey" PRIMARY KEY ("cadmin_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cadmins_username_key" ON "cadmins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "cadmins_email_key" ON "cadmins"("email");
