// pharmacy-web/src/pages/marketplace-payouts/components/DetailSummaryTab.jsx

import React from "react";
import { CheckCircle2, ArrowUpRight, ArrowDownRight, Landmark, FileText, StickyNote } from "lucide-react";

const fmt = (n) =>
  `₹${(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const DetailSummaryTab = ({ data }) => {
  return (
    <div className="space-y-5 text-xs text-white/80">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-base font-black text-white">{data.total_orders}</p>
        </div>
        <div className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Gross Sales</p>
          <p className="text-base font-black text-white/95">{fmt(data.gross_amount)}</p>
        </div>
        <div className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <p className="text-[10px] text-rose-400/80 uppercase tracking-wider mb-1">Marketplace Fee</p>
          <p className="text-base font-black text-rose-400">{fmt(data.commission_amount)}</p>
        </div>
        <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <p className="text-[10px] text-indigo-300 uppercase tracking-wider mb-1">Resolved Net</p>
          <p className="text-base font-black text-emerald-400">{fmt(data.net_amount)}</p>
        </div>
      </div>

      {/* Disbursal Snapshot */}
      {data.utr_reference && (
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-300">Settlement Complete</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-[11px] text-white/60">
              <p>UTR Reference: <span className="text-white font-mono">{data.utr_reference}</span></p>
              {data.payment_date && <p>Resolved Date: <span className="text-white">{data.payment_date}</span></p>}
              {data.manual_bank_used && <p>Source Bank Account: <span className="text-white">{data.manual_bank_used}</span></p>}
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustments List */}
      {data.adjustments && data.adjustments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Adjustments Log
          </h4>
          <div className="space-y-1.5">
            {data.adjustments.map((adj, index) => {
              const isAddition = adj.type === "ADDITION";
              return (
                <div
                  key={index}
                  className={`flex items-start justify-between p-2.5 rounded-xl border ${
                    isAddition
                      ? "border-emerald-500/10 bg-emerald-500/[0.02]"
                      : "border-rose-500/10 bg-rose-500/[0.02]"
                  }`}
                >
                  <div className="flex gap-2">
                    {isAddition ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-400 mt-0.5" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-rose-400 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-white/80">{adj.label}</p>
                      {adj.note && <p className="text-[10px] text-white/40 mt-0.5">{adj.note}</p>}
                    </div>
                  </div>
                  <span className={`font-bold ${isAddition ? "text-emerald-400" : "text-rose-400"}`}>
                    {isAddition ? "+" : "-"}{fmt(adj.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Internal Admin Audit Notes */}
      {data.internal_notes && data.internal_notes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1">
            <StickyNote className="h-3 w-3" /> Settlement Notes
          </h4>
          <div className="space-y-1.5">
            {data.internal_notes.map((note, idx) => (
              <div key={idx} className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                <p className="text-white/70 leading-relaxed">{note.text}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[9px] text-white/40 font-medium">
                  <span>Logged by Admin</span>
                  <span>·</span>
                  <span>{new Date(note.created_at).toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailSummaryTab;