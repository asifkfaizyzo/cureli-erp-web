// pharmacy-web/src/pages/marketplace-payouts/components/PayoutDetailModal.jsx

import React, { useState } from "react";
import { X, Loader2, FileText, ShoppingBag, Layers } from "lucide-react";
import DetailSummaryTab from "./DetailSummaryTab";
import DetailOrdersTab from "./DetailOrdersTab";
import DetailBranchesTab from "./DetailBranchesTab";

const PayoutDetailModal = ({ data, loading, error, onClose }) => {
  const [activeTab, setActiveTab] = useState("summary");

  if (!loading && error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010015]/80 backdrop-blur-md p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0c0a2a] p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-semibold text-rose-400">{error}</p>
          <button onClick={onClose} className="mt-4 rounded-lg bg-white/[0.08] px-4 py-2 text-xs font-medium text-white hover:bg-white/[0.12]">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010015]/85 backdrop-blur-md p-4 transition-opacity duration-200" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/[0.10] bg-[#0c0a2a] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header section */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Payout Settlement Review</h2>
            {data && (
              <p className="text-[11px] text-white/50 mt-0.5">
                Cycle window: <span className="text-white/80 font-medium">{data.week_start}</span> to <span className="text-white/80 font-medium">{data.week_end}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1 px-5 border-b border-white/[0.08] bg-white/[0.01]">
          {[
            { id: "summary", label: "Overview", icon: FileText },
            { id: "orders", label: "Order Items", icon: ShoppingBag },
            { id: "branches", label: "Branch Split", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-indigo-400 text-indigo-400"
                    : "border-transparent text-white/40 hover:text-white/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal content body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              <p className="text-xs text-white/50">Assembling payout snapshot...</p>
            </div>
          ) : !data ? (
            <p className="text-xs text-white/40 text-center py-10">Data context missing.</p>
          ) : (
            <>
              {activeTab === "summary" && <DetailSummaryTab data={data} />}
              {activeTab === "orders" && <DetailOrdersTab orders={data.order_line_items} />}
              {activeTab === "branches" && <DetailBranchesTab branches={data.branches} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayoutDetailModal;