// backend/prisma/seed.rider-dashboard.js (do not remove this comment)
// Seeds rider dashboard test data:
//  - Keeps existing seed data intact
//  - Wipes & recreates: rider-related data, surge rules, incentives, dummy orders
//  - Creates 1 TEAM rider (new phone) alongside existing INDEPENDENT rider
//  - Populates: deliveries (today, yesterday, this week, last week, this month),
//    assignment logs, online sessions, surge rule, incentives, payouts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const uuid = () => randomUUID();

/* ════════════════════════════════════════════════════════
   CONFIG
   ════════════════════════════════════════════════════════ */

// Reference "now" = 3 Oct 2026, 2:00 PM IST (so we're within today's 6AM-6AM shift)
const NOW = new Date("2026-10-03T14:00:00+05:30");

const TEAM_RIDER = {
  phone: "9876543210",
  email: "team.rider@cureli.com",
  password: "Qwerty@11",
  full_name: "Rajesh Kumar",
  date_of_birth: "1992-04-10",
  sex: "MALE",
  current_city: "Kochi",
  residential_address: "Flat 2A, Palm Grove, Edappally, Kochi",
  preferred_lat: 10.0260,
  preferred_lng: 76.3080,
  preferred_address: "Edappally, Kochi",
  vehicle_type: "bike",
  vehicle_number: "KL-07-CD-5678",
  vehicle_make_model: "TVS Jupiter",
  bank_account_number: "9876543210987",
  bank_ifsc: "HDFC0001234",
  bank_holder_name: "Rajesh Kumar",
  bank_name: "HDFC Bank",
  emergency_contact_name: "Lakshmi Kumar",
  emergency_contact_phone: "9876543211",
};

/* ════════════════════════════════════════════════════════
   TIME HELPERS
   ════════════════════════════════════════════════════════ */

function getShiftWindow(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth();
  const dd = d.getDate();
  return {
    shiftStart: new Date(y, m, dd, 6, 0, 0, 0),
    shiftEnd: new Date(y, m, dd + 1, 5, 59, 59, 999),
  };
}

function getShiftDateUTC(date) {
  const d = new Date(date);
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function getWeekStartMonday6AM(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(6, 0, 0, 0);
  if (date < d) d.setDate(d.getDate() - 7);
  return d;
}

function daysAgo(n, baseDate = NOW) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n, baseDate = NOW) {
  return new Date(baseDate.getTime() - n * 60 * 60 * 1000);
}

