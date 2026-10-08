import { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const OrdersTab = ({ orderLineItems }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  if (!orderLineItems || orderLineItems.length === 0) {
    return <p className="text-sm text-gray-400">No order line items. Payout must be recalculated or finalized first.</p>;
  }

  const toggleExpand = (id) => {
    setExpandedOrder((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Settled Orders ({orderLineItems.length})
        </h3>
        <span className="text-[11px] text-gray-500 flex items-center gap-1">
          <Info size={12} /> Click any row to expand customer & rider breakdown
        </span>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th className="w-8 px-2 py-2.5" />
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Order</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Subtotal</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Comm %</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Commission</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Pharmacy Net</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Customer Total</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Rider Cost</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Cureli Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orderLineItems.map((o) => {
              const isExpanded = expandedOrder === o.id;

              return (
                <div key={o.id} className="contents">
                  <tr
                    onClick={() => toggleExpand(o.id)}
                    className={`cursor-pointer hover:bg-gray-50/70 transition-colors ${
                      isExpanded ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    <td className="px-2 py-2.5 text-center text-gray-400">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-indigo-700">{o.order_number}</span>
                      {o.completed_at && (
                        <span className="block text-[10px] text-gray-400">
                          {new Date(o.completed_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900">{fmt(o.subtotal)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{o.commission_rate_percent}%</td>
                    <td className="px-3 py-2.5 text-right text-amber-700 font-medium">-{fmt(o.commission_amount)}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-700 font-semibold">{fmt(o.pharmacy_earning)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{fmt(o.customer_total_amount)}</td>
                    <td className="px-3 py-2.5 text-right text-rose-600 font-medium">-{fmt(o.rider_payout)}</td>
                    <td className="px-3 py-2.5 text-right text-indigo-700 font-bold">{fmt(o.cureli_margin)}</td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50/80 border-y border-indigo-100/60">
                      <td colSpan={9} className="px-6 py-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] bg-white p-3 rounded-lg border border-gray-200">
                          <div>
                            <span className="text-gray-400 block mb-0.5 font-medium">Customer Fees</span>
                            <p className="text-gray-700">Service Fee: <strong>{fmt(o.service_charge)}</strong></p>
                            <p className="text-gray-700">Delivery Fee: <strong>{fmt(o.delivery_fee)}</strong></p>
                            <p className="text-gray-700">KM Surcharge: <strong>{fmt(o.km_surcharge)}</strong></p>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5 font-medium">Discounts (Cureli Absorbed)</span>
                            <p className="text-gray-700">Coupon: <strong>{fmt(o.coupon_discount_amount)}</strong></p>
                            <p className="text-gray-700">Loyalty: <strong>{fmt(o.loyalty_discount_amount)}</strong></p>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5 font-medium">Fulfillment Costs</span>
                            <p className="text-gray-700">Rider Disbursal: <strong>{fmt(o.rider_payout)}</strong></p>
                            <p className="text-gray-700">Tip (100% Pass-thru): <strong>{fmt(o.tip)}</strong></p>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5 font-medium">Order P&L Outcome</span>
                            <p className="text-emerald-700 font-medium">Pharmacy Cut: <strong>{fmt(o.pharmacy_earning)}</strong></p>
                            <p className="text-indigo-700 font-bold">Cureli Net Margin: <strong>{fmt(o.cureli_margin)}</strong></p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTab;