// pharmacy-web/src/components/common/BankingPendingBanner.jsx

import { Landmark } from "lucide-react";

/**
 * Reusable amber warning banner shown when banking details
 * have not been configured.
 *
 * Props:
 *   onAction  – optional callback for a CTA button (e.g. open modal)
 *   compact   – renders a smaller inline variant (for checklists)
 */
const BankingPendingBanner = ({ onAction, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <Landmark size={12} className="text-amber-400 flex-shrink-0" />
        <p className="text-[11px] text-amber-400/80 leading-snug">
          Banking details pending — weekly settlements will be paused
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
        <Landmark size={15} className="text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-300">
          Banking details pending
        </p>
        <p className="text-xs text-amber-400/60 mt-0.5">
          Weekly settlements will be paused until you add your bank account.
        </p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20
            border border-amber-500/30 text-amber-300 text-xs font-medium
            hover:bg-amber-500/30 transition-all"
        >
          Add Now
        </button>
      )}
    </div>
  );
};

export default BankingPendingBanner;