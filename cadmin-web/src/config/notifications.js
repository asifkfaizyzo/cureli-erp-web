// cadmin-web/src/config/notifications.js (do not remove this comment)
// ============================================
// cadmin-web/src/config/notifications.js
// ============================================

import {
  Megaphone,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  Link2,
  Image,
  Video,
} from "lucide-react";

// ============================================
// EVENT TYPES (CAdmin-specific for now)
// ============================================

export const NOTIFICATION_EVENTS = {
  // Broadcast from CAdmin (currently the only type)
  BROADCAST_INAPP: "BROADCAST_INAPP",

  // Future events (extensible)
  // TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  // SHOP_VERIFICATION_NEEDED: 'SHOP_VERIFICATION_NEEDED',
  // NEW_SHOP_REGISTERED: 'NEW_SHOP_REGISTERED',
};

// ============================================
// ICON CONFIGURATION
// ============================================

export const NOTIFICATION_ICON_CONFIG = {
  // ─────────────────────────────────────────
  // BROADCAST
  // ─────────────────────────────────────────
  [NOTIFICATION_EVENTS.BROADCAST_INAPP]: {
    icon: Megaphone,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    label: "Announcement",
  },

  // ─────────────────────────────────────────
  // DEFAULT
  // ─────────────────────────────────────────
  DEFAULT: {
    icon: Bell,
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    label: "Notification",
  },
};

// ============================================
// ROUTE MAPPINGS
// ============================================

export const NOTIFICATION_ROUTES = {
  // Broadcast - Opens in notification page side panel (no specific route)
  [NOTIFICATION_EVENTS.BROADCAST_INAPP]: null,

  // Future routes
  // [NOTIFICATION_EVENTS.TICKET_ASSIGNED]: '/communications/tickets',
  // [NOTIFICATION_EVENTS.SHOP_VERIFICATION_NEEDED]: '/verifications',
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
// EVENT TYPE GROUPS (For filters - extensible)
// ============================================

export const EVENT_TYPE_GROUPS = {
  announcements: {
    label: "Announcements",
    icon: Megaphone,
    events: [NOTIFICATION_EVENTS.BROADCAST_INAPP],
  },
  // Future groups
  // tickets: {
  //   label: 'Tickets',
  //   icon: Ticket,
  //   events: [
  //     NOTIFICATION_EVENTS.TICKET_ASSIGNED,
  //   ],
  // },
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
