// backend/src/modules/cadmin/subscriptions/cadminSubscriptions.service.js (do not remove this comment)
// ============================================
// backend\src\modules\cadmin\subscriptions\cadminSubscriptions.service.js
// ============================================

import prisma from "../../../config/prisma.js";
import {
  notify,
  notifyAsync,
  NOTIFICATION_EVENTS,
} from "../../notifications/index.js";
import * as audit from "../../audit/index.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatSubscriptionForList(subscription, category) {
  const shop = subscription.shop;
  const plan = subscription.plan;

  let daysLeft = null;
  if (category === "expiring") {
    daysLeft = getDaysRemaining(subscription.end_date);
  } else if (category === "gracePeriod") {
    daysLeft = getDaysRemaining(subscription.grace_period_until);
  }

  return {
    subscription_id: subscription.subscription_id,
    status: subscription.status,
    payment_status: subscription.payment_status,
    is_active: subscription.is_active,

    start_date: subscription.start_date,
    end_date: subscription.end_date,
    grace_period_until: subscription.grace_period_until,
    updated_at: subscription.updated_at,

    days_left: daysLeft,
    is_critical: daysLeft !== null && daysLeft <= 3,

    shop_id: shop?.shop_id || null,
    shop_name: shop?.business_name || "Unknown Shop",
    shop_city: shop?.city || "",
    shop_state: shop?.state || "",
    shop_is_active: shop?.is_active ?? true,

    owner_name: shop?.owner?.full_name || "",
    owner_email: shop?.owner?.email || "",
    owner_phone: shop?.owner?.phone_number || "",

    plan_id: plan?.plan_id || null,
    plan_name: plan?.name || "Unknown Plan",
    plan_type: plan?.type || "PRE_MADE",
    plan_price: plan?.price ? Number(plan.price) : 0,
  };
}

// ============================================
// COMMON INCLUDES
// ============================================

const subscriptionIncludes = {
  shop: {
    select: {
      shop_id: true,
      business_name: true,
      city: true,
      state: true,
      is_active: true,
      verification_status: true,
      owner: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          phone_number: true,
        },
      },
    },
  },
  plan: {
    select: {
      plan_id: true,
      name: true,
      type: true,
      price: true,
      max_users: true,
      max_branches: true,
    },
  },
};

// ============================================
// GET AT-RISK SUBSCRIPTIONS
// ============================================

export async function getAtRiskSubscriptions(rangeDays = 30) {
  const now = new Date();
  const rangeEnd = addDays(now, rangeDays);

  const [expiring, gracePeriod, suspended] = await Promise.all([
    // 1. EXPIRING SOON
    prisma.shopSubscription.findMany({
      where: {
        end_date: {
          gte: now,
          lte: rangeEnd,
        },
        is_active: true,
        status: "active",
      },
      include: subscriptionIncludes,
      orderBy: { end_date: "asc" },
    }),

    // 2. IN GRACE PERIOD
    prisma.shopSubscription.findMany({
      where: {
        end_date: {
          lt: now,
        },
        grace_period_until: {
          gt: now,
        },
        is_active: true,
      },
      include: subscriptionIncludes,
      orderBy: { grace_period_until: "asc" },
    }),

    // 3. SUSPENDED
    prisma.shopSubscription.findMany({
      where: {
        is_active: false,
      },
      include: subscriptionIncludes,
      orderBy: { updated_at: "desc" },
      take: 100,
    }),
  ]);

  const formattedExpiring = expiring.map((s) =>
    formatSubscriptionForList(s, "expiring"),
  );
  const formattedGrace = gracePeriod.map((s) =>
    formatSubscriptionForList(s, "gracePeriod"),
  );
  const formattedSuspended = suspended.map((s) =>
    formatSubscriptionForList(s, "suspended"),
  );

  return {
    expiring: formattedExpiring,
    gracePeriod: formattedGrace,
    suspended: formattedSuspended,
    counts: {
      expiring: formattedExpiring.length,
      gracePeriod: formattedGrace.length,
      suspended: formattedSuspended.length,
      total:
        formattedExpiring.length +
        formattedGrace.length +
        formattedSuspended.length,
    },
    meta: {
      range_days: rangeDays,
      fetched_at: now.toISOString(),
    },
  };
}

// ============================================
// GET SUBSCRIPTION BY ID
// ============================================

export async function getSubscriptionById(subscriptionId) {
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
    include: {
      shop: {
        select: {
          shop_id: true,
          business_name: true,
          legal_name: true,
          city: true,
          state: true,
          pincode: true,
          gst_number: true,
          verification_status: true,
          is_active: true,
          created_at: true,
          owner: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              phone_number: true,
              is_active: true,
            },
          },
          _count: {
            select: {
              users: true,
              branches: true,
            },
          },
        },
      },
      plan: {
        select: {
          plan_id: true,
          name: true,
          type: true,
          price: true,
          compare_at_price: true,
          max_users: true,
          max_branches: true,
          billing_cycle_months: true,
          bonus_months: true,
          intro_price: true,
          intro_trigger_type: true,
          intro_duration_years: true,
          intro_end_date: true,
        },
      },
      paymentTransactions: {
        select: {
          transaction_id: true,
          amount: true,
          currency: true,
          status: true,
          provider: true,
          provider_payment_id: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
        take: 10,
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  const daysUntilExpiry = getDaysRemaining(subscription.end_date);
  const daysUntilGraceEnd = getDaysRemaining(subscription.grace_period_until);

  return {
    subscription_id: subscription.subscription_id,
    status: subscription.status,
    payment_status: subscription.payment_status,
    billing_cycle: subscription.billing_cycle,
    is_active: subscription.is_active,

    start_date: subscription.start_date,
    end_date: subscription.end_date,
    renewal_date: subscription.renewal_date,
    grace_period_until: subscription.grace_period_until,
    created_at: subscription.created_at,
    updated_at: subscription.updated_at,

    branch_limit_snapshot: subscription.branch_limit_snapshot,
    user_limit_snapshot: subscription.user_limit_snapshot,

    days_until_expiry: daysUntilExpiry,
    days_until_grace_end: daysUntilGraceEnd,
    is_expired: daysUntilExpiry !== null && daysUntilExpiry < 0,
    is_in_grace:
      daysUntilExpiry !== null &&
      daysUntilExpiry < 0 &&
      daysUntilGraceEnd !== null &&
      daysUntilGraceEnd >= 0,

    shop: subscription.shop,
    plan: {
      ...subscription.plan,
      price: Number(subscription.plan.price),
      compare_at_price: subscription.plan.compare_at_price
        ? Number(subscription.plan.compare_at_price)
        : null,
      intro_price: subscription.plan.intro_price
        ? Number(subscription.plan.intro_price)
        : null,
    },
    payment_history: subscription.paymentTransactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    })),
  };
}

// ============================================
// SEND PAYMENT REMINDER
// ============================================

export async function sendPaymentReminder(
  subscriptionId,
  method,
  cadminId,
  auditContext = {},
) {
  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
    include: {
      shop: {
        include: {
          owner: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              phone_number: true,
            },
          },
        },
      },
      plan: {
        select: {
          name: true,
          price: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (!subscription.is_active) {
    throw createError(
      "Cannot send reminder for suspended subscription",
      "ALREADY_SUSPENDED",
    );
  }

  const owner = subscription.shop?.owner;
  if (!owner) {
    throw createError("Shop owner not found", "OWNER_NOT_FOUND");
  }

  // Validate contact info exists
  if (method === "email" && !owner.email) {
    throw createError("Owner email not available", "NO_EMAIL");
  }
  if (method === "sms" && !owner.phone_number) {
    throw createError("Owner phone not available", "NO_PHONE");
  }
  if (method === "both" && (!owner.email || !owner.phone_number)) {
    throw createError(
      "Both email and phone are required for this method",
      "MISSING_CONTACT",
    );
  }

  const now = new Date();
  const isInGrace =
    subscription.end_date < now && subscription.grace_period_until > now;
  const deadlineDate = isInGrace
    ? subscription.grace_period_until
    : subscription.end_date;
  const daysRemaining = getDaysRemaining(deadlineDate);

  const channels = [];
  if (method === "email" || method === "both") channels.push("email");
  if (method === "sms" || method === "both") channels.push("sms");

  // Send notification
  const notificationResult = await notify({
    type: NOTIFICATION_EVENTS.SUBSCRIPTION_PAYMENT_REMINDER,
    context: {
      shop_id: subscription.shop.shop_id,
      recipientName: owner.full_name,
      email: owner.email,
      phone_number: owner.phone_number,
      shop_name: subscription.shop.business_name,
      plan_name: subscription.plan.name,
      plan_price: Number(subscription.plan.price),
      end_date: subscription.end_date,
      grace_period_until: subscription.grace_period_until,
      days_remaining: daysRemaining,
      is_in_grace: isInGrace,
    },
    channels: channels,
    audience: [
      {
        user_id: owner.user_id,
        email: owner.email,
        phone_number: owner.phone_number,
        full_name: owner.full_name,
      },
    ],
  });

  //  AUDIT: Payment reminder sent (non-critical, async logging)
  audit
    .log({
      action: audit.AuditAction.SYSTEM_BROADCAST_SENT,
      entity_type: audit.EntityType.SUBSCRIPTION,
      entity_id: subscriptionId,
      shop_id: subscription.shop.shop_id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        broadcast_type: "payment_reminder",
        method: method,
        channels: channels,
        sent_to:
          method === "email"
            ? owner.email
            : method === "sms"
              ? owner.phone_number
              : { email: owner.email, phone: owner.phone_number },
        days_remaining: daysRemaining,
        is_in_grace: isInGrace,
        notification_success: notificationResult.success,
      },
    })
    .catch((err) => {
      // Non-blocking: log error but don't fail the operation
      console.error("[AUDIT] Failed to log payment reminder:", err);
    });

  

  return {
    success: notificationResult.success,
    method,
    sent_to:
      method === "email"
        ? owner.email
        : method === "sms"
          ? owner.phone_number
          : { email: owner.email, phone: owner.phone_number },
    shop_name: subscription.shop.business_name,
    sent_at: new Date().toISOString(),
    sent_by: cadminId,
    notification_result: notificationResult,
  };
}

// ============================================
// EXTEND GRACE PERIOD
// ============================================

export async function extendGracePeriod(
  subscriptionId,
  days,
  reason,
  cadminId,
  auditContext = {},
) {
  if (!days || days < 1 || days > 30) {
    throw createError(
      "Extension must be between 1 and 30 days",
      "VALIDATION_ERROR",
    );
  }

  if (!reason || reason.trim().length < 10) {
    throw createError(
      "Reason must be at least 10 characters",
      "VALIDATION_ERROR",
    );
  }

  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
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
              phone_number: true,
            },
          },
        },
      },
      plan: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (!subscription.is_active) {
    throw createError(
      "Cannot extend grace for suspended subscription. Reactivate first.",
      "ALREADY_SUSPENDED",
    );
  }

  const baseDate = subscription.grace_period_until || subscription.end_date;
  const previousGraceEnd = subscription.grace_period_until;
  const newGraceEnd = addDays(new Date(baseDate), days);

  await prisma.$transaction(async (tx) => {
    await tx.shopSubscription.update({
      where: { subscription_id: subscriptionId },
      data: {
        grace_period_until: newGraceEnd,
        updated_at: new Date(),
      },
    });

    //  AUDIT: Grace period extended
    await audit.log(
      {
        action: audit.AuditAction.SUBSCRIPTION_ENTERED_GRACE,
        entity_type: audit.EntityType.SUBSCRIPTION,
        entity_id: subscriptionId,
        shop_id: subscription.shop.shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          grace_period_until: newGraceEnd,
          reason: reason.trim(),
          days_extended: days,
          previous_grace_end: previousGraceEnd,
          new_grace_end: newGraceEnd,
          extended_by_cadmin_id: cadminId,
        },
      },
      { tx },
    );
  });

  // Send notification to shop owner
  const owner = subscription.shop?.owner;
  if (owner?.email) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_EXTENDED,
      context: {
        shop_id: subscription.shop.shop_id,
        recipientName: owner.full_name,
        email: owner.email,
        shop_name: subscription.shop.business_name,
        plan_name: subscription.plan?.name,
        days_extended: days,
        previous_grace_end: previousGraceEnd,
        new_grace_end: newGraceEnd,
        reason: reason.trim(),
      },
      audience: [
        {
          user_id: owner.user_id,
          email: owner.email,
          phone_number: owner.phone_number,
          full_name: owner.full_name,
        },
      ],
    });
  }

  return {
    subscription_id: subscriptionId,
    shop_name: subscription.shop.business_name,
    previous_grace_end: previousGraceEnd,
    new_grace_end: newGraceEnd,
    days_extended: days,
    reason: reason.trim(),
    extended_by: cadminId,
    extended_at: new Date().toISOString(),
  };
}

// ============================================
// FORCE SUSPEND SUBSCRIPTION
// ============================================

