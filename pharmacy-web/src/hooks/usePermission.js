// pharmacy-web/src/hooks/usePermission.js (do not remove this comment)
// src/hooks/usePermission.js

import { useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  roleHasPermission,
  roleHasAnyPermission,
  PERMISSIONS,
} from "../config/permissions";

/**
 * ============================================
 * USE PERMISSION HOOK
 * ============================================
 */
export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const helpers = useMemo(() => {
    const role = user?.role;

    return {
      hasPermission: (permission) => {
        if (!role) return false;
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return permissions.includes(permission);
        }
        return roleHasPermission(role, permission);
      },

      hasAnyPermission: (...perms) => {
        if (!role) return false;
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return perms.some((p) => permissions.includes(p));
        }
        return roleHasAnyPermission(role, perms);
      },

      hasRole: (...roles) => {
        if (!role) return false;
        return roles.includes(role);
      },

      isSuperAdmin: role === "super_admin",
      isBranchAdmin: role === "branch_admin",
      isStaff: role === "staff",
      role,
      branchId: user?.branch_id,
      canSwitchBranches: role === "super_admin",
    };
  }, [user, permissions]);

  return helpers;
}

/**
 * ============================================
 * USE MENU PERMISSIONS HOOK
 * ============================================
 */
export function useMenuPermissions() {
  const { hasPermission, isSuperAdmin, isBranchAdmin, isStaff } =
    usePermission();

  return useMemo(
    () => ({
      // ════════════════════════════════════════════════════════════
      // DASHBOARD
      // ════════════════════════════════════════════════════════════
      dashboard: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.DASHBOARD_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // SALES
      // ════════════════════════════════════════════════════════════
      salesBilling: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.BILLING_CREATE),
      },
      salesInvoices: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.BILLING_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // PURCHASE
      // ════════════════════════════════════════════════════════════
      purchaseBilling: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.PURCHASE_CREATE),
      },
      purchaseInvoices: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.PURCHASE_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // INVENTORY
      // ════════════════════════════════════════════════════════════
      inventory: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.INVENTORY_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // SUPPLIERS
      // ════════════════════════════════════════════════════════════
      suppliers: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.SUPPLIERS_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // REPORTS
      // ════════════════════════════════════════════════════════════
      salesReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_SALES),
      },
      purchaseReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_PURCHASE),
      },
      inventoryReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_INVENTORY),
      },
      financeReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_FINANCIAL),
      },

      // ════════════════════════════════════════════════════════════
      // SETTINGS (Parent)
      // Staff: NO access to settings at all
      // Branch Admin: Users submenu only
      // Super Admin: Full access
      // ════════════════════════════════════════════════════════════
      settings: {
        visible: !isStaff,
        disabled: isStaff,
      },

      settingsUsers: {
        visible: isSuperAdmin || isBranchAdmin,
        disabled: !hasPermission(PERMISSIONS.USERS_VIEW),
      },

      settingsBranches: {
        visible: isSuperAdmin,
        disabled: !isSuperAdmin,
      },

      settingsProfile: {
        visible: isSuperAdmin,
        disabled: !isSuperAdmin,
      },

      settingsUpgrade: {
        visible: isSuperAdmin,
        disabled: !isSuperAdmin,
      },

      // ════════════════════════════════════════════════════════════
      // LEGACY
      // ════════════════════════════════════════════════════════════
      pendingUsers: {
        visible: isSuperAdmin,
        disabled: !hasPermission(PERMISSIONS.USERS_MANAGE),
      },

      // ════════════════════════════════════════════════════════════
      // MARKETPLACE
      //
      // All three roles can see marketplace menu items.
      // The MARKETPLACE_VIEW permission is assigned to all roles
      // so visible is always true for authenticated users.
      //
      // Backend enforces data scoping:
      //   super_admin  → all branches
      //   branch_admin → their branch only
      //   staff        → their branch only, read-only
      // ════════════════════════════════════════════════════════════
      marketplaceDashboard: {
        visible: hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
        disabled: !hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
      },

      marketplaceOrders: {
        visible: hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
        disabled: !hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
      },

      marketplaceListings: {
        visible: hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
        disabled: !hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
      },

      marketplaceStorefront: {
        visible: hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
        disabled: !hasPermission(PERMISSIONS.MARKETPLACE_VIEW),
      },
    }),
    [hasPermission, isSuperAdmin, isBranchAdmin, isStaff],
  );
}

export default usePermission;