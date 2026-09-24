// pharmacy-web/src/pages/marketplace-onboarding/steps/BranchSelectionStep.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/steps/BranchSelectionStep.jsx

import { useState } from "react";
import {
  Building2,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";

const BranchSelectionStep = ({ onNext, onBack }) => {
  const allBranches = useMarketplaceStore((s) => s.allBranches);
  const selectedBranchIds = useMarketplaceStore((s) => s.selectedBranchIds);
  const toggleBranchSelection = useMarketplaceStore(
    (s) => s.toggleBranchSelection
  );
  const submitBranchSelections = useMarketplaceStore(
    (s) => s.submitBranchSelections
  );
  const isSubmitting = useMarketplaceStore((s) => s.isSubmitting);

  const [error, setError] = useState(null);

  const handleNext = async () => {
    if (selectedBranchIds.length === 0) {
      setError("Select at least one branch to continue.");
      return;
    }
    setError(null);
    const result = await submitBranchSelections();
    if (result.success) {
      onNext();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Branches</h2>
        <p className="text-white/50 text-sm">
          Choose which branches will participate in marketplace fulfillment. You
          can configure each one in the next step.
        </p>
      </div>

      {allBranches.length === 0 ? (
        <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-white/8">
          <Building2 size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No active branches found.</p>
          <p className="text-white/25 text-xs mt-1">
            Add branches in ERP settings before setting up the marketplace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allBranches.map((branch) => {
            const isSelected = selectedBranchIds.includes(branch.branch_id);
            return (
              <button
                key={branch.branch_id}
                type="button"
                onClick={() => {
                  toggleBranchSelection(branch.branch_id);
                  if (error) setError(null);
                }}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-2xl border
                  text-left transition-all duration-150
                  ${isSelected
                    ? "bg-white/8 border-white/25"
                    : "bg-white/[0.02] border-white/8 hover:border-white/15 hover:bg-white/5"
                  }
                `}
              >
                <div
                  className={`
                    w-6 h-6 rounded-lg flex items-center justify-center
                    flex-shrink-0 transition-all border
                    ${isSelected
                      ? "bg-white border-white"
                      : "border-white/20 bg-transparent"
                    }
                  `}
                >
                  {isSelected && (
                    <Check
                      size={14}
                      className="text-[#010015]"
                      strokeWidth={3}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-semibold text-sm truncate ${
                        isSelected ? "text-white" : "text-white/60"
                      }`}
                    >
                      {branch.branch_name}
                    </p>
                    {branch.branch_type === "main" && (
                      <span
                        className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5
                        rounded bg-blue-500/20 text-blue-300 uppercase"
                      >
                        Main
                      </span>
                    )}
                  </div>
                  {(branch.city || branch.state) && (
                    <p className="text-xs text-white/30 mt-0.5 truncate">
                      {[branch.city, branch.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <Building2
                  size={18}
                  className={isSelected ? "text-white/60" : "text-white/20"}
                />
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <p className="mt-4 text-xs text-white/30">
        {selectedBranchIds.length} of {allBranches.length} branches selected
      </p>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border border-white/10
            text-white/60 text-sm font-medium hover:border-white/20
            hover:text-white/80 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting || selectedBranchIds.length === 0}
          className="flex-[2] py-3.5 bg-white text-[#010015] rounded-xl font-bold
            text-sm hover:bg-white/90 disabled:opacity-50
            disabled:cursor-not-allowed transition-all flex items-center
            justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              Configure Branches <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BranchSelectionStep;