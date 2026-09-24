// backend/src/modules/subscription/subscription.service.js (do not remove this comment)
// src/modules/subscription/subscription.service.js

import prisma from "../../config/prisma.js";
import {
  razorpay,
  RAZORPAY_CURRENCY,
  verifyPaymentSignature,
} from "../../config/razorpay.js";
import * as audit from "../audit/index.js";
import { notify } from "../notifications/index.js"; //  ADD THIS
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";
const GRACE_PERIOD_DAYS = 7;

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}
function isIntroPriceActive(plan) {
  if (!plan.intro_price || !plan.intro_trigger_type) return false;

  if (plan.intro_trigger_type === "date") {
    return plan.intro_end_date
      ? new Date(plan.intro_end_date) > new Date()
      : false;
  }

  // duration - always active at plan level
  if (plan.intro_trigger_type === "duration") {
    return true;
  }

  return false;
}
function getChargeablePrice(plan) {
  const introActive = isIntroPriceActive(plan);

  if (introActive && plan.intro_price !== null) {
    return Number(plan.intro_price);
  }

  return Number(plan.price);
}
function calculateSubscriptionDates(plan) {
  const now = new Date();
  const start_date = new Date(now);

  let referenceDate = new Date(now);

  if (plan.promo_free_until) {
    const promoDate = new Date(plan.promo_free_until);
    if (promoDate > now) {
      referenceDate = promoDate;
    }
  }

  const billingCycleMonths = plan.billing_cycle_months || 12;
  const bonusMonths = plan.bonus_months || 0;
  const totalMonths = billingCycleMonths + bonusMonths;

  const end_date = new Date(referenceDate);
  end_date.setMonth(end_date.getMonth() + totalMonths);

  const renewal_date = new Date(end_date);

  return {
    start_date,
    end_date,
    renewal_date,
    grace_period_until: null,
  };
}

function isPlanEffectivelyFree(plan) {
  const isPriceZero = Number(plan.price) === 0;
  const isPromoActive =
    plan.promo_free_until && new Date(plan.promo_free_until) > new Date();
  return isPriceZero || isPromoActive;
}

async function applyGracePeriodGuard(subscription) {
  if (!subscription) return subscription;

  const now = new Date();
  const endDate = new Date(subscription.end_date);

  const isExpired = endDate < now;
  const isActive = subscription.is_active && subscription.status === "active";
  const hasNoGrace = !subscription.grace_period_until;

  if (isExpired && isActive && hasNoGrace) {
    const gracePeriodUntil = new Date(endDate);
    gracePeriodUntil.setDate(gracePeriodUntil.getDate() + GRACE_PERIOD_DAYS);

    const updated = await prisma.shopSubscription.update({
      where: { subscription_id: subscription.subscription_id },
      data: { grace_period_until: gracePeriodUntil },
    });

    return { ...subscription, grace_period_until: gracePeriodUntil };
  }

  return subscription;
}

function calculateDaysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export async function getVisiblePlans() {
  const plans = await prisma.plan.findMany({
    where: {
      status: "ACTIVE",
      type: "PRE_MADE",
      deleted_at: null,
    },
    orderBy: [{ price: "asc" }, { name: "asc" }],
    select: {
      plan_id: true,
      name: true,
      description: true,
      price: true,
      compare_at_price: true,
      max_users: true,
      max_branches: true,
      billing_cycle_months: true,
      bonus_months: true,
      promo_free_until: true,
      is_featured: true,
      is_customizable: true,
      // ── Intro pricing ──────────────────────
      intro_price: true,
      intro_trigger_type: true,
      intro_duration_years: true,
      intro_end_date: true,
      // ───────────────────────────────────────
    },
  });

  const now = new Date();

  return plans.map((plan) => {
    const introActive = isIntroPriceActive(plan);

    return {
      plan_id: plan.plan_id,
      name: plan.name,
      description: plan.description,
      price: Number(plan.price),
      compare_at_price: plan.compare_at_price
        ? Number(plan.compare_at_price)
        : null,
      max_users: plan.max_users,
      max_branches: plan.max_branches,
      billing_cycle_months: plan.billing_cycle_months || 12,
      bonus_months: plan.bonus_months || 0,
      promo_free_until: plan.promo_free_until,
      is_promo_active: plan.promo_free_until
        ? new Date(plan.promo_free_until) > now
        : false,
      is_featured: plan.is_featured,
      is_customizable: plan.is_customizable,
      // ── Intro pricing ──────────────────────
      intro_price: plan.intro_price ? Number(plan.intro_price) : null,
      intro_trigger_type: plan.intro_trigger_type || null,
      intro_duration_years: plan.intro_duration_years || null,
      intro_end_date: plan.intro_end_date || null,
      is_intro_active: introActive,
      // ───────────────────────────────────────
    };
  });
}

export async function getUserDetails(user_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      full_name: true,
      email: true,
      phone_number: true,
    },
  });

  if (!user) {
    throw createError("User not found", "USER_NOT_FOUND");
  }

  return user;
}

export async function getActivePlan(plan_id) {
  const plan = await prisma.plan.findFirst({
    where: {
      plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  if (!plan) {
    throw createError("Plan not found or not available", "PLAN_NOT_FOUND");
  }

  return plan;
}

export async function createFreeSubscription({
  shop_id,
  plan,
  isPromoApplied = false,
  auditContext,
}) {
  const dates = calculateSubscriptionDates(plan);

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: "active",
      payment_status: "paid",
      billing_cycle: "yearly",

      start_date: dates.start_date,
      end_date: dates.end_date,
      renewal_date: dates.renewal_date,
      grace_period_until: null,

      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
      is_active: true,
    },
  });

  await prisma.shop.update({
    where: { shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  if (isPromoApplied) {
    await prisma.paymentTransaction.create({
      data: {
        shop_id,
        subscription_id: subscription.subscription_id,
        provider: "promo",
        amount: BigInt(0),
        currency: "INR",
        status: "completed",
        meta: {
          plan_name: plan.name,
          promo_free_until: plan.promo_free_until,
          original_price: Number(plan.price),
          created_at: new Date().toISOString(),
        },
      },
    });
  }

  // Audit: Subscription created (free/promo)
  await audit.log({
    action: audit.AuditAction.SUBSCRIPTION_CREATED,
    entity_type: audit.EntityType.SUBSCRIPTION,
    entity_id: subscription.subscription_id,
    shop_id: shop_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      plan_id: plan.plan_id,
      plan_name: plan.name,
      is_promo: isPromoApplied,
      is_free: Number(plan.price) === 0,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
    },
  });
  notify({
    type: NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED,
    context: {
      shop_id,
      plan_name: plan.name,
      end_date: subscription.end_date,
    },
  }).catch((err) =>
    console.error("[Notification] SUBSCRIPTION_ACTIVATED failed:", err),
  );

  return subscription;
}

export async function createPaidSubscription({ shop_id, plan, user }) {
  const dates = calculateSubscriptionDates(plan);

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: plan.plan_id,
      status: "pending",
      payment_status: "pending",
      billing_cycle: "yearly",

      start_date: dates.start_date,
      end_date: dates.end_date,
      renewal_date: dates.renewal_date,
      grace_period_until: null,

      branch_limit_snapshot: plan.max_branches,
      user_limit_snapshot: plan.max_users,
      is_active: false,
    },
  });

  // ── Determine charge amount ─────────────────────────────────────────────
  // If intro pricing is active, charge intro_price. Otherwise charge price.
  const chargeablePrice = getChargeablePrice(plan);
  const introActive = isIntroPriceActive(plan);
  const amountInPaisa = Math.round(chargeablePrice * 100);
  // ────────────────────────────────────────────────────────────────────────

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaisa,
    currency: RAZORPAY_CURRENCY,
    receipt: subscription.subscription_id,
    notes: {
      shop_id,
      plan_id: plan.plan_id,
      plan_name: plan.name,
      subscription_id: subscription.subscription_id,
      // Record what was charged and why
      charge_type: introActive ? "intro" : "regular",
      intro_trigger_type: plan.intro_trigger_type || null,
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      shop_id,
      subscription_id: subscription.subscription_id,
      provider: "razorpay",
      provider_order_id: razorpayOrder.id,
      // Store the actual charged amount (not plan.price)
      amount: BigInt(chargeablePrice),
      currency: RAZORPAY_CURRENCY,
      status: "created",
      meta: {
        plan_name: plan.name,
        billing_cycle_months: plan.billing_cycle_months || 12,
        bonus_months: plan.bonus_months || 0,
        // Intro pricing metadata for audit trail
        is_intro_charge: introActive,
        intro_trigger_type: plan.intro_trigger_type || null,
        intro_duration_years: plan.intro_duration_years || null,
        intro_end_date: plan.intro_end_date || null,
        regular_price: Number(plan.price),
        charged_price: chargeablePrice,
        created_at: new Date().toISOString(),
      },
    },
  });

  return {
    subscription,
    razorpay_order_id: razorpayOrder.id,
    razorpay_key: process.env.RAZORPAY_KEY_ID,
    amount: amountInPaisa,
    amount_in_rupees: chargeablePrice,
    currency: RAZORPAY_CURRENCY,
    user_name: user.full_name,
    user_email: user.email,
    user_phone: user.phone_number,
    // Pass intro metadata to controller for response
    is_intro_charge: introActive,
    intro_trigger_type: plan.intro_trigger_type || null,
  };
}

export async function verifyAndActivateSubscription({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  subscription_id,
  auditContext,
}) {
  const isValid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );

  if (!isValid) {
    throw createError(
      "Payment verification failed - invalid signature",
      "INVALID_SIGNATURE",
    );
  }

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { provider_order_id: razorpay_order_id },
    include: { subscription: true },
  });

  if (!transaction) {
    throw createError("Transaction not found", "TRANSACTION_NOT_FOUND");
  }

  if (transaction.subscription_id !== subscription_id) {
    throw createError("Subscription mismatch", "SUBSCRIPTION_MISMATCH");
  }

  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id },
    include: { plan: true },
  });

  if (!subscription) {
    throw createError("Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  const dates = calculateSubscriptionDates(subscription.plan);

  const result = await prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.update({
      where: { transaction_id: transaction.transaction_id },
      data: {
        provider_payment_id: razorpay_payment_id,
        status: "captured",
        meta: {
          ...transaction.meta,
          signature_verified: true,
          captured_at: new Date().toISOString(),
        },
      },
    });

    const activatedSubscription = await tx.shopSubscription.update({
      where: { subscription_id },
      data: {
        status: "active",
        payment_status: "paid",
        is_active: true,
        start_date: dates.start_date,
        end_date: dates.end_date,
        renewal_date: dates.renewal_date,
        grace_period_until: null,
      },
      include: { plan: true },
    });

    await tx.shop.update({
      where: { shop_id: transaction.shop_id },
      data: { current_subscription_id: subscription_id },
    });

    // Audit: Subscription activated
    await audit.log(
      {
        action: audit.AuditAction.SUBSCRIPTION_ACTIVATED,
        entity_type: audit.EntityType.SUBSCRIPTION,
        entity_id: subscription_id,
        shop_id: transaction.shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          plan_id: activatedSubscription.plan.plan_id,
          plan_name: activatedSubscription.plan.name,
          payment_id: razorpay_payment_id,
          amount: Number(transaction.amount),
          start_date: activatedSubscription.start_date,
          end_date: activatedSubscription.end_date,
        },
      },
      { tx },
    );

    notify({
      type: NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED,
      context: {
        shop_id: transaction.shop_id,
        plan_name: activatedSubscription.plan.name,
        end_date: activatedSubscription.end_date,
      },
    }).catch((err) =>
      console.error("[Notification] SUBSCRIPTION_ACTIVATED failed:", err),
    );

    return activatedSubscription;
  });

  return result;
}

export async function getSubscriptionStatus(shop_id) {
  if (!shop_id) return null;

  let subscription = await prisma.shopSubscription.findFirst({
    where: {
      shop_id,
      is_active: true,
    },
    include: {
      plan: {
        select: {
          plan_id: true,
          name: true,
          price: true,
          max_users: true,
          max_branches: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  if (!subscription) return null;

  subscription = await applyGracePeriodGuard(subscription);

  const now = new Date();
  const endDate = new Date(subscription.end_date);
  const isExpired = endDate < now;

  const daysRemaining = calculateDaysRemaining(subscription.end_date);

  const isInGracePeriod = subscription.grace_period_until
    ? new Date(subscription.grace_period_until) >= now && isExpired
    : false;

  return {
    subscription_id: subscription.subscription_id,
    status: subscription.status,
    payment_status: subscription.payment_status,
    billing_cycle: subscription.billing_cycle,
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    renewal_date: subscription.renewal_date,
    grace_period_until: subscription.grace_period_until,
    branch_limit_snapshot: subscription.branch_limit_snapshot,
    user_limit_snapshot: subscription.user_limit_snapshot,
    is_active: subscription.is_active,
    plan: {
      plan_id: subscription.plan.plan_id,
      name: subscription.plan.name,
      price: Number(subscription.plan.price),
      max_users: subscription.plan.max_users,
      max_branches: subscription.plan.max_branches,
    },
    is_expired: isExpired,
    is_in_grace_period: isInGracePeriod,
    days_remaining: daysRemaining,
  };
}

export async function getSubscriptionHistory(shop_id) {
  if (!shop_id) return [];

  const subscriptions = await prisma.shopSubscription.findMany({
    where: { shop_id },
    include: {
      plan: {
        select: {
          plan_id: true,
          name: true,
          price: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return subscriptions.map((sub) => ({
    ...sub,
    plan: {
      ...sub.plan,
      price: Number(sub.plan.price),
    },
  }));
}

export async function cancelPendingSubscriptionService(
  subscription_id,
  shop_id,
) {
  const subscription = await prisma.shopSubscription.findFirst({
    where: {
      subscription_id,
      shop_id,
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  if (subscription.status !== "pending") {
    throw createError("Can only cancel pending subscriptions", "NOT_PENDING");
  }

  await prisma.$transaction(async (tx) => {
    await tx.shopSubscription.update({
      where: { subscription_id },
      data: {
        status: "cancelled",
        is_active: false,
      },
    });

    await tx.paymentTransaction.updateMany({
      where: { subscription_id },
      data: { status: "cancelled" },
    });
  });

  return { success: true };
}

export async function analyzePlanChangeService(shop_id, target_plan_id) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: {
        include: { plan: true },
      },
      _count: {
        select: {
          users: {
            where: {
              is_active: true,
              role: { in: ["branch_admin", "staff"] },
            },
          },
          branches: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  if (!shop?.currentSubscription) {
    throw createError("No active subscription found", "NO_ACTIVE_SUBSCRIPTION");
  }

  const targetPlan = await prisma.plan.findFirst({
    where: {
      plan_id: target_plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  if (!targetPlan) {
    throw createError("Target plan not found", "PLAN_NOT_FOUND");
  }

  const currentPlan = shop.currentSubscription.plan;
  const activeUsers = shop._count.users;
  const activeBranches = shop._count.branches;

  if (currentPlan.plan_id === target_plan_id) {
    return {
      direction: "renew",
      hasImpact: false,
      currentPlan: formatPlanForResponse(currentPlan),
      targetPlan: formatPlanForResponse(targetPlan),
      usage: { activeUsers, activeBranches },
    };
  }

  const normalizeLimit = (val) => (val === -1 ? Infinity : val);
  const currentMaxUsers = normalizeLimit(currentPlan.max_users);
  const currentMaxBranches = normalizeLimit(currentPlan.max_branches);
  const targetMaxUsers = normalizeLimit(targetPlan.max_users);
  const targetMaxBranches = normalizeLimit(targetPlan.max_branches);

  const userDecrease = targetMaxUsers < currentMaxUsers;
  const branchDecrease = targetMaxBranches < currentMaxBranches;
  const isDowngrade = userDecrease || branchDecrease;

  if (isDowngrade) {
    const excessUsers =
      targetPlan.max_users !== -1
        ? Math.max(0, activeUsers - targetPlan.max_users)
        : 0;
    const excessBranches =
      targetPlan.max_branches !== -1
        ? Math.max(0, activeBranches - targetPlan.max_branches)
        : 0;

    return {
      direction: "downgrade",
      hasImpact: excessUsers > 0 || excessBranches > 0,
      currentPlan: formatPlanForResponse(currentPlan),
      targetPlan: formatPlanForResponse(targetPlan),
      usage: { activeUsers, activeBranches },
      compliance: {
        users: {
          current: activeUsers,
          allowed: targetPlan.max_users,
          excess: excessUsers,
        },
        branches: {
          current: activeBranches,
          allowed: targetPlan.max_branches,
          excess: excessBranches,
        },
      },
    };
  }

  return {
    direction: "upgrade",
    hasImpact: false,
    currentPlan: formatPlanForResponse(currentPlan),
    targetPlan: formatPlanForResponse(targetPlan),
    usage: { activeUsers, activeBranches },
  };
}

export async function getComplianceDataService(shop_id, target_plan_id) {
  const targetPlan = await prisma.plan.findFirst({
    where: {
      plan_id: target_plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  if (!targetPlan) {
    throw createError("Target plan not found", "PLAN_NOT_FOUND");
  }

  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true },
  });

  const users = await prisma.user.findMany({
    where: {
      shop_id,
      is_active: true,
      role: { in: ["branch_admin", "staff"] },
      user_id: { not: shop.owner_user_id },
    },
    select: {
      user_id: true,
      full_name: true,
      username: true,
      role: true,
      branch: {
        select: { branch_id: true, branch_name: true },
      },
    },
    orderBy: [{ role: "asc" }, { full_name: "asc" }],
  });

  const branches = await prisma.branch.findMany({
    where: { shop_id, is_active: true },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      _count: {
        select: { users: { where: { is_active: true } } },
      },
    },
    orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
  });

  return {
    targetPlan: formatPlanForResponse(targetPlan),
    users: users.map((u) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      username: u.username,
      role: u.role,
      branch_name: u.branch?.branch_name || "Unassigned",
    })),
    branches: branches.map((b) => ({
      branch_id: b.branch_id,
      branch_name: b.branch_name,
      is_main: b.branch_type === "main",
      user_count: b._count.users,
    })),
    counts: {
      activeUsers: users.length,
      activeBranches: branches.length,
      userLimit: targetPlan.max_users,
      branchLimit: targetPlan.max_branches,
    },
  };
}

export async function changePlanService({
  shop_id,
  user_id,
  target_plan_id,
  users_to_disable = [],
  branches_to_deactivate = [],
  user_reassignments = [],
  auditContext,
}) {
  const analysis = await analyzePlanChangeService(shop_id, target_plan_id);

  const targetPlan = await prisma.plan.findFirst({
    where: {
      plan_id: target_plan_id,
      status: "ACTIVE",
      deleted_at: null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { user_id },
    select: { full_name: true, email: true, phone_number: true },
  });

  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: {
        include: { plan: true },
      },
    },
  });

  //  Get current plan from shop's subscription
  const currentPlan = shop.currentSubscription?.plan || null;

  if (analysis.direction === "renew") {
    return await executeRenewal(
      shop_id,
      targetPlan,
      shop.currentSubscription,
      user,
      auditContext,
    );
  }

  if (analysis.direction === "upgrade") {
    //  Pass currentPlan to executeUpgrade
    return await executeUpgrade(
      shop_id,
      targetPlan,
      currentPlan,
      user,
      auditContext,
    );
  }

  return await executeDowngrade(
    shop_id,
    targetPlan,
    analysis,
    users_to_disable,
    branches_to_deactivate,
    user_reassignments,
    auditContext,
  );
}

async function executeUpgrade(
  shop_id,
  targetPlan,
  currentPlan,
  user,
  auditContext,
) {
  const dates = calculateSubscriptionDates(targetPlan);

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: targetPlan.plan_id,
      status: "pending",
      payment_status: "pending",
      billing_cycle: "yearly",
      start_date: dates.start_date,
      end_date: dates.end_date,
      renewal_date: dates.renewal_date,
      grace_period_until: null,
      branch_limit_snapshot: targetPlan.max_branches,
      user_limit_snapshot: targetPlan.max_users,
      is_active: false,
    },
  });

  // ── Use intro price if active, otherwise regular price ─────────────────
  const chargeablePrice = getChargeablePrice(targetPlan);
  const introActive = isIntroPriceActive(targetPlan);
  const amountInPaisa = Math.round(chargeablePrice * 100);
  // ────────────────────────────────────────────────────────────────────────

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaisa,
    currency: RAZORPAY_CURRENCY,
    receipt: subscription.subscription_id,
    notes: {
      shop_id,
      plan_id: targetPlan.plan_id,
      plan_name: targetPlan.name,
      subscription_id: subscription.subscription_id,
      type: "upgrade",
      charge_type: introActive ? "intro" : "regular",
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      shop_id,
      subscription_id: subscription.subscription_id,
      provider: "razorpay",
      provider_order_id: razorpayOrder.id,
      amount: BigInt(chargeablePrice),
      currency: RAZORPAY_CURRENCY,
      status: "created",
      meta: {
        plan_name: targetPlan.name,
        type: "upgrade",
        is_intro_charge: introActive,
        intro_trigger_type: targetPlan.intro_trigger_type || null,
        regular_price: Number(targetPlan.price),
        charged_price: chargeablePrice,
        created_at: new Date().toISOString(),
      },
    },
  });

  await audit.log({
    action: audit.AuditAction.PLAN_UPGRADED,
    entity_type: audit.EntityType.SUBSCRIPTION,
    entity_id: subscription.subscription_id,
    shop_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      previous_plan_id: currentPlan?.plan_id,
      previous_plan_name: currentPlan?.name,
      target_plan_id: targetPlan.plan_id,
      target_plan_name: targetPlan.name,
      price: chargeablePrice,
      is_intro_charge: introActive,
      payment_pending: true,
      razorpay_order_id: razorpayOrder.id,
    },
  });

  notify({
    type: NOTIFICATION_EVENTS.PLAN_UPGRADED,
    context: {
      shop_id,
      old_plan_name: currentPlan?.name || "Previous Plan",
      new_plan_name: targetPlan.name,
    },
  }).catch((err) => console.error("[Notification] PLAN_UPGRADED failed:", err));

  return {
    requires_payment: true,
    subscription_id: subscription.subscription_id,
    razorpay: {
      key: process.env.RAZORPAY_KEY_ID,
      order_id: razorpayOrder.id,
      amount: amountInPaisa,
      currency: RAZORPAY_CURRENCY,
      name: "Cureli",
      description: introActive
        ? `${targetPlan.name} - Intro Period (Upgrade)`
        : `${targetPlan.name} - Annual Subscription (Upgrade)`,
      prefill: {
        name: user.full_name || "",
        email: user.email || "",
        contact: user.phone_number || "",
      },
    },
    plan: formatPlanForResponse(targetPlan),
    // Pass to controller for response
    is_intro_charge: introActive,
  };
}

async function executeRenewal(
  shop_id,
  targetPlan,
  currentSubscription,
  user,
  auditContext,
) {
  const now = new Date();
  const currentEndDate = new Date(currentSubscription.end_date);
  const referenceDate = currentEndDate > now ? currentEndDate : now;

  const billingCycleMonths = targetPlan.billing_cycle_months || 12;
  const bonusMonths = targetPlan.bonus_months || 0;
  const totalMonths = billingCycleMonths + bonusMonths;

  const start_date = new Date(referenceDate);
  const end_date = new Date(referenceDate);
  end_date.setMonth(end_date.getMonth() + totalMonths);
  const renewal_date = new Date(end_date);

  const subscription = await prisma.shopSubscription.create({
    data: {
      shop_id,
      plan_id: targetPlan.plan_id,
      status: "pending",
      payment_status: "pending",
      billing_cycle: "yearly",
      start_date,
      end_date,
      renewal_date,
      grace_period_until: null,
      branch_limit_snapshot: targetPlan.max_branches,
      user_limit_snapshot: targetPlan.max_users,
      is_active: false,
    },
  });

  // ── Always charge regular price on renewal ──────────────────────────────
  // Intro pricing is a first-time incentive only.
  const priceInRupees = Number(targetPlan.price);
  const amountInPaisa = Math.round(priceInRupees * 100);
  // ────────────────────────────────────────────────────────────────────────

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaisa,
    currency: RAZORPAY_CURRENCY,
    receipt: subscription.subscription_id,
    notes: {
      shop_id,
      plan_id: targetPlan.plan_id,
      plan_name: targetPlan.name,
      subscription_id: subscription.subscription_id,
      type: "renewal",
      charge_type: "regular", // always regular on renewal
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      shop_id,
      subscription_id: subscription.subscription_id,
      provider: "razorpay",
      provider_order_id: razorpayOrder.id,
      amount: BigInt(priceInRupees),
      currency: RAZORPAY_CURRENCY,
      status: "created",
      meta: {
        plan_name: targetPlan.name,
        type: "renewal",
        is_intro_charge: false, // explicitly false for renewal
        regular_price: priceInRupees,
        charged_price: priceInRupees,
        extended_from: currentSubscription.end_date,
        created_at: new Date().toISOString(),
      },
    },
  });

  await audit.log({
    action: audit.AuditAction.SUBSCRIPTION_RENEWED,
    entity_type: audit.EntityType.SUBSCRIPTION,
    entity_id: subscription.subscription_id,
    shop_id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      plan_id: targetPlan.plan_id,
      plan_name: targetPlan.name,
      previous_end_date: currentSubscription.end_date,
      new_end_date: end_date,
      payment_pending: true,
      is_intro_charge: false,
      razorpay_order_id: razorpayOrder.id,
    },
  });

  return {
    requires_payment: true,
    subscription_id: subscription.subscription_id,
    razorpay: {
      key: process.env.RAZORPAY_KEY_ID,
      order_id: razorpayOrder.id,
      amount: amountInPaisa,
      currency: RAZORPAY_CURRENCY,
      name: "Cureli",
      description: `${targetPlan.name} - Plan Renewal`,
      prefill: {
        name: user.full_name || "",
        email: user.email || "",
        contact: user.phone_number || "",
      },
    },
    plan: formatPlanForResponse(targetPlan),
    is_intro_charge: false,
  };
}

async function executeDowngrade(
  shop_id,
  targetPlan,
  analysis,
  users_to_disable,
  branches_to_deactivate,
  user_reassignments = [],
  auditContext,
) {
  const now = new Date();

  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: { owner_user_id: true },
  });

  if (users_to_disable.includes(shop.owner_user_id)) {
    throw createError("Cannot disable shop owner", "CANNOT_DISABLE_OWNER");
  }

  const activeBranches = analysis.usage.activeBranches;
  const remainingBranches = activeBranches - branches_to_deactivate.length;

  if (remainingBranches < 1) {
    throw createError(
      "Must keep at least one active branch",
      "MUST_KEEP_ONE_BRANCH",
    );
  }

  if (users_to_disable.length > 0) {
    const validUsers = await prisma.user.count({
      where: {
        user_id: { in: users_to_disable },
        shop_id,
        is_active: true,
        role: { in: ["branch_admin", "staff"] },
      },
    });

    if (validUsers !== users_to_disable.length) {
      throw createError(
        "Some users are invalid or already disabled",
        "INVALID_USER",
      );
    }
  }

  if (branches_to_deactivate.length > 0) {
    const validBranches = await prisma.branch.count({
      where: {
        branch_id: { in: branches_to_deactivate },
        shop_id,
        is_active: true,
      },
    });

    if (validBranches !== branches_to_deactivate.length) {
      throw createError(
        "Some branches are invalid or already deactivated",
        "INVALID_BRANCH",
      );
    }
  }

  if (user_reassignments.length > 0) {
    const targetBranchIds = [
      ...new Set(user_reassignments.map((r) => r.toBranchId)),
    ];
    const invalidTargets = targetBranchIds.filter((id) =>
      branches_to_deactivate.includes(id),
    );

    if (invalidTargets.length > 0) {
      throw createError(
        "Cannot reassign users to a branch being deactivated",
        "INVALID_REASSIGNMENT_TARGET",
      );
    }

    const validTargetBranches = await prisma.branch.count({
      where: {
        branch_id: { in: targetBranchIds },
        shop_id,
        is_active: true,
      },
    });

    if (validTargetBranches !== targetBranchIds.length) {
      throw createError(
        "Some target branches for reassignment are invalid",
        "INVALID_TARGET_BRANCH",
      );
    }
  }

  const reassignedUserIds = new Set(user_reassignments.map((r) => r.userId));
  const finalUsersToDisable = users_to_disable.filter(
    (id) => !reassignedUserIds.has(id),
  );

  const finalActiveUsers =
    analysis.usage.activeUsers - finalUsersToDisable.length;
  const finalActiveBranches = activeBranches - branches_to_deactivate.length;

  const userLimit =
    targetPlan.max_users === -1 ? Infinity : targetPlan.max_users;
  const branchLimit =
    targetPlan.max_branches === -1 ? Infinity : targetPlan.max_branches;

  if (finalActiveUsers > userLimit) {
    const err = createError(
      `Still ${finalActiveUsers - userLimit} users over the limit. Please disable more users.`,
      "NOT_COMPLIANT",
    );
    err.details = { type: "users", excess: finalActiveUsers - userLimit };
    throw err;
  }

  if (finalActiveBranches > branchLimit) {
    const err = createError(
      `Still ${finalActiveBranches - branchLimit} branches over the limit. Please deactivate more branches.`,
      "NOT_COMPLIANT",
    );
    err.details = {
      type: "branches",
      excess: finalActiveBranches - branchLimit,
    };
    throw err;
  }

  const dates = calculateSubscriptionDates(targetPlan);
  const correlationId = crypto.randomUUID();

  const result = await prisma.$transaction(async (tx) => {
    if (finalUsersToDisable.length > 0) {
      await tx.user.updateMany({
        where: { user_id: { in: finalUsersToDisable } },
        data: { is_active: false, status: "inactive" },
      });

      await tx.userSession.updateMany({
        where: { user_id: { in: finalUsersToDisable }, is_active: true },
        data: { is_active: false, ended_at: now, ended_reason: "admin_force" },
      });

      // Audit: Users disabled due to downgrade
      await audit.log(
        {
          action: audit.AuditAction.USERS_DISABLED_DUE_TO_PLAN_DOWNGRADE,
          entity_type: audit.EntityType.SUBSCRIPTION,
          entity_id: null,
          shop_id: shop_id,
          correlation_id: correlationId,
          ...auditContext,
          reason_code: audit.AuditReasonCode.PLAN_LIMIT_ENFORCEMENT,
          metadata: {
            user_ids: finalUsersToDisable,
            count: finalUsersToDisable.length,
            target_plan_id: targetPlan.plan_id,
            target_plan_name: targetPlan.name,
            new_user_limit: targetPlan.max_users,
          },
        },
        { tx },
      );
    }

    if (user_reassignments.length > 0) {
      for (const reassignment of user_reassignments) {
        await tx.user.update({
          where: { user_id: reassignment.userId },
          data: { branch_id: reassignment.toBranchId },
        });
      }
    }

    if (branches_to_deactivate.length > 0) {
      await tx.branch.updateMany({
        where: { branch_id: { in: branches_to_deactivate } },
        data: { is_active: false },
      });

      // Audit: Branches deactivated due to downgrade
      await audit.log(
        {
          action: audit.AuditAction.BRANCHES_DEACTIVATED_DUE_TO_PLAN_DOWNGRADE,
          entity_type: audit.EntityType.SUBSCRIPTION,
          entity_id: null,
          shop_id: shop_id,
          correlation_id: correlationId,
          ...auditContext,
          reason_code: audit.AuditReasonCode.PLAN_LIMIT_ENFORCEMENT,
          metadata: {
            branch_ids: branches_to_deactivate,
            count: branches_to_deactivate.length,
            target_plan_id: targetPlan.plan_id,
            target_plan_name: targetPlan.name,
            new_branch_limit: targetPlan.max_branches,
          },
        },
        { tx },
      );
    }

    const oldSubscription = await tx.shop.findUnique({
      where: { shop_id },
      select: { current_subscription_id: true },
    });

    if (oldSubscription?.current_subscription_id) {
      await tx.shopSubscription.update({
        where: { subscription_id: oldSubscription.current_subscription_id },
        data: { is_active: false, status: "cancelled" },
      });
    }

    const newSubscription = await tx.shopSubscription.create({
      data: {
        shop_id,
        plan_id: targetPlan.plan_id,
        status: "active",
        payment_status: "paid",
        billing_cycle: "yearly",
        start_date: dates.start_date,
        end_date: dates.end_date,
        renewal_date: dates.renewal_date,
        grace_period_until: null,
        branch_limit_snapshot: targetPlan.max_branches,
        user_limit_snapshot: targetPlan.max_users,
        is_active: true,
      },
    });

    await tx.shop.update({
      where: { shop_id },
      data: { current_subscription_id: newSubscription.subscription_id },
    });

    // Audit: Plan downgraded
    await audit.log(
      {
        action: audit.AuditAction.PLAN_DOWNGRADED,
        entity_type: audit.EntityType.SUBSCRIPTION,
        entity_id: newSubscription.subscription_id,
        shop_id: shop_id,
        correlation_id: correlationId,
        ...auditContext,
        reason_code: audit.AuditReasonCode.USER_REQUEST,
        metadata: {
          previous_subscription_id: oldSubscription?.current_subscription_id,
          new_plan_id: targetPlan.plan_id,
          new_plan_name: targetPlan.name,
          disabled_users_count: finalUsersToDisable.length,
          deactivated_branches_count: branches_to_deactivate.length,
          reassigned_users_count: user_reassignments.length,
        },
      },
      { tx },
    );

    return newSubscription;
  });

  notify({
    type: NOTIFICATION_EVENTS.PLAN_DOWNGRADED,
    context: {
      shop_id,
      old_plan_name: analysis.currentPlan?.name || "Previous Plan",
      new_plan_name: targetPlan.name,
      effective_date: result.start_date,
    },
  }).catch((err) =>
    console.error("[Notification] PLAN_DOWNGRADED failed:", err),
  );

  return {
    requires_payment: false,
    subscription: {
      subscription_id: result.subscription_id,
      status: result.status,
      start_date: result.start_date,
      end_date: result.end_date,
    },
    plan: formatPlanForResponse(targetPlan),
    disabled_users: finalUsersToDisable.length,
    deactivated_branches: branches_to_deactivate.length,
    reassigned_users: user_reassignments.length,
  };
}

function formatPlanForResponse(plan) {
  const now = new Date();
  const isPromoActive = plan.promo_free_until
    ? new Date(plan.promo_free_until) > now
    : false;
  const introActive = isIntroPriceActive(plan);

  return {
    plan_id: plan.plan_id,
    name: plan.name,
    description: plan.description,
    price: Number(plan.price),
    compare_at_price: plan.compare_at_price
      ? Number(plan.compare_at_price)
      : null,
    max_users: plan.max_users,
    max_branches: plan.max_branches,
    billing_cycle_months: plan.billing_cycle_months || 12,
    bonus_months: plan.bonus_months || 0,
    promo_free_until: plan.promo_free_until,
    is_promo_active: isPromoActive,
    is_featured: plan.is_featured,
    // ── Intro pricing ──────────────────────────
    intro_price: plan.intro_price ? Number(plan.intro_price) : null,
    intro_trigger_type: plan.intro_trigger_type || null,
    intro_duration_years: plan.intro_duration_years || null,
    intro_end_date: plan.intro_end_date || null,
    is_intro_active: introActive,
    // ───────────────────────────────────────────
  };
}

export async function transitionExpiredToGrace() {
  const now = new Date();

  const expiredSubscriptions = await prisma.shopSubscription.findMany({
    where: {
      is_active: true,
      status: "active",
      end_date: { lt: now },
      grace_period_until: null,
    },
    include: {
      shop: {
        select: { shop_id: true, business_name: true },
      },
    },
  });

  let transitioned = 0;
  const results = [];

  for (const sub of expiredSubscriptions) {
    const graceUntil = new Date(sub.end_date);
    graceUntil.setDate(graceUntil.getDate() + GRACE_PERIOD_DAYS);

    await prisma.shopSubscription.update({
      where: { subscription_id: sub.subscription_id },
      data: { grace_period_until: graceUntil },
    });

    transitioned++;
    results.push({
      subscription_id: sub.subscription_id,
      shop_name: sub.shop?.business_name,
      end_date: sub.end_date,
      grace_period_until: graceUntil,
    });
  }

  return { checked: expiredSubscriptions.length, transitioned, results };
}

export async function suspendExpiredGrace() {
  const now = new Date();

  const expiredGraceSubscriptions = await prisma.shopSubscription.findMany({
    where: {
      is_active: true,
      status: "active",
      grace_period_until: { lt: now },
      payment_status: { not: "paid" },
    },
    include: {
      shop: {
        select: {
          shop_id: true,
          business_name: true,
          owner: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  let suspended = 0;
  const results = [];
  const systemContext = audit.buildSystemContext("suspend-expired-grace");

  for (const sub of expiredGraceSubscriptions) {
    await prisma.$transaction(async (tx) => {
      // Suspend subscription
      await tx.shopSubscription.update({
        where: { subscription_id: sub.subscription_id },
        data: {
          is_active: false,
          status: "suspended",
        },
      });

      //  CORRECT: Use is_active instead of is_suspended
      await tx.shop.update({
        where: { shop_id: sub.shop_id },
        data: {
          is_active: false, //  Suspend the shop
          updated_at: new Date(),
        },
      });

      //  AUDIT: Shop suspended due to non-payment
      await audit.log(
        {
          action: audit.AuditAction.SHOP_SUSPENDED_DUE_TO_NON_PAYMENT,
          entity_type: audit.EntityType.SHOP,
          entity_id: sub.shop_id,
          shop_id: sub.shop_id,
          ...systemContext,
          reason_code: audit.AuditReasonCode.PAYMENT_ISSUE,
          metadata: {
            subscription_id: sub.subscription_id,
            grace_period_until: sub.grace_period_until,
            days_overdue: Math.floor(
              (now - new Date(sub.grace_period_until)) / (1000 * 60 * 60 * 24),
            ),
            reason: "Grace period expired without payment",
          },
        },
        { tx },
      );
      notify({
        type: NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED,
        context: {
          shop_id: sub.shop_id,
          reason: "Payment overdue - grace period expired",
        },
      }).catch((err) =>
        console.error("[Notification] SUBSCRIPTION_SUSPENDED failed:", err),
      );
    });

    suspended++;
    results.push({
      subscription_id: sub.subscription_id,
      shop_id: sub.shop_id,
      shop_name: sub.shop?.business_name,
      grace_period_until: sub.grace_period_until,
    });
  }

  return { checked: expiredGraceSubscriptions.length, suspended, results };
}
export async function transitionPendingToOverdue() {
  const now = new Date();

  const overdueSubscriptions = await prisma.shopSubscription.findMany({
    where: {
      payment_status: "pending",
      end_date: { lt: now },
    },
  });

  const result = await prisma.shopSubscription.updateMany({
    where: {
      payment_status: "pending",
      end_date: { lt: now },
    },
    data: {
      payment_status: "overdue",
    },
  });

  return { checked: overdueSubscriptions.length, updated: result.count };
}

export async function getSubscriptionsDueForReminders() {
  const now = new Date();

  const reminder7Days = new Date(now);
  reminder7Days.setDate(reminder7Days.getDate() + 7);

  const reminder3Days = new Date(now);
  reminder3Days.setDate(reminder3Days.getDate() + 3);

  const graceDaysWarning = new Date(now);
  graceDaysWarning.setDate(graceDaysWarning.getDate() + 1);

  const expiring7Days = await prisma.shopSubscription.findMany({
    where: {
      is_active: true,
      status: "active",
      end_date: {
        gte: new Date(now.setHours(0, 0, 0, 0)),
        lt: new Date(reminder7Days.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      shop: {
        include: {
          owner: {
            select: { email: true, full_name: true },
          },
        },
      },
    },
  });

  const expiring3Days = await prisma.shopSubscription.findMany({
    where: {
      is_active: true,
      status: "active",
      end_date: {
        gte: new Date(now.setHours(0, 0, 0, 0)),
        lt: new Date(reminder3Days.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      shop: {
        include: {
          owner: {
            select: { email: true, full_name: true },
          },
        },
      },
    },
  });

  const graceEndingSoon = await prisma.shopSubscription.findMany({
    where: {
      is_active: true,
      status: "active",
      grace_period_until: {
        gte: now,
        lt: graceDaysWarning,
      },
    },
    include: {
      shop: {
        include: {
          owner: {
            select: { email: true, full_name: true },
          },
        },
      },
    },
  });

  return {
    expiring7Days,
    expiring3Days,
    graceEndingSoon,
  };
}

export async function sendSubscriptionReminders() {
  const { expiring7Days, expiring3Days, graceEndingSoon } =
    await getSubscriptionsDueForReminders();

  const now = new Date();

  // 7 days reminder
  for (const sub of expiring7Days) {
    notify({
      type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS,
      context: {
        shop_id: sub.shop_id,
        plan_name: sub.plan?.name || "Current Plan",
        end_date: sub.end_date,
      },
    }).catch((err) =>
      console.error("[Notification] SUBSCRIPTION_EXPIRING_7_DAYS failed:", err),
    );
  }

  // 3 days reminder
  for (const sub of expiring3Days) {
    notify({
      type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS,
      context: {
        shop_id: sub.shop_id,
        plan_name: sub.plan?.name || "Current Plan",
        end_date: sub.end_date,
      },
    }).catch((err) =>
      console.error("[Notification] SUBSCRIPTION_EXPIRING_3_DAYS failed:", err),
    );
  }

  // Grace period ending soon
  for (const sub of graceEndingSoon) {
    notify({
      type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING,
      context: {
        shop_id: sub.shop_id,
        grace_period_until: sub.grace_period_until,
      },
    }).catch((err) =>
      console.error("[Notification] SUBSCRIPTION_GRACE_ENDING failed:", err),
    );
  }

  return {
    reminded_7days: expiring7Days.length,
    reminded_3days: expiring3Days.length,
    grace_ending_soon: graceEndingSoon.length,
  };
}

// 📋 NOTIFICATIONS ADDED:
// - SUBSCRIPTION_ACTIVATED (free + paid)
// - PLAN_UPGRADED (upgrade initiated)
// - PLAN_DOWNGRADED (downgrade completed)
// - SUBSCRIPTION_SUSPENDED (grace period expired)
// - SUBSCRIPTION_EXPIRING_7_DAYS / _3_DAYS / GRACE_ENDING (via new cron helper)
//
// NOTE: For expiry/grace notifications, call sendSubscriptionReminders() daily via cron
