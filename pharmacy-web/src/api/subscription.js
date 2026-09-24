// pharmacy-web/src/api/subscription.js (do not remove this comment)
// pharmacy-web/src/api/subscription.js

import API from "./axios";

// ============================================
// PLAN APIs
// ============================================

// Get all active plans for selection
export const getPlans = () => API.get("/plans");

// Get single plan by ID
export const getPlanById = (planId) => API.get(`/plans/${planId}`);

// ============================================
// SUBSCRIPTION APIs
// ============================================

// Get user details for Razorpay prefill
export const getUserDetails = () => API.get("/subscriptions/user-details");

// Select a plan (creates Razorpay order for paid, activates for free)
export const selectPlan = (data) => API.post("/subscriptions/select", data);

// Confirm payment after Razorpay checkout
export const confirmPayment = (data) =>
  API.post("/subscriptions/confirm", data);

// Get current subscription
export const getMySubscription = () => API.get("/subscriptions/my");

// Get subscription status
export const getSubscriptionStatus = () => API.get("/subscriptions/status");

// Get subscription history
export const getSubscriptionHistory = () => API.get("/subscriptions/history");

// Cancel pending subscription (e.g., if user closes Razorpay)
export const cancelPendingSubscription = (subscriptionId) =>
  API.post(`/subscriptions/${subscriptionId}/cancel`);

// ============================================
// PLAN CHANGE APIs (Upgrade/Downgrade)
// ============================================

/**
 * Change subscription plan (upgrade or downgrade)
 * @param {Object} data
 * @param {string} data.plan_id - Target plan ID
 * @param {string[]} data.users_to_disable - User IDs to disable (downgrade only)
 * @param {string[]} data.branches_to_deactivate - Branch IDs to deactivate (downgrade only)
 * @param {Array} data.user_reassignments - User reassignments (downgrade only)
 */
export const changePlan = (data) => API.post("/subscriptions/change", data);

/**
 * Get plan change preview
 * @param {string} planId - Target plan ID
 */
export const previewPlanChange = (planId) =>
  API.get(`/subscriptions/change/preview/${planId}`);

/**
 * Get compliance data for downgrade
 * @param {string} planId - Target plan ID
 */
export const getDowngradeCompliance = (planId) =>
  API.get(`/subscriptions/downgrade/compliance/${planId}`);
