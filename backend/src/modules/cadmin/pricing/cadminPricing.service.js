// backend/src/modules/cadmin/pricing/cadminPricing.service.js (do not remove this comment)

import prisma from '../../../config/prisma.js';

// ── Whitelist of editable pricing fields (matches DeliveryPricingConfig model) ──
const NUMERIC_FIELDS = [
  'service_tier_1_max',
  'service_tier_1_charge',
  'service_tier_2_max',
  'service_tier_2_charge',
  'service_tier_3_charge',
  'delivery_tier_1_max',
  'delivery_tier_1_charge',
  'delivery_tier_2_max',
  'delivery_tier_2_charge',
  'delivery_tier_3_max',
  'delivery_tier_3_charge',
  'delivery_tier_4_charge',
  'free_km_radius',
  'per_km_tier_1_max',
  'per_km_tier_1_rate',
  'per_km_tier_2_rate',
];

export async function getPricingConfig() {
  let config = await prisma.deliveryPricingConfig.findFirst();

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

  // ── Build clean update payload from whitelist only ──
  const updateData = {};

  // Numeric fields: coerce to Number, preserve 0 as valid
  for (const key of NUMERIC_FIELDS) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      updateData[key] = Number(data[key]);
    }
  }

  // max_delivery_km: nullable — empty string / 0 / null → null
  if ('max_delivery_km' in data) {
    const raw = data.max_delivery_km;
    if (raw === null || raw === '' || raw === 0 || raw === '0') {
      updateData.max_delivery_km = null;
    } else {
      updateData.max_delivery_km = Number(raw);
    }
  }

  // tip_enabled: boolean
  if ('tip_enabled' in data) {
    updateData.tip_enabled = Boolean(data.tip_enabled);
  }

  // Version bump + audit
  updateData.version = { increment: 1 };
  if (cadmin_id) {
    updateData.updated_by = cadmin_id;
  }
  // NOTE: updated_at is handled automatically by Prisma's @updatedAt

  const updated = await prisma.deliveryPricingConfig.update({
    where: { config_id: existing.config_id },
    data: updateData,
  });

  return updated;
}