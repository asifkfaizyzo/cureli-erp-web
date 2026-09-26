// pharmacy-web/src/store/useSubscriptionStore.js (do not remove this comment)
// src/store/useSubscriptionStore.js

import { create } from "zustand";
import { getSubscriptionStatus } from "../api/subscription";

/**
 * ============================================
 * SUBSCRIPTION STORE
 * ============================================
 */

const initialState = {
  isLoaded: false,
  isLoading: false,
  error: null,

  // Subscription data
  has_active_subscription: false,
  is_in_grace_period: false,
  days_remaining: null,
  end_date: null,

  plan_id: null,
  plan_name: null,

  // Computed flags
  needs_renewal: false,
  is_urgent: false,
};

export const useSubscriptionStore = create((set, get) => ({
  ...initialState,

  /**
   * Load subscription status from API
   */
  loadSubscriptionStatus: async (force = false) => {
    const { isLoaded, isLoading } = get();

    if (isLoaded && !force) return;
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const response = await getSubscriptionStatus();

      //  FIX: Correctly access nested response structure
      // API returns: { success: true, data: { subscription: {...} } }
      const apiData = response.data; // { success, data, message }
      const subscription = apiData?.data?.subscription || apiData?.subscription;

      if (!subscription) {
      
        set({
          ...initialState,
          isLoaded: true,
          isLoading: false,
        });
        return;
      }

      //  FIX: Use the pre-calculated days_remaining from API if available
      let daysRemaining = subscription.days_remaining;

      // Fallback calculation if not provided
      if (daysRemaining === undefined || daysRemaining === null) {
        const endDate = new Date(subscription.end_date);
        const now = new Date();
        const diffTime = endDate - now;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      //  FIX: Use is_in_grace_period from API response
      const isInGracePeriod = subscription.is_in_grace_period || false;

      // Determine renewal flags
      const needsRenewal = daysRemaining <= 30 || isInGracePeriod;
      const isUrgent = daysRemaining <= 7 || isInGracePeriod;

      set({
        isLoaded: true,
        isLoading: false,
        error: null,

        has_active_subscription: true,
        is_in_grace_period: isInGracePeriod,
        days_remaining: daysRemaining,
        end_date: subscription.end_date,

        plan_id: subscription.plan?.plan_id || null,
        plan_name: subscription.plan?.name || null,

        needs_renewal: needsRenewal,
        is_urgent: isUrgent,
      });

      
    } catch (error) {
      console.error(" [SubscriptionStore] Failed to load:", error);

      set({
        isLoaded: true,
        isLoading: false,
        error: error.response?.data?.message || "Failed to load subscription",
      });
    }
  },

  refresh: () => get().loadSubscriptionStatus(true),
  clear: () => set(initialState),
}));

// ============================================
// SELECTORS
// ============================================

export const selectNeedsRenewal = (state) => state.needs_renewal;
export const selectIsUrgent = (state) => state.is_urgent;
export const selectDaysRemaining = (state) => state.days_remaining;
export const selectIsInGrace = (state) => state.is_in_grace_period;
export const selectIsLoaded = (state) => state.isLoaded;
