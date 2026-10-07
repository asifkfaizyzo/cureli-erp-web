const OrdersTab = ({ orderLineItems }) => {
  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!orderLineItems || orderLineItems.length === 0) {
    return <p className="text-sm text-gray-400">No order line items. Payout may not be finalized yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">
          {orderLineItems.length} Order{orderLineItems.length !== 1 ? "s" : ""} in this Payout
        </h3>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Order</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Subtotal</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Rate</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Commission</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Earning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orderLineItems.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50">
                <td className="px-3 py-2">
                  <span className="font-medium text-indigo-700">{o.order_number}</span>
                  {o.completed_at && (
                    <span className="block text-[10px] text-gray-400">
                      {new Date(o.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">{fmt(o.subtotal)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{o.commission_rate_percent}%</td>
                <td className="px-3 py-2 text-right text-amber-700">{fmt(o.commission_amount)}</td>
                <td className="px-3 py-2 text-right text-green-700 font-medium">{fmt(o.pharmacy_earning)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTab;