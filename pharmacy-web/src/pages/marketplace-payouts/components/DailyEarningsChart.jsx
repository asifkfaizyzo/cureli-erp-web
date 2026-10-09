// pharmacy-web/src/pages/marketplace-payouts/components/DailyEarningsChart.jsx

import React from "react";
import { BarChart3 } from "lucide-react";

const fmt = (n) =>
  `₹${(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const DailyEarningsChart = ({ dailyData }) => {
  if (!dailyData || !dailyData.some((d) => d.orders > 0)) return null;

  // Calculate highest metric peak for proper layout scaling
  const maxNet = Math.max(
    ...dailyData.map((x) => Number(x.subtotal) - Number(x.commission)),
    100
  );

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-4">
        <BarChart3 className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">
          Daily Sales Performance
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-2 pt-2">
        {dailyData.map((day) => {
          const net = Number(day.subtotal) - Number(day.commission);
          const heightPercent = Math.max(5, (net / maxNet) * 100);

          return (
            <div key={day.date} className="group flex flex-col items-center gap-2">
              {/* Tooltip value */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#0c0a2a] border border-white/[0.12] rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow-lg pointer-events-none mb-1">
                {fmt(net)}
              </div>

              {/* Bar track container */}
              <div className="w-full h-24 bg-white/[0.02] border border-white/[0.04] rounded-lg relative overflow-hidden flex items-end">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-indigo-600/40 to-indigo-400/80 rounded-b-lg border-t border-indigo-300/30 transition-all duration-500 ease-out"
                />
              </div>

              {/* Label strings */}
              <span className="text-[10px] font-semibold text-white/70">
                {day.day_name}
              </span>
              <span className="text-[9px] text-white/40">
                {day.orders} order{day.orders !== 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyEarningsChart;