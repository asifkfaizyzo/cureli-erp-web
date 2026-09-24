// backend/src/config/permissions.js (do not remove this comment)
// backend/src/config/permissions.js

/**
 * ============================================
 * PERMISSION CONSTANTS
 * ============================================
 *
 * Naming convention: RESOURCE_ACTION
 * Format: "resource:action"
 *
 * To add a new permission:
 * 1. Add constant here
 * 2. Add to appropriate role(s) in ROLE_PERMISSIONS
 * 3. Use in routes with requirePermission("permission:name")
 *
 * Keep in sync with: pharmacy-web/src/config/permissions.js
 */

export const PERMISSIONS = {
  // ============================================
  // BILLING / SALES
  // ============================================
  BILLING_CREATE: "billing:create",
  BILLING_VIEW:   "billing:view",
  BILLING_EDIT:   "billing:edit",
  BILLING_DELETE: "billing:delete",
  BILLING_REFUND: "billing:refund",

  // ============================================
  // PURCHASE
  // ============================================
  PURCHASE_CREATE: "purchase:create",
  PURCHASE_VIEW:   "purchase:view",
  PURCHASE_EDIT:   "purchase:edit",
  PURCHASE_DELETE: "purchase:delete",

  // ============================================
  // INVENTORY
  // ============================================
  INVENTORY_VIEW:     "inventory:view",
  INVENTORY_ADJUST:   "inventory:adjust",
  INVENTORY_TRANSFER: "inventory:transfer",

  // ============================================
  // SUPPLIERS
  // ============================================
  SUPPLIERS_VIEW:   "suppliers:view",
  SUPPLIERS_MANAGE: "suppliers:manage",

  // ============================================
  // REPORTS
  // ============================================
  REPORTS_SALES:     "reports:sales",
  REPORTS_PURCHASE:  "reports:purchase",
  REPORTS_INVENTORY: "reports:inventory",
  REPORTS_FINANCIAL: "reports:financial",

  // ============================================
  // USER MANAGEMENT
  // ============================================
  USERS_VIEW:           "users:view",
  USERS_CREATE:         "users:create",
  USERS_EDIT:           "users:edit",
  USERS_DELETE:         "users:delete",
  USERS_MANAGE:         "users:manage",
  USERS_RESET_PASSWORD: "users:reset_password",

  // ============================================
  // BRANCH MANAGEMENT
  // ============================================
  BRANCHES_VIEW:   "branches:view",
  BRANCHES_CREATE: "branches:create",
  BRANCHES_EDIT:   "branches:edit",
  BRANCHES_DELETE: "branches:delete",
  BRANCHES_MANAGE: "branches:manage",
  BRANCHES_SWITCH: "branches:switch",

  // ============================================
  // SETTINGS
  // ============================================
  SETTINGS_VIEW:   "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  // ============================================
  // DASHBOARD
  // ============================================
  DASHBOARD_VIEW:      "dashboard:view",
  DASHBOARD_ANALYTICS: "dashboard:analytics",

  // ============================================
  // TICKETS
  // ============================================
  TICKETS_VIEW:   "tickets:view",
  TICKETS_CREATE: "tickets:create",
  TICKETS_CANCEL: "tickets:cancel",
  TICKETS_REOPEN: "tickets:reopen",

  // ============================================
  // NOTIFICATIONS
  // All authenticated users can receive notifications.
  // Kept here for frontend parity. Backend does not
  // enforce this at route level — all auth'd users
  // can access /notifications endpoints.
  // ============================================
  NOTIFICATIONS_VIEW: "notifications:view",

  // ============================================
  // MARKETPLACE
  // ============================================
  MARKETPLACE_VIEW:    "marketplace:view",
  MARKETPLACE_MANAGE:  "marketplace:manage",
  MARKETPLACE_SUSPEND: "marketplace:suspend",
};

export const ROLE_PERMISSIONS = {
  // Super Admin — full access
  super_admin: ["*"],

  // Branch Admin — branch-level access
  branch_admin: [
    // Billing
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_EDIT,
    PERMISSIONS.BILLING_DELETE,
    PERMISSIONS.BILLING_REFUND,

    // Purchase
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_EDIT,
    PERMISSIONS.PURCHASE_DELETE,

    // Inventory
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,

    // Suppliers
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,

    // Reports (no financial)
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_PURCHASE,
    PERMISSIONS.REPORTS_INVENTORY,

    // Users (own branch only — enforced by backend)
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_RESET_PASSWORD,

    // Branches (own branch only — enforced by backend)
    PERMISSIONS.BRANCHES_VIEW,
    PERMISSIONS.BRANCHES_EDIT,

    // Settings
    PERMISSIONS.SETTINGS_VIEW,

    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,

    // Tickets
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_CANCEL,
    PERMISSIONS.TICKETS_REOPEN,

    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,

    // Marketplace
    PERMISSIONS.MARKETPLACE_VIEW,
    PERMISSIONS.MARKETPLACE_MANAGE,
  ],

  // Staff — limited access
  staff: [
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.DASHBOARD_VIEW,

    // Notifications
    PERMISSIONS.NOTIFICATIONS_VIEW,

    // Marketplace — view only, no manage, no suspend
    PERMISSIONS.MARKETPLACE_VIEW,
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function roleHasAnyPermission(role, permissions) {
  return permissions.some((perm) => roleHasPermission(role, perm));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function roleHasAllPermissions(role, permissions) {
  return permissions.every((perm) => roleHasPermission(role, perm));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return [];
  if (permissions.includes("*")) return Object.values(PERMISSIONS);
  return permissions;
}

// ============================================
// ROUTE → PERMISSION MAPPING
// Backend reference only. Actual enforcement
// happens via requirePermission() middleware.
// ============================================
export const ROUTE_PERMISSIONS = {
  // Dashboard
  "/erp/dashboard": [PERMISSIONS.DASHBOARD_VIEW],

  // Sales
  "/erp/sales-billing":  [PERMISSIONS.BILLING_CREATE],
  "/erp/sales-invoice":  [PERMISSIONS.BILLING_VIEW],
  "/erp/sales-returns":  [PERMISSIONS.BILLING_VIEW],

  // Purchase
  "/erp/purchase-billing":  [PERMISSIONS.PURCHASE_CREATE],
  "/erp/purchase-invoices": [PERMISSIONS.PURCHASE_VIEW],
  "/erp/purchase-returns":  [PERMISSIONS.PURCHASE_VIEW],

  // Inventory
  "/erp/inventory": [PERMISSIONS.INVENTORY_VIEW],

  // Suppliers
  "/erp/suppliers": [PERMISSIONS.SUPPLIERS_VIEW],

  // Reports
  "/erp/reports-sales":      [PERMISSIONS.REPORTS_SALES],
  "/erp/reports-purchase":   [PERMISSIONS.REPORTS_PURCHASE],
  "/erp/reports-inventory":  [PERMISSIONS.REPORTS_INVENTORY],
  "/erp/reports-finance":    [PERMISSIONS.REPORTS_FINANCIAL],

  // Settings
  "/erp/settings/users":    [PERMISSIONS.USERS_VIEW],
  "/erp/settings/branches": [PERMISSIONS.BRANCHES_VIEW],
  "/erp/settings/profile":  [],
  "/erp/settings/upgrade":  [],

  // Support
  "/erp/tickets":       [PERMISSIONS.TICKETS_VIEW],
  "/erp/notifications": [PERMISSIONS.NOTIFICATIONS_VIEW],

  // Marketplace
  "/marketplace/dashboard":  [PERMISSIONS.MARKETPLACE_VIEW],
  "/marketplace/orders":     [PERMISSIONS.MARKETPLACE_VIEW],
  "/marketplace/listings":   [PERMISSIONS.MARKETPLACE_VIEW],
  "/marketplace/storefront": [PERMISSIONS.MARKETPLACE_VIEW],
};

/**
 * Get required permissions for a route
 */
export function getRoutePermissions(route) {
  return ROUTE_PERMISSIONS[route] || [];
}