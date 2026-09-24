// cadmin-web/src/config/ticketConfigs.js (do not remove this comment)
// cadmin-web/src/config/ticketConfigs.js

/**
 * ============================================
 * CENTRALIZED TICKET CONFIGURATIONS
 * ============================================
 */

// Status configuration - used across all ticket components
export const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    // Modal/dark theme variants
    darkBg: "bg-yellow-500/20",
    darkText: "text-yellow-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    darkBg: "bg-blue-500/20",
    darkText: "text-blue-300",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    darkBg: "bg-emerald-500/20",
    darkText: "text-emerald-300",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
    darkBg: "bg-gray-500/20",
    darkText: "text-gray-300",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    darkBg: "bg-red-500/20",
    darkText: "text-red-300",
  },
};

// Category configuration
export const CATEGORY_CONFIG = {
  TECHNICAL_ISSUE: {
    label: "Technical",
    fullLabel: "Technical Issue",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  BILLING_ISSUE: {
    label: "Billing",
    fullLabel: "Billing Issue",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  FEATURE_REQUEST: {
    label: "Feature",
    fullLabel: "Feature Request",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  ACCOUNT_ISSUE: {
    label: "Account",
    fullLabel: "Account Issue",
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
  },
  OTHER: {
    label: "Other",
    fullLabel: "Other",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

// Priority configuration (computed from reopen_count)
export const PRIORITY_CONFIG = {
  LOW: {
    label: "Low",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    icon: "○", // Empty circle
  },
  MEDIUM: {
    label: "Medium",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: "◐", // Half circle
  },
  HIGH: {
    label: "High",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    icon: "◉", // Filled circle outline
  },
  CRITICAL: {
    label: "Critical",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    icon: "●", // Filled circle
    pulse: true, // Add pulse animation
  },
};

// Filter options for dropdowns
export const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Technical Issue", value: "TECHNICAL_ISSUE" },
  { label: "Billing Issue", value: "BILLING_ISSUE" },
  { label: "Feature Request", value: "FEATURE_REQUEST" },
  { label: "Account Issue", value: "ACCOUNT_ISSUE" },
  { label: "Other", value: "OTHER" },
];

export const PRIORITY_OPTIONS = [
  { label: "All Priorities", value: "" },
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

// Updatable statuses for CAdmin (cannot set CANCELLED)
export const UPDATABLE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

/**
 * Get status config with fallback
 */
export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
}

/**
 * Get category config with fallback
 */
export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER;
}

/**
 * Get priority config with fallback
 */
export function getPriorityConfig(priority) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
}
