// backend/src/modules/subscription/subscription.routes.js (do not remove this comment)
// backend/src/modules/subscription/subscription.routes.js
// REPLACE the entire file with this updated version

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import {
  getPlansController,
  getUserDetailsController,
  selectPlanController,
  confirmPaymentController,
  subscriptionStatusController,
  subscriptionHistoryController,
  getMySubscription,
  // NEW controllers
  changePlanController,
  previewPlanChangeController,
  getDowngradeComplianceController,
  cancelPendingSubscriptionController,
} from "./subscription.controller.js";
import {
  selectPlanSchema,
  confirmPaymentSchema,
  changePlanSchema,
} from "./subscription.schema.js";

const router = express.Router();

// ============================================
// EXISTING ROUTES
// ============================================

// Get all available plans
router.get("/plans", requireAuth, getPlansController);

// Get user details for Razorpay prefill
router.get("/user-details", requireAuth, getUserDetailsController);

// Select a plan (creates order for paid, activates for free) - ONBOARDING ONLY
router.post(
  "/select",
  requireAuth,
  validateBody(selectPlanSchema),
  selectPlanController
);

// Confirm payment after Razorpay checkout
router.post(
  "/confirm",
  requireAuth,
  validateBody(confirmPaymentSchema),
  confirmPaymentController
);

// Get current subscription status
router.get("/status", requireAuth, subscriptionStatusController);

// Get subscription history
router.get("/history", requireAuth, subscriptionHistoryController);

// Get my current subscription
router.get("/my", requireAuth, getMySubscription);

// ============================================
// NEW: PLAN CHANGE ROUTES (Upgrade/Downgrade)
// ============================================

/**
 * POST /api/subscriptions/change
 * Change subscription plan (upgrade or downgrade)
 * - SA only
 * - Upgrade: Creates Razorpay order, returns payment details
 * - Downgrade: Validates compliance, applies immediately
 */
router.post(
  "/change",
  requireAuth,
  requireRole("super_admin"),
  validateBody(changePlanSchema),
  changePlanController
);

/**
 * GET /api/subscriptions/change/preview/:plan_id
 * Preview what will happen on plan change
 * - Returns direction (upgrade/downgrade)
 * - Returns compliance requirements for downgrade
 */
router.get(
  "/change/preview/:plan_id",
  requireAuth,
  requireRole("super_admin"),
  previewPlanChangeController
);

/**
 * GET /api/subscriptions/downgrade/compliance/:plan_id
 * Get users and branches for compliance selection
 * - Returns list of active users (excluding owner)
 * - Returns list of active branches
 */
router.get(
  "/downgrade/compliance/:plan_id",
  requireAuth,
  requireRole("super_admin"),
  getDowngradeComplianceController
);

/**
 * POST /api/subscriptions/:subscription_id/cancel
 * Cancel a pending subscription (e.g., Razorpay abandoned)
 */
router.post(
  "/:subscription_id/cancel",
  requireAuth,
  requireRole("super_admin"),
  cancelPendingSubscriptionController
);

export default router;