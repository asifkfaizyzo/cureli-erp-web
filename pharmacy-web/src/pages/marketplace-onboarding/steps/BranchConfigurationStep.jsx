// pharmacy-web/src/pages/marketplace-onboarding/steps/BranchConfigurationStep.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/steps/BranchConfigurationStep.jsx

import { useState, useMemo, useCallback } from "react";
import { ArrowRight, ArrowLeft, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";
import { useGoogleMaps } from "../../../hooks/useGoogleMaps";
import BranchConfigCard from "../components/BranchConfigCard";
import UnifiedBranchMap from "../components/UnifiedBranchMap";

const BranchConfigurationStep = ({ onNext, onBack }) => {
  const allBranches = useMarketplaceStore((s) => s.allBranches);
  const selectedBranchIds = useMarketplaceStore((s) => s.selectedBranchIds);
  const branchConfigs = useMarketplaceStore((s) => s.branchConfigs);
  const updateBranchConfig = useMarketplaceStore((s) => s.updateBranchConfig);
  const submitBranchConfig = useMarketplaceStore((s) => s.submitBranchConfig);

  const { isLoaded, loadError } = useGoogleMaps();

  const [activeBranchId, setActiveBranchId] = useState(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [submitAllError, setSubmitAllError] = useState(null);

  const selectedBranches = allBranches.filter((b) =>
    selectedBranchIds.includes(b.branch_id)
  );

  const enabledBranches = selectedBranches.filter(
    (b) => branchConfigs[b.branch_id]?.marketplace_enabled
  );

  const enabledCount = enabledBranches.length;

  const mappableBranches = useMemo(() => {
    return selectedBranches
      .filter((b) => {
        const cfg = branchConfigs[b.branch_id];
        return cfg?.latitude && cfg?.longitude && cfg?.marketplace_enabled;
      })
      .map((b) => {
        const cfg = branchConfigs[b.branch_id];
        return {
          branch_id: b.branch_id,
          branch_name: b.branch_name,
          latitude: cfg.latitude,
          longitude: cfg.longitude,
          formatted_address: cfg.formatted_address,
          isPersisted: cfg._persisted === true,
          isActive: b.branch_id === activeBranchId,
        };
      });
  }, [selectedBranches, branchConfigs, activeBranchId]);

  const handleToggleExpand = useCallback((branchId) => {
    setActiveBranchId((prev) => (prev === branchId ? null : branchId));
  }, []);

  const handleBranchSaved = useCallback(() => {}, []);

  const handleLocationUpdate = useCallback(
    (branchId, locationData) => {
      const existing = branchConfigs[branchId];
      updateBranchConfig(branchId, {
        google_place_id: existing?.google_place_id ?? null,
        formatted_address: locationData.formatted_address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        _dirty: true,
      });
    },
    [branchConfigs, updateBranchConfig]
  );

  // Auto-save all enabled branches to DB before advancing to Banking step
  const handleContinue = async () => {
    setSubmitAllError(null);
    if (enabledCount === 0) return;

    setIsSubmittingAll(true);

    try {
      for (const b of enabledBranches) {
        const res = await submitBranchConfig(b.branch_id);
        if (!res.success) {
          throw new Error(
            `${b.branch_name}: ${res.error || "Failed to save configuration"}`
          );
        }
      }
      onNext();
    } catch (err) {
      setSubmitAllError(err.message);
    } finally {
      setIsSubmittingAll(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white mb-1">
          Configure Branches
        </h2>
        <p className="text-white/40 text-sm">
          Set location, hours, and fulfillment for each branch.
        </p>
      </div>

      {/* ── Two-column layout ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* ── Left: Map (sticky) ───────────────────────────────── */}
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <div className="lg:sticky lg:top-4 space-y-3">
            <UnifiedBranchMap
              branches={mappableBranches}
              activeBranchId={activeBranchId}
              onMarkerClick={handleToggleExpand}
              onLocationUpdate={handleLocationUpdate}
              isLoaded={isLoaded}
              loadError={loadError}
            />

            {/* Status banner */}
            {enabledCount === 0 ? (
              <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">
                  Enable at least one branch to proceed.
                </p>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                bg-emerald-500/10 border border-emerald-500/20"
              >
                <MapPin size={12} className="text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-400">
                  {enabledCount} branch{enabledCount > 1 ? "es" : ""} enabled
                  {mappableBranches.filter((b) => b.isPersisted).length > 0 && (
                    <span className="text-emerald-400/50">
                      {" "}· {mappableBranches.filter((b) => b.isPersisted).length} saved
                    </span>
                  )}
                </p>
              </div>
            )}

            {submitAllError && (
              <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{submitAllError}</p>
              </div>
            )}

            {/* Navigation — desktop only, sits under map */}
            <div className="hidden lg:flex gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmittingAll}
                className="flex-1 py-2.5 rounded-xl border border-white/10
                  text-white/50 text-sm font-medium hover:border-white/20
                  hover:text-white/70 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={enabledCount === 0 || isSubmittingAll}
                className="flex-[2] py-2.5 bg-white text-[#010015] rounded-xl
                  font-bold text-sm hover:bg-white/90 disabled:opacity-50
                  disabled:cursor-not-allowed transition-all flex items-center
                  justify-center gap-2"
              >
                {isSubmittingAll ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving Branches...
                  </>
                ) : (
                  <>
                    Continue to Banking <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Branch cards (scrollable) ─────────────────── */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {selectedBranches.map((branch) => (
            <BranchConfigCard
              key={branch.branch_id}
              branch={branch}
              isExpanded={activeBranchId === branch.branch_id}
              onToggleExpand={() => handleToggleExpand(branch.branch_id)}
              onSave={handleBranchSaved}
              isLoaded={isLoaded}
              loadError={loadError}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile-only navigation ───────────────────────────────── */}
      <div className="flex lg:hidden gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmittingAll}
          className="flex-1 py-3 rounded-xl border border-white/10
            text-white/50 text-sm font-medium hover:border-white/20
            hover:text-white/70 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={enabledCount === 0 || isSubmittingAll}
          className="flex-[2] py-3 bg-white text-[#010015] rounded-xl
            font-bold text-sm hover:bg-white/90 disabled:opacity-50
            disabled:cursor-not-allowed transition-all flex items-center
            justify-center gap-2"
        >
          {isSubmittingAll ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              Continue to Banking <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BranchConfigurationStep;