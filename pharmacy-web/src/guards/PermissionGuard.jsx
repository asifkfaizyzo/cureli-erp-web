// pharmacy-web/src/guards/PermissionGuard.jsx (do not remove this comment)
// src/guards/PermissionGuard.jsx

import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getRoutePermissions } from "../config/permissions";

/**
 * ============================================
 * PERMISSION GUARD
 * ============================================
 */

const PermissionGuard = ({ 
  children, 
  permission, 
  permissions = [], 
  fallback = "/erp/dashboard",
  showAccessDenied = true,
}) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  // No user = not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Build list of required permissions
  const requiredPermissions = permission 
    ? [permission, ...permissions] 
    : permissions;

  // If no permissions specified, try to get from route mapping
  const effectivePermissions = requiredPermissions.length > 0 
    ? requiredPermissions 
    : getRoutePermissions(location.pathname);

  // No permissions required = allow access
  if (effectivePermissions.length === 0) {
    return children ? children : <Outlet />;
  }

  // Check if user has any of the required permissions
  const hasAccess = hasAnyPermission(...effectivePermissions);

  if (!hasAccess) {
    console.warn(
      `🚫 PermissionGuard: User ${user.user_id} (${user.role}) denied access to ${location.pathname}`
    );

    if (showAccessDenied) {
      return <AccessDeniedModal fallback={fallback} />;
    }

    return <Navigate to={fallback} replace />;
  }

  return children ? children : <Outlet />;
};

/**
 * Access Denied Modal
 */
const AccessDeniedModal = ({ fallback }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-red-50 px-6 py-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-10 h-10 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-600 text-center mb-6">
            You don't have permission to access this page. 
            Please contact your administrator if you believe this is an error.
          </p>

          <button
            onClick={() => navigate(fallback, { replace: true })}
            className="w-full py-3 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PermissionGuard;