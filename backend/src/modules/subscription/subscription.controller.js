// backend/src/modules/subscription/subscription.controller.js (do not remove this comment)
// src/modules/subscription/subscription.controller.js

import { success, fail } from "../../utils/response.js";
import {
  getVisiblePlans,
  getActivePlan,
  getUserDetails,
  createFreeSubscription,
  createPaidSubscription,
  verifyAndActivateSubscription,
  getSubscriptionStatus,
  getSubscriptionHistory,
  analyzePlanChangeService,
  changePlanService,
  getComplianceDataService,
  cancelPendingSubscriptionService,
} from "./subscription.service.js";
import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js"; //  ADD THIS IMPORT

// ============================================
// GET PLANS
// ============================================

/**
 * GET /plans - Get all available plans
 */
export async function getPlansController(req, res) {
  try {
    const plans = await getVisiblePlans();
    return success(res, { plans });
  } catch (err) {
    console.error("getPlansController error:", err);
    return fail(res, "Failed to fetch plans", 500);
  }
}

// ============================================
// GET USER DETAILS
// ============================================

/**
 * GET /user-details - Get current user details for Razorpay prefill
 */
export async function getUserDetailsController(req, res) {
  try {
    const user_id = req.user.user_id;
    const user = await getUserDetails(user_id);
    return success(res, { user });
  } catch (err) {
    console.error("getUserDetailsController error:", err);

    if (err.code === "USER_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, "Failed to fetch user details", 500);
  }
}

// ============================================
// SELECT PLAN
// ============================================

/**
 * POST /select - Select a plan
 * For FREE plans (price = 0 OR promo active): Activates immediately
 * For PAID plans: Creates Razorpay order
 */
export async function selectPlanController(req, res) {
  try {
    const { plan_id } = req.validated;
    const shop_id = req.user.shop_id;
    const user_id = req.user.user_id;

    if (!shop_id) {
      return fail(
        res,
        "Shop not found. Please complete shop setup first.",
        400,
      );
    }

    // Get the plan first — needed for graceful recovery check below
    const plan = await getActivePlan(plan_id);

    // Check if effectively free (needed before the existing subscription check)
    const isPriceZero = Number(plan.price) === 0;
    const isPromoActive =
      plan.promo_free_until && new Date(plan.promo_free_until) > new Date();
    const isEffectivelyFree = isPriceZero || isPromoActive;

    // Check if shop already has active subscription
    const existingSubscription = await prisma.shopSubscription.findFirst({
      where: {
        shop_id,
        status: "active",
        is_active: true,
        end_date: { gte: new Date() },
      },
    });

    if (existingSubscription) {
      // ── GRACEFUL RECOVERY ─────────────────────────────────────────────
      // Condition: selecting a free plan AND existing active subscription
      // is the same plan AND that subscription is also free/promo.
      // This handles the orphaned-retry case where createFreeSubscription
      // succeeded but the controller crashed before returning a response.
      if (isEffectivelyFree && existingSubscription.plan_id === plan_id) {
        const existingPlan = await getActivePlan(existingSubscription.plan_id);
        const existingIsFree =
          Number(existingPlan.price) === 0 ||
          (existingPlan.promo_free_until &&
            new Date(existingPlan.promo_free_until) > new Date());

        if (existingIsFree) {
          return success(
            res,
            { is_free: true },
            "Subscription already active. Proceeding to setup.",
          );
        }
      }
      // ─────────────────────────────────────────────────────────────────

      return fail(res, "You already have an active subscription", 400);
    }

    // Get user details for Razorpay prefill (paid plans only, but fetch once)
    const user = await getUserDetails(user_id);

    const auditContext = audit.extractRequestContext(req);

    if (isEffectivelyFree) {
      // FREE PLAN (Standard or Promo) - Activate immediately
      const subscription = await createFreeSubscription({
        shop_id,
        plan,
        user_id,
        user_role: req.user.role,
        isPromoApplied: isPromoActive && !isPriceZero,
        auditContext,
      });

      const message =
        isPromoActive && !isPriceZero
          ? "Promo plan activated! Enjoy free access until the promo period ends."
          : "Free plan activated successfully!";

      return success(res, { is_free: true }, message);
    }

    // PAID PLAN - Create Razorpay order
    const orderData = await createPaidSubscription({ shop_id, plan, user });

    return success(
      res,
      {
        is_free: false,
        is_intro_charge: orderData.is_intro_charge || false,
        subscription_id: orderData.subscription.subscription_id,
        razorpay: {
          key: orderData.razorpay_key,
          order_id: orderData.razorpay_order_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Cureli",
          description: orderData.is_intro_charge
            ? `${plan.name} - Intro Period`
            : `${plan.name} - Annual Subscription`,
          prefill: {
            name: orderData.user_name || "",
            email: orderData.user_email || "",
            contact: orderData.user_phone || "",
          },
        },
        plan: {
          plan_id: plan.plan_id,
          name: plan.name,
          price: Number(plan.price),
          intro_price: plan.intro_price ? Number(plan.intro_price) : null,
          intro_trigger_type: plan.intro_trigger_type || null,
          intro_duration_years: plan.intro_duration_years || null,
          intro_end_date: plan.intro_end_date || null,
          is_intro_active: orderData.is_intro_charge || false,
        },
      },
      "Payment order created",
    );
  } catch (err) {
    console.error("selectPlanController error:", err);

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "USER_NOT_FOUND") {
      return fail(res, "User not found", 404);
    }

    return fail(res, "Plan selection failed. Please try again.", 500);
  }
}

// ============================================
// CONFIRM PAYMENT
// ============================================

/**
 * POST /confirm - Confirm payment after Razorpay checkout
 */
export async function confirmPaymentController(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscription_id,
    } = req.validated;

    //  Extract audit context (IP, user agent)
    const auditContext = audit.extractRequestContext(req);

    const subscription = await verifyAndActivateSubscription({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscription_id,
      user_id: req.user.user_id, //  Pass user info
      user_role: req.user.role, //  Pass user role
      auditContext, //  Pass audit context
    });

    return success(
      res,
      {
        subscription: {
          subscription_id: subscription.subscription_id,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          grace_period_until: subscription.grace_period_until,
        },
        plan: {
          plan_id: subscription.plan.plan_id,
          name: subscription.plan.name,
        },
        redirect: "dashboard",
      },
      "Payment successful! Subscription activated.",
    );
  } catch (err) {
    console.error("confirmPaymentController error:", err);

    if (err.code === "INVALID_SIGNATURE") {
      return fail(
        res,
        "Payment verification failed. Please contact support.",
        400,
      );
    }
    if (err.code === "TRANSACTION_NOT_FOUND") {
      return fail(res, "Transaction not found", 404);
    }
    if (err.code === "SUBSCRIPTION_MISMATCH") {
      return fail(res, "Invalid subscription", 400);
    }

    return fail(
      res,
      "Payment confirmation failed. Please contact support.",
      500,
    );
  }
}

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================

/**
 * GET /status - Get current subscription status
 */
export async function subscriptionStatusController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const status = await getSubscriptionStatus(shop_id);
    return success(res, { subscription: status });
  } catch (err) {
    console.error("subscriptionStatusController error:", err);
    return fail(res, "Failed to fetch subscription status", 500);
  }
}

// ============================================
// GET SUBSCRIPTION HISTORY
// ============================================

/**
 * GET /history - Get subscription history
 */
export async function subscriptionHistoryController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const history = await getSubscriptionHistory(shop_id);
    return success(res, { history });
  } catch (err) {
    console.error("subscriptionHistoryController error:", err);
    return fail(res, "Failed to fetch subscription history", 500);
  }
}

// ============================================
// GET MY SUBSCRIPTION (WITH GRACE GUARD)
// ============================================

/**
 * GET /my - Get current user's active subscription
 */
