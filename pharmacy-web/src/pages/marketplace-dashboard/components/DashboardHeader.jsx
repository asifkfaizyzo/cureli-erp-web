// pharmacy-web/src/pages/marketplace-dashboard/components/DashboardHeader.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/DashboardHeader.jsx

import { LayoutGrid, RefreshCw, Wifi } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG = {
  LIVE: {
    label: 'Live',
    dot:   'bg-emerald-400',
    pill:  'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  SUSPENDED: {
    label: 'Suspended',
    dot:   'bg-amber-400',
    pill:  'bg-amber-400/10 text-amber-400 border-amber-400/20',
  },
  DRAFT: {
    label: 'Draft',
    dot:   'bg-blue-400',
    pill:  'bg-blue-400/10 text-blue-400 border-blue-400/20',
  },
  NOT_STARTED: {
    label: 'Not Started',
    dot:   'bg-white/20',
    pill:  'bg-white/[0.06] text-white/40 border-white/10',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const DashboardHeader = ({
  storefront_name,
  marketplace_status,
  lastUpdated,
  isRefreshing,
  usingDummy,
  onRefresh,
}) => {
  const config = STATUS_CONFIG[marketplace_status] ?? STATUS_CONFIG.NOT_STARTED;

  const lastUpdatedLabel = lastUpdated
    ? `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
    : null;

  return (
    <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.06]">
      <div className="flex items-start justify-between gap-4">

        {/* Left: icon + title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <LayoutGrid size={18} className="text-white/60" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {storefront_name ? `${storefront_name}` : 'Marketplace Dashboard'}
              </h1>

              {/* Status pill */}
              <span
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-0.5
                  rounded-full text-[11px] font-semibold border
                  ${config.pill}
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${marketplace_status === 'LIVE' ? 'animate-pulse' : ''}`} />
                {config.label}
              </span>

              {/* Dummy data indicator — dev only */}
              {usingDummy && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Wifi size={9} />
                  Demo Data
                </span>
              )}
            </div>

            <p className="text-[12px] text-white/35 mt-0.5">
              Overview of your marketplace performance and operations
            </p>
          </div>
        </div>

        {/* Right: last updated + refresh */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {lastUpdatedLabel && (
            <span className="text-[11px] text-white/25 hidden sm:block">
              {lastUpdatedLabel}
            </span>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-white/50 hover:text-white/70 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? 'animate-spin' : ''}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;