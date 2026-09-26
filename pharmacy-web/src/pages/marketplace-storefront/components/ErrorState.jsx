// pharmacy-web/src/pages/marketplace-storefront/components/ErrorState.jsx (do not remove this comment)
import { WifiOff, RefreshCw } from "lucide-react";

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center mb-4">
      <WifiOff size={22} className="text-red-400/60" />
    </div>
    <p className="text-sm font-semibold text-white/60 mb-1">Failed to load storefront</p>
    <p className="text-xs text-white/25 mb-5 max-w-xs">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sm text-white/50 hover:text-white/70 transition-all"
    >
      <RefreshCw size={13} />
      Retry
    </button>
  </div>
);

export default ErrorState;