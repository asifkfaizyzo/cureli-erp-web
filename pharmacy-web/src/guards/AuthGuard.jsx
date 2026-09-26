// pharmacy-web/src/guards/AuthGuard.jsx (do not remove this comment)
// src/guards/AuthGuard.jsx

import { useEffect } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

/**
 * ============================================
 * AUTH GUARD
 * ============================================
 * 
 * Protects routes that require authentication.
 * 
 * Usage in App.jsx:
 *   <Route element={<AuthGuard />}>
 *     <Route path="dashboard" element={<Dashboard />} />
 *   </Route>
 */

const AuthGuard = ({ children }) => {
  const location = useLocation();
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialize = useAuthStore((state) => state.initialize);

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
   
    
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Authenticated → render children or Outlet
  return children ? children : <Outlet />;
};

export default AuthGuard;