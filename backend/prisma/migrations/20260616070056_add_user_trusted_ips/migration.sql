-- backend/prisma/migrations/20260616070056_add_user_trusted_ips/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "user_trusted_ips" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ip_address" TEXT NOT NULL,
    "last_otp_verified_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_trusted_ips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_trusted_ips_user_id_idx" ON "user_trusted_ips"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_trusted_ips_user_id_ip_address_key" ON "user_trusted_ips"("user_id", "ip_address");

-- AddForeignKey
ALTER TABLE "user_trusted_ips" ADD CONSTRAINT "user_trusted_ips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
