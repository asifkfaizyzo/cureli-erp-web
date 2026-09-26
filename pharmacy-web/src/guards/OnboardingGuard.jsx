// pharmacy-web/src/guards/OnboardingGuard.jsx (do not remove this comment)
// src/guards/OnboardingGuard.jsx

import { useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

/**
 * ============================================
 * ONBOARDING GUARD
 * ============================================
 *
 * Special guard for onboarding routes that handles TWO cases:
 *
 * CASE 1: PendingUser (steps 0-3)
 *   - Has pending_id in location.state
 *   - NO access_token yet
 *   - Allow access to complete signup flow
 *
 * CASE 2: Real User (steps 4-11)
 *   - Has access_token
 *   - User created but still in onboarding
 *   - Allow access to continue onboarding
 *
 * CASE 3: Fully verified user trying to access /onboarding
 *   - Redirect to /erp/dashboard
 *
 * CASE 4: No pending_id AND no token
 *   - Redirect to /login (or home)
 */

const OnboardingGuard = ({ children }) => {
  const location = useLocation();

  // Auth store state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const initialize = useAuthStore((state) => state.initialize);

  // Check for pending signup data in location state
  const pendingId = location.state?.pending_id;
  const hasLocationState = !!(
    pendingId ||
    location.state?.email ||
    location.state?.resume_step !== undefined
  );

  // Local state for validation
  const [isValidating, setIsValidating] = useState(true);
  const [accessDecision, setAccessDecision] = useState(null); // 'allow' | 'redirect-login' | 'redirect-dashboard'

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Validate access once auth is initialized
  useEffect(() => {
    if (!isInitialized || isLoading) {
      return; // Wait for initialization
    }

    validateAccess();
  }, [
    isInitialized,
    isLoading,
    isAuthenticated,
    user,
    hasLocationState,
    pendingId,
  ]);

  const validateAccess = () => {
    const hasToken = !!localStorage.getItem("access_token");

   

    // ============================================
    // CASE 1: PendingUser (steps 0-3)
    // Has pending_id but no token = fresh signup
    // ============================================
    if (pendingId && !hasToken) {
     
      setAccessDecision("allow");
      setIsValidating(false);
      return;
    }

    // ============================================
    // CASE 2: Real User with token
    // ============================================
    if (hasToken || isAuthenticated) {
      // Check user status
      const status = user?.status;

      // If user is fully active/verified AND has completed first login
      // They shouldn't be in onboarding anymore
      if (status === "active" && location.pathname === "/onboarding") {
       
        setAccessDecision("redirect-dashboard");
        setIsValidating(false);
        return;
      }

      // User is in pending_setup or pending_verification = allow onboarding
      if (
        status === "pending_setup" ||
        status === "pending_verification" ||
        status === "verified"
      ) {
     
        setAccessDecision("allow");
        setIsValidating(false);
        return;
      }

      // Has token but status unclear - allow access
      // The OnboardingPage itself will handle redirect logic
    
      setAccessDecision("allow");
      setIsValidating(false);
      return;
    }

    // ============================================
    // CASE 3: Has location state but no pending_id/token
    // Could be a resume_step passed from login
    // ============================================
    if (hasLocationState && location.state?.resume_step !== undefined) {
      // This case happens when login redirects here with resume_step
      // But token should be set by now... check again
      const freshToken = localStorage.getItem("access_token");
      if (freshToken) {
      
        setAccessDecision("allow");
        setIsValidating(false);
        return;
      }
    }

    // ============================================
    // CASE 4: No valid credentials at all
    // ============================================
    
    setAccessDecision("redirect-login");
    setIsValidating(false);
  };

  // ============================================
  // RENDER LOGIC
  // ============================================

  // Still initializing auth or validating
  if (!isInitialized || isLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle redirects
  if (accessDecision === "redirect-login") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (accessDecision === "redirect-dashboard") {
    return <Navigate to="/erp/dashboard" replace />;
  }

  // Allow access
  return children ? children : <Outlet />;
};

export default OnboardingGuard;
