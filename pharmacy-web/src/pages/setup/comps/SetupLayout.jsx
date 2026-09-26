// pharmacy-web/src/pages/setup/comps/SetupLayout.jsx (do not remove this comment)
// src/components/setup/SetupLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import OnboardingHeader from "../../../components/layout/OnboardingHeader";
import SetupStepper from "./SetupStepper";
import PlanLimitsBanner from "./PlanLimitsBanner";
import { useSetupStore } from "../../../store/useSetupStore";
import { getMySubscription } from "../../../api/subscription";
import { getSetupStatus } from "../../../api/setup";

const SetupLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isSetupComplete,
    isInitialized,
    planLimits,
    initializeSetup,
    completeSetup,
  } = useSetupStore();

  const userName = localStorage.getItem("user_name") || "";
  const userId = localStorage.getItem("user_id") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initializeFromAPI();
  }, []);

  const initializeFromAPI = async () => {
    try {
      setIsLoading(true);
      setInitError(null);

      try {
        const statusRes = await getSetupStatus();
        const statusData = statusRes.data?.data;

        if (statusData?.is_complete) {
          completeSetup();
          navigate("/erp/dashboard", { replace: true });
          return;
        }
      } catch (err) {
        console.warn("Setup status check failed, continuing...", err);
      }

      const res = await getMySubscription();
      const data = res.data?.data;

      if (!data?.has_active_subscription) {
        navigate("/plan-selection", { replace: true });
        return;
      }

      const maxBranches = data.subscription?.branch_limit ?? 
                          data.current_plan?.max_branches ?? 1;
      const maxUsers = data.subscription?.user_limit ?? 
                       data.current_plan?.max_users ?? 1;

      initializeSetup({
        planLimits: {
          plan_id: data.current_plan.plan_id,
          plan_name: data.current_plan.name,
          max_branches: maxBranches,
          max_users: maxUsers,
        },
        superAdmin: {
          user_id: userId,
          name: userName,
        },
        forceRefresh: true,
      });

      setIsLoading(false);

    } catch (err) {
      console.error("Failed to initialize setup:", err);
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }
      
      setInitError("Failed to load subscription data. Please try again.");
      setIsLoading(false);
    }
  };

  const getStepFromPath = (pathname) => {
    if (pathname.includes("/setup/branches")) return 1;
    if (pathname.includes("/setup/users")) return 2;
    if (pathname.includes("/setup/review")) return 3;
    return 1;
  };

  const activeStep = getStepFromPath(location.pathname);

  if (isLoading) {
    return (
      <div className="min-h-dvh h-dvh flex flex-col bg-gray-50 font-poppins">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#000060] animate-spin" />
            <p className="text-gray-600 text-lg font-medium">Loading setup...</p>
          </div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-dvh h-dvh flex flex-col bg-gray-50 font-poppins">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Setup Error</h2>
            <p className="text-gray-600">{initError}</p>
            <button
              onClick={initializeFromAPI}
              className="px-6 py-3 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized || !planLimits.plan_id) {
    return (
      <div className="min-h-dvh h-dvh flex flex-col bg-gray-50 font-poppins">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#000060] animate-spin" />
            <p className="text-gray-600 text-lg font-medium">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh h-dvh bg-gray-50 flex flex-col font-poppins overflow-hidden">
      {/* Header */}
      <OnboardingHeader userName={userName} />

      {/* Main Content Area - Horizontal Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Stepper & Plan Info */}
        <div className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 flex-col bg-white border-r border-gray-200 p-6">
          {/* Vertical Stepper */}
          <SetupStepper currentStep={activeStep} variant="vertical" />
          
          {/* Plan Limits - Stacked vertically */}
          <div className="mt-auto pt-6">
            <PlanLimitsBanner variant="compact" />
          </div>
        </div>

        {/* Mobile/Tablet Header - Horizontal stepper + plan info */}
        <div className="lg:hidden flex-shrink-0 w-full absolute top-16 left-0 right-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <SetupStepper currentStep={activeStep} variant="horizontal-compact" />
            <PlanLimitsBanner variant="minimal" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 lg:pt-0 pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 overflow-y-auto px-4 lg:px-8 py-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SetupLayout;