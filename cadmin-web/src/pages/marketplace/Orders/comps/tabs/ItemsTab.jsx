// cadmin-web/src/pages/marketplace/Orders/comps/tabs/ItemsTab.jsx (do not remove this comment)
import { ShoppingBag, FileText } from "lucide-react";

const fmtAmount = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ItemsTab = ({ order }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center">
            <ShoppingBag size={12} className="text-[#05015A]" />
          </div>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Items ({order.items?.length || 0})
          </p>
        </div>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.item_id}
              className="flex items-start justify-between gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.medicine_name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.brand && (
                    <span className="text-[11px] text-gray-500">
                      {item.brand}
                    </span>
                  )}
                  {item.pack_size && (
                    <span className="text-[11px] text-gray-400">
                      · {item.pack_size}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    SKU: {item.sku}
                  </span>
                  {item.requires_prescription && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                      Rx
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                  MRP: {fmtAmount(item.mrp)} · Qty: {item.quantity} · Unit:{" "}
                  {fmtAmount(item.unit_price)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-800">
                  {fmtAmount(item.line_total)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Full Billing Summary */}
        <div className="mt-5 pt-4 border-t-2 border-gray-200 max-w-sm ml-auto space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Subtotal</span>
            <span className="text-xs font-semibold text-gray-700">
              {fmtAmount(order.subtotal)}
            </span>
          </div>
          {order.service_charge > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Service Charge</span>
              <span className="text-xs font-medium text-gray-600">
                {fmtAmount(order.service_charge)}
              </span>
            </div>
          )}
          {order.delivery_fee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Delivery Fee{" "}
                {order.distance_km > 0 ? `(${order.distance_km} km)` : ""}
              </span>
              <span className="text-xs font-medium text-gray-600">
                {fmtAmount(order.delivery_fee)}
              </span>
            </div>
          )}
          {order.tip > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Tip</span>
              <span className="text-xs font-medium text-gray-600">
                {fmtAmount(order.tip)}
              </span>
            </div>
          )}
          {order.coupon_discount_amount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">
                Coupon ({order.coupon_code})
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                -{fmtAmount(order.coupon_discount_amount)}
              </span>
            </div>
          )}
          {order.loyalty_discount_amount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-violet-600">
                Loyalty ({order.loyalty_points_redeemed} pts)
              </span>
              <span className="text-xs font-semibold text-violet-600">
                -{fmtAmount(order.loyalty_discount_amount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-dashed border-gray-200">
            <span className="text-sm font-bold text-gray-900">Grand Total</span>
            <span className="text-base font-extrabold text-[#05015A]">
              {fmtAmount(order.total_amount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
            <span>Payment: {order.payment_method}</span>
            <span>Status: {order.payment_status}</span>
          </div>
        </div>
      </div>

      {order.prescriptions?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center">
              <FileText size={12} className="text-[#05015A]" />
            </div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Prescriptions ({order.prescriptions.length})
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.prescriptions.map((p) => (
              <div
                key={p.prescription_id}
                className="flex items-center gap-2 p-2.5 bg-amber-50/30 rounded-lg border border-amber-100"
              >
                <FileText size={14} className="text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {p.original_name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {p.mime_type} · {(p.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsTab;
