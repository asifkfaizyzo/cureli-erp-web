import { TrendingUp, ArrowDownRight, ArrowUpRight, Store, ShieldCheck } from "lucide-react";

const EarningsBreakdownTab = ({ payout }) => {
  if (!payout) return <p className="text-sm text-gray-400">No payout data yet.</p>;

  const breakdown = payout.breakdown_snapshot;
  if (!breakdown) return <p className="text-sm text-gray-400">No breakdown available. Click Recalculate.</p>;

  const cureli = breakdown.cureli_summary || {};
  const adjustments = payout.adjustments || [];
  const adjustmentTotal = Array.isArray(adjustments)
    ? adjustments.reduce((s, a) => s + (a.type === "ADDITION" ? Number(a.amount) : -Number(a.amount)), 0)
    : 0;

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 text-sm">
      {/* SECTION 1: PHARMACY PAYOUT STATEMENT */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Store size={16} className="text-emerald-600" />
          <h3 className="font-bold text-gray-900 text-sm tracking-wide">Pharmacy Settlement Statement</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Orders Count</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{breakdown.total_orders || 0}</p>
            <span className="text-[11px] text-gray-400">Completed & Paid</span>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">Pharmacy Gross (Subtotal)</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{fmt(breakdown.gross_total)}</p>
            <span className="text-[11px] text-gray-400">Medicine sales value</span>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 font-medium">Commission Deducted</p>
            <p className="text-xl font-bold text-amber-800 mt-1">-{fmt(breakdown.commission_total)}</p>
            <span className="text-[11px] text-amber-600">Retained by Cureli</span>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs text-emerald-700 font-medium">Final Net Payable</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{fmt(payout.net_amount)}</p>
            <span className="text-[11px] text-emerald-600">
              {adjustmentTotal !== 0 ? `Includes ${fmt(adjustmentTotal)} adj.` : "Direct Disbursal"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: CURELI PLATFORM ECONOMICS (P&L) */}
      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-600" />
            <h3 className="font-bold text-indigo-950 text-sm">Cureli Platform Order Economics (P&L)</h3>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">
            Net Margin: {fmt(cureli.total_cureli_margin)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border border-indigo-100">
            <span className="text-[11px] text-gray-500 font-medium">Customer Billed</span>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{fmt(cureli.total_customer_billed)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-100">
            <span className="text-[11px] text-gray-500 font-medium">Delivery & Service Fees</span>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {fmt((cureli.total_delivery_fees || 0) + (cureli.total_service_charges || 0) + (cureli.total_km_surcharges || 0))}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-100">
            <span className="text-[11px] text-rose-600 font-medium">Rider Delivery Cost</span>
            <p className="text-sm font-bold text-rose-700 mt-0.5">-{fmt(cureli.total_rider_payouts)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-100">
            <span className="text-[11px] text-rose-600 font-medium">Discounts Absorbed</span>
            <p className="text-sm font-bold text-rose-700 mt-0.5">-{fmt(cureli.total_discounts_absorbed)}</p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-indigo-100/80 flex items-center justify-between text-xs text-indigo-900 font-medium">
          <span>Formula: (Commission + Delivery Fee + Service Fee + KM Surcharge) - (Rider Pay + Marketing Discounts)</span>
          <span className="font-bold text-indigo-950">100% Tips ({fmt(cureli.total_tips_collected)}) passed to riders</span>
        </div>
      </div>

      {/* SECTION 3: PER-BRANCH BREAKDOWN */}
      {breakdown.branches && breakdown.branches.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Branch Breakdown</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3.5 py-2.5 font-semibold">Branch</th>
                  <th className="text-right px-3.5 py-2.5 font-semibold">Orders</th>
                  <th className="text-right px-3.5 py-2.5 font-semibold">Subtotal</th>
                  <th className="text-right px-3.5 py-2.5 font-semibold">Commission</th>
                  <th className="text-right px-3.5 py-2.5 font-semibold">Pharmacy Net</th>
                  <th className="text-right px-3.5 py-2.5 font-semibold">Cureli Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.branches.map((b) => (
                  <tr key={b.branch_id} className="hover:bg-gray-50/50">
                    <td className="px-3.5 py-2.5 font-medium text-gray-900">{b.branch_name}</td>
                    <td className="px-3.5 py-2.5 text-right text-gray-600">{b.orders}</td>
                    <td className="px-3.5 py-2.5 text-right">{fmt(b.subtotal)}</td>
                    <td className="px-3.5 py-2.5 text-right text-amber-700">{fmt(b.commission)}</td>
                    <td className="px-3.5 py-2.5 text-right text-emerald-700 font-semibold">{fmt(b.net)}</td>
                    <td className="px-3.5 py-2.5 text-right text-indigo-700 font-semibold">{fmt(b.cureli_margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: DAILY BREAKDOWN */}
      {breakdown.daily && breakdown.daily.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Daily Revenue Trend</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3.5 py-2 font-semibold">Day</th>
                  <th className="text-right px-3.5 py-2 font-semibold">Orders</th>
                  <th className="text-right px-3.5 py-2 font-semibold">Subtotal</th>
                  <th className="text-right px-3.5 py-2 font-semibold">Commission</th>
                  <th className="text-right px-3.5 py-2 font-semibold">Cureli Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.daily.map((d) => (
                  <tr key={d.date} className={`hover:bg-gray-50/50 ${d.orders === 0 ? "opacity-40" : ""}`}>
                    <td className="px-3.5 py-2 font-medium">
                      {d.day_name} <span className="text-gray-400 font-normal ml-1">{d.date}</span>
                    </td>
                    <td className="px-3.5 py-2 text-right">{d.orders}</td>
                    <td className="px-3.5 py-2 text-right">{fmt(d.subtotal)}</td>
                    <td className="px-3.5 py-2 text-right text-amber-700">{fmt(d.commission)}</td>
                    <td className="px-3.5 py-2 text-right text-indigo-700 font-medium">{fmt(d.cureli_margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: ADJUSTMENTS SUMMARY */}
      {adjustments.length > 0 && (
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700">Manual / Rollover Adjustments Reconciled:</span>
          <span className={`font-bold ${adjustmentTotal >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {adjustmentTotal >= 0 ? `+${fmt(adjustmentTotal)}` : fmt(adjustmentTotal)}
          </span>
        </div>
      )}
    </div>
  );
};

export default EarningsBreakdownTab;