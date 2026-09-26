// pharmacy-web/src/utils/authRouting.js (do not remove this comment)
// src/utils/authRouting.js
//
// Centralized auth-based routing logic.
//
// This is the single source of truth for "where should this user go
// after authentication?". It was previously inlined inside
// LoginOtpVerification as determineDestination(). Extracted here so:
//
//   - LoginPage can redirect already-authenticated users
//   - LoginOtpVerification can reuse the same logic post-OTP
//   - Future guards / flows can import without duplication
//
// Routing rules:
//   staff / branch_admin  → /erp/dashboard (no checks needed)
//   super_admin           → check subscription
//                             no subscription  → /plan-selection
//                             has subscription → check setup
//                               incomplete     → /setup
//                               complete       → /erp/dashboard

import { getMySubscription } from "../api/subscription";
import { getSetupStatus } from "../api/setup";

/**
 * Determine the correct post-auth destination for a user.
 *
 * @param {string} role - The user's role: "super_admin" | "branch_admin" | "staff"
 * @returns {Promise<string>} - A route path string e.g. "/erp/dashboard"
 */
export const determineAuthDestination = async (role) => {
  // ── Non-admin roles: always go straight to dashboard ──────────────────
  if (role === "staff" || role === "branch_admin") {
    console.log(`[authRouting] ${role} → /erp/dashboard`);
    return "/erp/dashboard";
  }

  // ── super_admin: check subscription first ─────────────────────────────
  try {
    const subRes = await getMySubscription();
    const hasActive = subRes.data?.data?.has_active_subscription === true;

    if (!hasActive) {
      console.log("[authRouting] No active subscription → /plan-selection");
      return "/plan-selection";
    }

    // ── Subscription exists: check setup completion ──────────────────────
    try {
      const setupRes = await getSetupStatus();
      const setupData = setupRes.data?.data;

      if (setupData?.is_complete) {
        console.log("[authRouting] Setup complete → /erp/dashboard");
        return "/erp/dashboard";
      }

      console.log("[authRouting] Setup incomplete → /setup");
      return "/setup";
    } catch (setupErr) {
      // Setup API failed — safer to send to setup than dashboard
      // so user doesn't land in a broken ERP state
      console.warn(
        "[authRouting] Setup status check failed, defaulting to /setup",
        setupErr,
      );
      return "/setup";
    }
  } catch (subErr) {
    // Subscription API failed — safer to send to plan-selection
    console.warn(
      "[authRouting] Subscription check failed, defaulting to /plan-selection",
      subErr,
    );
    return "/plan-selection";
  }
};