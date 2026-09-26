// cadmin-web/src/config/modules/subscriptionRiskConfig.js (do not remove this comment)
// src/config/modules/subscriptionRiskConfig.js

// ============================================
// TAB DEFINITIONS
// ============================================
export const RISK_TABS = {
  EXPIRING: "expiring",
  GRACE_PERIOD: "gracePeriod",
  SUSPENDED: "suspended",
};

export const TAB_CONFIG = [
  {
    id: RISK_TABS.EXPIRING,
    label: "Expiring Soon",
    emptyTitle: "No expiring subscriptions",
    emptySubtitle: "No subscriptions are expiring in the selected time range",
  },
  {
    id: RISK_TABS.GRACE_PERIOD,
    label: "Grace Period",
    emptyTitle: "No subscriptions in grace period",
    emptySubtitle: "All subscriptions are currently active or renewed",
  },
  {
    id: RISK_TABS.SUSPENDED,
    label: "Suspended",
    emptyTitle: "No suspended subscriptions",
    emptySubtitle: "All subscriptions are in good standing",
  },
];

// ============================================
// TIME RANGE OPTIONS
// ============================================
export const TIME_RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

export const DEFAULT_TIME_RANGE = 30;

// ============================================
// COLUMN DEFINITIONS
// ============================================
export const EXPIRING_COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  { key: "shop_name", label: "Shop Name", width: 200, sortable: true, align: "left" },
  { key: "plan_name", label: "Plan", width: 130, sortable: true, align: "left" },
  { key: "end_date", label: "Expires On", width: 120, sortable: true, align: "left" },
  { key: "days_left", label: "Days Left", width: 100, sortable: true, align: "left" },
  { key: "payment_status", label: "Payment", width: 110, sortable: false, align: "center" },
  { key: "actions", label: "Actions", width: 90, sortable: false, align: "center" },
];

export const GRACE_PERIOD_COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  { key: "shop_name", label: "Shop Name", width: 200, sortable: true, align: "left" },
  { key: "plan_name", label: "Plan", width: 130, sortable: true, align: "left" },
  { key: "grace_period_until", label: "Grace Ends", width: 120, sortable: true, align: "left" },
  { key: "days_left", label: "Days Left", width: 100, sortable: true, align: "left" },
  { key: "payment_status", label: "Payment", width: 110, sortable: false, align: "center" },
  { key: "actions", label: "Actions", width: 90, sortable: false, align: "center" },
];

export const SUSPENDED_COLUMNS = [
  { key: "slNo", label: "#", width: 50, sortable: false, align: "left" },
  { key: "shop_name", label: "Shop Name", width: 200, sortable: true, align: "left" },
  { key: "plan_name", label: "Plan", width: 130, sortable: true, align: "left" },
  { key: "updated_at", label: "Suspended On", width: 120, sortable: true, align: "left" },
  { key: "owner", label: "Owner", width: 180, sortable: true, align: "left" },
  { key: "actions", label: "Actions", width: 90, sortable: false, align: "center" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format days left display
 */
export const formatDaysLeft = (days) => {
  if (days === null || days === undefined) return "N/A";
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
};

/**
 * Get days left styling based on urgency
 */
export const getDaysLeftStyle = (days) => {
  if (days === null || days === undefined) {
    return "bg-gray-100 text-gray-600";
  }
  if (days < 0) {
    return "bg-red-100 text-red-700 border border-red-200";
  }
  if (days <= 3) {
    return "bg-red-100 text-red-700 border border-red-200";
  }
  if (days <= 7) {
    return "bg-amber-100 text-amber-700 border border-amber-200";
  }
  if (days <= 14) {
    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  }
  return "bg-blue-100 text-blue-700 border border-blue-200";
};

/**
 * Get payment status badge config
 */
export const getPaymentStatusBadge = (status) => {
  const statusMap = {
    paid: {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    refunded: {
      label: "Refunded",
      className: "bg-gray-50 text-gray-700 border-gray-200",
    },
  };

  const normalizedStatus = status?.toLowerCase() || "pending";
  return statusMap[normalizedStatus] || statusMap.pending;
};