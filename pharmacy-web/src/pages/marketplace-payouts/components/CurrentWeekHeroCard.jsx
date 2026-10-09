// pharmacy-web/src/pages/marketplace-payouts/components/CurrentWeekHeroCard.jsx

import React from "react";
import { TrendingUp, CalendarDays, ShoppingBag, Landmark } from "lucide-react";

const STATUS_LABELS = {
  DRAFT: "Calculating",
  LIVE_PREVIEW: "Live Preview",
  PENDING: "Settlement Pending",
  PROCESSING: "Disbursal In Progress",
  COMPLETED: "Settled & Paid",
  FAILED: "Disbursal Failed",
};

const STATUS_BADGES = {
  DRAFT: "bg-white/[0.04] text-white/60 border border-white/[0.08]",
  LIVE_PREVIEW: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  PROCESSING: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

const fmt = (n) =>
  `₹${(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CurrentWeekHeroCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0c0a2a] via-[#05015a]/30 to-[#010015] p-5 sm:p-6 shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-[80px]" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/20">
            <CalendarDays className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">
              {data.status === "LIVE_PREVIEW" ? "Active Cycle (Real-Time)" : "Settlement Cycle"}
            </span>
            <h2 className="text-sm font-semibold text-white mt-0.5">
              {data.week_start} <span className="text-white/30 mx-1">→</span> {data.week_end}
            </h2>
          </div>
        </div>

        <div>
          <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg ${STATUS_BADGES[data.status] || STATUS_BADGES.DRAFT}`}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {STATUS_LABELS[data.status] || data.status}
          </span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 pt-5">
        {/* Metric 1 */}
        <div className="space-y-1">
          <p className="text-xs text-white/40 flex items-center gap-1.5">
            <ShoppingBag className="h-3 w-3 text-white/30" /> Total Orders
          </p>
          <p className="text-2xl font-black text-white">{data.total_orders || 0}</p>
        </div>

        {/* Metric 2 */}
        <div className="space-y-1">
          <p className="text-xs text-white/40">Gross Sales</p>
          <p className="text-2xl font-black text-white/90">{fmt(data.gross_amount)}</p>
        </div>

        {/* Metric 3 */}
        <div className="space-y-1">
          <p className="text-xs text-white/40">Marketplace Fees</p>
          <p className="text-2xl font-black text-rose-400">{fmt(data.commission_amount)}</p>
        </div>

        {/* Metric 4 */}
        <div className="space-y-1">
          <p className="text-xs text-indigo-300 flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Net Earnings
          </p>
          <p className="text-2xl font-black text-emerald-400">{fmt(data.net_amount)}</p>
        </div>
      </div>

      {/* Multi-Branch indicators */}
      {data.branches && data.branches.length > 1 && (
        <div className="relative z-10 mt-5 border-t border-white/[0.08] pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5">
            Branch Breakdowns
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data.branches.map((b) => (
              <div
                key={b.branch_id}
                className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-xs"
              >
                <span className="text-white/60 font-medium truncate max-w-[150px]" title={b.branch_name}>
                  {b.branch_name}
                </span>
                <span className="font-bold text-emerald-400">{fmt(b.net)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentWeekHeroCard;