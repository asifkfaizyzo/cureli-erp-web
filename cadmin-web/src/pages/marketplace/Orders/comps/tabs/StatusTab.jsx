// cadmin-web/src/pages/marketplace/Orders/comps/tabs/StatusTab.jsx (do not remove this comment)
import { Clock, Truck, ShieldCheck } from "lucide-react";
import StatusUpdateBox from "../panels/StatusUpdateBox";
import PaymentStatusBox from "../panels/PaymentStatusBox";

const STATUS_CONFIG = {
  PLACED: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  ACCEPTED: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  READY_FOR_PICKUP: {
    dot: "bg-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
  },
  COMPLETED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  REJECTED: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
  CANCELLED: { dot: "bg-gray-400", text: "text-gray-700", bg: "bg-gray-50" },
};

const fmtTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtAmount = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center flex-shrink-0">
      <Icon size={12} className="text-[#05015A]" />
    </div>
    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
      {title}
    </p>
  </div>
);

const StatusTab = ({ order, onUpdated }) => {
  const delivery = order.delivery;
  const hasDeliveryEarnings =
    delivery &&
    (delivery.total_rider_earning != null ||
      delivery.pickup_fee != null ||
      delivery.drop_fee != null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Column 1: Order Status Control */}
        <div className="xl:col-span-1">
          <StatusUpdateBox order={order} onUpdated={onUpdated} />
        </div>

        {/* Column 2: Payment Status Control */}
        <div className="xl:col-span-1">
          <PaymentStatusBox order={order} onUpdated={onUpdated} />
        </div>

        {/* Column 3: Logistics Fee Snapshot / Info */}
        <div className="xl:col-span-1">
          <Card>
            <SectionTitle icon={Truck} title="Logistics & Payout Snapshot" />
            {!delivery ? (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400 font-medium">
                  No delivery partner assigned yet
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Earnings and leg metrics will populate once assigned
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Delivery Status</span>
                  <span className="font-bold text-[#05015A]">
                    {delivery.status?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Assigned Partner</span>
                  <span className="font-semibold text-gray-800">
                    {delivery.rider?.full_name || "—"}
                  </span>
                </div>
                {delivery.total_distance_km != null && (
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Total Route Distance</span>
                    <span className="font-semibold text-gray-800">
                      {delivery.total_distance_km} km
                    </span>
                  </div>
                )}
                {hasDeliveryEarnings && (
                  <>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Pickup Leg Fee</span>
                      <span className="font-semibold text-gray-700">
                        {fmtAmount(delivery.pickup_fee)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Drop Leg Fee</span>
                      <span className="font-semibold text-gray-700">
                        {fmtAmount(delivery.drop_fee)}
                      </span>
                    </div>
                    {delivery.surge_fee > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Surge Increment</span>
                        <span className="font-semibold text-amber-600">
                          +{fmtAmount(delivery.surge_fee)}
                        </span>
                      </div>
                    )}
                    {delivery.floor_topup_fee > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">
                          Floor Guarantee Top-Up
                        </span>
                        <span className="font-semibold text-indigo-600">
                          +{fmtAmount(delivery.floor_topup_fee)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 pt-2 border-t-2 border-gray-100">
                      <span className="font-bold text-gray-900">
                        Total Partner Payout
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {fmtAmount(delivery.total_rider_earning)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Row 2: Status History Audit Timeline */}
      <Card>
        <SectionTitle icon={Clock} title="Order Audit Timeline" />
        {!order.status_history || order.status_history.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center font-medium">
            No history recorded yet
          </p>
        ) : (
          <div className="relative pl-2 pt-2 space-y-4">
            {order.status_history.map((h, idx) => {
              const cfg = STATUS_CONFIG[h.to_status] || {
                dot: "bg-gray-400",
                text: "text-gray-700",
                bg: "bg-gray-50",
              };

              return (
                <div
                  key={h.history_id || idx}
                  className="flex items-start gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${cfg.dot}`}
                    />
                    {idx < order.status_history.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[22px]" />
                    )}
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${cfg.text}`}>
                        {h.to_status?.replace(/_/g, " ")}
                      </span>
                      {h.from_status && (
                        <span className="text-[10px] text-gray-400">
                          (from {h.from_status.replace(/_/g, " ")})
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-medium">
                        by{" "}
                        {h.changed_by_type
                          ? h.changed_by_type.charAt(0).toUpperCase() +
                            h.changed_by_type.slice(1)
                          : "System"}
                      </span>
                    </div>

                    {h.reason && (
                      <p className="text-[11px] text-gray-600 mt-0.5 font-medium bg-gray-50 rounded px-2 py-0.5 inline-block">
                        {h.reason}
                      </p>
                    )}

                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                      {fmtTime(h.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StatusTab;
