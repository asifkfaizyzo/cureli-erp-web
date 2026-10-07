const EarningsBreakdownTab = ({ payout }) => {
  if (!payout) return <p className="text-sm text-gray-400">No payout data yet.</p>;

  const breakdown = payout.breakdown_snapshot;
  if (!breakdown) return <p className="text-sm text-gray-400">No breakdown available. Click Recalculate.</p>;

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-bold">{breakdown.total_orders || 0}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">Gross Sales</p>
          <p className="text-lg font-bold text-gray-900">{fmt(breakdown.gross_total)}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg text-center">
          <p className="text-xs text-amber-600">Commission</p>
          <p className="text-lg font-bold text-amber-700">{fmt(breakdown.commission_total)}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-xs text-green-600">Net Payable</p>
          <p className="text-lg font-bold text-green-700">{fmt(payout.net_amount)}</p>
        </div>
      </div>

      {/* Per-Branch Breakdown */}
      {breakdown.branches && breakdown.branches.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Branch Breakdown</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Branch</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Orders</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Subtotal</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Commission</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.branches.map((b) => (
                  <tr key={b.branch_id}>
                    <td className="px-3 py-2 font-medium">{b.branch_name}</td>
                    <td className="px-3 py-2 text-right">{b.orders}</td>
                    <td className="px-3 py-2 text-right">{fmt(b.subtotal)}</td>
                    <td className="px-3 py-2 text-right text-amber-700">{fmt(b.commission)}</td>
                    <td className="px-3 py-2 text-right text-green-700 font-medium">{fmt(b.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-Day Breakdown */}
      {breakdown.daily && breakdown.daily.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Daily Breakdown</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Day</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Orders</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Subtotal</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.daily.map((d) => (
                  <tr key={d.date} className={d.orders === 0 ? "opacity-40" : ""}>
                    <td className="px-3 py-2 font-medium">{d.day_name} <span className="text-xs text-gray-400">{d.date}</span></td>
                    <td className="px-3 py-2 text-right">{d.orders}</td>
                    <td className="px-3 py-2 text-right">{fmt(d.subtotal)}</td>
                    <td className="px-3 py-2 text-right text-amber-700">{fmt(d.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustments Summary */}
      {payout.adjustments && Array.isArray(payout.adjustments) && payout.adjustments.length > 0 && (
        <div className="p-3 bg-indigo-50 rounded-lg">
          <p className="text-xs text-indigo-600 font-semibold">
            Adjustments: {fmt(payout.adjustments.reduce((s, a) => s + (a.type === "ADDITION" ? a.amount : -a.amount), 0))}
          </p>
        </div>
      )}
    </div>
  );
};

export default EarningsBreakdownTab;