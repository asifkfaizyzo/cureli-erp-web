// backend/src/scripts/seedDashboard.js
import { PrismaClient, TicketCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Dashboard Seeder...");

  // 1. Create Plans
  console.log("- Seeding Subscription Plans...");
  const plans = [
    { plan_code: "PLAN-0001", name: "Bronze Standard", max_branches: 1, max_users: 3, price: 199900n, status: "ACTIVE" },
    { plan_code: "PLAN-0002", name: "Silver Growth", max_branches: 3, max_users: 10, price: 499900n, status: "ACTIVE" },
    { plan_code: "PLAN-0003", name: "Gold Enterprise", max_branches: 10, max_users: 50, price: 1299900n, status: "ACTIVE" },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { plan_code: plan.plan_code },
      update: {},
      create: plan,
    });
  }

  const seededPlans = await prisma.plan.findMany();

  // 2. Create Owner User
  console.log("- Seeding Shop Owner...");
  const owner = await prisma.user.upsert({
    where: { email: "owner@cureliers.com" },
    update: {
      first_name: "Harish",
      last_name: "Kumar",
      full_name: "Harish Kumar",
      status: "active",
      login_provider: "email",
    },
    create: {
      user_id: "77777777-7777-7777-7777-777777777777",
      first_name: "Harish",
      last_name: "Kumar",
      full_name: "Harish Kumar",
      email: "owner@cureliers.com",
      password_hash: "hashed_password",
      phone_number: "+919876543210",
      role: "super_admin",
      status: "active",
      login_provider: "email",
    },
  });

  // 3. Create Shop and Branch
  console.log("- Seeding Shop and Branch...");
  const shop = await prisma.shop.upsert({
    where: { shop_id: "11111111-1111-1111-1111-111111111111" },
    update: {
      is_active: true,
      verification_status: "verified",
    },
    create: {
      shop_id: "11111111-1111-1111-1111-111111111111",
      owner_user_id: owner.user_id,
      business_name: "Cureli Medicos Pvt Ltd",
      city: "Kochi",
      state: "Kerala",
      address_line_1: "Kakkarat Road",
      pincode: "682021",
      verification_status: "verified",
      is_active: true,
    },
  });

  const branch = await prisma.branch.upsert({
    where: { branch_id: "22222222-2222-2222-2222-222222222222" },
    update: { is_active: true },
    create: {
      branch_id: "22222222-2222-2222-2222-222222222222",
      shop_id: shop.shop_id,
      branch_name: "Kochi Central Hub",
      branch_type: "main",
      city: "Kochi",
      state: "Kerala",
      is_active: true,
    },
  });

  // 4. Create Active Shop Subscription
  console.log("- Seeding Shop Subscription...");
  const existingSub = await prisma.shopSubscription.findFirst({
    where: { shop_id: shop.shop_id },
  });

  let sub = existingSub;
  if (!sub) {
    sub = await prisma.shopSubscription.create({
      data: {
        subscription_id: "33333333-3333-3333-3333-333333333333",
        shop_id: shop.shop_id,
        plan_id: seededPlans[1].plan_id,
        billing_cycle: "yearly",
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
        renewal_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
        branch_limit_snapshot: 3,
        user_limit_snapshot: 10,
        is_active: true,
        status: "active",
        payment_status: "PAID",
      },
    });

    await prisma.shop.update({
      where: { shop_id: shop.shop_id },
      data: { current_subscription_id: sub.subscription_id },
    });
  }

  // 5. Create Mobile App Consumers
  console.log("- Seeding Mobile Users...");
  const mobileUser = await prisma.cureliMobileUser.upsert({
    where: { phone: "+919998887776" },
    update: { status: "active", phone_verified: true },
    create: {
      id: "44444444-4444-4444-4444-444444444444",
      phone: "+919998887776",
      full_name: "Rahul Verma",
      email: "rahul@gmail.com",
      status: "active",
      phone_verified: true,
      login_provider: "otp",
    },
  });

  // 6. Create Historical Revenue Transactions
  console.log("- Seeding Payment Transactions...");
  const existingPayments = await prisma.paymentTransaction.count({
    where: { shop_id: shop.shop_id },
  });

  if (existingPayments === 0) {
    const paymentDays = [5, 10, 15, 20, 25];
    for (const day of paymentDays) {
      await prisma.paymentTransaction.create({
        data: {
          shop_id: shop.shop_id,
          subscription_id: sub.subscription_id,
          provider: "razorpay",
          amount: 499900n,
          status: "success",
          created_at: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 7. Create Support Ticket
  console.log("- Seeding Support Ticket...");
  // Dynamically select a valid category from Prisma's TicketCategory enum
  const validCategory = TicketCategory
    ? Object.values(TicketCategory)[0]
    : "OTHER";

  await prisma.ticket.upsert({
    where: { ticket_number: "TCK-KOCHI-001" },
    update: {},
    create: {
      ticket_number: "TCK-KOCHI-001",
      shop_id: shop.shop_id,
      branch_id: branch.branch_id,
      created_by_user_id: owner.user_id,
      contact_number: "+919876543210",
      category: validCategory,
      subject: "Unable to provision branch slot #2",
      description: "Getting limit error while enabling marketplace config on the sub-branch.",
      preferred_slot: "morning",
      status: "PENDING",
    },
  });

  // 8. Create Marketplace Order
  console.log("- Seeding Marketplace Orders...");
  await prisma.marketplaceOrder.upsert({
    where: { order_number: "ORD-998811" },
    update: {},
    create: {
      order_id: "55555555-5555-5555-5555-555555555555",
      order_number: "ORD-998811",
      shop_id: shop.shop_id,
      branch_id: branch.branch_id,
      customer_id: mobileUser.id,
      customer_name_snapshot: "Rahul Verma",
      customer_phone_snapshot: "+919998887776",
      status: "PLACED",
      delivery_address_snapshot: { address_line_1: "Apex Tower", city: "Kochi" },
      subtotal: 350.00,
      total_amount: 385.00,
      placed_at: new Date(),
    },
  });

  console.log("✅ Seeding completed successfully! Refresh your CAdmin Dashboard.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });