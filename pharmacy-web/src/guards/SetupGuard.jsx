// pharmacy-web/src/guards/SetupGuard.jsx (do not remove this comment)
// src/guards/SetupGuard.jsx

import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSetupStore } from "../store/useSetupStore";
import { getSetupStatus } from "../api/setup";

/**
 * ============================================
 * SETUP GUARD - v3 with Smart Loop Detection
 * ============================================
 *
 * PROBLEM SOLVED:
 * - Old version counted ALL navigation as potential loops
 * - New version only counts REDIRECTS (actual routing changes by the guard)
 * - Normal navigation (user clicking links) is ignored
 */

const SetupGuard = ({ children }) => {
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const completeSetup = useSetupStore((state) => state.completeSetup);
  const storeIsComplete = useSetupStore((state) => state.isSetupComplete);

  const [isChecking, setIsChecking] = useState(true);
  const [setupStatus, setSetupStatus] = useState(null); // null = unknown, true/false = known
  const [error, setError] = useState(null);

  // ============================================
  // SMART LOOP DETECTION
  // ============================================
  // Only counts redirects issued BY THIS GUARD, not normal navigation
  const redirectHistory = useRef([]); // Array of { from, to, timestamp }
  const lastCheckedUserId = useRef(null);

  // Cache setup status to avoid repeated API calls
  const setupCache = useRef({
    status: null,
    timestamp: 0,
    userId: null,
  });

  const CACHE_TTL = 60000; // 1 minute cache

  // Detect if we're in a redirect loop
  const isRedirectLoop = useCallback(() => {
    const now = Date.now();
    const recentRedirects = redirectHistory.current.filter(
      (r) => now - r.timestamp < 10000, // Last 10 seconds
    );

    // If more than 4 redirects in 10 seconds, it's a loop
    if (recentRedirects.length > 4) {
      // Check if it's actually ping-ponging between same routes
      const uniqueRoutes = new Set(
        recentRedirects.map((r) => `${r.from}->${r.to}`),
      );
      // If we're repeating the same redirect pattern, it's definitely a loop
      if (uniqueRoutes.size <= 2) {
        return true;
      }
    }
    return false;
  }, []);

  // Record a redirect
  const recordRedirect = useCallback((from, to) => {
    const now = Date.now();
    redirectHistory.current.push({ from, to, timestamp: now });

    // Keep only last 10 redirects
    if (redirectHistory.current.length > 10) {
      redirectHistory.current = redirectHistory.current.slice(-10);
    }

  
  }, []);

  // Main setup check function
  const checkSetupStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSetupStatus(false);
      setIsChecking(false);
      return;
    }

    const now = Date.now();

    // Reset everything if user changed
    if (lastCheckedUserId.current !== user.user_id) {
  
      setupCache.current = { status: null, timestamp: 0, userId: null };
      redirectHistory.current = [];
      lastCheckedUserId.current = user.user_id;
    }

    // Use cache if valid
    if (
      setupCache.current.userId === user.user_id &&
      setupCache.current.status !== null &&
      now - setupCache.current.timestamp < CACHE_TTL
    ) {
    
      setSetupStatus(setupCache.current.status);
      setIsChecking(false);
      return;
    }

    // Branch admin & staff always skip setup
    if (user.role === "staff" || user.role === "branch_admin") {
      setupCache.current = {
        status: true,
        timestamp: now,
        userId: user.user_id,
      };
      setSetupStatus(true);
      setIsChecking(false);
      return;
    }

    // Super admin → check backend
    if (user.role === "super_admin") {
      try {
        const response = await getSetupStatus();
        const { is_complete } = response.data?.data || {};

      

        // Update cache
        setupCache.current = {
          status: is_complete,
          timestamp: now,
          userId: user.user_id,
        };

        // Sync store
        if (is_complete) {
          completeSetup();
        }

        setSetupStatus(is_complete);
      } catch (err) {
        console.error("SetupGuard API error:", err);

        // On 401, don't cache - might be token issue
        if (err.response?.status === 401) {
          setSetupStatus(false);
          setIsChecking(false);
          return;
        }

        // On other errors, trust store if it says complete
        if (storeIsComplete) {
        
          setupCache.current = {
            status: true,
            timestamp: now,
            userId: user.user_id,
          };
          setSetupStatus(true);
        } else {
          // Don't cache failures
          setSetupStatus(false);
        }
      }
    }

    setIsChecking(false);
  }, [isAuthenticated, user, completeSetup, storeIsComplete]);

  // Run check on mount and when user/auth changes
  useEffect(() => {
    setIsChecking(true);
    checkSetupStatus();
  }, [user?.user_id, isAuthenticated, checkSetupStatus]);

  // ============================================
  // ROUTE HANDLING
  // ============================================

  const isSetupRoute = location.pathname.startsWith("/setup");
  const isAdmin = user?.role === "super_admin" || user?.role === "branch_admin";

  // Admin accessing /setup/users should always work (from ERP settings)
  if (isAdmin && location.pathname === "/setup/users") {
    return children ? children : <Outlet />;
  }

  // ============================================
  // LOADING
  // ============================================
  if (isChecking || setupStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Checking setup status...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR (Loop detected)
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                // Nuclear option: clear everything
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/login";
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Start Fresh
            </button>
            <button
              onClick={() => {
                // Soft retry: just clear cache and error
                setupCache.current = {
                  status: null,
                  timestamp: 0,
                  userId: null,
                };
                redirectHistory.current = [];
                setError(null);
                setIsChecking(true);
                checkSetupStatus();
              }}
              className="px-6 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // SETUP NOT COMPLETE → Need to redirect
  // ============================================
  if (!setupStatus) {
    // If already on setup route, just render (no redirect needed)
    if (isSetupRoute) {
      return children ? children : <Outlet />;
    }

    // Check for redirect loop BEFORE redirecting
    if (isRedirectLoop()) {
      console.error(" Redirect loop detected!");
      setError(
        "Navigation loop detected. This usually happens when there's conflicting data between browser storage and server. Please clear your data and try again.",
      );
      // Return null to trigger re-render with error state
      return null;
    }

    // Record this redirect
    recordRedirect(location.pathname, "/setup");

  
    return <Navigate to="/setup" state={{ from: location.pathname }} replace />;
  }

  // ============================================
  // SETUP COMPLETE → Allow access
  // ============================================

  // Clear redirect history on successful access (no loop)
  redirectHistory.current = [];

  return children ? children : <Outlet />;
};

export default SetupGuard;
