// cadmin-web/src/hooks/useCAdminPermission.js (do not remove this comment)
// pharmacy-web/src/hooks/useCAdminPermission.js

import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { CADMIN_PERMISSIONS } from "../config/cadminPermissions";

export function useCAdminPermission() {
  const { admin } = useAuth();

  return useMemo(() => {
    const isSuperCAdmin = admin?.is_super_cadmin === true;
    const permissions = admin?.permissions ?? [];
    const primary_role = admin?.primary_role ?? null;

    return {
      hasPermission: (permission) => {
        if (!admin) return false;
        if (isSuperCAdmin) return true;
        return permissions.includes(permission);
      },

      hasAnyPermission: (...perms) => {
        if (!admin) return false;
        if (isSuperCAdmin) return true;
        return perms.some((p) => permissions.includes(p));
      },

      hasAllPermissions: (...perms) => {
        if (!admin) return false;
        if (isSuperCAdmin) return true;
        return perms.every((p) => permissions.includes(p));
      },

      isSuperCAdmin,
      primary_role,
      permissions,

      canManageAdmins: isSuperCAdmin,

      canManageFinance:
        isSuperCAdmin ||
        [
          CADMIN_PERMISSIONS.SUBSCRIPTIONS_EXTEND_GRACE,
          CADMIN_PERMISSIONS.SUBSCRIPTIONS_FORCE_SUSPEND,
          CADMIN_PERMISSIONS.SUBSCRIPTIONS_REACTIVATE,
          CADMIN_PERMISSIONS.PLANS_CREATE,
          CADMIN_PERMISSIONS.PLANS_EDIT,
        ].some((p) => permissions.includes(p)),

      canHandleCommunications:
        isSuperCAdmin ||
        [
          CADMIN_PERMISSIONS.TICKETS_VIEW,
          CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS,
          CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
          CADMIN_PERMISSIONS.ENQUIRIES_REPLY,
          CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
          CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        ].some((p) => permissions.includes(p)),
    };
  }, [admin]);
}

export function useCAdminMenuPermissions() {
  const { hasPermission, hasAnyPermission, isSuperCAdmin } =
    useCAdminPermission();

  return useMemo(() => {
    const show = (permission) => ({
      visible: hasPermission(permission),
      disabled: false,
    });

    const showAny = (...perms) => ({
      visible: hasAnyPermission(...perms),
      disabled: false,
    });

    return {
      dashboard: show(CADMIN_PERMISSIONS.DASHBOARD_VIEW),

      shops: show(CADMIN_PERMISSIONS.SHOPS_VIEW),

      users: show(CADMIN_PERMISSIONS.USERS_VIEW),

      subscriptions: showAny(
        CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK,
        CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_DETAIL,
        CADMIN_PERMISSIONS.PLANS_VIEW,
      ),
      subscriptionsList: show(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK),
      plans: show(CADMIN_PERMISSIONS.PLANS_VIEW),
      riskMonitor: show(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK),

      verifications: show(CADMIN_PERMISSIONS.DOCUMENTS_VIEW),

      communications: showAny(
        CADMIN_PERMISSIONS.TICKETS_VIEW,
        CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
        CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND,
        CADMIN_PERMISSIONS.BROADCAST_MOBILE_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_MOBILE_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_MOBILE_SCHEDULE,
      ),

      tickets: show(CADMIN_PERMISSIONS.TICKETS_VIEW),

      enquiries: show(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),

      broadcast: showAny(
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
      ),

      broadcastEmail: showAny(
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
      ),

      broadcastInApp: showAny(
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
      ),

      admins: show(CADMIN_PERMISSIONS.ADMINS_VIEW),

      audit: show(CADMIN_PERMISSIONS.AUDIT_VIEW),

      masterMedicines: show(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),

      appConfig: showAny(
        CADMIN_PERMISSIONS.APP_CONFIG_VIEW,
        CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES,
      ),
      notifications: { visible: true, disabled: false },
      settings: show(CADMIN_PERMISSIONS.SETTINGS_VIEW),

      fleet: showAny(
        CADMIN_PERMISSIONS.FLEET_RIDERS_VIEW,
        CADMIN_PERMISSIONS.FLEET_VERIFICATION_VIEW,
        CADMIN_PERMISSIONS.FLEET_DASHBOARD_VIEW,
      ),
      fleetRiders: show(CADMIN_PERMISSIONS.FLEET_RIDERS_VIEW),
      fleetVerification: show(CADMIN_PERMISSIONS.FLEET_VERIFICATION_VIEW),
    };
  }, [hasPermission, hasAnyPermission, isSuperCAdmin]);
}

export default useCAdminPermission;
