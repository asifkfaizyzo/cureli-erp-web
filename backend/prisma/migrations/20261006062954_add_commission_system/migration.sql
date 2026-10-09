-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FLAT_PERCENT', 'FLAT_AMOUNT', 'HYBRID', 'CAPPED_PERCENT');

-- CreateEnum
CREATE TYPE "SettlementFrequency" AS ENUM ('PER_ORDER', 'WEEKLY');

-- CreateTable
CREATE TABLE "commission_rules" (
    "rule_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "commission_type" "CommissionType" NOT NULL DEFAULT 'FLAT_PERCENT',
    "flat_percent" DECIMAL(5,2),
    "flat_amount" DECIMAL(10,2),
    "hybrid_percent" DECIMAL(5,2),
    "hybrid_flat_amount" DECIMAL(10,2),
    "capped_percent" DECIMAL(5,2),
    "capped_max_amount" DECIMAL(10,2),
    "commission_base" VARCHAR(30) NOT NULL DEFAULT 'SUBTOTAL',
    "settlement_frequency" "SettlementFrequency" NOT NULL DEFAULT 'PER_ORDER',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspended_until" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "commission_overrides" (
    "override_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commission_overrides_pkey" PRIMARY KEY ("override_id")
);

-- CreateIndex
CREATE INDEX "commission_rules_is_default_idx" ON "commission_rules"("is_default");

-- CreateIndex
CREATE INDEX "commission_rules_is_active_idx" ON "commission_rules"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "commission_overrides_shop_id_key" ON "commission_overrides"("shop_id");

-- CreateIndex
CREATE INDEX "commission_overrides_rule_id_idx" ON "commission_overrides"("rule_id");

-- AddForeignKey
ALTER TABLE "commission_overrides" ADD CONSTRAINT "commission_overrides_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_overrides" ADD CONSTRAINT "commission_overrides_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "commission_rules"("rule_id") ON DELETE RESTRICT ON UPDATE CASCADE;
