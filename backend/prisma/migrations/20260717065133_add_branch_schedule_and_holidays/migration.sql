-- backend/prisma/migrations/20260717065133_add_branch_schedule_and_holidays/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "BranchHolidayScope" AS ENUM ('BRANCH', 'SHOP');

-- AlterTable
ALTER TABLE "branch_marketplace_settings" ADD COLUMN     "last_auto_opened_date" VARCHAR(10),
ADD COLUMN     "open_days" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "branch_holidays" (
    "holiday_id" UUID NOT NULL,
    "scope" "BranchHolidayScope" NOT NULL DEFAULT 'BRANCH',
    "branch_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "holiday_date" DATE NOT NULL,
    "reason" VARCHAR(200),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_holidays_pkey" PRIMARY KEY ("holiday_id")
);

-- CreateIndex
CREATE INDEX "branch_holidays_branch_id_holiday_date_idx" ON "branch_holidays"("branch_id", "holiday_date");

-- CreateIndex
CREATE INDEX "branch_holidays_shop_id_holiday_date_idx" ON "branch_holidays"("shop_id", "holiday_date");

-- CreateIndex
CREATE INDEX "branch_holidays_holiday_date_idx" ON "branch_holidays"("holiday_date");

-- CreateIndex
CREATE UNIQUE INDEX "branch_holidays_branch_id_holiday_date_scope_key" ON "branch_holidays"("branch_id", "holiday_date", "scope");

-- AddForeignKey
ALTER TABLE "branch_holidays" ADD CONSTRAINT "branch_holidays_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch_marketplace_settings"("branch_id") ON DELETE CASCADE ON UPDATE CASCADE;
