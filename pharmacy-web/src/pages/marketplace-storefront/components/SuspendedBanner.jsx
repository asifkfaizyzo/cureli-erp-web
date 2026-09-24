// pharmacy-web/src/pages/marketplace-storefront/components/SuspendedBanner.jsx (do not remove this comment)
import { motion } from "framer-motion";
import { PowerOff, Power, Loader2 } from "lucide-react";

const SuspendedBanner = ({ onResume, isResuming, canSuspend }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20"
  >
    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
      <PowerOff size={14} className="text-amber-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-amber-400">Marketplace Suspended</p>
      <p className="text-xs text-amber-400/60 mt-0.5">
        All branches are offline. Re-enable branches individually after resuming.
      </p>
    </div>
    {canSuspend && (
      <button
        onClick={onResume}
        disabled={isResuming}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-xs font-semibold text-amber-400 transition-all disabled:opacity-50 flex-shrink-0"
      >
        {isResuming
          ? <Loader2 size={12} className="animate-spin" />
          : <Power size={12} />
        }
        Resume
      </button>
    )}
  </motion.div>
);

export default SuspendedBanner;