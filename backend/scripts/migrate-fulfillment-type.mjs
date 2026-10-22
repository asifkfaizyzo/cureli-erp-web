// backend/scripts/migrate-fulfillment-type.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Set all existing orders to INSTANT_DELIVERY
  const orderResult = await prisma.marketplaceOrder.updateMany({
    where: {},
    data: { fulfillment_type: 'INSTANT_DELIVERY' },
  });
  console.log(`Updated ${orderResult.count} orders to INSTANT_DELIVERY`);

  // 2. Duplicate pricing config for each fulfillment type
  const existing = await prisma.deliveryPricingConfig.findFirst();
  if (!existing) {
    console.log('No existing pricing config found. Skipping.');
    return;
  }

  // Update existing row to have explicit fulfillment_type
  await prisma.deliveryPricingConfig.update({
    where: { config_id: existing.config_id },
    data: {
      fulfillment_type: 'INSTANT_DELIVERY',
      service_charge_enabled: true,
      delivery_fee_enabled: true,
      km_surcharge_enabled: true,
      packing_enabled: false,
    },
  });

  const types = ['PICKUP', 'SAME_DAY', 'NEXT_DAY'];
  for (const type of types) {
    const isPickup = type === 'PICKUP';
    await prisma.deliveryPricingConfig.create({
      data: {
        fulfillment_type: type,
        service_charge_enabled: true,
        delivery_fee_enabled: !isPickup,
        km_surcharge_enabled: !isPickup,
        packing_enabled: isPickup,
        service_tier_1_max: existing.service_tier_1_max,
        service_tier_1_charge: existing.service_tier_1_charge,
        service_tier_2_max: existing.service_tier_2_max,
        service_tier_2_charge: existing.service_tier_2_charge,
        service_tier_3_charge: existing.service_tier_3_charge,
        delivery_tier_1_max: existing.delivery_tier_1_max,
        delivery_tier_1_charge: existing.delivery_tier_1_charge,
        delivery_tier_2_max: existing.delivery_tier_2_max,
        delivery_tier_2_charge: existing.delivery_tier_2_charge,
        delivery_tier_3_max: existing.delivery_tier_3_max,
        delivery_tier_3_charge: existing.delivery_tier_3_charge,
        delivery_tier_4_charge: existing.delivery_tier_4_charge,
        packing_tier_1_max: existing.service_tier_1_max,
        packing_tier_1_charge: 10,
        packing_tier_2_max: existing.service_tier_2_max,
        packing_tier_2_charge: 8,
        packing_tier_3_charge: 5,
        free_km_radius: existing.free_km_radius,
        per_km_tier_1_max: existing.per_km_tier_1_max,
        per_km_tier_1_rate: existing.per_km_tier_1_rate,
        per_km_tier_2_rate: existing.per_km_tier_2_rate,
        max_delivery_km: existing.max_delivery_km,
        tip_enabled: isPickup ? false : existing.tip_enabled,
      },
    });
    console.log(`Created pricing config for ${type}`);
  }

  console.log('Migration complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());