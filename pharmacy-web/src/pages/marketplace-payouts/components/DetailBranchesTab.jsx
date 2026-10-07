// pharmacy-web/src/pages/marketplace-payouts/components/DetailBranchesTab.jsx

import React from "react";
import { Layers } from "lucide-react";

const fmt = (n) =>
  `₹${(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const DetailBranchesTab = ({ branches = [] }) => {
  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Layers className="h-8 w-8 text-white/20 mb-2" />
        <p className="text-xs text-white/40">No branch classifications available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
        Aggregate Settlement per Branch
      </p>

      <div className="space-y-2">
        {branches.map((branch) => (
          <div
            key={branch.branch_id}
            className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">{branch.branch_name}</span>
              <span className="text-xs font-black text-emerald-400">{fmt(branch.net)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-white/40 font-medium">
              <p>Orders: <span className="text-white/60 font-semibold">{branch.orders}</span></p>
              <p className="text-right">Gross: <span className="text-white/60">{fmt(branch.subtotal)}</span></p>
              <p className="text-right">Fees: <span className="text-rose-400/80">{fmt(branch.commission)}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailBranchesTab;