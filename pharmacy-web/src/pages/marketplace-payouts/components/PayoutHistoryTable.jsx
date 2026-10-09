// pharmacy-web/src/pages/marketplace-payouts/components/PayoutHistoryTable.jsx (do not remove this comment)
import React from "react";
import { Loader2, Landmark, ChevronRight, Eye, CalendarRange } from "lucide-react";

const STATUS_BADGES = {
  DRAFT: "bg-white/[0.04] text-white/60 border border-white/[0.08]",
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

const PayoutHistoryTable = ({
  history,
  loading,
  onSelectPayout,
  onLoadDashboardContext,
  page,
  totalPages,
  onPageChange,
  activeContextId
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        <p className="text-xs text-white/50">Retrieving settlement records...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.01] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] mb-4">
          <Landmark className="h-5 w-5 text-white/40" />
        </div>
        <h4 className="text-sm font-semibold text-white/80">No payouts resolved</h4>
        <p className="text-xs text-white/40 max-w-sm mt-1">
          Settlement historical registers populate immediately once the marketplace processes your completed transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.01]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-white/60">
              <th className="px-5 py-3.5">Cycle Window</th>
              <th className="px-5 py-3.5 text-center">Orders</th>
              <th className="px-5 py-3.5 text-right">Gross Sales</th>
              <th className="px-5 py-3.5 text-right">Commissions</th>
              <th className="px-5 py-3.5 text-right">Net Earnings</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              <th className="px-5 py-3.5 text-center">Settled On</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-xs">
            {history.map((payout) => {
              const isActiveContext = activeContextId === payout.payout_id;
              return (
                <tr
                  key={payout.payout_id}
                  className={`group transition-colors duration-150 ${
                    isActiveContext ? "bg-indigo-500/[0.05]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="px-5 py-4 font-medium text-white/80">
                    {payout.week_start} <span className="text-white/30 mx-1">→</span> {payout.week_end}
                    {isActiveContext && (
                      <span className="ml-2 inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded">
                        Active View
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-white/70">
                    {payout.total_orders || 0}
                  </td>
                  <td className="px-5 py-4 text-right text-white/70 font-mono">
                    {fmt(payout.gross_amount)}
                  </td>
                  <td className="px-5 py-4 text-right text-rose-400 font-mono">
                    {fmt(payout.commission_amount)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-400 font-mono">
                    {fmt(payout.net_amount)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_BADGES[payout.status] || STATUS_BADGES.DRAFT}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center text-white/50">
                    {payout.manual_payment_date || payout.payment_date || "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => onLoadDashboardContext(payout)}
                        title="Load week analytics into dashboard"
                        className="p-1 px-2.5 rounded text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 transition-all flex items-center gap-1"
                      >
                        <CalendarRange size={10} />
                        Analyze Week
                      </button>
                      <button
                        onClick={() => onSelectPayout(payout.payout_id)}
                        title="View Bank Receipt details"
                        className="p-1 rounded-md bg-white/[0.02] border border-white/[0.06] text-white/40 group-hover:text-white/90 hover:bg-white/[0.06] transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Standard Pagination Footer ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 py-3 px-5 border-t border-white/[0.08] bg-white/[0.02]">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-semibold hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous History Page
          </button>
          <span className="text-xs text-white/60 font-medium">
            History Page <span className="text-white/90 font-bold">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-semibold hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next History Page
          </button>
        </div>
      )}
    </div>
  );
};

export default PayoutHistoryTable;