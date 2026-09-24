// pharmacy-web/src/pages/marketplace-onboarding/steps/GoLiveStep.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-onboarding/steps/GoLiveStep.jsx

import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Rocket,
  AlertCircle,
  Check,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";
import GoLiveCelebration from "../components/GoLiveCelebration";

const GoLiveStep = ({ onBack }) => {
  const submitGoLive = useMarketplaceStore((s) => s.submitGoLive);
  const confirmGoLive = useMarketplaceStore((s) => s.confirmGoLive);
  const isGoingLive = useMarketplaceStore((s) => s.isGoingLive);
  const goLiveErrors = useMarketplaceStore((s) => s.goLiveErrors);
  const storefront = useMarketplaceStore((s) => s.storefront);
  const allBranches = useMarketplaceStore((s) => s.allBranches);
  const selectedBranchIds = useMarketplaceStore((s) => s.selectedBranchIds);
  const branchConfigs = useMarketplaceStore((s) => s.branchConfigs);

  const [showCelebration, setShowCelebration] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const enabledBranches = allBranches.filter(
    (b) =>
      selectedBranchIds.includes(b.branch_id) &&
      branchConfigs[b.branch_id]?.marketplace_enabled,
  );

  const handleGoLive = async () => {
    setSubmitError(null);

    const result = await submitGoLive();

    if (!result?.success) {
      setSubmitError(
        result?.error || "Something went wrong. Please try again.",
      );
      return;
    }

    setShowCelebration(true);
  };

  const handleCelebrationComplete = () => {
    confirmGoLive();
  };

  if (showCelebration) {
    return (
      <GoLiveCelebration
        onComplete={handleCelebrationComplete}
        storeName={storefront.storefront_name || "Your Pharmacy"}
      />
    );
  }

  // Safely stringify error entries whether they are strings or {field, message} objects
  const renderErrorText = (err) => {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    if (typeof err === "object") {
      if (err.message) return err.message;
      try {
        return JSON.stringify(err);
      } catch {
        return "Unknown error";
      }
    }
    return String(err);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column */}
        <div className="flex-1">
          <div
            className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center
            justify-center mb-5"
          >
            <Rocket size={20} className="text-indigo-400" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Ready to Go Live?
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-md">
            Once live, your storefront and all enabled branches will be visible
            to customers on the Cureli Mobile. You can suspend or update your
            listing at any time.
          </p>

          <div className="space-y-3 mb-8">
            {[
              {
                icon: Globe,
                title: "Your storefront goes public",
                desc: "Customers can find and view your pharmacy",
              },
              {
                icon: ShieldCheck,
                title: "You stay in control",
                desc: "Suspend, edit, or update anytime from settings",
              },
              {
                icon: Rocket,
                title: "Start receiving orders",
                desc: "Customers can place orders for pickup or delivery",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center
                  justify-center flex-shrink-0"
                >
                  <item.icon size={14} className="text-white/30" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">
                    {item.title}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {goLiveErrors.length > 0 && (
            <div
              className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border
              border-red-500/20 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-sm font-medium text-red-400">
                  Fix the following before going live:
                </p>
              </div>
              <ul className="ml-6 space-y-1">
                {goLiveErrors.map((err, i) => (
                  <li key={i} className="text-xs text-red-400/80 list-disc">
                    {renderErrorText(err)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div
              className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border
              border-red-500/20 flex items-center gap-2"
            >
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={isGoingLive}
              className="flex-1 py-2.5 rounded-xl border border-white/10
                text-white/50 text-sm font-medium hover:border-white/20
                hover:text-white/70 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={handleGoLive}
              disabled={isGoingLive}
              className="flex-[2] py-2.5 bg-white text-[#010015] rounded-xl
                font-bold text-sm hover:bg-white/90 disabled:opacity-50
                disabled:cursor-not-allowed transition-all flex items-center
                justify-center gap-2"
            >
              {isGoingLive ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Going Live...
                </>
              ) : (
                <>
                  <Rocket size={14} /> Launch Marketplace
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="w-full lg:w-[280px] flex-shrink-0">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-3">
                Publishing
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06]
                  flex items-center justify-center overflow-hidden flex-shrink-0"
                >
                  {storefront.logo_url ? (
                    <img
                      src={
                        storefront.logo_url.startsWith("http")
                          ? storefront.logo_url
                          : `${import.meta.env.VITE_API_URL}${storefront.logo_url}`
                      }
                      alt="Logo"
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <Rocket size={16} className="text-white/15" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/70 truncate">
                    {storefront.storefront_name || "Your Pharmacy"}
                  </p>
                  <p className="text-[10px] text-white/25">Storefront</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">
                  Branches ({enabledBranches.length})
                </p>
                <div className="space-y-1.5">
                  {enabledBranches.map((b) => {
                    const cfg = branchConfigs[b.branch_id] || {};
                    return (
                      <div
                        key={b.branch_id}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg
                          bg-white/[0.03] border border-white/[0.05]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white/60 truncate">
                            {b.branch_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {cfg.pickup_enabled && (
                              <span className="text-[8px] text-white/20">
                                Pickup
                              </span>
                            )}
                            {cfg.delivery_enabled && (
                              <span className="text-[8px] text-white/20">
                                Delivery ({cfg.delivery_mode === "SELF" ? "Self" : "Cureli"})
                              </span>
                            )}
                          </div>
                        </div>
                        <Check
                          size={10}
                          className="text-emerald-400/50 flex-shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoLiveStep;