-- backend/prisma/migrations/20251230092036_add_enquiry_tables/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'REPLIED', 'CLOSED');

-- CreateTable
CREATE TABLE "enquiries" (
    "enquiry_id" UUID NOT NULL,
    "enquiry_number" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "message" TEXT NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("enquiry_id")
);

-- CreateTable
CREATE TABLE "enquiry_replies" (
    "reply_id" UUID NOT NULL,
    "enquiry_id" UUID NOT NULL,
    "replied_by_id" UUID NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMPTZ(6),
    "email_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_replies_pkey" PRIMARY KEY ("reply_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_enquiry_number_key" ON "enquiries"("enquiry_number");

-- CreateIndex
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");

-- CreateIndex
CREATE INDEX "enquiries_created_at_idx" ON "enquiries"("created_at");

-- CreateIndex
CREATE INDEX "enquiries_email_idx" ON "enquiries"("email");

-- CreateIndex
CREATE INDEX "enquiry_replies_enquiry_id_idx" ON "enquiry_replies"("enquiry_id");

-- CreateIndex
CREATE INDEX "enquiry_replies_replied_by_id_idx" ON "enquiry_replies"("replied_by_id");

-- AddForeignKey
ALTER TABLE "enquiry_replies" ADD CONSTRAINT "enquiry_replies_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("enquiry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_replies" ADD CONSTRAINT "enquiry_replies_replied_by_id_fkey" FOREIGN KEY ("replied_by_id") REFERENCES "cadmins"("cadmin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
