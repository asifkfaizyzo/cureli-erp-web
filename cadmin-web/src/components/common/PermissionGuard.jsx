// cadmin-web/src/components/common/PermissionGuard.jsx (do not remove this comment)
// pharmacy-web/src/components/common/PermissionGuard.jsx

import { Navigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";

/**
 * =============================================================================
 * PERMISSION GUARD
 * =============================================================================
 *
 * Protects routes and components based on admin permissions.
 *
 * HOW IT WORKS:
 * - Reads admin.is_super_cadmin and admin.permissions[] from AuthContext
 * - SUPER_CADMIN bypasses all checks
 * - Others checked against their permissions[] array
 *
 * USAGE:
 *
 * // Single permission:
 * <PermissionGuard permission={CADMIN_PERMISSIONS.SHOPS_VIEW}>
 *   <ShopsPage />
 * </PermissionGuard>
 *
 * // Any of multiple permissions:
 * <PermissionGuard permissions={[CADMIN_PERMISSIONS.TICKETS_VIEW, CADMIN_PERMISSIONS.SHOPS_VIEW]}>
 *   <SomePage />
 * </PermissionGuard>
 *
 * // Super admin only (no permission key needed):
 * <PermissionGuard superAdminOnly>
 *   <AdminsPage />
 * </PermissionGuard>
 *
 * =============================================================================
 */
export function PermissionGuard({
  children,
  permission, // single permission string
  permissions, // array — any match = allowed
  superAdminOnly, // only super admin can access
  fallback = "/dashboard",
  showForbidden = true,
}) {
  const { admin, loading } = useAuth();
  const { hasPermission, hasAnyPermission, isSuperCAdmin } =
    useCAdminPermission();

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!admin) {
    return <Navigate to="/" replace />;
  }

  // ── Super admin only ──────────────────────────────────────────────────────
  if (superAdminOnly && !isSuperCAdmin) {
    return showForbidden ? (
      <ForbiddenPage reason="This page is restricted to Super Admins only." />
    ) : (
      <Navigate to={fallback} replace />
    );
  }

  // ── Single permission ─────────────────────────────────────────────────────
  if (permission && !hasPermission(permission)) {
    return showForbidden ? (
      <ForbiddenPage requiredPermission={permission} />
    ) : (
      <Navigate to={fallback} replace />
    );
  }

  // ── Any of multiple permissions ───────────────────────────────────────────
  if (permissions?.length > 0 && !hasAnyPermission(...permissions)) {
    return showForbidden ? (
      <ForbiddenPage />
    ) : (
      <Navigate to={fallback} replace />
    );
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORBIDDEN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function ForbiddenPage({ reason, requiredPermission }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
        <Shield size={36} className="text-red-400" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>

      <p className="text-gray-500 max-w-sm mb-2">
        {reason ??
          "You don't have permission to access this page. Contact your Super Admin if you think this is a mistake."}
      </p>

      {/* Dev mode: show required permission */}
      {import.meta.env.DEV && requiredPermission && (
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Required:{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
            {requiredPermission}
          </code>
        </p>
      )}

      <a
        href="/dashboard"
        className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm
                   font-medium hover:bg-indigo-700 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

/**
 * HOC wrapper — wraps a component with a permission guard.
 *
 * Usage:
 * const GuardedShopsPage = withPermission(ShopsPage, CADMIN_PERMISSIONS.SHOPS_VIEW);
 */
export function withPermission(Component, permission) {
  return function GuardedComponent(props) {
    return (
      <PermissionGuard permission={permission}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

export default PermissionGuard;