function minutesAgo(n, baseDate = NOW) {
  return new Date(baseDate.getTime() - n * 60 * 1000);
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ════════════════════════════════════════════════════════
   CLEANUP (rider dashboard scope only — no main data wipe)
   ════════════════════════════════════════════════════════ */

async function cleanup() {
  console.log("🧹 Cleaning rider dashboard data...");

  // Ledger & payouts
  await prisma.riderEarningLedger.deleteMany();
  await prisma.riderPayout.deleteMany();

  // Delivery-related
  await prisma.deliveryAssignmentLog.deleteMany();
  await prisma.deliveryChat.deleteMany();
  await prisma.riderRating.deleteMany();
  await prisma.riderGivesRating.deleteMany();
  await prisma.delivery.deleteMany();

  // Dummy orders we created for FK satisfaction
  await prisma.marketplaceOrderStatusHistory.deleteMany({
    where: { reason: "dashboard_seed" },
  });
  await prisma.marketplaceOrder.deleteMany({
    where: { notes: "dashboard_seed" },
  });

  // Online sessions
  await prisma.riderOnlineSession.deleteMany();

  // Incentives (full wipe & reseed per user request)
  await prisma.incentiveSchedule.deleteMany();
  await prisma.incentiveTier.deleteMany();
  await prisma.incentiveTemplate.deleteMany();

  // Surge rules
  await prisma.riderSurgeRule.deleteMany();

  // Pricing config (so we can reference it on deliveries)
  await prisma.pricingDistanceSlab.deleteMany();
  await prisma.riderPricingConfig.deleteMany();

  // TEAM rider (if previously seeded)
  const existingTeamRider = await prisma.rider.findFirst({
    where: { phone: TEAM_RIDER.phone },
  });
  if (existingTeamRider) {
    await prisma.riderDocument.deleteMany({
      where: { rider_id: existingTeamRider.rider_id },
    });
    await prisma.riderSession.deleteMany({
      where: { rider_id: existingTeamRider.rider_id },
    });
    await prisma.rider.delete({
      where: { rider_id: existingTeamRider.rider_id },
    });
  }

  console.log("✅ Cleaned\n");
}

/* ════════════════════════════════════════════════════════
   PRICING CONFIG (for reference on deliveries)
   ════════════════════════════════════════════════════════ */

async function createPricingConfig() {
  console.log("💰 Creating pricing config...");

  const config = await prisma.riderPricingConfig.create({
    data: {
      config_id: uuid(),
      name: "Default Config v1",
      status: "ACTIVE",
      min_floor_payout: 25.0,
      pickup_base_fee: 10.0,
      drop_base_fee: 15.0,
      effective_from: daysAgo(30),
    },
  });

  await prisma.pricingDistanceSlab.createMany({
    data: [
      {
        slab_id: uuid(),
        config_id: config.config_id,
        leg_type: "LEG_1_PICKUP",
        from_km: 0,
        to_km: 3,
        rate_type: "PER_KM",
        rate: 5.0,
      },
      {
        slab_id: uuid(),
        config_id: config.config_id,
        leg_type: "LEG_2_DROP",
        from_km: 0,
        to_km: 3,
        rate_type: "PER_KM",
        rate: 7.0,
      },
    ],
  });

  console.log("   ✅ Pricing config created\n");
  return config;
}

/* ════════════════════════════════════════════════════════
   SURGE RULE
   ════════════════════════════════════════════════════════ */

async function createSurgeRule() {
  console.log("⚡ Creating active surge rule...");

  const rule = await prisma.riderSurgeRule.create({
    data: {
      rule_id: uuid(),
      name: "Evening Rain Surge",
      description: "1.5x pricing due to heavy rain",
      is_active: true,
      calc_type: "MULTIPLIER",
      value: 1.5,
      expires_at: hoursAgo(-3), // expires 3 hours from NOW
      activated_at: hoursAgo(1),
    },
  });

  console.log("   ✅ Surge rule active (1.5x)\n");
  return rule;
}

/* ════════════════════════════════════════════════════════
   INCENTIVES (daily + weekly)
   ════════════════════════════════════════════════════════ */

async function createIncentives() {
  console.log("🎯 Creating incentive templates & schedules...");

  // ── DAILY INCENTIVE ──
  const dailyTemplate = await prisma.incentiveTemplate.create({
    data: {
      template_id: uuid(),
      title: "Daily Order Streak",
      description: "Complete more orders today to unlock bonuses",
      period_type: "DAILY",
      metric_type: "ORDER_COUNT",
      min_online_hours: 2,
      max_denial_count: 5,
      max_cancellation_count: 2,
      min_acceptance_rate: 70,
      min_completion_rate: 85,
      is_active: true,
      tiers: {
        create: [
          { tier_id: uuid(), tier_level: 1, target_value: 5, reward_amount: 30 },
          { tier_id: uuid(), tier_level: 2, target_value: 10, reward_amount: 80 },
          { tier_id: uuid(), tier_level: 3, target_value: 15, reward_amount: 130 },
          { tier_id: uuid(), tier_level: 4, target_value: 20, reward_amount: 180 },
          { tier_id: uuid(), tier_level: 5, target_value: 25, reward_amount: 230 },
          { tier_id: uuid(), tier_level: 6, target_value: 30, reward_amount: 280 },
        ],
      },
    },
  });

  // Schedule DAILY from today's shift date for 30 days
  const todayShiftDateUTC = getShiftDateUTC(NOW);
  const dailyEndDate = new Date(todayShiftDateUTC);
  dailyEndDate.setUTCDate(dailyEndDate.getUTCDate() + 30);

  await prisma.incentiveSchedule.create({
    data: {
      schedule_id: uuid(),
      template_id: dailyTemplate.template_id,
      start_date: todayShiftDateUTC,
      end_date: dailyEndDate,
      is_featured: true,
      custom_tag: "FEATURED",
      is_active: true,
    },
  });

  console.log("   ✅ Daily incentive scheduled");

  // ── WEEKLY INCENTIVE ──
  const weeklyTemplate = await prisma.incentiveTemplate.create({
    data: {
      template_id: uuid(),
      title: "Weekly Earnings Challenge",
      description: "Earn base fees this week to unlock weekly bonuses",
      period_type: "WEEKLY",
      metric_type: "BASE_EARNINGS",
      min_online_hours: 10,
      max_denial_count: 15,
      max_cancellation_count: 5,
      min_acceptance_rate: 65,
      min_completion_rate: 80,
      is_active: true,
      tiers: {
        create: [
          { tier_id: uuid(), tier_level: 1, target_value: 5, reward_amount: 30 },
          { tier_id: uuid(), tier_level: 2, target_value: 255, reward_amount: 80 },
          { tier_id: uuid(), tier_level: 3, target_value: 505, reward_amount: 130 },
          { tier_id: uuid(), tier_level: 4, target_value: 755, reward_amount: 180 },
          { tier_id: uuid(), tier_level: 5, target_value: 1005, reward_amount: 230 },
          { tier_id: uuid(), tier_level: 6, target_value: 1255, reward_amount: 280 },
        ],
      },
    },
  });

  const weekStart = getWeekStartMonday6AM(NOW);
  const weeklyStartDateUTC = new Date(
    Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
  );
  const weeklyEndDate = new Date(weeklyStartDateUTC);
  weeklyEndDate.setUTCDate(weeklyEndDate.getUTCDate() + 6);

  await prisma.incentiveSchedule.create({
    data: {
      schedule_id: uuid(),
      template_id: weeklyTemplate.template_id,
      start_date: weeklyStartDateUTC,
      end_date: weeklyEndDate,
      is_featured: false,
      is_active: true,
    },
  });

  console.log("   ✅ Weekly incentive scheduled\n");
}

/* ════════════════════════════════════════════════════════
   TEAM RIDER CREATION
   ════════════════════════════════════════════════════════ */

async function createTeamRider() {
  console.log("🏍️  Creating TEAM rider (Rajesh)...");

  const rider = await prisma.rider.create({
    data: {
      rider_id: uuid(),
      phone: TEAM_RIDER.phone,
      password_hash: await bcrypt.hash(TEAM_RIDER.password, 10),
      rider_type: "TEAM",
      full_name: TEAM_RIDER.full_name,
      email: TEAM_RIDER.email,
      date_of_birth: new Date(TEAM_RIDER.date_of_birth),
      sex: TEAM_RIDER.sex,
      profile_photo_key: "rider_documents/rajesh_profile_photo.jpg",
      current_city: TEAM_RIDER.current_city,
      residential_address: TEAM_RIDER.residential_address,
      preferred_lat: TEAM_RIDER.preferred_lat,
      preferred_lng: TEAM_RIDER.preferred_lng,
      preferred_address: TEAM_RIDER.preferred_address,
      vehicle_type: TEAM_RIDER.vehicle_type,
      vehicle_number: TEAM_RIDER.vehicle_number,
      vehicle_make_model: TEAM_RIDER.vehicle_make_model,
      status: "ACTIVE",
      onboarding_step: "COMPLETED",
      submitted_for_review: true,
      first_submitted_at: NOW,
      is_online: false,
      bank_account_number: TEAM_RIDER.bank_account_number,
      bank_ifsc: TEAM_RIDER.bank_ifsc,
      bank_holder_name: TEAM_RIDER.bank_holder_name,
      bank_name: TEAM_RIDER.bank_name,
      bank_verified: true,
      terms_accepted_at: NOW,
      emergency_contact_name: TEAM_RIDER.emergency_contact_name,
      emergency_contact_phone: TEAM_RIDER.emergency_contact_phone,
      referral_code: "TEAMRAJESH26",
      rating: 4.7,
      total_ratings: 25,
      total_deliveries: 112,
      last_seen_at: NOW,
    },
  });

  // Documents (all approved)
  const docs = [
    { type: "PROFILE_PHOTO", storage_key: "rider_documents/rajesh_profile.jpg" },
    {
      type: "AADHAAR_FRONT",
      storage_key: "rider_documents/rajesh_aadhaar_front.jpg",
      back_storage_key: "rider_documents/rajesh_aadhaar_back.jpg",
    },
    { type: "PAN_FRONT", storage_key: "rider_documents/rajesh_pan.jpg" },
    {
      type: "DRIVING_LICENSE_FRONT",
      storage_key: "rider_documents/rajesh_dl_front.jpg",
      back_storage_key: "rider_documents/rajesh_dl_back.jpg",
    },
    { type: "VEHICLE_RC", storage_key: "rider_documents/rajesh_rc.jpg" },
  ];

  const superAdmin = await prisma.cAdmin.findFirst({
    where: { is_super_cadmin: true },
  });

  for (const doc of docs) {
    await prisma.riderDocument.create({
      data: {
        document_id: uuid(),
        rider_id: rider.rider_id,
        type: doc.type,
        storage_key: doc.storage_key,
        back_storage_key: doc.back_storage_key || null,
        status: "APPROVED",
        reviewed_by: superAdmin?.cadmin_id,
        reviewed_at: NOW,
        uploaded_at: NOW,
      },
    });
  }

  console.log(`   ✅ ${rider.full_name} (${rider.phone}) — TEAM, ACTIVE\n`);
  return rider;
}

/* ════════════════════════════════════════════════════════
   HELPER: Get or create a shop/branch/customer for FK
   ════════════════════════════════════════════════════════ */

async function getFKReferences() {
  const shop = await prisma.shop.findFirst();
  const branch = await prisma.branch.findFirst({
    where: { shop_id: shop?.shop_id },
  });
  const customer = await prisma.cureliMobileUser.findFirst();

  if (!shop || !branch || !customer) {
    throw new Error(
      "Missing shop/branch/customer. Run the main seed.dev.js first.",
    );
  }

  return { shop, branch, customer };
}

/* ════════════════════════════════════════════════════════
   DUMMY ORDER CREATION (minimal, FK-satisfying)
   ════════════════════════════════════════════════════════ */

let orderCounter = 1;
// Convert timestamp to Base-36 (8 chars) to prevent VarChar(20) overflow
const seedSessionId = Date.now().toString(36); 

async function createDummyOrder(fk, placedAt) {
  const orderNumber = `D-${seedSessionId}-${orderCounter++}`;

  return prisma.marketplaceOrder.create({
    data: {
      order_id: uuid(),
      order_number: orderNumber,
      shop_id: fk.shop.shop_id,
      branch_id: fk.branch.branch_id,
      customer_id: fk.customer.id,
      delivery_address_snapshot: {
        address_line_1: "Dummy Address",
        city: "Kochi",
        pincode: "682001",
      },
      customer_name_snapshot: fk.customer.full_name || "Test Customer",
      customer_phone_snapshot: fk.customer.phone,
      status: "COMPLETED",
      payment_method: "COD",
      payment_status: "PAID",
      subtotal: 100,
      total_amount: 100,
      notes: "dashboard_seed",
      placed_at: placedAt,
      completed_at: placedAt,
    },
  });
}

/* ════════════════════════════════════════════════════════
   DELIVERY CREATION HELPER
   ════════════════════════════════════════════════════════ */

async function createDelivery(opts) {
  const {
    riderId,
    orderId,
    status,
    deliveredAt,
    failedAt,
    cancelledAt,
    pickupFee = 25,
    dropFee = 35,
    surgeFee = 0,
    floorTopup = 0,
    tipAmount = 0,
    pickupKm = 2.5,
    dropKm = 3.0,
    pricingConfigId,
  } = opts;

  const totalEarning = pickupFee + dropFee + surgeFee + floorTopup;

  return prisma.delivery.create({
    data: {
      delivery_id: uuid(),
      order_id: orderId,
      rider_id: riderId,
      status,
      assigned_at: deliveredAt || failedAt || cancelledAt,
      accepted_at: deliveredAt || failedAt || cancelledAt,
      arrived_at_pharmacy_at: deliveredAt || failedAt || cancelledAt,
      pharmacy_confirmed_at: deliveredAt || failedAt || cancelledAt,
      picked_up_at: deliveredAt || failedAt || cancelledAt,
      arrived_at_customer_at: deliveredAt,
      delivered_at: deliveredAt,
      failed_at: failedAt,
      failure_reason: failedAt ? "CUSTOMER_UNAVAILABLE" : null,
      pickup_lat: 9.9716,
      pickup_lng: 76.2753,
      drop_lat: 9.9816,
      drop_lng: 76.2853,
      pickup_distance_km: pickupKm,
      drop_distance_km: dropKm,
      total_distance_km: pickupKm + dropKm,
      pickup_fee: status === "DELIVERED" ? pickupFee : null,
      drop_fee: status === "DELIVERED" ? dropFee : null,
      surge_fee: status === "DELIVERED" ? surgeFee : null,
      floor_topup_fee: status === "DELIVERED" ? floorTopup : null,
      total_rider_earning: status === "DELIVERED" ? totalEarning : null,
      tip_amount: status === "DELIVERED" ? tipAmount : null,
      pricing_config_id: pricingConfigId,
      created_at: deliveredAt || failedAt || cancelledAt,
      updated_at: cancelledAt || failedAt || deliveredAt,
    },
  });
}

/* ════════════════════════════════════════════════════════
   ONLINE SESSION HELPER
   ════════════════════════════════════════════════════════ */

async function createOnlineSession(riderId, start, end, closedBy = "rider") {
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.round((durationMs / 60_000) * 100) / 100;

  return prisma.riderOnlineSession.create({
    data: {
      session_id: uuid(),
      rider_id: riderId,
      went_online_at: start,
      went_offline_at: end,
      duration_minutes: durationMinutes,
      shift_date: getShiftDateUTC(start),
      closed_by: closedBy,
    },
  });
}

/* ════════════════════════════════════════════════════════
   ASSIGNMENT LOG HELPER
   ════════════════════════════════════════════════════════ */

async function createAssignmentLog(deliveryId, riderId, action, createdAt) {
  return prisma.deliveryAssignmentLog.create({
    data: {
      log_id: uuid(),
      delivery_id: deliveryId,
      rider_id: riderId,
      action,
      created_at: createdAt,
    },
  });
}

/* ════════════════════════════════════════════════════════
   SEED DELIVERIES & ACTIVITY FOR A RIDER
   ════════════════════════════════════════════════════════ */

async function seedRiderActivity(rider, fk, pricingConfigId, isIndependent) {
  console.log(`\n📦 Seeding activity for ${rider.full_name} (${rider.rider_type})...`);

  const { shiftStart: todayStart } = getShiftWindow(NOW);
  const yesterdayDate = daysAgo(1);
  const { shiftStart: yesterdayStart, shiftEnd: yesterdayEnd } =
    getShiftWindow(yesterdayDate);

  let completedCount = 0;
  let deniedCount = 0;
  let cancelledCount = 0;
  let failedCount = 0;

  /* ── TODAY: 7 completed, 3 denied, 1 cancelled, 1 failed ── */
  console.log("   📅 Today (shift started 6AM):");

  // 7 completed deliveries spread across today's shift
  for (let i = 0; i < 7; i++) {
    const deliveredAt = minutesAgo(60 + i * 45); // every 45 min starting 1h ago
    const order = await createDummyOrder(fk, deliveredAt);

    const surge = i < 3 ? randBetween(10, 20) : 0; // first few get surge
    const tip = i % 2 === 0 ? randBetween(10, 30) : 0;

    const delivery = await createDelivery({
      riderId: rider.rider_id,
      orderId: order.order_id,
      status: "DELIVERED",
      deliveredAt,
      pickupFee: randBetween(20, 30),
      dropFee: randBetween(30, 45),
      surgeFee: surge,
      tipAmount: tip,
      pickupKm: 2 + Math.random() * 2,
      dropKm: 2.5 + Math.random() * 3,
      pricingConfigId,
    });

    await createAssignmentLog(
      delivery.delivery_id,
      rider.rider_id,
      "ACCEPTED",
      new Date(deliveredAt.getTime() - 30 * 60_000),
    );
    completedCount++;
  }

  // 3 denied orders
  for (let i = 0; i < 3; i++) {
    const deniedAt = minutesAgo(90 + i * 60);
    const order = await createDummyOrder(fk, deniedAt);
    const delivery = await createDelivery({
      riderId: rider.rider_id,
      orderId: order.order_id,
      status: "PENDING_ASSIGNMENT",
      pricingConfigId,
    });

    // Delete the delivery to simulate denial (just need the log)
    // Actually we keep delivery row and only create the log
    await createAssignmentLog(
      delivery.delivery_id,
      rider.rider_id,
      "REJECTED",
      deniedAt,
    );
    deniedCount++;
  }

  // 1 cancelled (rider accepted but cancelled mid-delivery)
  const cancelledAt = minutesAgo(180);
  const cancelOrder = await createDummyOrder(fk, cancelledAt);
  const cancelDelivery = await createDelivery({
    riderId: rider.rider_id,
    orderId: cancelOrder.order_id,
    status: "CANCELLED",
    cancelledAt,
    pricingConfigId,
  });
  await createAssignmentLog(
    cancelDelivery.delivery_id,
    rider.rider_id,
    "ACCEPTED",
    new Date(cancelledAt.getTime() - 20 * 60_000),
  );
  cancelledCount++;

  // 1 failed (customer unavailable)
  const failedAt = minutesAgo(240);
  const failedOrder = await createDummyOrder(fk, failedAt);
  const failedDelivery = await createDelivery({
    riderId: rider.rider_id,
    orderId: failedOrder.order_id,
    status: "FAILED",
    failedAt,
    pricingConfigId,
  });
  await createAssignmentLog(
    failedDelivery.delivery_id,
    rider.rider_id,
    "ACCEPTED",
    new Date(failedAt.getTime() - 15 * 60_000),
  );
  failedCount++;

  console.log(`      ${completedCount} delivered, ${deniedCount} denied, ${cancelledCount} cancelled, ${failedCount} failed`);

  // Today's online sessions (two sessions: morning + afternoon so far)
  await createOnlineSession(rider.rider_id, hoursAgo(7), hoursAgo(4));
  await createOnlineSession(rider.rider_id, hoursAgo(3), hoursAgo(0.5));
  console.log(`      Online sessions: 2 (~5.5h total today)`);

  /* ── YESTERDAY: 5 completed, 2 denied, 1 cancelled ── */
  console.log("   📅 Yesterday:");
  let yesterdayCompleted = 0;

  for (let i = 0; i < 5; i++) {
    const deliveredAt = new Date(yesterdayStart.getTime() + (4 + i * 2) * 60 * 60 * 1000);
    if (deliveredAt > yesterdayEnd) continue;
    const order = await createDummyOrder(fk, deliveredAt);
    const delivery = await createDelivery({
      riderId: rider.rider_id,
      orderId: order.order_id,
      status: "DELIVERED",
      deliveredAt,
      pickupFee: randBetween(20, 30),
      dropFee: randBetween(30, 45),
      surgeFee: i < 2 ? randBetween(10, 15) : 0,
      tipAmount: i === 0 ? 20 : 0,
      pricingConfigId,
    });
    await createAssignmentLog(
      delivery.delivery_id,
      rider.rider_id,
      "ACCEPTED",
      new Date(deliveredAt.getTime() - 25 * 60_000),
    );
    yesterdayCompleted++;
  }

  for (let i = 0; i < 2; i++) {
    const deniedAt = new Date(yesterdayStart.getTime() + (6 + i * 3) * 60 * 60 * 1000);
    const order = await createDummyOrder(fk, deniedAt);
    const delivery = await createDelivery({
      riderId: rider.rider_id,
      orderId: order.order_id,
      status: "PENDING_ASSIGNMENT",
      pricingConfigId,
    });
    await createAssignmentLog(
      delivery.delivery_id,
      rider.rider_id,
      "REJECTED",
      deniedAt,
    );
  }

  // Yesterday session
  await createOnlineSession(
    rider.rider_id,
    new Date(yesterdayStart.getTime() + 4 * 60 * 60 * 1000),
    new Date(yesterdayStart.getTime() + 12 * 60 * 60 * 1000),
  );
  console.log(`      ${yesterdayCompleted} delivered, ~8h online`);

  /* ── EARLIER THIS WEEK (3 days ago, 5 days ago) ── */
  console.log("   📅 Earlier this week:");
  let weekExtraCompleted = 0;
  for (const dayOffset of [2, 3, 4, 5]) {
    const dayDate = daysAgo(dayOffset);
    const { shiftStart, shiftEnd } = getShiftWindow(dayDate);
    const dayDeliveries = randBetween(4, 7);

    for (let i = 0; i < dayDeliveries; i++) {
      const deliveredAt = new Date(
        shiftStart.getTime() + (4 + i * 2) * 60 * 60 * 1000,
      );
      if (deliveredAt > shiftEnd) continue;
      const order = await createDummyOrder(fk, deliveredAt);
      const delivery = await createDelivery({
        riderId: rider.rider_id,
        orderId: order.order_id,
        status: "DELIVERED",
        deliveredAt,
        pickupFee: randBetween(20, 30),
        dropFee: randBetween(30, 45),
        tipAmount: i === 0 ? randBetween(10, 25) : 0,
        pricingConfigId,
      });
      await createAssignmentLog(
        delivery.delivery_id,
        rider.rider_id,
        "ACCEPTED",
        new Date(deliveredAt.getTime() - 20 * 60_000),
      );
      weekExtraCompleted++;
    }

    await createOnlineSession(
      rider.rider_id,
      new Date(shiftStart.getTime() + 4 * 60 * 60 * 1000),
      new Date(shiftStart.getTime() + 11 * 60 * 60 * 1000),
    );
  }
  console.log(`      ${weekExtraCompleted} delivered across 4 days`);

  /* ── LAST WEEK (for WoW delta) ── */
  console.log("   📅 Last week:");
  let lastWeekCompleted = 0;
  for (const dayOffset of [7, 8, 9, 10, 11, 12]) {
    const dayDate = daysAgo(dayOffset);
    const { shiftStart, shiftEnd } = getShiftWindow(dayDate);
    const dayDeliveries = randBetween(3, 5);

    for (let i = 0; i < dayDeliveries; i++) {
      const deliveredAt = new Date(
        shiftStart.getTime() + (5 + i * 2) * 60 * 60 * 1000,
      );
      if (deliveredAt > shiftEnd) continue;
      const order = await createDummyOrder(fk, deliveredAt);
      const delivery = await createDelivery({
        riderId: rider.rider_id,
        orderId: order.order_id,
        status: "DELIVERED",
        deliveredAt,
        pickupFee: randBetween(18, 28),
        dropFee: randBetween(28, 40),
        tipAmount: i === 0 ? 15 : 0,
        pricingConfigId,
      });
      await createAssignmentLog(
        delivery.delivery_id,
        rider.rider_id,
        "ACCEPTED",
        new Date(deliveredAt.getTime() - 20 * 60_000),
      );
      lastWeekCompleted++;
    }

    await createOnlineSession(
      rider.rider_id,
      new Date(shiftStart.getTime() + 5 * 60 * 60 * 1000),
      new Date(shiftStart.getTime() + 10 * 60 * 60 * 1000),
    );
  }
  console.log(`      ${lastWeekCompleted} delivered last week`);

  /* ── EARLIER THIS MONTH (for TEAM monthly stats) ── */
  console.log("   📅 Earlier this month:");
  let monthExtraCompleted = 0;
  for (const dayOffset of [15, 18, 22, 25]) {
    const dayDate = daysAgo(dayOffset);
    const { shiftStart } = getShiftWindow(dayDate);
    const dayDeliveries = randBetween(3, 6);

    for (let i = 0; i < dayDeliveries; i++) {
      const deliveredAt = new Date(
        shiftStart.getTime() + (5 + i * 2) * 60 * 60 * 1000,
      );
      const order = await createDummyOrder(fk, deliveredAt);
      const delivery = await createDelivery({
        riderId: rider.rider_id,
        orderId: order.order_id,
        status: "DELIVERED",
        deliveredAt,
        pickupFee: randBetween(18, 28),
        dropFee: randBetween(28, 40),
        tipAmount: i === 0 ? 20 : 0,
        pricingConfigId,
      });
      await createAssignmentLog(
        delivery.delivery_id,
        rider.rider_id,
        "ACCEPTED",
        new Date(deliveredAt.getTime() - 20 * 60_000),
      );
      monthExtraCompleted++;
    }

    await createOnlineSession(
      rider.rider_id,
      new Date(shiftStart.getTime() + 5 * 60 * 60 * 1000),
      new Date(shiftStart.getTime() + 10 * 60 * 60 * 1000),
    );
  }
  console.log(`      ${monthExtraCompleted} delivered earlier this month`);

  /* ── PAYOUT (last week + ledger entries for current week) ── */
  if (isIndependent) {
    console.log("   💵 Creating payouts & ledger entries...");

    const weekStart = getWeekStartMonday6AM(NOW);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    // Last week's completed payout
    const lastWeekPayout = await prisma.riderPayout.create({
      data: {
        payout_id: uuid(),
        rider_id: rider.rider_id,
        week_start: lastWeekStart,
        week_end: lastWeekEnd,
        gross_amount: 1850.0,
        status: "COMPLETED",
        payment_method: "MANUAL",
        manual_reference: "UTR123456789",
        manual_payment_date: lastWeekEnd,
        manual_bank_used: "HDFC Business",
        bank_snapshot: {
          account_number: rider.bank_account_number,
          ifsc: rider.bank_ifsc,
          holder_name: rider.bank_holder_name,
          bank_name: rider.bank_name,
        },
        processed_at: lastWeekEnd,
      },
    });

    // Mark ledger entries for last week as paid
    await prisma.riderEarningLedger.create({
      data: {
        ledger_id: uuid(),
        rider_id: rider.rider_id,
        payout_id: lastWeekPayout.payout_id,
        type: "WEEKLY_CHALLENGE",
        amount: 180,
        description: "Weekly incentive reward (last week)",
        week_start: lastWeekStart,
        is_paid: true,
      },
    });

    // Current week ledger entries (unpaid, feeds "accumulated_amount")
    const weekStartDate = new Date(
      Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
    );

    await prisma.riderEarningLedger.create({
      data: {
        ledger_id: uuid(),
        rider_id: rider.rider_id,
        type: "STREAK_BONUS",
        amount: 80,
        description: "Daily streak bonus - 2 days ago",
        week_start: weekStartDate,
        is_paid: false,
        created_at: daysAgo(2),
      },
    });

    await prisma.riderEarningLedger.create({
      data: {
        ledger_id: uuid(),
        rider_id: rider.rider_id,
        type: "SHIFT_BONUS",
        amount: 50,
        description: "Evening shift bonus",
        week_start: weekStartDate,
        is_paid: false,
        created_at: daysAgo(1),
      },
    });

    console.log(`      ✅ Last week payout: ₹1,850 (COMPLETED)`);
    console.log(`      ✅ Current week accumulated: ₹130 (unpaid)`);
  }
}

/* ════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════ */

async function main() {
  console.log("🌱 Rider Dashboard Seed Starting...");
  console.log(`📆 Reference time: ${NOW.toISOString()}\n`);

  await cleanup();

  const fk = await getFKReferences();
  console.log(`🔗 Using Shop: ${fk.shop.business_name}`);
  console.log(`🔗 Using Branch: ${fk.branch.branch_name}`);
  console.log(`🔗 Using Customer: ${fk.customer.full_name || fk.customer.phone}\n`);

  const pricingConfig = await createPricingConfig();
  await createSurgeRule();
  await createIncentives();

  // Independent rider (existing Asif)
  const independentRider = await prisma.rider.findFirst({
    where: { rider_type: "INDEPENDENT" },
  });
  if (!independentRider) {
    throw new Error("INDEPENDENT rider not found. Run main seed.dev.js first.");
  }
  console.log(`\n✅ Found existing INDEPENDENT rider: ${independentRider.full_name} (${independentRider.phone})`);

  await seedRiderActivity(independentRider, fk, pricingConfig.config_id, true);

  // Team rider (new)
  const teamRider = await createTeamRider();
  await seedRiderActivity(teamRider, fk, pricingConfig.config_id, false);

  /* ── Summary ── */
  console.log("\n" + "═".repeat(60));
  console.log("🎉 RIDER DASHBOARD SEED COMPLETED");
  console.log("═".repeat(60));
  console.log("\n🔐 TEST LOGINS:\n");
  console.log(`   INDEPENDENT │ ${independentRider.phone} │ Qwerty@11`);
  console.log(`   TEAM        │ ${TEAM_RIDER.phone} │ Qwerty@11`);
  console.log("\n📊 WHAT YOU'LL SEE:");
  console.log("   • Today's deliveries, earnings breakdown, order stats");
  console.log("   • Yesterday delta comparison");
  console.log("   • This week + last week delta");
  console.log("   • Active DAILY + WEEKLY incentive stepper (INDEPENDENT only)");
  console.log("   • Active 1.5x Surge banner (INDEPENDENT only)");
  console.log("   • Payout status: Last week ₹1,850 PAID, this week ₹130 pending");
  console.log("   • TEAM rider: monthly stats, no earnings/incentives");
  console.log("   • Rating card (4.5⭐ for Asif, 4.7⭐ for Rajesh)");
  console.log("\n" + "═".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });