// cadmin-web/src/pages/marketplace/Orders/comps/panels/delivery/ActiveTrackingView.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import {
  Truck,
  AlertCircle,
  User,
  Key,
  Compass,
  UserCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  getBatchOrders,
  unassignRiderFromOrder,
} from "../../../../../../api/cadminDelivery";
import { SectionTitle, Card, fmtTime } from "./deliveryMapConstants";
import RiderMapView from "./RiderMapView";

// ─────────────────────────────────────────────
// SAME DAY BATCH PANEL (sub-component, only used here)
// ─────────────────────────────────────────────

const SameDayBatchPanel = ({ batchGroupId, currentOrderId }) => {
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBatchOrders(batchGroupId)
      .then((res) => {
        if (!cancelled) setBatchData(res.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setBatchData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [batchGroupId]);

  if (loading) {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center gap-2">
        <Loader2 size={12} className="text-cyan-600 animate-spin" />
        <span className="text-[10px] text-cyan-700 font-medium">
          Loading batch...
        </span>
      </div>
    );
  }

  if (!batchData) return null;

  return (
    <div className="mt-2 rounded-lg bg-cyan-50 border border-cyan-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-cyan-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Truck size={12} className="text-cyan-600 flex-shrink-0" />
          <span className="text-[10px] font-bold text-cyan-800">
            Same Day Batch · {batchData.order_count} orders
          </span>
        </div>
        <span className="text-[9px] text-cyan-600 font-mono">
          {batchGroupId.slice(0, 12)}…
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-cyan-200 pt-2">
          {batchData.rider_name && (
            <p className="text-[10px] text-cyan-700 font-semibold mb-2">
              Rider: {batchData.rider_name} ({batchData.rider_phone})
            </p>
          )}
          {batchData.orders.map((o) => {
            const isCurrent = o.order_id === currentOrderId;
            return (
              <div
                key={o.delivery_id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[10px] ${
                  isCurrent
                    ? "bg-cyan-200/50 font-bold text-cyan-900"
                    : "bg-white/60 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold flex-shrink-0">
                    {o.order_number}
                  </span>
                  <span className="text-gray-500 truncate">
                    {o.customer_name}
                  </span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex-shrink-0 ${
                    o.delivery_status === "DELIVERED"
                      ? "bg-emerald-100 text-emerald-700"
                      : o.delivery_status === "PICKED_UP" ||
                          o.delivery_status === "EN_ROUTE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {o.delivery_status.replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// ACTIVE TRACKING VIEW — 60/40 Map + Rider/Milestones Split
// ─────────────────────────────────────────────

const MILESTONES = [
  { key: "RIDER_NOTIFIED", label: "Rider Notified" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "ARRIVED_AT_PHARMACY", label: "Arrived at Shop" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "DELIVERED", label: "Delivered" },
];

function computeActiveIndex(status) {
  if (status === "PENDING_ASSIGNMENT") return -1;
  if (status === "RIDER_NOTIFIED") return 0;
  if (status === "ACCEPTED") return 1;
  if (status === "ARRIVED_AT_PHARMACY") return 2;
  if (["PICKED_UP", "EN_ROUTE"].includes(status)) return 3;
  if (["ARRIVED_AT_CUSTOMER", "DELIVERED"].includes(status)) return 4;
  return 0;
}

const ActiveTrackingView = ({
  order,
  onUpdated,
  toast,
  isLoaded,
  loadError,
  onRequestReassign,
}) => {
  const delivery = order.delivery;
  const isSameDay = order.fulfillment_type === "SAME_DAY";
  const activeIndex = computeActiveIndex(delivery.status);

  // Same Day: no live rider location on map (customer doesn't see it either)
  const activeRidersArray =
    !isSameDay && delivery.rider
      ? [
          {
            rider_id: delivery.rider_id,
            full_name: delivery.rider.full_name,
            phone: delivery.rider.phone,
            current_lat: delivery.drop_lat,
            current_lng: delivery.drop_lng,
            is_online: true,
          },
        ]
      : [];

  const handleUnassign = async () => {
    if (
      !window.confirm(`Unassign ${delivery.rider?.full_name || "rider"}?`)
    )
      return;
    try {
      await unassignRiderFromOrder(order.order_id);
      toast.success("Unassigned", "Rider removed from delivery.");
      onUpdated();
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Could not unassign.",
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(88vh-180px)]">
      {/* Left Side: 60% Map */}
      <div className="lg:col-span-3 h-full">
        <RiderMapView
          isLoaded={isLoaded}
          loadError={loadError}
          pharmacy={{
            shop_name: order.shop?.business_name,
            latitude: delivery.pickup_lat,
            longitude: delivery.pickup_lng,
          }}
          customerAddress={{
            latitude: delivery.drop_lat,
            longitude: delivery.drop_lng,
          }}
          riders={activeRidersArray}
          selectedRider={activeRidersArray[0]}
          onRiderSelect={() => {}}
        />
      </div>

      {/* Right Side: 40% Control & Milestones */}
      <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-1 h-full">
        {delivery.status === "RIDER_NOTIFIED" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 animate-pulse flex items-start gap-2.5">
            <AlertCircle
              className="text-amber-600 flex-shrink-0 mt-0.5"
              size={16}
            />
            <div>
              <h5 className="text-xs font-bold text-amber-900">
                Pending Partner Acceptance
              </h5>
              <p className="text-[10px] text-amber-700 font-semibold mt-0.5 leading-normal">
                An alert notification has been sent to{" "}
                {delivery.rider?.full_name || "the partner"}. They have not
                accepted the request yet. This screen will auto-update when
                they respond or if the request times out.
              </p>
            </div>
          </div>
        )}

        <Card className="border-l-4 border-l-[#05015A]">
          <SectionTitle icon={UserCheck} title="Assigned Rider" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  delivery.status === "RIDER_NOTIFIED"
                    ? "bg-amber-100 animate-pulse"
                    : "bg-[#05015A]/10"
                }`}
              >
                <User
                  size={18}
                  className={
                    delivery.status === "RIDER_NOTIFIED"
                      ? "text-amber-600 animate-pulse"
                      : "text-[#05015A]"
                  }
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-gray-800">
                    {delivery.rider?.full_name || "Driver"}
                  </h4>
                  {delivery.status === "RIDER_NOTIFIED" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 rounded animate-pulse">
                      Awaiting Accept
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {delivery.rider?.phone || "—"}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] font-semibold text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Type</span>
                <span>
                  {delivery.rider?.rider_type === "TEAM"
                    ? "Salary Team"
                    : "Independent"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Connection</span>
                <span
                  className={
                    delivery.rider?.is_online
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }
                >
                  {delivery.rider?.is_online ? "Online" : "Offline"}
                </span>
              </div>
              {delivery.total_distance_km != null && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">
                    Total Route
                  </span>
                  <span className="text-[#05015A]">
                    {delivery.total_distance_km} km
                  </span>
                </div>
              )}
              {delivery.total_rider_earning != null &&
                delivery.rider?.rider_type !== "TEAM" && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">
                      Rider Base Pay
                    </span>
                    <span className="text-emerald-600">
                      ₹{delivery.total_rider_earning}
                    </span>
                  </div>
                )}
              {isSameDay && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Rider Pay</span>
                  <span className="text-cyan-600 text-[10px] font-bold">
                    Fixed Salary (Team)
                  </span>
                </div>
              )}
              {delivery.tip_amount != null &&
                Number(delivery.tip_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">
                      Customer Tip
                    </span>
                    <span className="text-emerald-600">
                      + ₹{delivery.tip_amount}
                    </span>
                  </div>
                )}
            </div>

            {/* Reassign/Unassign — hidden for Same Day (batch-level operation) */}
            {order.fulfillment_type !== "SAME_DAY" &&
              [
                "ACCEPTED",
                "ARRIVED_AT_PHARMACY",
                "PENDING_ASSIGNMENT",
                "RIDER_NOTIFIED",
                "PICKED_UP",
                "EN_ROUTE",
                "ARRIVED_AT_CUSTOMER",
              ].includes(delivery.status) && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={onRequestReassign}
                    className="flex-1 py-2 border border-dashed border-gray-200 hover:border-[#05015A]/30 text-[11px] font-bold text-gray-600 hover:text-[#05015A] rounded-lg transition-all"
                  >
                    Reassign
                  </button>
                  <button
                    onClick={handleUnassign}
                    className="flex-1 py-2 border border-dashed border-red-200 hover:border-red-400 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-all"
                  >
                    Unassign
                  </button>
                </div>
              )}

            {/* Same Day batch info banner + order list */}
            {isSameDay && delivery.batch_group_id && (
              <SameDayBatchPanel
                batchGroupId={delivery.batch_group_id}
                currentOrderId={order.order_id}
              />
            )}
          </div>
        </Card>

        <Card className="bg-amber-50/20 border-amber-100">
          <SectionTitle icon={Key} title="Secure OTP Verification" />
          <p className="text-[11px] text-amber-700/80 leading-normal mb-3 font-semibold">
            Manual override PINs for connectivity issues.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-2.5 border border-amber-100 text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Pickup (Shop)
              </p>
              <p className="text-lg font-extrabold text-amber-800 font-mono mt-1 tracking-widest">
                {order.pickup_otp || "—"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-2.5 border border-amber-100 text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Delivery (User)
              </p>
              <p className="text-lg font-extrabold text-emerald-800 font-mono mt-1 tracking-widest">
                {order.delivery_otp || "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <SectionTitle icon={Compass} title="Live Tracking Milestones" />
            <div className="relative mt-4 pl-4 space-y-5">
              {MILESTONES.map((step, idx) => {
                const completed = idx <= activeIndex;
                const active = idx === activeIndex;
                return (
                  <div
                    key={step.key}
                    className="relative flex items-start gap-4"
                  >
                    {idx < MILESTONES.length - 1 && (
                      <div
                        className={`absolute left-3 top-6 w-0.5 h-11 -translate-x-1/2 ${
                          idx < activeIndex ? "bg-emerald-500" : "bg-gray-100"
                        }`}
                      />
                    )}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 border transition-all ${
                        completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : active
                            ? "bg-white border-[#05015A] text-[#05015A]"
                            : "bg-white border-gray-200 text-gray-300"
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <span className="text-[10px] font-bold">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="pt-0.5">
                      <h5
                        className={`text-xs font-bold ${
                          completed ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                        {idx === 0 &&
                          delivery.assigned_at &&
                          `Assigned: ${fmtTime(delivery.assigned_at)}`}
                        {idx === 1 &&
                          delivery.accepted_at &&
                          `Accepted: ${fmtTime(delivery.accepted_at)}`}
                        {idx === 2 &&
                          delivery.arrived_at_pharmacy_at &&
                          `Arrived: ${fmtTime(delivery.arrived_at_pharmacy_at)}`}
                        {idx === 3 &&
                          delivery.picked_up_at &&
                          `Picked up: ${fmtTime(delivery.picked_up_at)}`}
                        {idx === 4 &&
                          delivery.delivered_at &&
                          `Delivered: ${fmtTime(delivery.delivered_at)}`}
                        {!completed &&
                          idx === 3 &&
                          order.status !== "READY_FOR_PICKUP" && (
                            <span className="text-amber-600">
                              Awaiting shop READY FOR PICKUP
                            </span>
                          )}
                        {!completed &&
                          idx === 3 &&
                          order.status === "READY_FOR_PICKUP" && (
                            <span className="text-violet-600">
                              Shop ready! Awaiting rider pickup
                            </span>
                          )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-semibold">
            <span>
              Delivery ID:{" "}
              <span className="font-mono">{delivery.delivery_id}</span>
            </span>
            <span>Attempts: {delivery.assignment_attempts}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ActiveTrackingView;