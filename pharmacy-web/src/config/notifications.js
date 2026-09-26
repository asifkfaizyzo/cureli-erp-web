// pharmacy-web/src/config/notifications.js (do not remove this comment)
// pharmacy-web/src/config/notifications.js

import {
  Package,
  Clock,
  AlertTriangle,
  Shield,
  UserCog,
  Building2,
  CreditCard,
  Ticket,
  CheckCircle,
  XCircle,
  BadgeCheck,
  FileX,
  Bell,
  UserPlus,
  UserMinus,
  RefreshCw,
  Key,
  Mail,
  Phone,
  FileCheck,
  AlertCircle,
  Megaphone,
  Info,
  Sparkles,
  Link2,
  Image,
  Video,
} from "lucide-react";

// ============================================
// EVENT TYPES (Mirror backend)
// ============================================

export const NOTIFICATION_EVENTS = {
  // Security & Access
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_RESET_BY_ADMIN: "PASSWORD_RESET_BY_ADMIN",
  EMAIL_CHANGED: "EMAIL_CHANGED",
  PHONE_CHANGED: "PHONE_CHANGED",
  ROLE_CHANGED: "ROLE_CHANGED",
  BRANCH_CHANGED: "BRANCH_CHANGED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_REACTIVATED: "USER_REACTIVATED",

  // User Management
  USER_CREATED: "USER_CREATED",

  // Shop & Verification
  SHOP_VERIFIED: "SHOP_VERIFIED",
  DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
  DOCUMENT_PARTIALLY_REJECTED: "DOCUMENT_PARTIALLY_REJECTED",

  // Subscription
  SUBSCRIPTION_ACTIVATED: "SUBSCRIPTION_ACTIVATED",
  SUBSCRIPTION_EXPIRING_7_DAYS: "SUBSCRIPTION_EXPIRING_7_DAYS",
  SUBSCRIPTION_EXPIRING_3_DAYS: "SUBSCRIPTION_EXPIRING_3_DAYS",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  SUBSCRIPTION_GRACE_STARTED: "SUBSCRIPTION_GRACE_STARTED",
  SUBSCRIPTION_GRACE_ENDING: "SUBSCRIPTION_GRACE_ENDING",
  SUBSCRIPTION_GRACE_EXTENDED: "SUBSCRIPTION_GRACE_EXTENDED",
  SUBSCRIPTION_SUSPENDED: "SUBSCRIPTION_SUSPENDED",
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",
  SUBSCRIPTION_PAYMENT_REMINDER: "SUBSCRIPTION_PAYMENT_REMINDER",
  PLAN_UPGRADED: "PLAN_UPGRADED",
  PLAN_DOWNGRADED: "PLAN_DOWNGRADED",

  // Payments
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",

  // Inventory
  LOW_STOCK_ALERT: "LOW_STOCK_ALERT",
  OUT_OF_STOCK_ALERT: "OUT_OF_STOCK_ALERT",
  NEAR_EXPIRY_ALERT: "NEAR_EXPIRY_ALERT",
  EXPIRED_STOCK_ALERT: "EXPIRED_STOCK_ALERT",

  // Tickets
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_STATUS_CHANGED: "TICKET_STATUS_CHANGED",

  //  NEW: Broadcast from CAdmin
  BROADCAST_INAPP: "BROADCAST_INAPP",
};

// ============================================
// ICON CONFIGURATION
// ============================================

export const NOTIFICATION_ICON_CONFIG = {
  // ... (keep all existing configs)

  // ─────────────────────────────────────────
  // BROADCAST (NEW)
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.BROADCAST_INAPP]: {
    icon: Megaphone,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    label: "Announcement",
  },

  // ─────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.LOW_STOCK_ALERT]: {
    icon: Package,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  [NOTIFICATION_EVENTS.OUT_OF_STOCK_ALERT]: {
    icon: Package,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_EVENTS.NEAR_EXPIRY_ALERT]: {
    icon: Clock,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  [NOTIFICATION_EVENTS.EXPIRED_STOCK_ALERT]: {
    icon: AlertTriangle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },

  // ─────────────────────────────────────────
  // SECURITY & ACCESS
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.PASSWORD_CHANGED]: {
    icon: Key,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [NOTIFICATION_EVENTS.PASSWORD_RESET_BY_ADMIN]: {
    icon: Key,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  [NOTIFICATION_EVENTS.EMAIL_CHANGED]: {
    icon: Mail,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [NOTIFICATION_EVENTS.PHONE_CHANGED]: {
    icon: Phone,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [NOTIFICATION_EVENTS.ROLE_CHANGED]: {
    icon: UserCog,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  [NOTIFICATION_EVENTS.BRANCH_CHANGED]: {
    icon: Building2,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  [NOTIFICATION_EVENTS.USER_DEACTIVATED]: {
    icon: UserMinus,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_EVENTS.USER_REACTIVATED]: {
    icon: UserPlus,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },

  // ─────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.USER_CREATED]: {
    icon: UserPlus,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },

  // ─────────────────────────────────────────
  // SHOP & VERIFICATION
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.SHOP_VERIFIED]: {
    icon: BadgeCheck,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  [NOTIFICATION_EVENTS.DOCUMENT_REJECTED]: {
    icon: FileX,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_EVENTS.DOCUMENT_PARTIALLY_REJECTED]: {
    icon: FileCheck,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },

  // ─────────────────────────────────────────
  // SUBSCRIPTION
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED]: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS]: {
    icon: CreditCard,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS]: {
    icon: CreditCard,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED]: {
    icon: CreditCard,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED]: {
    icon: Clock,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING]: {
    icon: AlertCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_EXTENDED]: {
    icon: RefreshCw,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED]: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED]: {
    icon: RefreshCw,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  [NOTIFICATION_EVENTS.SUBSCRIPTION_PAYMENT_REMINDER]: {
    icon: CreditCard,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  [NOTIFICATION_EVENTS.PLAN_UPGRADED]: {
    icon: CreditCard,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  [NOTIFICATION_EVENTS.PLAN_DOWNGRADED]: {
    icon: CreditCard,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.PAYMENT_SUCCESS]: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  [NOTIFICATION_EVENTS.PAYMENT_FAILED]: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },

  // ─────────────────────────────────────────
  // TICKETS
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.TICKET_CREATED]: {
    icon: Ticket,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  [NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED]: {
    icon: Ticket,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },

  // ─────────────────────────────────────────
  // DEFAULT
  // ─────────────────────────────────────────
  DEFAULT: {
    icon: Bell,
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

// ============================================
// ROUTE MAPPINGS
// ============================================

export const NOTIFICATION_ROUTES = {
  // Inventory
  [NOTIFICATION_EVENTS.LOW_STOCK_ALERT]: "/erp/inventory",
  [NOTIFICATION_EVENTS.OUT_OF_STOCK_ALERT]: "/erp/inventory",
  [NOTIFICATION_EVENTS.NEAR_EXPIRY_ALERT]: "/erp/inventory",
  [NOTIFICATION_EVENTS.EXPIRED_STOCK_ALERT]: "/erp/inventory",

  // Security - Stay on current page (null = no navigation)
  [NOTIFICATION_EVENTS.PASSWORD_CHANGED]: null,
  [NOTIFICATION_EVENTS.PASSWORD_RESET_BY_ADMIN]: null,
  [NOTIFICATION_EVENTS.EMAIL_CHANGED]: null,
  [NOTIFICATION_EVENTS.PHONE_CHANGED]: null,
  [NOTIFICATION_EVENTS.ROLE_CHANGED]: null,
  [NOTIFICATION_EVENTS.BRANCH_CHANGED]: "/erp/dashboard",

  // User Management
  [NOTIFICATION_EVENTS.USER_CREATED]: "/erp/settings/users",
  [NOTIFICATION_EVENTS.USER_DEACTIVATED]: "/erp/settings/users",
  [NOTIFICATION_EVENTS.USER_REACTIVATED]: "/erp/settings/users",

  // Shop & Verification
  [NOTIFICATION_EVENTS.SHOP_VERIFIED]: "/erp/dashboard",
  [NOTIFICATION_EVENTS.DOCUMENT_REJECTED]: "/verification",       // ← intentional, pre-auth flow
  [NOTIFICATION_EVENTS.DOCUMENT_PARTIALLY_REJECTED]: "/verification", // ← intentional

  // Subscription
  [NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED]: "/erp/settings/profile",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS]: "/erp/settings/upgrade",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS]: "/erp/settings/upgrade",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED]: "/erp/settings/upgrade",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED]: "/erp/settings/upgrade",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING]: "/erp/settings/upgrade",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_EXTENDED]: "/erp/settings/profile",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED]: "/erp/settings/upgrade",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED]: "/erp/settings/profile",
  [NOTIFICATION_EVENTS.SUBSCRIPTION_PAYMENT_REMINDER]: "/erp/settings/upgrade",
  [NOTIFICATION_EVENTS.PLAN_UPGRADED]: "/erp/settings/profile",
  [NOTIFICATION_EVENTS.PLAN_DOWNGRADED]: "/erp/settings/profile",

  // Payments
  [NOTIFICATION_EVENTS.PAYMENT_SUCCESS]: "/erp/settings/profile",
  [NOTIFICATION_EVENTS.PAYMENT_FAILED]: "/erp/settings/upgrade",

  // Tickets
  [NOTIFICATION_EVENTS.TICKET_CREATED]: "/erp/tickets",
  [NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED]: "/erp/tickets",

  // Broadcast — dynamic, uses context.action_url
  [NOTIFICATION_EVENTS.BROADCAST_INAPP]: null,
};

// ============================================
// PRIORITY CONFIGURATION
// ============================================

export const PRIORITY_CONFIG = {
  critical: {
    label: "Critical",
    dotColor: "bg-red-500",
    borderColor: "border-l-red-500",
    bgColor: "bg-red-50/50",
    textColor: "text-red-700",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
  high: {
    label: "High",
    dotColor: "bg-orange-500",
    borderColor: "border-l-orange-500",
    bgColor: "bg-orange-50/30",
    textColor: "text-orange-700",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
  },
  normal: {
    label: "Normal",
    dotColor: "bg-blue-500",
    borderColor: "border-l-blue-500",
    bgColor: "bg-transparent",
    textColor: "text-blue-700",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
  low: {
    label: "Low",
    dotColor: "bg-gray-400",
    borderColor: "border-l-gray-300",
    bgColor: "bg-transparent",
    textColor: "text-gray-600",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
  },
};

// ============================================
// EVENT TYPE GROUPS (For filters)
// ============================================

export const EVENT_TYPE_GROUPS = {
  announcements: {
    label: "Announcements",
    icon: Megaphone,
    events: [NOTIFICATION_EVENTS.BROADCAST_INAPP],
  },
  inventory: {
    label: "Inventory",
    icon: Package,
    events: [
      NOTIFICATION_EVENTS.LOW_STOCK_ALERT,
      NOTIFICATION_EVENTS.OUT_OF_STOCK_ALERT,
      NOTIFICATION_EVENTS.NEAR_EXPIRY_ALERT,
      NOTIFICATION_EVENTS.EXPIRED_STOCK_ALERT,
    ],
  },
  security: {
    label: "Security",
    icon: Shield,
    events: [
      NOTIFICATION_EVENTS.PASSWORD_CHANGED,
      NOTIFICATION_EVENTS.PASSWORD_RESET_BY_ADMIN,
      NOTIFICATION_EVENTS.EMAIL_CHANGED,
      NOTIFICATION_EVENTS.PHONE_CHANGED,
      NOTIFICATION_EVENTS.ROLE_CHANGED,
      NOTIFICATION_EVENTS.BRANCH_CHANGED,
    ],
  },
  subscription: {
    label: "Subscription",
    icon: CreditCard,
    events: [
      NOTIFICATION_EVENTS.SUBSCRIPTION_ACTIVATED,
      NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS,
      NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS,
      NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED,
      NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED,
      NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING,
      NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_EXTENDED,
      NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED,
      NOTIFICATION_EVENTS.SUBSCRIPTION_RENEWED,
      NOTIFICATION_EVENTS.SUBSCRIPTION_PAYMENT_REMINDER,
      NOTIFICATION_EVENTS.PLAN_UPGRADED,
      NOTIFICATION_EVENTS.PLAN_DOWNGRADED,
      NOTIFICATION_EVENTS.PAYMENT_SUCCESS,
      NOTIFICATION_EVENTS.PAYMENT_FAILED,
    ],
  },
  tickets: {
    label: "Tickets",
    icon: Ticket,
    events: [
      NOTIFICATION_EVENTS.TICKET_CREATED,
      NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED,
    ],
  },
  users: {
    label: "Users",
    icon: UserPlus,
    events: [
      NOTIFICATION_EVENTS.USER_CREATED,
      NOTIFICATION_EVENTS.USER_DEACTIVATED,
      NOTIFICATION_EVENTS.USER_REACTIVATED,
    ],
  },
  shop: {
    label: "Shop",
    icon: BadgeCheck,
    events: [
      NOTIFICATION_EVENTS.SHOP_VERIFIED,
      NOTIFICATION_EVENTS.DOCUMENT_REJECTED,
      NOTIFICATION_EVENTS.DOCUMENT_PARTIALLY_REJECTED,
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get icon config for a notification event type
 */
export const getNotificationIconConfig = (eventType) => {
  return (
    NOTIFICATION_ICON_CONFIG[eventType] || NOTIFICATION_ICON_CONFIG.DEFAULT
  );
};

/**
 * Get route for a notification event type
 * For broadcasts, check context.action_url
 */
export const getNotificationRoute = (eventType, context = {}) => {
  // For broadcasts, use action_url from context if available
  if (eventType === NOTIFICATION_EVENTS.BROADCAST_INAPP) {
    return context?.action_url || null;
  }
  return NOTIFICATION_ROUTES[eventType] || null;
};

/**
 * Get priority config
 */
export const getPriorityConfig = (priority) => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
};

/**
 * Check if notification is a broadcast
 */
export const isBroadcastNotification = (eventType) => {
  return eventType === NOTIFICATION_EVENTS.BROADCAST_INAPP;
};

/**
 * Get attachment icon
 */
export const getAttachmentIcon = (type) => {
  const icons = {
    link: Link2,
    image: Image,
    video: Video,
  };
  return icons[type] || Link2;
};

/**
 * Format relative time for notifications
 */
export const formatNotificationTime = (dateString) => {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

/**
 * Format full date for notification detail
 */
export const formatNotificationFullDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default {
  NOTIFICATION_EVENTS,
  NOTIFICATION_ICON_CONFIG,
  NOTIFICATION_ROUTES,
  PRIORITY_CONFIG,
  EVENT_TYPE_GROUPS,
  getNotificationIconConfig,
  getNotificationRoute,
  getPriorityConfig,
  isBroadcastNotification,
  getAttachmentIcon,
  formatNotificationTime,
  formatNotificationFullDate,
};
