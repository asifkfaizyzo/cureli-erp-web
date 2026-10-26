// backend/scripts/migrate-delivery-tiers.js
// One-time migration: flat delivery columns → delivery_tiers_json
// Also injects mode:"FULL" into existing slash tiers.
// Idempotent — safe to re-run.
// Run: node scripts/migrate-delivery-tiers.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('═══ Delivery Tiers Migration ═══\n');

  // ── Step 1: Migrate DeliveryPricingConfig rows ───────────
  const configs = await prisma.deliveryPricingConfig.findMany();
  console.log(`Found ${configs.length} DeliveryPricingConfig row(s)\n`);

  for (const cfg of configs) {
    // Skip if already migrated
    if (
      cfg.delivery_tiers_json &&
      Array.isArray(cfg.delivery_tiers_json) &&
      cfg.delivery_tiers_json.length > 0
    ) {
      console.log(`  ⊘ ${cfg.fulfillment_type}: already has delivery_tiers_json — skipping`);
      continue;
    }

    // Use the OLD max thresholds directly as the NEXT tier's min_order_value
    // so the boundary behaviour matches the old `subtotal < max` comparison exactly.
    // Old: subtotal < 299.99 → tier 1.  New: subtotal >= 299.99 → tier 2.  Same boundary.
    const tiers = [
      {
        min_order_value: 0,
        flat_charge:     Number(cfg.delivery_tier_1_charge),
        free_radius_km:  Number(cfg.free_km_radius),
        per_km_rate:     Number(cfg.per_km_tier_1_rate),
      },
      {
        min_order_value: Number(cfg.delivery_tier_1_max),
        flat_charge:     Number(cfg.delivery_tier_2_charge),
        free_radius_km:  Number(cfg.free_km_radius),
        per_km_rate:     Number(cfg.per_km_tier_1_rate),
      },
      {
        min_order_value: Number(cfg.delivery_tier_2_max),
        flat_charge:     Number(cfg.delivery_tier_3_charge),
        free_radius_km:  Number(cfg.free_km_radius),
        per_km_rate:     Number(cfg.per_km_tier_2_rate),
      },
      {
        min_order_value: Number(cfg.delivery_tier_3_max),
        flat_charge:     Number(cfg.delivery_tier_4_charge),
        free_radius_km:  Number(cfg.free_km_radius),
        per_km_rate:     Number(cfg.per_km_tier_2_rate),
      },
    ];

    await prisma.deliveryPricingConfig.update({
      where: { config_id: cfg.config_id },
      data:  { delivery_tiers_json: tiers },
    });

    console.log(`  ✓ ${cfg.fulfillment_type}: ${tiers.length} tiers written`);
    for (const t of tiers) {
      console.log(
        `      ≥₹${t.min_order_value}  flat ₹${t.flat_charge}  free ${t.free_radius_km}km  ₹${t.per_km_rate}/km`,
      );
    }
  }

  // ── Step 2: Inject mode into SlashDisplayConfig tiers ────
  console.log('\n--- Slash tiers ---');
  const slash = await prisma.slashDisplayConfig.findFirst();

  if (!slash) {
    console.log('  ⚠ No SlashDisplayConfig row found — skipping');
  } else {
    const raw = slash.delivery_tiers;
    const tiers = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);

    let changed = 0;
    for (const t of tiers) {
      if (!t.mode) {
        t.mode = 'FULL';
        changed++;
      }
    }

    if (changed > 0) {
      await prisma.slashDisplayConfig.update({
        where: { config_id: slash.config_id },
        data:  { delivery_tiers: tiers },
      });
      console.log(`  ✓ Added mode="FULL" to ${changed} slash tier(s)`);
    } else {
      console.log('  ✓ All slash tiers already have mode');
    }
  }

  // ── Step 3: Verify ───────────────────────────────────────
  console.log('\n--- Verification ---');
  const verify = await prisma.deliveryPricingConfig.findMany({
    select: { fulfillment_type: true, delivery_tiers_json: true },
  });
  for (const v of verify) {
    const n = Array.isArray(v.delivery_tiers_json) ? v.delivery_tiers_json.length : 0;
    console.log(`  ${v.fulfillment_type}: ${n} tier(s) in JSON`);
  }

  console.log('\n✅ Migration complete. Old flat columns are untouched (rollback-safe).');
}

main()
  .catch((e) => { console.error('❌ Migration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());