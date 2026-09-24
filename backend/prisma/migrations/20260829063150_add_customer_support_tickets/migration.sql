-- backend/prisma/migrations/20260829063150_add_customer_support_tickets/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "CustomerTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CustomerTicketCategory" AS ENUM ('WRONG_ITEM', 'DAMAGED_PRODUCT', 'DELIVERY_ISSUE', 'QUALITY_ISSUE', 'MISSING_ITEM', 'REFUND_REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerTicketActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'CUSTOMER_REPLY', 'CADMIN_REPLY', 'INTERNAL_NOTE');

-- CreateTable
CREATE TABLE "customer_support_tickets" (
    "ticket_id" UUID NOT NULL,
    "ticket_number" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "category" "CustomerTicketCategory" NOT NULL,
    "other_category_text" VARCHAR(150),
    "subject" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CustomerTicketStatus" NOT NULL DEFAULT 'OPEN',
    "attachment_count" INTEGER NOT NULL DEFAULT 0,
    "activity_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "customer_support_tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "customer_support_ticket_attachments" (
    "attachment_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_support_ticket_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "customer_support_ticket_activities" (
    "activity_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "type" "CustomerTicketActivityType" NOT NULL,
    "from_status" "CustomerTicketStatus",
    "to_status" "CustomerTicketStatus",
    "actor_type" VARCHAR(20) NOT NULL,
    "actor_id" UUID NOT NULL,
    "actor_name" VARCHAR(150) NOT NULL,
    "message" TEXT,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_support_ticket_activities_pkey" PRIMARY KEY ("activity_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_support_tickets_ticket_number_key" ON "customer_support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "customer_support_tickets_customer_id_created_at_idx" ON "customer_support_tickets"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "customer_support_tickets_order_id_idx" ON "customer_support_tickets"("order_id");

-- CreateIndex
CREATE INDEX "customer_support_tickets_shop_id_status_idx" ON "customer_support_tickets"("shop_id", "status");

-- CreateIndex
CREATE INDEX "customer_support_tickets_status_created_at_idx" ON "customer_support_tickets"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "customer_support_tickets_ticket_number_idx" ON "customer_support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "customer_support_ticket_attachments_ticket_id_idx" ON "customer_support_ticket_attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "customer_support_ticket_activities_ticket_id_created_at_idx" ON "customer_support_ticket_activities"("ticket_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "customer_support_ticket_activities_type_idx" ON "customer_support_ticket_activities"("type");

-- AddForeignKey
ALTER TABLE "customer_support_tickets" ADD CONSTRAINT "customer_support_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "cureli_mobile_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_support_tickets" ADD CONSTRAINT "customer_support_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_support_tickets" ADD CONSTRAINT "customer_support_tickets_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_support_ticket_attachments" ADD CONSTRAINT "customer_support_ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "customer_support_tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_support_ticket_activities" ADD CONSTRAINT "customer_support_ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "customer_support_tickets"("ticket_id") ON DELETE CASCADE ON UPDATE CASCADE;
