// prisma/seed.dev.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const uuid = () => randomUUID();

/* ════════════════════════════════════════════════════════
   CONFIGURATION — EDIT VALUES HERE
   ════════════════════════════════════════════════════════ */

const CONFIG = {
  superAdmin: {
    name: "Super Cadmin",
    username: "cadmin",
    email: "cadmin@cureli.com",
    phone: "9961045596",
    password: "Qwerty@11",
  },

  pharmacyOwner: {
    first_name: "Asif",
    last_name: "Faizal",
    username: "asif",
    email: "asifkfaiz@gmail.com",
    phone: "9961045596",
    password: "Qwerty@11",
  },

  shop: {
    business_name: "Cureli Pharmacy",
    legal_name: "Cureli Pharmacy Pvt Ltd",
    business_type: "Partnership",
    gst_number: "32ABCDE1234F1Z5",
    address_line_1: "MG Road",
    address_line_2: "Near Town Hall",
    city: "Kochi",
    state: "Kerala",
    pincode: "682001",
    verification_notes: "All documents verified successfully",
  },

  branches: [
    {
      name: "Main Branch",
      type: "main",
      address_line_1: "MG Road",
      address_line_2: "Ground Floor",
      city: "Kochi",
      state: "Kerala",
      pincode: "682001",
      contact_number: "9961045596",
      admin: {
        first_name: "Anil",
        last_name: "Kumar",
        username: "anil.kumar",
        email: "main.admin@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
      staff: {
        first_name: "Deepa",
        last_name: "S",
        username: "deepa.s",
        email: "main.staff@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
    },
    {
      name: "Second Branch",
      type: "branch",
      address_line_1: "Kakkanad Road",
      address_line_2: "First Floor",
      city: "Kochi",
      state: "Kerala",
      pincode: "682030",
      contact_number: "9961045596",
      admin: {
        first_name: "Rahul",
        last_name: "Nair",
        username: "rahul.nair",
        email: "second.admin@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
      staff: {
        first_name: "Meera",
        last_name: "P",
        username: "meera.p",
        email: "second.staff@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
    },
  ],

  plan: {
    name: "Free Plan",
    plan_code: "FREE-001",
    description: "Free plan for development and staging use",
    max_branches: 5,
    max_users: 10,
    price: 0,
    is_featured: false,
  },

  shopFiles: [
    {
      file_type: "drug_license",
      storage_key: "demo/drug_license.pdf",
      original_name: "drug_license.pdf",
      mime_type: "application/pdf",
      file_size: 98000,
    },
    {
      file_type: "pharmacy_registration",
      storage_key: "demo/pharmacy_registration.pdf",
      original_name: "pharmacy_registration.pdf",
      mime_type: "application/pdf",
      file_size: 110000,
    },
    {
      file_type: "pan_card",
      storage_key: "demo/pan_card.pdf",
      original_name: "pan_card.pdf",
      mime_type: "application/pdf",
      file_size: 75000,
    },
  ],

  suppliers: [
    {
      name: "MedLife Distributors",
      supplier_code: "SUP-001",
      contact_person: "Suresh Babu",
      office_phone: "9961045596",
      email: "medlife@supplier.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682001",
      gst_number: "32XYZAB5678C1Z9",
      credit_days: 30,
    },
    {
      name: "PharmaCare Supplies",
      supplier_code: "SUP-002",
      contact_person: "Rajan Pillai",
      office_phone: "9961045596",
      email: "pharmacare@supplier.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682030",
      gst_number: "32LMNOP9012D1Z3",
      credit_days: 15,
    },
  ],

  customers: [
    {
      name: "Priya Nair",
      phone: "9000000010",
      email: "priya.nair@example.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682001",
    },
    {
      name: "Thomas John",
      phone: "9000000011",
      email: "thomas.john@example.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682030",
    },
  ],

  mobileUser: {
    phone: "9961045596",
    email: "asifkfaiz@gmail.com",
    password: "Qwerty@11",
    full_name: "Asif Faizal",
    date_of_birth: "1995-06-15",
    sex: "MALE",
    addresses: [
      {
        label: "Home",
        recipient_name: "Asif Faizal",
        recipient_phone: "9961045596",
        address_line_1: "Flat 3B, Skyline Apartments",
        address_line_2: "Marine Drive",
        landmark: "Near GCDA Complex",
        city: "Kochi",
        state: "Kerala",
        pincode: "682011",
        latitude: 9.9716,
        longitude: 76.2753,
        is_default: true,
      },
      {
        label: "Work",
        recipient_name: "Asif Faizal",
        recipient_phone: "9961045596",
        address_line_1: "2nd Floor, TechPark Tower",
        address_line_2: "Infopark Phase 1",
        landmark: "Opposite Infopark Main Gate",
        city: "Kochi",
        state: "Kerala",
        pincode: "682303",
        latitude: 9.9173,
        longitude: 76.3558,
        is_default: false,
      },
    ],
  },

  rider: {
    phone: "9961045596",
    email: "asifkfaiz@gmail.com",
    password: "Qwerty@11",
    full_name: "Asif Faizal",
    date_of_birth: "1995-06-15",
    sex: "MALE",
    current_city: "Kochi",
    residential_address: "Flat 3B, Skyline Apartments, Marine Drive, Kochi",
    preferred_lat: 9.9716,
    preferred_lng: 76.2753,
    preferred_address: "Marine Drive, Kochi",
    vehicle_type: "bike",
    vehicle_number: "KL-07-AB-1234",
    vehicle_make_model: "Honda Activa 6G",
    bank_account_number: "1234567890123",
    bank_ifsc: "SBIN0001234",
    bank_holder_name: "Asif Faizal",
    bank_name: "State Bank of India",
    emergency_contact_name: "Faizal K",
    emergency_contact_phone: "9876543210",
  },

  // ── ALL REQUIRED RIDER DOCUMENTS ──────────────────────────
  riderDocuments: [
    {
      type: "PROFILE_PHOTO",
      storage_key: "rider_documents/asif_profile_photo.jpg",
    },
    {
      type: "AADHAAR_FRONT",
      storage_key: "rider_documents/asif_aadhaar_front.jpg",
      back_storage_key: "rider_documents/asif_aadhaar_back.jpg",
    },
    {
      type: "AADHAAR_BACK",
      storage_key: "rider_documents/asif_aadhaar_back.jpg",
      back_storage_key: "rider_documents/asif_aadhaar_back.jpg",
    },
    {
      type: "PAN_FRONT",
      storage_key: "rider_documents/asif_pan_front.jpg",
    },
    {
      type: "DRIVING_LICENSE_FRONT",
      storage_key: "rider_documents/asif_dl_front.jpg",
      back_storage_key: "rider_documents/asif_dl_back.jpg",
    },
    {
      type: "DRIVING_LICENSE_BACK",
      storage_key: "rider_documents/asif_dl_back.jpg",
      back_storage_key: "rider_documents/asif_dl_back.jpg",
    },
    {
      type: "VEHICLE_RC",
      storage_key: "rider_documents/asif_vehicle_rc.jpg",
    },
  ],
};

/* ════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════ */

const now = new Date();
const oneYearLater = new Date(new Date().setFullYear(now.getFullYear() + 1));

/* ════════════════════════════════════════════════════════
   CLEANUP — Full wipe in safe FK order
   ════════════════════════════════════════════════════════ */

async function cleanup() {
  console.log("🧹 Clearing existing data...");

  // Logs first
  await prisma.cAdminActivityLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.planActivityLog.deleteMany();
  await prisma.fileVerificationLog.deleteMany();
  await prisma.deletionLog.deleteMany();

  // Notifications
  await prisma.notification.deleteMany();

  // Tickets
  await prisma.ticketActivity.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();

  // Sales
  await prisma.customerCreditApplication.deleteMany();
  await prisma.customerCredit.deleteMany();
  await prisma.customerLedger.deleteMany();
  await prisma.salesInvoiceItem.deleteMany();
  await prisma.salesPayment.deleteMany();
  await prisma.salesInvoice.deleteMany();

  // Purchase
  await prisma.creditApplication.deleteMany();
  await prisma.supplierCredit.deleteMany();
  await prisma.purchaseInvoiceItem.deleteMany();
  await prisma.purchasePayment.deleteMany();
  await prisma.purchaseInvoice.deleteMany();

  // Stock
  await prisma.stockAdjustment.deleteMany();
  await prisma.stockLedger.deleteMany();

  // Inventory
  await prisma.inventory.deleteMany();
  await prisma.inventoryImportJob.deleteMany();

  // Medicines
  await prisma.medicine.deleteMany();

  // Customers & Suppliers
  await prisma.customer.deleteMany();
  await prisma.supplierBranch.deleteMany();
  await prisma.supplier.deleteMany();

  // Checkout sessions
  await prisma.checkoutSession.deleteMany();

  // Marketplace
  await prisma.marketplaceOrderStatusHistory.deleteMany();
  await prisma.marketplaceOrderPrescription.deleteMany();
  await prisma.marketplaceOrderItem.deleteMany();
  await prisma.marketplaceOrder.deleteMany();
  await prisma.branchCategoryVisibility.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.branchHoliday.deleteMany();
  await prisma.branchMarketplaceSettings.deleteMany();
  await prisma.marketplaceProfile.deleteMany();

  // Shop files
  await prisma.shopFile.deleteMany();

  // Payments
  await prisma.paymentTransaction.deleteMany();

  // Unlink current_subscription_id
  await prisma.shop.updateMany({ data: { current_subscription_id: null } });
  await prisma.shopSubscription.deleteMany();

  // Broadcast
  await prisma.broadcastAttachment.deleteMany();
  await prisma.broadcastCampaign.deleteMany();
  await prisma.broadcastSegment.deleteMany();
  await prisma.broadcastTemplate.deleteMany();
  await prisma.emailBroadcastAttachment.deleteMany();
  await prisma.emailBroadcastRecipient.deleteMany();
  await prisma.emailBroadcastCampaign.deleteMany();
  await prisma.cureliMobileBroadcastCampaign.deleteMany();

  // Sessions
  await prisma.userSession.deleteMany();
  await prisma.pendingUser.deleteMany();

  // Mobile
  await prisma.cureliMobileNotification.deleteMany();
  await prisma.cureliMobilePushPreference.deleteMany();
  await prisma.cureliMobileFamilyMember.deleteMany();
  await prisma.cureliMobileSession.deleteMany();
  await prisma.cureliMobileAddress.deleteMany();
  await prisma.cureliMobileUser.deleteMany();

  // ── RIDER / FLEET CLEANUP ──────────────────────────────────
  await prisma.riderEarningLedger.deleteMany();
  await prisma.riderPayout.deleteMany();
  await prisma.riderRating.deleteMany();
  await prisma.riderGivesRating.deleteMany();
  await prisma.deliveryAssignmentLog.deleteMany();
  await prisma.deliveryChat.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.incentiveSchedule.deleteMany();
  await prisma.incentiveTier.deleteMany();
  await prisma.incentiveTemplate.deleteMany();
  await prisma.pricingDistanceSlab.deleteMany();
  await prisma.riderPricingConfig.deleteMany();
  await prisma.riderSurgeRule.deleteMany();
  await prisma.riderSession.deleteMany();
  await prisma.riderDocument.deleteMany();
  await prisma.riderNotification.deleteMany();
  await prisma.riderTicketReply.deleteMany();
  await prisma.riderTicket.deleteMany();
  await prisma.riderIncident.deleteMany();
  await prisma.riderAppeal.deleteMany();
  await prisma.zoneChangeRequest.deleteMany();
  await prisma.riderTrainingContent.deleteMany();
  await prisma.riderOnlineSession.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.deliveryZone.deleteMany();
  // ────────────────────────────────────────────────────────────

  // Marketplace checkout pricing
  await prisma.deliveryPricingConfig.deleteMany();

  // ── CRITICAL ORDER ──────────────────────────────────────────
  await prisma.branch.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  // Plans
  await prisma.plan.deleteMany();

  // CAdmin
  await prisma.cAdminRoleAssignment.deleteMany();
  await prisma.cAdminCustomRole.deleteMany();
  await prisma.cAdmin.deleteMany();

  // Misc
  await prisma.enquiryReply.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.otpDailyLimit.deleteMany();
  await prisma.cronLock.deleteMany();
  await prisma.dailySendQuota.deleteMany();
  await prisma.emailUnsubscribe.deleteMany();

  console.log("✅ Cleared\n");
}

/* ════════════════════════════════════════════════════════
   MAIN SEED
   ════════════════════════════════════════════════════════ */

async function main() {
  console.log("🌱 Starting production-stage seed...\n");

  await cleanup();

  /* ─────────────────────────────────────────
     1. SUPER CADMIN
  ───────────────────────────────────────── */
  console.log("👑 Creating Super CAdmin...");

  const superAdmin = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: CONFIG.superAdmin.name,
      username: CONFIG.superAdmin.username,
      email: CONFIG.superAdmin.email,
      phone_number: CONFIG.superAdmin.phone,
      password_hash: await bcrypt.hash(CONFIG.superAdmin.password, 10),
      is_super_cadmin: true,
      is_active: true,
    },
  });

  await prisma.cAdminActivityLog.create({
    data: {
      id: uuid(),
      cadmin_id: superAdmin.cadmin_id,
      performed_by_id: superAdmin.cadmin_id,
      action: "CREATED",
      description: "Super CAdmin account created via seed",
    },
  });

  console.log(`   ✅ ${superAdmin.username}\n`);

  /* ─────────────────────────────────────────
     2. PLAN
  ───────────────────────────────────────── */
  console.log("📋 Creating Plan...");

  const plan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      plan_code: CONFIG.plan.plan_code,
      name: CONFIG.plan.name,
      description: CONFIG.plan.description,
      max_branches: CONFIG.plan.max_branches,
      max_users: CONFIG.plan.max_users,
      price: BigInt(CONFIG.plan.price),
      status: "ACTIVE",
      type: "PRE_MADE",
      billing_cycle_months: 12,
      bonus_months: 0,
      is_featured: CONFIG.plan.is_featured,
      activated_at: now,
      created_by: superAdmin.cadmin_id,
    },
  });

  await prisma.planActivityLog.create({
    data: {
      id: uuid(),
      plan_id: plan.plan_id,
      cadmin_id: superAdmin.cadmin_id,
      action: "CREATED",
      to_status: "ACTIVE",
      meta: { seeded: true },
    },
  });

  console.log(`   ✅ ${plan.name} (${plan.plan_code})\n`);

  /* ─────────────────────────────────────────
     3. PHARMACY OWNER
  ───────────────────────────────────────── */
  console.log("👤 Creating Pharmacy Owner...");

  const owner = await prisma.user.create({
    data: {
      user_id: uuid(),
      first_name: CONFIG.pharmacyOwner.first_name,
      last_name: CONFIG.pharmacyOwner.last_name,
      full_name: `${CONFIG.pharmacyOwner.first_name} ${CONFIG.pharmacyOwner.last_name}`,
      username: CONFIG.pharmacyOwner.username,
      email: CONFIG.pharmacyOwner.email,
      phone_number: CONFIG.pharmacyOwner.phone,
      password_hash: await bcrypt.hash(CONFIG.pharmacyOwner.password, 10),
      login_provider: "password",
      role: "super_admin",
      status: "active",
      is_active: true,
      onboarding_step: 12,
      first_login_after_verification: false,
      first_verified_at: now,
    },
  });

  console.log(`   ✅ ${owner.full_name} (${owner.email})\n`);

  /* ─────────────────────────────────────────
     4. SHOP
  ───────────────────────────────────────── */
  console.log("🏪 Creating Shop...");

  const shop = await prisma.shop.create({
    data: {
      shop_id: uuid(),
      owner_user_id: owner.user_id,
      business_name: CONFIG.shop.business_name,
      legal_name: CONFIG.shop.legal_name,
      business_type: CONFIG.shop.business_type,
      gst_number: CONFIG.shop.gst_number,
      address_line_1: CONFIG.shop.address_line_1,
      address_line_2: CONFIG.shop.address_line_2,
      city: CONFIG.shop.city,
      state: CONFIG.shop.state,
      pincode: CONFIG.shop.pincode,
      verification_status: "verified",
      verification_notes: CONFIG.shop.verification_notes,
      is_active: true,
    },
  });

  await prisma.user.update({
    where: { user_id: owner.user_id },
    data: { shop_id: shop.shop_id },
  });

  console.log(`   ✅ ${shop.business_name}\n`);

  /* ─────────────────────────────────────────
     5. SHOP FILES (All verified)
  ───────────────────────────────────────── */
  console.log("📄 Creating Shop Files...");

  for (const fileConfig of CONFIG.shopFiles) {
    await prisma.shopFile.create({
      data: {
        file_id: uuid(),
        shop_id: shop.shop_id,
        file_type: fileConfig.file_type,
        storage_key: fileConfig.storage_key,
        original_name: fileConfig.original_name,
        mime_type: fileConfig.mime_type,
        file_size: fileConfig.file_size,
        status: "verified",
        uploaded_by: owner.user_id,
        uploaded_at: now,
        verified_at: now,
        resubmission_count: 0,
      },
    });
    console.log(`   ✅ ${fileConfig.file_type}`);
  }

  console.log();

  /* ─────────────────────────────────────────
     6. SUBSCRIPTION
  ───────────────────────────────────────── */
  console.log("💳 Creating Subscription...");

  const subscription = await prisma.shopSubscription.create({
    data: {
      subscription_id: uuid(),
      shop_id: shop.shop_id,
      plan_id: plan.plan_id,
      billing_cycle: "yearly",
      start_date: now,
      end_date: oneYearLater,
      renewal_date: oneYearLater,
      branch_limit_snapshot: CONFIG.plan.max_branches,
      user_limit_snapshot: CONFIG.plan.max_users,
      status: "ACTIVE",
      payment_status: "PAID",
      is_active: true,
    },
  });

  await prisma.shop.update({
    where: { shop_id: shop.shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  console.log(
    `   ✅ Subscription active until ${oneYearLater.toDateString()}\n`
  );

  /* ─────────────────────────────────────────
     7. MARKETPLACE PROFILE (with banking details)
  ───────────────────────────────────────── */
  console.log("🛒 Creating Marketplace Profile...");

  const marketplaceProfile = await prisma.marketplaceProfile.create({
    data: {
      marketplace_profile_id: uuid(),
      shop_id: shop.shop_id,
      marketplace_status: "DRAFT",
      onboarding_completed: false,
      is_live: false,
      storefront_name: "Cureli Pharmacy",
      support_phone: "9961045596",
      logo_url: "demo/marketplace/logo.png",
      // Banking details (all filled for go-live readiness)
      bank_account_holder: "Cureli Pharmacy Pvt Ltd",
      bank_name: "State Bank of India",
      bank_branch_name: "MG Road Branch",
      bank_ifsc: "SBIN0001234",
      bank_account_number: "1234567890123",
    },
  });

  console.log(`   ✅ Marketplace profile created with banking details\n`);

  /* ─────────────────────────────────────────
     8. DELIVERY PRICING CONFIG
  ───────────────────────────────────────── */
  console.log("💰 Creating Delivery Pricing Config...");

  const pricingConfig = await prisma.deliveryPricingConfig.create({
    data: {},
  });

  console.log(`   ✅ Delivery pricing config created (schema defaults)\n`);

  /* ─────────────────────────────────────────
     9. BRANCHES + USERS + SUPPLIERS + CUSTOMERS
  ───────────────────────────────────────── */
  console.log("🏬 Creating Branches...\n");

  for (let i = 0; i < CONFIG.branches.length; i++) {
    const branchConfig = CONFIG.branches[i];
    const supplierConfig = CONFIG.suppliers[i];
    const customerConfig = CONFIG.customers[i];

    const branch = await prisma.branch.create({
      data: {
        branch_id: uuid(),
        shop_id: shop.shop_id,
        branch_name: branchConfig.name,
        branch_type: branchConfig.type,
        address_line_1: branchConfig.address_line_1,
        address_line_2: branchConfig.address_line_2,
        city: branchConfig.city,
        state: branchConfig.state,
        pincode: branchConfig.pincode,
        contact_number: branchConfig.contact_number,
        is_active: true,
      },
    });

    console.log(`   📍 Branch: ${branch.branch_name} (${branch.branch_type})`);

    // Branch Marketplace Settings
    await prisma.branchMarketplaceSettings.create({
      data: {
        branch_marketplace_id: uuid(),
        branch_id: branch.branch_id,
        marketplace_profile_id: marketplaceProfile.marketplace_profile_id,
        marketplace_enabled: false,
        pickup_enabled: false,
        delivery_enabled: false,
      },
    });

    // Branch Admin
    const admin = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        first_name: branchConfig.admin.first_name,
        last_name: branchConfig.admin.last_name,
        full_name: `${branchConfig.admin.first_name} ${branchConfig.admin.last_name}`,
        username: branchConfig.admin.username,
        email: branchConfig.admin.email,
        phone_number: branchConfig.admin.phone,
        password_hash: await bcrypt.hash(branchConfig.admin.password, 10),
        login_provider: "password",
        role: "branch_admin",
        status: "verified",
        is_active: true,
        onboarding_step: 12,
        first_login_after_verification: false,
        first_verified_at: now,
      },
    });

    console.log(`   ✅ Admin: ${admin.full_name} (${admin.role})`);

    // Staff
    const staff = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        first_name: branchConfig.staff.first_name,
        last_name: branchConfig.staff.last_name,
        full_name: `${branchConfig.staff.first_name} ${branchConfig.staff.last_name}`,
        username: branchConfig.staff.username,
        email: branchConfig.staff.email,
        phone_number: branchConfig.staff.phone,
        password_hash: await bcrypt.hash(branchConfig.staff.password, 10),
        login_provider: "password",
        role: "staff",
        status: "verified",
        is_active: true,
        onboarding_step: 12,
        first_login_after_verification: false,
        first_verified_at: now,
      },
    });

    console.log(`   ✅ Staff: ${staff.full_name} (${staff.role})`);

    // Supplier
    const supplier = await prisma.supplier.create({
      data: {
        supplier_id: uuid(),
        shop_id: shop.shop_id,
        name: supplierConfig.name,
        supplier_code: supplierConfig.supplier_code,
        contact_person: supplierConfig.contact_person,
        office_phone: supplierConfig.office_phone,
        email: supplierConfig.email,
        city: supplierConfig.city,
        state: supplierConfig.state,
        pincode: supplierConfig.pincode,
        gst_number: supplierConfig.gst_number,
        credit_days: supplierConfig.credit_days,
        is_active: true,
        created_by: admin.user_id,
      },
    });

    await prisma.supplierBranch.create({
      data: {
        id: uuid(),
        supplier_id: supplier.supplier_id,
        branch_id: branch.branch_id,
        is_active: true,
        created_by: admin.user_id,
      },
    });

    console.log(`   ✅ Supplier: ${supplier.name}`);

    // Customer
    await prisma.customer.create({
      data: {
        customer_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        name: customerConfig.name,
        phone: customerConfig.phone,
        email: customerConfig.email,
        city: customerConfig.city,
        state: customerConfig.state,
        pincode: customerConfig.pincode,
        credit_limit: 0,
        outstanding_balance: 0,
        discount_percent: 0,
        is_active: true,
        created_by: staff.user_id,
      },
    });

    console.log(`   ✅ Customer: ${customerConfig.name}\n`);

    // Welcome Notification
    await prisma.notification.create({
      data: {
        notification_id: uuid(),
        user_id: admin.user_id,
        event_type: "WELCOME",
        title: "Welcome to Cureli ERP",
        message: `Welcome ${admin.full_name}! Your ${branch.branch_name} account is ready.`,
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        priority: "normal",
        is_read: false,
      },
    });
  }

  // Owner Welcome Notification
  await prisma.notification.create({
    data: {
      notification_id: uuid(),
      user_id: owner.user_id,
      event_type: "WELCOME",
      title: "Welcome to Cureli ERP",
      message: `Welcome ${owner.full_name}! Your pharmacy is verified and ready.`,
      shop_id: shop.shop_id,
      priority: "normal",
      is_read: false,
    },
  });

  /* ─────────────────────────────────────────
     10. CURELI MOBILE USER (Asif)
  ───────────────────────────────────────── */
  console.log("📱 Creating Cureli Mobile User (Asif)...\n");

  const mobileUser = await prisma.cureliMobileUser.create({
    data: {
      id: uuid(),
      phone: CONFIG.mobileUser.phone,
      phone_verified: true,
      phone_verified_at: now,
      password_hash: await bcrypt.hash(CONFIG.mobileUser.password, 10),
      login_provider: "password",
      email: CONFIG.mobileUser.email,
      full_name: CONFIG.mobileUser.full_name,
      date_of_birth: new Date(CONFIG.mobileUser.date_of_birth),
      sex: CONFIG.mobileUser.sex,
      profile_complete: true,
      status: "active",
      referral_code: "ASIF2026",
      last_seen_at: now,
    },
  });

  console.log(`   ✅ ${mobileUser.full_name} (${mobileUser.phone})`);

  for (const addr of CONFIG.mobileUser.addresses) {
    await prisma.cureliMobileAddress.create({
      data: {
        id: uuid(),
        user_id: mobileUser.id,
        label: addr.label,
        recipient_name: addr.recipient_name,
        recipient_phone: addr.recipient_phone,
        address_line_1: addr.address_line_1,
        address_line_2: addr.address_line_2,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        latitude: addr.latitude,
        longitude: addr.longitude,
        is_default: addr.is_default,
      },
    });
    console.log(`   ✅ Address: ${addr.label} — ${addr.address_line_1}`);
  }

  console.log();

  /* ─────────────────────────────────────────
     11. RIDER (Asif — ALL DOCUMENTS APPROVED)
  ───────────────────────────────────────── */
  console.log("🏍️  Creating Rider (Asif — Independent, ACTIVE with ALL DOCS APPROVED)...\n");

  const rider = await prisma.rider.create({
    data: {
      rider_id: uuid(),
      phone: CONFIG.rider.phone,
      password_hash: await bcrypt.hash(CONFIG.rider.password, 10),
      rider_type: "INDEPENDENT",

      // Personal
      full_name: CONFIG.rider.full_name,
      email: CONFIG.rider.email,
      date_of_birth: new Date(CONFIG.rider.date_of_birth),
      sex: CONFIG.rider.sex,
      profile_photo_key: "rider_documents/asif_profile_photo.jpg",

      // Location
      current_city: CONFIG.rider.current_city,
      residential_address: CONFIG.rider.residential_address,
      preferred_lat: CONFIG.rider.preferred_lat,
      preferred_lng: CONFIG.rider.preferred_lng,
      preferred_address: CONFIG.rider.preferred_address,

      // Vehicle
      vehicle_type: CONFIG.rider.vehicle_type,
      vehicle_number: CONFIG.rider.vehicle_number,
      vehicle_make_model: CONFIG.rider.vehicle_make_model,

      // Status — ACTIVE & COMPLETED
      status: "ACTIVE",
      onboarding_step: "COMPLETED",
      submitted_for_review: true,
      first_submitted_at: now,

      // Telemetry
      is_online: false,

      // Bank (verified)
      bank_account_number: CONFIG.rider.bank_account_number,
      bank_ifsc: CONFIG.rider.bank_ifsc,
      bank_holder_name: CONFIG.rider.bank_holder_name,
      bank_name: CONFIG.rider.bank_name,
      bank_verified: true,

      // Compliance
      terms_accepted_at: now,

      // Emergency
      emergency_contact_name: CONFIG.rider.emergency_contact_name,
      emergency_contact_phone: CONFIG.rider.emergency_contact_phone,

      // Referral
      referral_code: "RIDERASIF26",

      // Ratings
      rating: 4.5,
      total_ratings: 12,
      total_deliveries: 47,

      last_seen_at: now,
    },
  });

  console.log(`   ✅ ${rider.full_name} (${rider.phone})`);
  console.log(`      Type: ${rider.rider_type} | Status: ${rider.status}`);
  console.log(`      Vehicle: ${rider.vehicle_make_model} (${rider.vehicle_number})`);
  console.log(`      City: ${rider.current_city} | Rating: ${rider.rating}⭐ (${rider.total_deliveries} deliveries)`);
  console.log(`      Bank: ${rider.bank_name} — ${rider.bank_account_number}\n`);

  /* ── Rider Documents (ALL APPROVED) ── */
  console.log("📄 Creating Rider Documents (ALL APPROVED)...\n");

  for (const docConfig of CONFIG.riderDocuments) {
    await prisma.riderDocument.create({
      data: {
        document_id: uuid(),
        rider_id: rider.rider_id,
        type: docConfig.type,
        storage_key: docConfig.storage_key,
        back_storage_key: docConfig.back_storage_key || null,
        status: "APPROVED",
        reviewed_by: superAdmin.cadmin_id,
        reviewed_at: now,
        uploaded_at: now,
        resubmission_count: 0,
        was_rejected_this_cycle: false,
      },
    });

    console.log(`   ✅ ${docConfig.type.padEnd(30)} │ APPROVED │ ${docConfig.storage_key}`);
  }

  console.log();

  /* ─────────────────────────────────────────
     SUMMARY
  ───────────────────────────────────────── */
  console.log("═".repeat(60));
  console.log("🎉 SEED COMPLETED");
  console.log("═".repeat(60));
  console.log("\n🔐 LOGIN CREDENTIALS:\n");
  console.log(
    `   CAdmin  │ ${CONFIG.superAdmin.username.padEnd(20)} │ ${CONFIG.superAdmin.password}`
  );
  console.log(
    `   Owner   │ ${CONFIG.pharmacyOwner.email.padEnd(20)} │ ${CONFIG.pharmacyOwner.password}`
  );
  for (const b of CONFIG.branches) {
    console.log(
      `   Admin   │ ${b.admin.email.padEnd(20)} │ ${b.admin.password}`
    );
    console.log(
      `   Staff   │ ${b.staff.email.padEnd(20)} │ ${b.staff.password}`
    );
  }
  console.log(
    `   Mobile  │ ${CONFIG.mobileUser.phone.padEnd(20)} │ ${CONFIG.mobileUser.password}`
  );
  console.log(
    `   Rider   │ ${CONFIG.rider.phone.padEnd(20)} │ ${CONFIG.rider.password}`
  );

  console.log("\n📦 SEEDED:");
  console.log(`   1  Super CAdmin`);
  console.log(`   1  Owner (role: super_admin)`);
  console.log(`   1  Shop (verified)`);
  console.log(`   ${CONFIG.shopFiles.length}  Shop Files (verified)`);
  console.log(`   1  Plan + Subscription (ACTIVE / PAID)`);
  console.log(`   1  Marketplace Profile (DRAFT, with banking)`);
  console.log(`   1  Delivery Pricing Config (schema defaults)`);
  console.log(`   ${CONFIG.branches.length}  Branches`);
  console.log(
    `   ${CONFIG.branches.length * 2}  Branch Users (${CONFIG.branches.length} branch_admin + ${CONFIG.branches.length} staff)`
  );
  console.log(
    `   ${CONFIG.suppliers.length}  Suppliers + SupplierBranch links`
  );
  console.log(`   ${CONFIG.customers.length}  Customers`);
  console.log(`   ${CONFIG.branches.length + 1}  Welcome Notifications`);
  console.log(`   1  Cureli Mobile User (${CONFIG.mobileUser.full_name}) + ${CONFIG.mobileUser.addresses.length} addresses`);
  console.log(`   1  Rider (${CONFIG.rider.full_name}, ${rider.rider_type}, ${rider.status})`);
  console.log(`   ${CONFIG.riderDocuments.length}  Rider Documents (ALL APPROVED by CAdmin)`);
  
  console.log("\n✅ READY TO USE:");
  console.log(`   • Rider can log in immediately (all docs approved)`);
  console.log(`   • Rider can go online and accept deliveries`);
  console.log(`   • Mobile user can place orders`);
  console.log(`   • Shop has all files verified`);
  console.log(`   • Marketplace has banking details (ready for go-live)`);
  
  console.log("\n⚠️  NOT SEEDED:");
  console.log(`   • Master Medicine Catalog (run separate seed script)`);
  console.log(`   • Marketplace Listings (requires master catalog + inventory)`);
  console.log(`   • Actual S3 files (storage_key paths are dummy references)`);
  
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