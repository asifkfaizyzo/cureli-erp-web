// backend/scripts/seedPlans.js (do not remove this comment)
// backend/src/scripts/seedPlans.js
//
// Run:  node src/scripts/seedPlans.js
// Wipe: node src/scripts/seedPlans.js --wipe
//
// Seeds 10 PRE_MADE plans covering every badge/pricing combination.
// Does NOT touch existing plans — inserts only if name doesn't exist.
// --wipe flag deletes ONLY plans created by this script (tracked by name prefix).

import "../env.js"; // load .env before prisma
import prisma from "../src/config/prisma.js";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const CADMIN_ID = "5d32ccf0-6971-46c7-b25d-493b46b8d646";

// All seed plan names are prefixed so the wipe script can find them cleanly
const SEED_PREFIX = "[SEED]";

const now = new Date();

// Helper — date N days from now
const daysFromNow = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

// Helper — date N months from now
const monthsFromNow = (n) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() + n);
  return d;
};

// ─────────────────────────────────────────────────────────────
// PLAN DEFINITIONS
// Each covers a distinct badge/pricing scenario
// ─────────────────────────────────────────────────────────────

const SEED_PLANS = [
  // ── 1. Free Trial ─────────────────────────────────────────
  // Badge: none (price=0 shows emerald card, no badge)
  {
    name: `${SEED_PREFIX} Free Trial`,
    description: "Try Cureli free for 14 days. No credit card required.",
    price: 0n,
    compare_at_price: null,
    max_users: 2,
    max_branches: 1,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: false,
    promo_free_until: null,
    intro_price: null,
    intro_trigger_type: null,
    intro_duration_years: null,
    intro_end_date: null,
  },

  // ── 2. Starter — plain paid, no extras ────────────────────
  // Badge: none
  {
    name: `${SEED_PREFIX} Starter`,
    description:
      "Ideal for small independent pharmacies just getting started.",
    price: 4999n,
    compare_at_price: null,
    max_users: 5,
    max_branches: 1,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: false,
    promo_free_until: null,
    intro_price: null,
    intro_trigger_type: null,
    intro_duration_years: null,
    intro_end_date: null,
  },

  // ── 3. Starter Plus — discount via compare_at_price ───────
  // Badge: SAVE 17%
  {
    name: `${SEED_PREFIX} Starter Plus`,
    description: "Everything in Starter, now at a reduced launch price.",
    price: 4999n,
    compare_at_price: 5999n, // 17% off
    max_users: 5,
    max_branches: 2,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: false,
    promo_free_until: null,
    intro_price: null,
    intro_trigger_type: null,
    intro_duration_years: null,
    intro_end_date: null,
  },

  // ── 4. Starter Bonus — bonus months ───────────────────────
  // Badge: +3 MONTHS FREE
  {
    name: `${SEED_PREFIX} Starter Bonus`,
    description: "Pay for a year, get 3 extra months absolutely free.",
    price: 4999n,
    compare_at_price: null,
    max_users: 5,
    max_branches: 2,
    billing_cycle_months: 12,
    bonus_months: 3,
    is_featured: false,
    promo_free_until: null,
    intro_price: null,
    intro_trigger_type: null,
    intro_duration_years: null,
    intro_end_date: null,
  },

  // ── 5. Professional — featured, no extras ─────────────────
  // Badge: MOST POPULAR (is_featured=true, no promo/intro/bonus/discount)
  {
    name: `${SEED_PREFIX} Professional`,
    description:
      "Best for growing pharmacies that need more users and branches.",
    price: 9999n,
    compare_at_price: null,
    max_users: 15,
    max_branches: 5,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: true,
    promo_free_until: null,
    intro_price: null,
    intro_trigger_type: null,
    intro_duration_years: null,
    intro_end_date: null,
  },

  // ── 6. Professional Intro (duration trigger) ───────────────
  // Badge: ₹6999 FOR FIRST 1 YEAR
  // Shows: intro price → then regular price
  // intro_duration_years stores months (12 = 1 year) per display logic
  {
    name: `${SEED_PREFIX} Professional Intro`,
    description:
      "Start at our introductory rate for the first year, then standard pricing.",
    price: 9999n,
    compare_at_price: null,
    max_users: 15,
    max_branches: 5,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: false,
    promo_free_until: null,
    intro_price: 6999n,
    intro_trigger_type: "duration",
    intro_duration_years: 1, // 12 months = 1 year (consumed by formatDuration)
    intro_end_date: null,
  },

  // ── 7. Professional Intro (date trigger) ──────────────────
  // Badge: ₹6999 UNTIL 31 DEC 2025 (or whatever date)
  // Shows: intro price active until intro_end_date
  {
    name: `${SEED_PREFIX} Professional Early Bird`,
    description:
      "Lock in our early-bird rate before the offer ends. Price goes up after.",
    price: 9999n,
    compare_at_price: null,
    max_users: 15,
    max_branches: 5,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: false,
    promo_free_until: null,
    intro_price: 7499n,
    intro_trigger_type: "date",
    intro_duration_years: null,
    intro_end_date: daysFromNow(90), // 90 days from now
  },

  // ── 8. Growth — promo free until (price > 0) ──────────────
  // Badge: FREE UNTIL <date>
  // Shows: FREE as price, then regular price after promo
  {
    name: `${SEED_PREFIX} Growth`,
    description:
      "Use Cureli free for the next 2 months as part of our launch promotion.",
    price: 7999n,
    compare_at_price: null,
    max_users: 10,
    max_branches: 3,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: false,
    promo_free_until: daysFromNow(60), // free for 60 days
    intro_price: null,
    intro_trigger_type: null,
    intro_duration_years: null,
    intro_end_date: null,
  },

  // ── 9. Enterprise — plain high-tier ───────────────────────
  // Badge: none
  {
    name: `${SEED_PREFIX} Enterprise`,
    description:
      "For large pharmacy chains needing high user counts and multi-branch access.",
    price: 24999n,
    compare_at_price: null,
    max_users: 50,
    max_branches: 20,
    billing_cycle_months: 12,
    bonus_months: 0,
    is_featured: false,
    promo_free_until: null,
    intro_price: null,
    intro_trigger_type: null,
    intro_duration_years: null,
    intro_end_date: null,
  },

  // ── 10. Enterprise Max — everything stacked ───────────────
  // Priority: intro wins (highest badge priority for paid plans)
  // Badge: INTRO PRICING badge (intro beats discount, bonus, featured)
  // Also has: compare_at_price, bonus_months, is_featured
  // This tests that only ONE badge shows despite multiple conditions
  {
    name: `${SEED_PREFIX} Enterprise Max`,
    description:
      "Our most complete plan. Intro pricing active, plus bonus months included.",
    price: 29999n,
    compare_at_price: 34999n, // 14% off — but intro badge takes priority
    max_users: -1,           // -1 = unlimited
    max_branches: -1,        // -1 = unlimited
    billing_cycle_months: 12,
    bonus_months: 2,         // bonus months exist but badge suppressed by intro
    is_featured: true,       // featured exists but badge suppressed by intro
    promo_free_until: null,
    intro_price: 19999n,
    intro_trigger_type: "duration",
    intro_duration_years: 2, // 24 months = 2 years at intro price
    intro_end_date: null,
  },
];

// ─────────────────────────────────────────────────────────────
// WIPE FUNCTION
// Deletes only plans whose names start with SEED_PREFIX
// ─────────────────────────────────────────────────────────────

async function wipeSeedPlans() {
  console.log(`\n🗑  Wiping plans prefixed with "${SEED_PREFIX}"...\n`);

  // Must delete activity logs first (FK constraint)
  const seedPlans = await prisma.plan.findMany({
    where: {
      name: { startsWith: SEED_PREFIX },
      deleted_at: null,
    },
    select: { plan_id: true, name: true },
  });

  if (seedPlans.length === 0) {
    console.log("  No seed plans found to wipe.");
    return;
  }

  const ids = seedPlans.map((p) => p.plan_id);

  // Check if any have active subscriptions — refuse to wipe those
  const activeSubCount = await prisma.shopSubscription.count({
    where: {
      plan_id: { in: ids },
      is_active: true,
    },
  });

  if (activeSubCount > 0) {
    console.error(
      `  ❌  Cannot wipe: ${activeSubCount} active subscription(s) reference these plans.`
    );
    console.error(
      "     Deactivate or migrate those subscriptions first.\n"
    );
    process.exit(1);
  }

  // Delete activity logs then plans
  const deletedLogs = await prisma.planActivityLog.deleteMany({
    where: { plan_id: { in: ids } },
  });

  const deletedPlans = await prisma.plan.deleteMany({
    where: { plan_id: { in: ids } },
  });

  console.log(`  ✅  Deleted ${deletedPlans.count} plan(s)`);
  console.log(`  ✅  Deleted ${deletedLogs.count} activity log(s)`);
  seedPlans.forEach((p) => console.log(`     — ${p.name}`));
  console.log();
}

// ─────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────

async function seedPlans() {
  console.log("\n🌱  Seeding plans...\n");

  let created = 0;
  let skipped = 0;

  for (const planData of SEED_PLANS) {
    // Check if name already exists (any status, not deleted)
    const existing = await prisma.plan.findFirst({
      where: {
        name: planData.name,
        deleted_at: null,
      },
    });

    if (existing) {
      console.log(`  ⏭  Skipped  — already exists: "${planData.name}"`);
      skipped++;
      continue;
    }

    // Create as ACTIVE directly (skip DRAFT for seed visibility)
    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: {
          ...planData,
          type: "PRE_MADE",
          status: "ACTIVE",
          activated_at: now,
          created_by: CADMIN_ID,
          deleted_at: null,
        },
      });

      await tx.planActivityLog.create({
        data: {
          plan_id: created.plan_id,
          cadmin_id: CADMIN_ID,
          action: "seeded",
          from_status: null,
          to_status: "ACTIVE",
          meta: { seeded_by: "seedPlans.js" },
        },
      });

      return created;
    });

    console.log(`  ✅  Created — "${plan.name}" (${plan.plan_id})`);
    created++;
  }

  console.log(`\n  Done. Created: ${created}  Skipped: ${skipped}\n`);
}

// ─────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────

async function main() {
  const isWipe = process.argv.includes("--wipe");

  try {
    if (isWipe) {
      await wipeSeedPlans();
    } else {
      await seedPlans();
    }
  } catch (err) {
    console.error("\n❌  Script failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();