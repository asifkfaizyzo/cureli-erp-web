// cadmin-web/src/config/modules/dashboardConfig.js (do not remove this comment)
// src/config/modules/dashboardConfig.js

import {
  Users,
  Store,
  CreditCard,
  BadgeIndianRupee,
  ShieldCheck,
  Ticket,
  Mail,
  AlertTriangle,
  Bell,
  Wallet,
} from "lucide-react";

// ============================================
// ROLE DEFINITIONS
// ============================================
export const CADMIN_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ANALYST: "ANALYST",
  ACCOUNTING: "ACCOUNTING",
};

// ============================================
// ROLE NORMALIZER - Handles all possible formats
// ============================================
export const normalizeRole = (role) => {
  if (!role) return CADMIN_ROLES.SUPER_ADMIN;

  // Convert to uppercase and replace spaces/hyphens with underscores
  const normalized = role
    .toUpperCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  //  FIXED: Map all possible role variations
  const roleMap = {
    // Super Admin variations
    SUPER_ADMIN: CADMIN_ROLES.SUPER_ADMIN,
    SUPERADMIN: CADMIN_ROLES.SUPER_ADMIN,
    SUPER_CADMIN: CADMIN_ROLES.SUPER_ADMIN, //  Added
    SUPERCADMIN: CADMIN_ROLES.SUPER_ADMIN, //  Added
    ADMIN: CADMIN_ROLES.SUPER_ADMIN,
    CADMIN: CADMIN_ROLES.SUPER_ADMIN, //  Added

    // Analyst variations
    ANALYST: CADMIN_ROLES.ANALYST,

    // Accounting variations
    ACCOUNTING: CADMIN_ROLES.ACCOUNTING,
    ACCOUNTANT: CADMIN_ROLES.ACCOUNTING,
  };

  // Check if normalized role exists in map
  if (roleMap[normalized]) {
    return roleMap[normalized];
  }

  //  Additional check: if role contains "SUPER" or "ADMIN", treat as SUPER_ADMIN
  if (normalized.includes("SUPER") || normalized.includes("CADMIN")) {
    return CADMIN_ROLES.SUPER_ADMIN;
  }

  // Default fallback - log warning
  console.warn(
    `⚠️ Unknown role: "${role}" (normalized: "${normalized}") - defaulting to SUPER_ADMIN`,
  );
  return CADMIN_ROLES.SUPER_ADMIN; //  Changed default from ANALYST to SUPER_ADMIN
};

// ============================================
// PERMISSIONS
// ============================================
export const DASHBOARD_PERMISSIONS = {
  totalUsers: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  totalShops: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  totalRevenue: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ACCOUNTING],
  activeSubscriptions: [
    CADMIN_ROLES.SUPER_ADMIN,
    CADMIN_ROLES.ACCOUNTING,
    CADMIN_ROLES.ANALYST,
  ],
  revenueChart: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ACCOUNTING],
  userGrowthChart: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  subscriptionChart: [
    CADMIN_ROLES.SUPER_ADMIN,
    CADMIN_ROLES.ACCOUNTING,
    CADMIN_ROLES.ANALYST,
  ],
  topShops: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ACCOUNTING],
  recentOnboardings: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  recentActivities: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  pendingVerifications: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  pendingTickets: [CADMIN_ROLES.SUPER_ADMIN],
  pendingEnquiries: [CADMIN_ROLES.SUPER_ADMIN],
  atRiskSubscriptions: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ACCOUNTING],
  systemAlerts: [CADMIN_ROLES.SUPER_ADMIN],
  manageAdmins: [CADMIN_ROLES.SUPER_ADMIN],
  manageUsers: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  manageShops: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  manageSubscriptions: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ACCOUNTING],
  verifyShops: [CADMIN_ROLES.SUPER_ADMIN, CADMIN_ROLES.ANALYST],
  broadcast: [CADMIN_ROLES.SUPER_ADMIN],
};

export const hasPermission = (role, permission) => {
  const normalizedRole = normalizeRole(role);
  const allowedRoles = DASHBOARD_PERMISSIONS[permission];
  if (!allowedRoles) return true;
  return allowedRoles.includes(normalizedRole);
};

// ============================================
// TIME PERIODS
// ============================================
export const TIME_PERIODS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

// ============================================
// QUICK ACTIONS
// ============================================
export const QUICK_ACTIONS = [
  {
    key: "verifyShops",
    label: "Verify Shops",
    icon: ShieldCheck,
    path: "/verifications",
    color: "bg-orange-500",
    permission: "verifyShops",
  },
  {
    key: "manageUsers",
    label: "Manage Users",
    icon: Users,
    path: "/users",
    color: "bg-blue-500",
    permission: "manageUsers",
  },
  {
    key: "manageShops",
    label: "Manage Shops",
    icon: Store,
    path: "/shops",
    color: "bg-emerald-500",
    permission: "manageShops",
  },
  {
    key: "manageSubscriptions",
    label: "Subscriptions",
    icon: CreditCard,
    path: "/subscriptions/manage",
    color: "bg-violet-500",
    permission: "manageSubscriptions",
  },
  {
    key: "viewTickets",
    label: "View Tickets",
    icon: Ticket,
    path: "/communications/tickets",
    color: "bg-amber-500",
    permission: "pendingTickets",
  },
  {
    key: "broadcast",
    label: "Broadcast",
    icon: Bell,
    path: "/communications/broadcast",
    color: "bg-pink-500",
    permission: "broadcast",
  },
];

// ============================================
// ROLE DISPLAY - Also handle CADMIN format
// ============================================
export const ROLE_DISPLAY_NAMES = {
  [CADMIN_ROLES.SUPER_ADMIN]: "Super Admin",
  [CADMIN_ROLES.ANALYST]: "Analyst",
  [CADMIN_ROLES.ACCOUNTING]: "Accounting",
};

// Get display name with normalization
export const getRoleDisplayName = (role) => {
  const normalized = normalizeRole(role);
  return ROLE_DISPLAY_NAMES[normalized] || "Admin";
};

// ============================================
// ROLE BADGE STYLES
// ============================================
export const ROLE_BADGE_STYLES = {
  [CADMIN_ROLES.SUPER_ADMIN]: "bg-purple-100 text-purple-700 border-purple-200",
  [CADMIN_ROLES.ANALYST]: "bg-blue-100 text-blue-700 border-blue-200",
  [CADMIN_ROLES.ACCOUNTING]:
    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// Get badge style with normalization
export const getRoleBadgeStyle = (role) => {
  const normalized = normalizeRole(role);
  return (
    ROLE_BADGE_STYLES[normalized] || "bg-gray-100 text-gray-700 border-gray-200"
  );
};

// ============================================
// CHART COLORS
// ============================================
export const CHART_COLORS = {
  primary: "#05015A",
  secondary: "#7C3AED",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  muted: "#6B7280",
  pie: [
    "#05015A",
    "#7C3AED",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#8B5CF6",
  ],
};
