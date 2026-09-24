// backend/src/modules/cadmin/pricing/cadminPricing.service.js (do not remove this comment)
// backend/src/modules/cadmin/pricing/cadminPricing.service.js

import prisma from '../../../config/prisma.js';

export async function getPricingConfig() {
  let config = await prisma.deliveryPricingConfig.findFirst();

  // Auto-seed defaults if no config row exists yet
  if (!config) {
    config = await prisma.deliveryPricingConfig.create({ data: {} });
  }

  return config;
}

export async function updatePricingConfig(data, cadmin_id) {
  let existing = await prisma.deliveryPricingConfig.findFirst();

  if (!existing) {
    existing = await prisma.deliveryPricingConfig.create({ data: {} });
  }

  const updated = await prisma.deliveryPricingConfig.update({
    where: { config_id: existing.config_id },
    data: {
      ...data,
      version:    { increment: 1 },
      updated_at: new Date(),
      updated_by: cadmin_id,
    },
  });

  return updated;
}