export async function forceSuspendSubscription(
  subscriptionId,
  reason,
  cadminId,
  auditContext = {},
) {
  if (!reason || reason.trim().length < 10) {
    throw createError(
      "Reason must be at least 10 characters",
      "VALIDATION_ERROR",
    );
  }

  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
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
              phone_number: true,
            },
          },
        },
      },
      plan: {
        select: {
          name: true,
          price: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (!subscription.is_active) {
    throw createError("Subscription is already suspended", "ALREADY_SUSPENDED");
  }

  await prisma.$transaction(async (tx) => {
    // Suspend subscription
    await tx.shopSubscription.update({
      where: { subscription_id: subscriptionId },
      data: {
        is_active: false,
        status: "suspended",
        updated_at: new Date(),
      },
    });

    // Suspend the shop
    await tx.shop.update({
      where: { shop_id: subscription.shop.shop_id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    //  AUDIT: Shop suspended due to non-payment
    await audit.log(
      {
        action: audit.AuditAction.SHOP_SUSPENDED_DUE_TO_NON_PAYMENT,
        entity_type: audit.EntityType.SHOP,
        entity_id: subscription.shop.shop_id,
        shop_id: subscription.shop.shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.PAYMENT_ISSUE,
        metadata: {
          overdue_amount: Number(subscription.plan.price),
          days_overdue: Math.abs(
            getDaysRemaining(
              subscription.grace_period_until || subscription.end_date,
            ),
          ),
          subscription_id: subscriptionId,
          reason: reason.trim(),
          suspended_by_cadmin_id: cadminId,
        },
      },
      { tx },
    );
  });

  // Send suspension notification
  const owner = subscription.shop?.owner;
  if (owner?.email) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED,
      context: {
        shop_id: subscription.shop.shop_id,
        recipientName: owner.full_name,
        email: owner.email,
        shop_name: subscription.shop.business_name,
        plan_name: subscription.plan?.name,
        plan_price: subscription.plan?.price
          ? Number(subscription.plan.price)
          : null,
        suspension_reason: reason.trim(),
        suspended_at: new Date().toISOString(),
        support_email: process.env.SUPPORT_EMAIL || "support@cureli.in",
      },
      audience: [
        {
          user_id: owner.user_id,
          email: owner.email,
          phone_number: owner.phone_number,
          full_name: owner.full_name,
        },
      ],
    });
  }

  return {
    subscription_id: subscriptionId,
    shop_id: subscription.shop.shop_id,
    shop_name: subscription.shop.business_name,
    new_status: "suspended",
    reason: reason.trim(),
    suspended_by: cadminId,
    suspended_at: new Date().toISOString(),
  };
}

// ============================================
// REACTIVATE SUBSCRIPTION
// ============================================

export async function reactivateSubscription(
  subscriptionId,
  reason,
  extendDays = 30,
  cadminId,
  auditContext = {},
) {
  if (!reason || reason.trim().length < 10) {
    throw createError(
      "Reason must be at least 10 characters",
      "VALIDATION_ERROR",
    );
  }

  if (extendDays < 1 || extendDays > 365) {
    throw createError(
      "Extension days must be between 1 and 365",
      "VALIDATION_ERROR",
    );
  }

  const subscription = await prisma.shopSubscription.findUnique({
    where: { subscription_id: subscriptionId },
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
              phone_number: true,
            },
          },
        },
      },
      plan: {
        select: {
          name: true,
          price: true,
        },
      },
    },
  });

  if (!subscription) {
    throw createError("Subscription not found", "NOT_FOUND");
  }

  if (subscription.is_active) {
    throw createError("Subscription is already active", "ALREADY_ACTIVE");
  }

  const now = new Date();
  const newEndDate = addDays(now, extendDays);
  const newGraceEnd = addDays(newEndDate, 7);

  await prisma.$transaction(async (tx) => {
    // Reactivate subscription
    await tx.shopSubscription.update({
      where: { subscription_id: subscriptionId },
      data: {
        is_active: true,
        status: "active",
        end_date: newEndDate,
        grace_period_until: newGraceEnd,
        updated_at: new Date(),
      },
    });

    // Reactivate the shop
    await tx.shop.update({
      where: { shop_id: subscription.shop.shop_id },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });

    //  AUDIT: Subscription renewed (reactivated)
    await audit.log(
      {
        action: audit.AuditAction.SUBSCRIPTION_RENEWED,
        entity_type: audit.EntityType.SUBSCRIPTION,
        entity_id: subscriptionId,
        shop_id: subscription.shop.shop_id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          subscription_id: subscriptionId,
          previous_end_date: subscription.end_date,
          new_end_date: newEndDate,
          payment_id: null, // Admin reactivation, no payment
          reactivation_reason: reason.trim(),
          extend_days: extendDays,
          reactivated_by_cadmin_id: cadminId,
        },
      },
      { tx },
    );
  });

  // Send reactivation notification
  const owner = subscription.shop?.owner;
  if (owner?.email) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED,
      context: {
        shop_id: subscription.shop.shop_id,
        recipientName: owner.full_name,
        email: owner.email,
        shop_name: subscription.shop.business_name,
        plan_name: subscription.plan?.name,
        start_date: now,
        end_date: newEndDate,
        grace_period_until: newGraceEnd,
        extend_days: extendDays,
        reactivation_reason: reason.trim(),
        is_reactivation: true,
      },
      audience: [
        {
          user_id: owner.user_id,
          email: owner.email,
          phone_number: owner.phone_number,
          full_name: owner.full_name,
        },
      ],
    });
  }

  return {
    subscription_id: subscriptionId,
    shop_id: subscription.shop.shop_id,
    shop_name: subscription.shop.business_name,
    new_status: "active",
    new_end_date: newEndDate,
    new_grace_end: newGraceEnd,
    extend_days: extendDays,
    reason: reason.trim(),
    reactivated_by: cadminId,
    reactivated_at: new Date().toISOString(),
  };
}
