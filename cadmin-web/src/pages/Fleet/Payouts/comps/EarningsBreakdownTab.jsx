// cadmin-web/src/pages/Fleet/Payouts/comps/EarningsBreakdownTab.jsx (do not remove this comment)
import { IndianRupee } from "lucide-react";

const EarningsBreakdownTab = ({ payout }) => {
  const breakdown = payout?.breakdown_snapshot;

  if (!breakdown) {
    return <p className="text-sm text-gray-400">No earnings data yet. Click refresh to calculate.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Deliveries", value: breakdown.total_deliveries, prefix: "" },
          { label: "Base Fee", value: breakdown.base_fee, prefix: "₹" },
          { label: "Surge", value: breakdown.surge_fee, prefix: "₹" },
          { label: "Floor Topup", value: breakdown.floor_topup_fee, prefix: "₹" },
          { label: "Tips", value: breakdown.tips, prefix: "₹" },
          { label: "Incentives", value: breakdown.incentive_earnings, prefix: "₹" },
        ].map((item) => (
          <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-lg font-bold text-gray-900">
              {item.prefix}{typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gross / Net */}
      <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg">
        <div className="flex-1">
          <p className="text-xs text-indigo-600">Gross Total</p>
          <p className="text-xl font-bold text-indigo-900 flex items-center gap-1">
            <IndianRupee size={16} />{breakdown.gross_total?.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="w-px h-10 bg-indigo-200" />
        <div className="flex-1">
          <p className="text-xs text-green-600">Net Total</p>
          <p className="text-xl font-bold text-green-800 flex items-center gap-1">
            <IndianRupee size={16} />{breakdown.net_total?.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      {breakdown.daily && breakdown.daily.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Daily Breakdown</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Day</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Orders</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Base</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Surge</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Tips</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.daily.map((day) => (
                  <tr key={day.date} className={day.deliveries === 0 ? "opacity-40" : ""}>
                    <td className="px-3 py-2 font-medium">
                      {day.day_name} <span className="text-gray-400 font-normal">{day.date.slice(5)}</span>
                    </td>
                    <td className="px-3 py-2 text-right">{day.deliveries}</td>
                    <td className="px-3 py-2 text-right">₹{day.base}</td>
                    <td className="px-3 py-2 text-right">₹{day.surge}</td>
                    <td className="px-3 py-2 text-right">₹{day.tips}</td>
                    <td className="px-3 py-2 text-right font-semibold">₹{day.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsBreakdownTab;