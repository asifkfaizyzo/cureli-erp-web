-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN     "delivery_otp" VARCHAR(6),
ADD COLUMN     "pickup_otp" VARCHAR(6);

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;
