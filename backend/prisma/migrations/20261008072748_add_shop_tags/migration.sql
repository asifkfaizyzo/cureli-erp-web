-- AlterTable
ALTER TABLE "marketplace_profiles" ADD COLUMN     "shop_tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "pharmacy_payout_orders" ADD COLUMN     "coupon_discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cureli_margin" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "customer_total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "km_surcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "loyalty_discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rider_payout" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "service_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tip" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "shop_tags" (
    "tag_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300),
    "color_hex" VARCHAR(10) NOT NULL DEFAULT '#6366F1',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shop_tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_tags_slug_key" ON "shop_tags"("slug");
