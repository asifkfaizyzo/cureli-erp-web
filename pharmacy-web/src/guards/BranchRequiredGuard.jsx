// pharmacy-web/src/guards/BranchRequiredGuard.jsx (do not remove this comment)
// src/guards/BranchRequiredGuard.jsx

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, selectBranchContext, selectIsSuperAdmin } from "../store/useAuthStore";
import { useToast } from "../components/common/Toast";

/**
 * ============================================
 * BRANCH REQUIRED GUARD
 * ============================================
 *
 * Blocks access to write/transactional routes when in GLOBAL mode.
 * Redirects to dashboard with a toast instead of showing a blocking modal.
 *
 * ARCHITECTURAL RULES:
 * 1. This guard is SEPARATE from PermissionGuard
 * 2. PermissionGuard checks role/permission
 * 3. BranchRequiredGuard checks operating mode
 * 4. Must be inside PermissionGuard in route nesting
 *
 * Usage:
 *   <PermissionGuard permission={PERMISSIONS.BILLING_CREATE}>
 *     <BranchRequiredGuard>
 *       <BillingPage />
 *     </BranchRequiredGuard>
 *   </PermissionGuard>
 */

const BranchRequiredGuard = ({ children }) => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  
  // Ref to prevent multiple toasts
  const hasRedirected = useRef(false);
  
  // Non-SA users are always in BRANCH mode, so they pass through
  if (!isSuperAdmin) {
    return children;
  }

  // If in BRANCH mode with valid branch_id, allow access
  if (branchContext.mode === "BRANCH" && branchContext.branch_id) {
    hasRedirected.current = false; // Reset for future navigations
    return children;
  }

  // Mode is GLOBAL or no branch selected - redirect with toast
  // Use useEffect to handle the redirect properly
  return (
    <BranchRedirect 
      navigate={navigate} 
      toast={toast} 
      hasRedirected={hasRedirected}
    />
  );
};

/**
 * Component that handles the redirect logic
 * Separated to properly use useEffect
 */
const BranchRedirect = ({ navigate, toast, hasRedirected }) => {
  useEffect(() => {
    // Prevent multiple redirects/toasts
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    
    // Show toast
    toast.warning(
      "Branch Required",
      "Select a specific branch to create transactions"
    );
    
    // Redirect to dashboard
    navigate("/erp/dashboard", { replace: true });
  }, [navigate, toast, hasRedirected]);

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Redirecting...</p>
      </div>
    </div>
  );
};

export default BranchRequiredGuard;