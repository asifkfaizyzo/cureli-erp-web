// pharmacy-web/src/pages/marketplace-storefront/components/StorefrontHeader.jsx (do not remove this comment)
import { Loader2, PowerOff } from "lucide-react";
import StatusPill from "./primitives/StatusPill";

const StorefrontHeader = ({
  storefront,
  isLive,
  isSuspending,
  canSuspend,
  onSuspendClick,
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-xl font-bold text-white">Storefront</h1>
      <p className="text-sm text-white/30 mt-0.5">
        Manage your pharmacy marketplace presence
      </p>
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      {storefront && <StatusPill status={storefront.marketplace_status} />}
      {canSuspend && isLive && (
        <button
          onClick={onSuspendClick}
          disabled={isSuspending}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 text-xs font-semibold text-red-400 transition-all disabled:opacity-50"
        >
          {isSuspending
            ? <Loader2 size={12} className="animate-spin" />
            : <PowerOff size={12} />
          }
          Suspend
        </button>
      )}
    </div>
  </div>
);

export default StorefrontHeader;