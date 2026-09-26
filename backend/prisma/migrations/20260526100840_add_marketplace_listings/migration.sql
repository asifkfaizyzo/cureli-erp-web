-- backend/prisma/migrations/20260526100840_add_marketplace_listings/migration.sql (do not remove this comment)
-- CreateEnum
CREATE TYPE "MarketplaceStockStatus" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK');


-- CreateTable
CREATE TABLE "marketplace_listings" (
    "listing_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "linked_variant_id" UUID NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT false,
    "stock_status" "MarketplaceStockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "marketplace_price" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "branch_category_visibility" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "category_name" VARCHAR(150) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "branch_category_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_listings_shop_id_branch_id_idx" ON "marketplace_listings"("shop_id", "branch_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_branch_id_is_visible_idx" ON "marketplace_listings"("branch_id", "is_visible");

-- CreateIndex
CREATE INDEX "marketplace_listings_linked_variant_id_idx" ON "marketplace_listings"("linked_variant_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_shop_id_branch_id_is_visible_stock_sta_idx" ON "marketplace_listings"("shop_id", "branch_id", "is_visible", "stock_status");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listings_medicine_id_branch_id_key" ON "marketplace_listings"("medicine_id", "branch_id");

-- CreateIndex
CREATE INDEX "branch_category_visibility_branch_id_idx" ON "branch_category_visibility"("branch_id");

-- CreateIndex
CREATE INDEX "branch_category_visibility_shop_id_branch_id_idx" ON "branch_category_visibility"("shop_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_category_visibility_branch_id_category_name_key" ON "branch_category_visibility"("branch_id", "category_name");

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("medicine_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_linked_variant_id_fkey" FOREIGN KEY ("linked_variant_id") REFERENCES "master_medicine_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_category_visibility" ADD CONSTRAINT "branch_category_visibility_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("branch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_category_visibility" ADD CONSTRAINT "branch_category_visibility_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;
