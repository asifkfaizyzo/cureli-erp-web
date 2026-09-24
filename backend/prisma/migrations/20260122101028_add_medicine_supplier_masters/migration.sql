-- backend/prisma/migrations/20260122101028_add_medicine_supplier_masters/migration.sql (do not remove this comment)
-- CreateTable
CREATE TABLE "medicines" (
    "medicine_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "generic_name" VARCHAR(200),
    "manufacturer" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100),
    "sub_category" VARCHAR(100),
    "schedule" VARCHAR(50),
    "hsn_code" VARCHAR(20),
    "pack_size" VARCHAR(50),
    "unit_of_measure" TEXT NOT NULL DEFAULT 'UNIT',
    "gst_percentage" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "cgst_percentage" DECIMAL(5,2) NOT NULL DEFAULT 6,
    "sgst_percentage" DECIMAL(5,2) NOT NULL DEFAULT 6,
    "rack_no" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_discontinued" BOOLEAN NOT NULL DEFAULT false,
    "shop_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("medicine_id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "supplier_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "supplier_code" VARCHAR(50),
    "contact_person" VARCHAR(100),
    "office_phone" VARCHAR(20),
    "personal_phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(10),
    "gst_number" VARCHAR(15),
    "pan_number" VARCHAR(10),
    "drug_license_no" VARCHAR(50),
    "credit_days" INTEGER NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(12,2),
    "bank_name" VARCHAR(100),
    "account_number" VARCHAR(50),
    "ifsc_code" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "shop_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateIndex
CREATE INDEX "medicines_shop_id_is_active_idx" ON "medicines"("shop_id", "is_active");

-- CreateIndex
CREATE INDEX "medicines_shop_id_name_idx" ON "medicines"("shop_id", "name");

-- CreateIndex
CREATE INDEX "medicines_hsn_code_idx" ON "medicines"("hsn_code");

-- CreateIndex
CREATE INDEX "medicines_manufacturer_idx" ON "medicines"("manufacturer");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_shop_id_name_manufacturer_key" ON "medicines"("shop_id", "name", "manufacturer");

-- CreateIndex
CREATE INDEX "suppliers_shop_id_is_active_idx" ON "suppliers"("shop_id", "is_active");

-- CreateIndex
CREATE INDEX "suppliers_shop_id_name_idx" ON "suppliers"("shop_id", "name");

-- CreateIndex
CREATE INDEX "suppliers_gst_number_idx" ON "suppliers"("gst_number");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_shop_id_name_key" ON "suppliers"("shop_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_shop_id_gst_number_key" ON "suppliers"("shop_id", "gst_number");

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
