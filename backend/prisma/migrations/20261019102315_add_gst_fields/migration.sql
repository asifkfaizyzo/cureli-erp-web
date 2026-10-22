-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "gst_amount" DECIMAL(10,2),
ADD COLUMN     "gst_breakdown" JSONB,
ADD COLUMN     "gst_rate" DECIMAL(5,2),
ADD COLUMN     "gst_type" TEXT;

-- AlterTable
ALTER TABLE "delivery_pricing_config" ADD COLUMN     "gst_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gst_on_delivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gst_on_packaging" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gst_on_service" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gst_on_subtotal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gst_type" TEXT NOT NULL DEFAULT 'CGST_SGST';

-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "gst_amount" DECIMAL(10,2),
ADD COLUMN     "gst_breakdown" JSONB,
ADD COLUMN     "gst_rate" DECIMAL(5,2),
ADD COLUMN     "gst_type" TEXT;
