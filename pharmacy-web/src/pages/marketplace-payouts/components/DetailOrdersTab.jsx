// pharmacy-web/src/pages/marketplace-payouts/components/DetailOrdersTab.jsx

import React from "react";
import { ShoppingBag } from "lucide-react";

const fmt = (n) =>
  `₹${(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const DetailOrdersTab = ({ orders = [] }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <ShoppingBag className="h-8 w-8 text-white/20 mb-2" />
        <p className="text-xs text-white/40">
          No itemized orders mapped in this snapshot.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
          Line Item Breakdown
        </p>
        <span className="text-[10px] bg-white/[0.06] text-white/60 px-2 py-0.5 rounded-md font-bold">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.08] overflow-hidden max-h-[350px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-white/[0.04] sticky top-0 border-b border-white/[0.08] z-10">
            <tr className="text-[9px] font-bold uppercase tracking-wider text-white/50">
              <th className="px-4 py-2.5">Order Ref</th>
              <th className="px-4 py-2.5 text-right">Subtotal</th>
              <th className="px-4 py-2.5 text-right">Rate</th>
              <th className="px-4 py-2.5 text-right">MKT Fee</th>
              <th className="px-4 py-2.5 text-right">Earning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-2 font-mono text-indigo-400 font-bold">
                  {o.order_number}
                </td>
                <td className="px-4 py-2 text-right text-white/70">
                  {fmt(o.subtotal)}
                </td>
                <td className="px-4 py-2 text-right text-white/55 font-semibold">
                  {Number(o.commission_rate_percent)}%
                </td>
                <td className="px-4 py-2 text-right text-rose-400">
                  {fmt(o.commission_amount)}
                </td>
                <td className="px-4 py-2 text-right text-emerald-400 font-bold">
                  {fmt(o.pharmacy_earning)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetailOrdersTab;
