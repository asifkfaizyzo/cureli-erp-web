// pharmacy-web/src/pages/setup/SetupRouter.jsx (do not remove this comment)
// src/pages/setup/SetupRouter.jsx

import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";
import { getMySubscription } from "../../api/subscription";
import { getSetupStatus } from "../../api/setup";

/**
 * SetupRouter
 * Entry controller for the setup flow (3 steps)
 *
 * CRITICAL RULES:
 * 1. Only trust BACKEND for setup completion status
 * 2. Always reset store when coming from plan selection
 * 3. Prevent multiple routing attempts with ref
 */

const SetupRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent infinite loops - only route once per mount
  const hasRouted = useRef(false);

  const { initializeSetup, resetSetup, completeSetup } = useSetupStore();

  const userName = localStorage.getItem("user_name") || "";
  const userId = localStorage.getItem("user_id") || "";

  // Check if coming from plan selection (fresh start)
  const fromPlanSelection = location.state?.fromPlanSelection;

  useEffect(() => {
    // Prevent multiple routing attempts
    if (hasRouted.current) {
      
      return;
    }

    handleRouting();
  }, []);

  const handleRouting = async () => {
    try {
      setLoading(true);
      setError(null);

      // If coming from plan selection, ensure store is reset
      if (fromPlanSelection) {
        
        resetSetup();
      }

      // ============================================
      // CHECK 1: Backend setup status (SOURCE OF TRUTH)
      // ============================================
      try {
        const statusRes = await getSetupStatus();
        const statusData = statusRes.data?.data;

        if (statusData?.is_complete) {
          
          completeSetup();
          hasRouted.current = true;
          navigate("/erp/dashboard", { replace: true });
          return;
        }

      
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/login", { replace: true });
          return;
        }
        // Continue if status check fails (might be new user)
        console.warn("Setup status check failed:", err.message);
      }

      // ============================================
      // CHECK 2: Has active subscription?
      // ============================================
      let subscriptionData;
      try {
        const res = await getMySubscription();
        subscriptionData = res.data?.data;
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/login", { replace: true });
          return;
        }
        throw err;
      }

      if (!subscriptionData?.has_active_subscription) {
      
        hasRouted.current = true;
        navigate("/plan-selection", { replace: true });
        return;
      }

      

      // ============================================
      // INITIALIZE: Set plan limits
      // ============================================
      const maxBranches =
        subscriptionData.subscription?.branch_limit ??
        subscriptionData.current_plan?.max_branches ??
        1;
      const maxUsers =
        subscriptionData.subscription?.user_limit ??
        subscriptionData.current_plan?.max_users ??
        1;

      initializeSetup({
        planLimits: {
          plan_id: subscriptionData.current_plan.plan_id,
          plan_name: subscriptionData.current_plan.name,
          max_branches: maxBranches,
          max_users: maxUsers,
        },
        superAdmin: {
          user_id: userId,
          name: userName,
        },
        forceRefresh: true,
      });

      // ============================================
      // ROUTE: Go to branches (first step)
      // ============================================
    
      hasRouted.current = true;
      navigate("/setup/branches", { replace: true });
    } catch (err) {
      console.error("SetupRouter error:", err);
      setError("Failed to load setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-[#000060] animate-spin" />
          <p className="text-gray-600 text-lg font-medium">
            Preparing your setup...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Setup Error</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/login";
              }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Start Fresh
            </button>
            <button
              onClick={() => {
                hasRouted.current = false;
                handleRouting();
              }}
              className="px-5 py-2.5 bg-[#000060] text-white rounded-xl font-medium hover:bg-[#000080] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SetupRouter;
