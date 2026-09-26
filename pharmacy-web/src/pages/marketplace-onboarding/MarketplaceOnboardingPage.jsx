// pharmacy-web/src/pages/marketplace-onboarding/MarketplaceOnboardingPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-onboarding/MarketplaceOnboardingPage.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMarketplaceStore } from "../../store/useMarketplaceStore";
import { useAuthStore, selectIsSuperAdmin } from "../../store/useAuthStore";
import OnboardingSidebar from "./components/OnboardingSidebar";
import WelcomeStep from "./steps/WelcomeStep";
import StorefrontStep from "./steps/StorefrontStep";
import BranchSelectionStep from "./steps/BranchSelectionStep";
import BranchConfigurationStep from "./steps/BranchConfigurationStep";
import BankingStep from "./steps/BankingStep"; // <-- New step file imported
import PreviewStep from "./steps/PreviewStep";
import GoLiveStep from "./steps/GoLiveStep";

const MarketplaceOnboardingPage = () => {
  const navigate = useNavigate();
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);

  const currentStep = useMarketplaceStore((s) => s.currentStep);
  const setStep = useMarketplaceStore((s) => s.setStep);
  const marketplaceStatus = useMarketplaceStore((s) => s.marketplaceStatus);
  const isStatusLoaded = useMarketplaceStore((s) => s.isStatusLoaded);
  const isStatusLoading = useMarketplaceStore((s) => s.isStatusLoading);
  const loadStatus = useMarketplaceStore((s) => s.loadStatus);

  useEffect(() => {
    if (!isStatusLoaded && !isStatusLoading) {
      loadStatus();
    }
  }, [isStatusLoaded, isStatusLoading, loadStatus]);

  useEffect(() => {
    if (isStatusLoaded && marketplaceStatus === "LIVE") {
      navigate("/marketplace/dashboard", { replace: true });
    }
  }, [isStatusLoaded, marketplaceStatus, navigate]);

  if (!isSuperAdmin) {
    return (
      <div className="h-screen bg-[#010015] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-white/50 text-sm">
            Only a super admin can set up the marketplace.
          </p>
        </div>
      </div>
    );
  }

  if (!isStatusLoaded || isStatusLoading) {
    return (
      <div className="h-screen bg-[#010015] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const goNext = () => setStep(Math.min(currentStep + 1, 7)); // Extended step limit to 7
  const goBack = () => setStep(Math.max(currentStep - 1, 1));

  return (
    <div className="flex h-[89vh] overflow-hidden">
      <OnboardingSidebar currentStep={currentStep} onStepClick={setStep} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden border-b border-white/[0.06] px-4 py-3 flex-shrink-0">
          <MobileProgressBar currentStep={currentStep} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-8">
            {currentStep === 1 && <WelcomeStep onNext={goNext} />}
            {currentStep === 2 && (
              <StorefrontStep onNext={goNext} onBack={goBack} />
            )}
            {currentStep === 3 && (
              <BranchSelectionStep onNext={goNext} onBack={goBack} />
            )}
            {currentStep === 4 && (
              <BranchConfigurationStep onNext={goNext} onBack={goBack} />
            )}
            {/* ── NEW STEP 5 INJECTED ───────────────────────────── */}
            {currentStep === 5 && (
              <BankingStep onNext={goNext} onBack={goBack} />
            )}
            {/* ─────────────────────────────────────────────────── */}
            {currentStep === 6 && (
              <PreviewStep onNext={goNext} onBack={goBack} />
            )}
            {currentStep === 7 && <GoLiveStep onBack={goBack} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const MobileProgressBar = ({ currentStep }) => {
  const STEPS = [
    "Welcome",
    "Storefront",
    "Branches",
    "Configure",
    "Banking", // <-- Added
    "Preview",
    "Go Live",
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i + 1 < currentStep
                ? "w-1.5 bg-emerald-500"
                : i + 1 === currentStep
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/15"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-white/50 whitespace-nowrap">
        {currentStep}/7 · {STEPS[currentStep - 1]}
      </span>
    </div>
  );
};

export default MarketplaceOnboardingPage;