export async function getMySubscription(req, res) {
  try {
    const shop_id = req.user.shop_id;

    if (!shop_id) {
      return success(res, {
        has_active_subscription: false,
        current_plan: null,
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      include: {
        currentSubscription: {
          include: {
            plan: {
              select: {
                plan_id: true,
                name: true,
                price: true,
                max_users: true,
                max_branches: true,
                billing_cycle_months: true,
                bonus_months: true,
                promo_free_until: true,
                intro_price: true,
                intro_trigger_type: true,
                intro_duration_years: true,
                intro_end_date: true,
              },
            },
          },
        },
      },
    });

    if (!shop) {
      return success(res, {
        has_active_subscription: false,
        current_plan: null,
      });
    }

    let sub = shop.currentSubscription;
    const now = new Date();

    if (!sub) {
      return success(res, {
        has_active_subscription: false,
        current_plan: null,
      });
    }

    // READ-TIME GRACE GUARD
    const endDate = new Date(sub.end_date);
    const isExpired = endDate < now;
    const isActive = sub.is_active && sub.status === "active";
    const hasNoGrace = !sub.grace_period_until;

    if (isExpired && isActive && hasNoGrace) {
      const gracePeriodUntil = new Date(endDate);
      gracePeriodUntil.setDate(gracePeriodUntil.getDate() + 7);

      await prisma.shopSubscription.update({
        where: { subscription_id: sub.subscription_id },
        data: { grace_period_until: gracePeriodUntil },
      });

      sub.grace_period_until = gracePeriodUntil;
    }

    const isValid =
      sub.is_active && sub.status === "active" && new Date(sub.end_date) > now;

    const isInGracePeriod =
      sub.grace_period_until &&
      new Date(sub.end_date) <= now &&
      new Date(sub.grace_period_until) > now;

    return success(res, {
      has_active_subscription: isValid || isInGracePeriod,
      is_in_grace_period: isInGracePeriod,
      current_plan:
        isValid || isInGracePeriod
          ? {
              plan_id: sub.plan.plan_id,
              name: sub.plan.name,
              price: Number(sub.plan.price),
              expires_at: sub.end_date,
              grace_period_until: sub.grace_period_until,
              max_branches: sub.plan.max_branches,
              max_users: sub.plan.max_users,
            }
          : null,
      subscription:
        isValid || isInGracePeriod
          ? {
              subscription_id: sub.subscription_id,
              status: sub.status,
              start_date: sub.start_date,
              end_date: sub.end_date,
              renewal_date: sub.renewal_date,
              grace_period_until: sub.grace_period_until,
              branch_limit: sub.branch_limit_snapshot,
              user_limit: sub.user_limit_snapshot,
            }
          : null,
    });
  } catch (err) {
    console.error("getMySubscription error:", err);
    return fail(res, "Failed to fetch subscription status", 500);
  }
}

// ============================================
// PLAN CHANGE CONTROLLERS
// ============================================

/**
 * POST /change - Change subscription plan
 */
export async function changePlanController(req, res) {
  try {
    const {
      plan_id,
      users_to_disable,
      branches_to_deactivate,
      user_reassignments,
    } = req.validated;
    const { shop_id, user_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    //  Extract audit context
    const auditContext = audit.extractRequestContext(req);

    const result = await changePlanService({
      shop_id,
      user_id,
      user_role: req.user.role, //  Pass user role
      target_plan_id: plan_id,
      users_to_disable,
      branches_to_deactivate,
      user_reassignments,
      auditContext, //  Pass audit context
    });

    // UPGRADE: Return Razorpay order
    if (result.requires_payment) {
      return success(
        res,
        {
          requires_payment: true,
          is_intro_charge: result.is_intro_charge || false,
          subscription_id: result.subscription_id,
          razorpay: result.razorpay,
          plan: result.plan,
        },
        "Payment required for upgrade",
      );
    }

    // DOWNGRADE: Applied immediately
    return success(
      res,
      {
        requires_payment: false,
        subscription: result.subscription,
        plan: result.plan,
        disabled_users: result.disabled_users || 0,
        deactivated_branches: result.deactivated_branches || 0,
        reassigned_users: result.reassigned_users || 0,
      },
      "Plan changed successfully",
    );
  } catch (err) {
    console.error("changePlanController error:", err);

    const errorMap = {
      PLAN_NOT_FOUND: 404,
      NO_ACTIVE_SUBSCRIPTION: 400,
      SAME_PLAN: 400,
      NOT_COMPLIANT: 400,
      CANNOT_DISABLE_OWNER: 400,
      MUST_KEEP_ONE_BRANCH: 400,
      INVALID_USER: 400,
      INVALID_BRANCH: 400,
      INVALID_REASSIGNMENT_TARGET: 400,
      INVALID_TARGET_BRANCH: 400,
    };

    const status = errorMap[err.code] || 500;
    return fail(res, err.message, status, {
      code: err.code,
      details: err.details,
    });
  }
}

/**
 * GET /change/preview/:plan_id - Preview plan change impact
 */
export async function previewPlanChangeController(req, res) {
  try {
    const { plan_id } = req.params;
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const preview = await analyzePlanChangeService(shop_id, plan_id);
    return success(res, preview);
  } catch (err) {
    console.error("previewPlanChangeController error:", err);

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "NO_ACTIVE_SUBSCRIPTION") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to preview plan change", 500);
  }
}

/**
 * GET /downgrade/compliance/:plan_id - Get compliance data for downgrade modal
 */
export async function getDowngradeComplianceController(req, res) {
  try {
    const { plan_id } = req.params;
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const complianceData = await getComplianceDataService(shop_id, plan_id);
    return success(res, complianceData);
  } catch (err) {
    console.error("getDowngradeComplianceController error:", err);

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, "Failed to fetch compliance data", 500);
  }
}

/**
 * POST /:subscription_id/cancel - Cancel pending subscription
 */
export async function cancelPendingSubscriptionController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    await cancelPendingSubscriptionService(subscription_id, shop_id);
    return success(res, null, "Pending subscription cancelled");
  } catch (err) {
    console.error("cancelPendingSubscriptionController error:", err);

    if (err.code === "SUBSCRIPTION_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "NOT_PENDING") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to cancel subscription", 500);
  }
}
