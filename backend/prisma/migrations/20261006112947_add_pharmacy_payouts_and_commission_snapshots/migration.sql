-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "commission_amount_snapshot" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "commission_rate_snapshot" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN     "commission_rule_id_snapshot" UUID;

-- CreateTable
CREATE TABLE "pharmacy_payouts" (
    "payout_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "payment_method" "PayoutMethod" NOT NULL DEFAULT 'MANUAL',
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "finalized_at" TIMESTAMPTZ(6),
    "breakdown_snapshot" JSONB,
    "adjustments" JSONB NOT NULL DEFAULT '[]',
    "internal_notes" JSONB NOT NULL DEFAULT '[]',
    "manual_reference" VARCHAR(100),
    "manual_notes" VARCHAR(500),
    "manual_payment_date" DATE,
    "manual_bank_used" VARCHAR(100),
    "bank_snapshot" JSONB,
    "last_refreshed_at" TIMESTAMPTZ(6),
    "refreshed_by" UUID,
    "processed_by" UUID,
    "processed_at" TIMESTAMPTZ(6),
    "failed_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pharmacy_payouts_pkey" PRIMARY KEY ("payout_id")
);

-- CreateTable
CREATE TABLE "pharmacy_payout_orders" (
    "id" UUID NOT NULL,
    "payout_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "commission_rate_percent" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "pharmacy_earning" DECIMAL(10,2) NOT NULL,
    "payment_status_at_calculation" VARCHAR(30) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_payout_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pharmacy_payouts_shop_id_status_idx" ON "pharmacy_payouts"("shop_id", "status");

-- CreateIndex
CREATE INDEX "pharmacy_payouts_status_created_at_idx" ON "pharmacy_payouts"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pharmacy_payouts_week_start_idx" ON "pharmacy_payouts"("week_start");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_payouts_shop_id_week_start_key" ON "pharmacy_payouts"("shop_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_payout_orders_order_id_key" ON "pharmacy_payout_orders"("order_id");

-- CreateIndex
CREATE INDEX "pharmacy_payout_orders_payout_id_idx" ON "pharmacy_payout_orders"("payout_id");

-- CreateIndex
CREATE INDEX "pharmacy_payout_orders_order_id_idx" ON "pharmacy_payout_orders"("order_id");

-- CreateIndex
CREATE INDEX "pharmacy_payout_orders_branch_id_idx" ON "pharmacy_payout_orders"("branch_id");

-- AddForeignKey
ALTER TABLE "pharmacy_payouts" ADD CONSTRAINT "pharmacy_payouts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_payout_orders" ADD CONSTRAINT "pharmacy_payout_orders_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "pharmacy_payouts"("payout_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_payout_orders" ADD CONSTRAINT "pharmacy_payout_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;
