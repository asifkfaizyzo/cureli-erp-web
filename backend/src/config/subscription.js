// backend/src/config/subscription.js (do not remove this comment)
// backend/src/constants/subscription.js

/**
 * Subscription Status Constants
 */
export const SubscriptionStatus = Object.freeze({
  PENDING: "PENDING", // Created, awaiting payment
  ACTIVE: "ACTIVE", // Paid and within subscription period
  EXPIRED: "EXPIRED", // End date has passed
});

export const PaymentStatus = Object.freeze({
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
});

/**
 * Grace period in days after expiry
 * User can still access the app during this period
 */
export const GRACE_PERIOD_DAYS = 20;

/**
 * Check if subscription grants access to the app
 * - ACTIVE: Always yes
 * - EXPIRED: Yes if within grace period
 * - PENDING: No
 */
export function canAccessApp(subscription) {
  if (!subscription) return false;

  const now = new Date();
  const endDate = new Date(subscription.end_date);

  // ACTIVE and not past end date
  if (subscription.status === SubscriptionStatus.ACTIVE && endDate > now) {
    return true;
  }

  // EXPIRED but within grace period
  if (subscription.status === SubscriptionStatus.EXPIRED || endDate <= now) {
    const gracePeriodEnd = new Date(endDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    return now <= gracePeriodEnd;
  }

  return false;
}

/**
 * Check if subscription is in grace period
 */
export function isInGracePeriod(subscription) {
  if (!subscription) return false;

  const now = new Date();
  const endDate = new Date(subscription.end_date);

  // Not expired yet
  if (endDate > now) return false;

  // Check if within grace period
  const gracePeriodEnd = new Date(endDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  return now <= gracePeriodEnd;
}

/**
 * Get days remaining (negative if expired)
 */
export function getDaysRemaining(subscription) {
  if (!subscription) return 0;

  const now = new Date();
  const endDate = new Date(subscription.end_date);

  return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
}

/**
 * Get grace period days remaining (0 if not in grace period)
 */
export function getGraceDaysRemaining(subscription) {
  if (!subscription) return 0;

  const now = new Date();
  const endDate = new Date(subscription.end_date);

  // Not expired yet
  if (endDate > now) return GRACE_PERIOD_DAYS;

  const gracePeriodEnd = new Date(endDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  const remaining = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}

/**
 * Get subscription state for pharmacy-web display
 */
export function getSubscriptionState(subscription) {
  if (!subscription) {
    return {
      state: "NONE",
      canAccess: false,
      message: "No subscription",
    };
  }

  const daysRemaining = getDaysRemaining(subscription);
  const graceDaysRemaining = getGraceDaysRemaining(subscription);
  const inGracePeriod = isInGracePeriod(subscription);

  // Active and plenty of time
  if (daysRemaining > 30) {
    return {
      state: "ACTIVE",
      canAccess: true,
      daysRemaining,
      message: `${daysRemaining} days remaining`,
    };
  }

  // Active but expiring soon (within 30 days)
  if (daysRemaining > 0) {
    return {
      state: "EXPIRING_SOON",
      canAccess: true,
      daysRemaining,
      message: `Expiring in ${daysRemaining} days`,
      showWarning: true,
    };
  }

  // Expired but in grace period
  if (inGracePeriod) {
    return {
      state: "GRACE_PERIOD",
      canAccess: true,
      graceDaysRemaining,
      message: `Subscription expired! ${graceDaysRemaining} days left to renew`,
      showUrgentWarning: true,
    };
  }

  // Fully expired, no access
  return {
    state: "BLOCKED",
    canAccess: false,
    message: "Subscription expired. Please renew to continue.",
  };
}
