// pharmacy-web/src/guards/MarketplaceOnboardingGuard.jsx (do not remove this comment)
// src/guards/MarketplaceOnboardingGuard.jsx

import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useMarketplaceStore } from "../store/useMarketplaceStore";
import { useAuthStore, selectIsSuperAdmin } from "../store/useAuthStore";

/**
 * ============================================
 * MARKETPLACE ONBOARDING GUARD
 * ============================================
 *
 * Sits inside AuthGuard + SetupGuard + AppLayout.
 * Wraps all /marketplace/* routes EXCEPT /marketplace/onboarding.
 *
 * Logic:
 *   NOT_STARTED | DRAFT → redirect to /marketplace/onboarding
 *   LIVE               → allow access
 *   SUSPENDED          → allow access (show banner on dashboard)
 *   null (loading)     → show spinner
 */
const MarketplaceOnboardingGuard = () => {
  const marketplaceStatus = useMarketplaceStore((s) => s.marketplaceStatus);
  const isStatusLoaded = useMarketplaceStore((s) => s.isStatusLoaded);
  const isStatusLoading = useMarketplaceStore((s) => s.isStatusLoading);
  const loadStatus = useMarketplaceStore((s) => s.loadStatus);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);

  useEffect(() => {
    if (!isStatusLoaded && !isStatusLoading) {
      loadStatus();
    }
  }, [isStatusLoaded, isStatusLoading, loadStatus]);

  // Loading state
  if (!isStatusLoaded || isStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010015]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/50 text-sm font-medium">
            Loading marketplace...
          </p>
        </div>
      </div>
    );
  }

  // LIVE or SUSPENDED → allow through
  if (
    marketplaceStatus === "LIVE" ||
    marketplaceStatus === "SUSPENDED"
  ) {
    return <Outlet />;
  }

  // NOT_STARTED or DRAFT:
  // super_admin → send to onboarding wizard
  // branch_admin → show pending screen (they can't complete onboarding)
  if (
    marketplaceStatus === "NOT_STARTED" ||
    marketplaceStatus === "DRAFT"
  ) {
    if (isSuperAdmin) {
      return <Navigate to="/marketplace/onboarding" replace />;
    }

    // branch_admin: show informational screen, not the wizard
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010015]">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Marketplace Not Set Up
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Your pharmacy's marketplace is not yet configured. Please ask your
            super admin to complete the marketplace setup.
          </p>
        </div>
      </div>
    );
  }

  // Fallback (null status — error state)
  return <Navigate to="/marketplace/onboarding" replace />;
};

export default MarketplaceOnboardingGuard;