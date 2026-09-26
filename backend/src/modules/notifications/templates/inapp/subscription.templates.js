// backend/src/modules/notifications/templates/inapp/subscription.templates.js (do not remove this comment)
// ============================================
// SUBSCRIPTION LIFECYCLE TEMPLATES
// ============================================

export const subscriptionTemplates = {
  /**
   * Subscription activated
   */
  activated: (context) => {
    const { plan_name, end_date } = context;
    return {
      title: 'Subscription Activated',
      message: plan_name
        ? `Your ${plan_name} subscription is now active${end_date ? ` until ${formatDate(end_date)}` : ''}.`
        : 'Your subscription has been successfully activated.',
    };
  },

  /**
   * Subscription expiring in 7 days
   */
  expiring7Days: (context) => {
    const { plan_name, end_date } = context;
    return {
      title: 'Subscription Expiring Soon',
      message: `Your ${plan_name || 'subscription'} will expire in 7 days${end_date ? ` on ${formatDate(end_date)}` : ''}. Renew now to avoid service interruption.`,
    };
  },

  /**
   * Subscription expiring in 3 days
   */
  expiring3Days: (context) => {
    const { plan_name, end_date } = context;
    return {
      title: 'Subscription Expiring in 3 Days',
      message: `Your ${plan_name || 'subscription'} will expire in 3 days${end_date ? ` on ${formatDate(end_date)}` : ''}. Renew immediately to continue using all features.`,
    };
  },

  /**
   * Subscription expired
   */
  expired: (context) => {
    const { plan_name, grace_period_until } = context;
    return {
      title: 'Subscription Expired',
      message: grace_period_until
        ? `Your ${plan_name || 'subscription'} has expired. You have until ${formatDate(grace_period_until)} to renew before access is suspended.`
        : `Your ${plan_name || 'subscription'} has expired. Please renew to continue using all features.`,
    };
  },

  /**
   * Grace period started
   */
  graceStarted: (context) => {
    const { grace_period_until, days_remaining } = context;
    return {
      title: 'Grace Period Started',
      message: days_remaining
        ? `Your subscription has entered a ${days_remaining}-day grace period. Please renew before ${formatDate(grace_period_until)} to avoid suspension.`
        : `Your subscription is in grace period. Please renew before ${formatDate(grace_period_until)} to avoid suspension.`,
    };
  },

  /**
   * Grace period ending (tomorrow)
   */
  graceEnding: (context) => {
    const { grace_period_until } = context;
    return {
      title: 'Grace Period Ending Tomorrow',
      message: 'Your grace period ends tomorrow. Renew now to prevent account suspension and data access loss.',
    };
  },

  /**
   * Grace period extended by admin
   */
  graceExtended: (context) => {
    const { new_grace_until, days_extended } = context;
    return {
      title: 'Grace Period Extended',
      message: days_extended
        ? `Your grace period has been extended by ${days_extended} days until ${formatDate(new_grace_until)}.`
        : `Your grace period has been extended until ${formatDate(new_grace_until)}.`,
    };
  },

  /**
   * Subscription suspended
   */
  suspended: (context) => {
    const { reason } = context;
    return {
      title: 'Subscription Suspended',
      message: reason
        ? `Your subscription has been suspended: ${reason}. Please contact support or renew to restore access.`
        : 'Your subscription has been suspended due to non-payment. Please renew to restore access.',
    };
  },

  /**
   * Subscription renewed
   */
  renewed: (context) => {
    const { plan_name, end_date } = context;
    return {
      title: 'Subscription Renewed',
      message: `Your ${plan_name || 'subscription'} has been renewed successfully${end_date ? ` until ${formatDate(end_date)}` : ''}.`,
    };
  },

  /**
   * Payment reminder from admin
   */
  paymentReminder: (context) => {
    const { days_overdue, amount_due } = context;
    let message = 'This is a reminder to complete your subscription payment.';
    
    if (days_overdue && amount_due) {
      message = `Your payment of ₹${formatAmount(amount_due)} is ${days_overdue} days overdue. Please pay immediately to avoid suspension.`;
    } else if (amount_due) {
      message = `Please complete your pending payment of ₹${formatAmount(amount_due)} to continue your subscription.`;
    }

    return {
      title: 'Payment Reminder',
      message,
    };
  },

  /**
   * Plan upgraded
   */
  planUpgraded: (context) => {
    const { old_plan_name, new_plan_name } = context;
    return {
      title: 'Plan Upgraded',
      message: old_plan_name && new_plan_name
        ? `Your subscription has been upgraded from ${old_plan_name} to ${new_plan_name}. Enjoy your new features!`
        : `Your subscription has been upgraded to ${new_plan_name || 'a higher plan'}. Enjoy your new features!`,
    };
  },

  /**
   * Plan downgraded
   */
  planDowngraded: (context) => {
    const { old_plan_name, new_plan_name, effective_date } = context;
    return {
      title: 'Plan Downgraded',
      message: effective_date
        ? `Your subscription will be downgraded from ${old_plan_name || 'current plan'} to ${new_plan_name || 'new plan'} on ${formatDate(effective_date)}.`
        : `Your subscription has been downgraded to ${new_plan_name || 'a lower plan'}.`,
    };
  },
};

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount) {
  if (!amount) return '0';
  return Number(amount).toLocaleString('en-IN');
}

export default subscriptionTemplates;