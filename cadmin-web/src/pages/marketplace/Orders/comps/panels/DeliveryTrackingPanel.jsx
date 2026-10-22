// cadmin-web/src/pages/marketplace/Orders/comps/panels/DeliveryTrackingPanel.jsx (do not remove this comment)
import { useState, useEffect, useCallback, useRef } from "react";
import { Truck, Store, AlertCircle } from "lucide-react";
import {
  getAvailableRidersForOrder,
  assignRiderToOrder,
} from "../../../../../api/cadminDelivery";
import { useToast } from "../../../../../components/common/Toast";
import { useGoogleMaps } from "../../../../../hooks/useGoogleMaps";
import useMarketplaceSSE from "../hooks/useMarketplaceSSE";
import { haversineKm } from "./delivery/deliveryMapConstants";
import RiderMapView from "./delivery/RiderMapView";
import RiderAssignList from "./delivery/RiderAssignList";
import ActiveTrackingView from "./delivery/ActiveTrackingView";

// ─────────────────────────────────────────────
// MAIN TRACKING CONTAINER
// ─────────────────────────────────────────────

const DeliveryTrackingPanel = ({ order, onUpdated }) => {
  const toast = useToast();
  const { isLoaded, loadError } = useGoogleMaps();

  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("TEAM");
  const [forceReassign, setForceReassign] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);

  const pharmacyRef = useRef(null);

  // ── 1. Fetch ONCE on mount or when filter/search/reassign changes ──
  const fetchRiders = useCallback(async () => {
    if (order.fulfillment_type === "PICKUP") return;
    if (order.fulfillment_type === "SAME_DAY") return; // Batch-assigned, not individual
    setLoading(true);
    try {
      const res = await getAvailableRidersForOrder(order.order_id, {
        rider_type: typeFilter,
        search: searchQuery,
      });
      const data = res.data?.data;
      setRiders(data?.riders || []);
      pharmacyRef.current = data?.pharmacy || null;
    } catch {
      toast.error("Fetch Error", "Failed to retrieve available partners.");
    } finally {
      setLoading(false);
    }
  }, [order.order_id, order.fulfillment_type, searchQuery, typeFilter, toast]);

  useEffect(() => {
    if (order.fulfillment_type === "PICKUP") return;
    if (order.fulfillment_type === "SAME_DAY") return;
    if (
      (!order.delivery?.rider_id &&
        ["ACCEPTED", "READY_FOR_PICKUP"].includes(order.status)) ||
      forceReassign
    ) {
      fetchRiders();
    }
  }, [
    order.fulfillment_type,
    order.delivery?.rider_id,
    order.status,
    forceReassign,
    fetchRiders,
  ]);

  // ── 2. Real-time SSE updates (No polling!) ──
  const handleRiderAvailability = useCallback((payload) => {
    if (!payload?.rider_id) return;
    setRiders((prev) =>
      prev.map((r) =>
        r.rider_id === payload.rider_id
          ? { ...r, is_online: payload.is_online }
          : r,
      ),
    );
  }, []);

  const handleRiderLocation = useCallback((payload) => {
    if (!payload?.rider_id || !pharmacyRef.current) return;
    const pLat = pharmacyRef.current.latitude;
    const pLng = pharmacyRef.current.longitude;
    if (!pLat || !pLng) return;

    setRiders((prev) =>
      prev.map((r) => {
        if (r.rider_id !== payload.rider_id) return r;
        const newDist = haversineKm(payload.lat, payload.lng, pLat, pLng);
        return {
          ...r,
          current_lat: payload.lat,
          current_lng: payload.lng,
          distance_to_pharmacy_km: newDist,
          is_estimate: true,
        };
      }),
    );
  }, []);

  // ── Real-time delivery status updates ──────────────────────────────
  const handleDeliveryChanged = useCallback(
    (payload) => {
      if (!payload?.order_id || payload.order_id !== order.order_id) return;
      onUpdated();
    },
    [order.order_id, onUpdated],
  );

  // ── Real-time order status updates ─────────────────────────────────
  const handleStatusChanged = useCallback(
    (payload) => {
      if (!payload?.order_id || payload.order_id !== order.order_id) return;
      onUpdated();
    },
    [order.order_id, onUpdated],
  );

  useMarketplaceSSE({
    onRiderAvailability: handleRiderAvailability,
    onRiderLocation: handleRiderLocation,
    onDeliveryChanged: handleDeliveryChanged,
    onStatusChanged: handleStatusChanged,
    debounceMs: 1000,
  });

  const handleAssign = async (riderId, name) => {
    setAssigningId(riderId);
    try {
      await assignRiderToOrder(order.order_id, riderId);
      toast.success("Assigned", `${name} assigned to this delivery.`);
      setForceReassign(false);
      onUpdated();
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Assignment failed.",
      );
    } finally {
      setAssigningId(null);
    }
  };

  // ── Guard 0: Pickup orders — no rider assignment needed ──
  // FIX: removed phantom `order.customer_pickup_code` (never existed on
  // the CAdmin backend) and the duplicate OTP block that would have shown
  // the same secret twice. The only real code for a pickup order is
  // `delivery_otp` — the single code the customer shows the pharmacy.
  if (order.fulfillment_type === "PICKUP") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Store size={36} className="text-orange-400 mb-3" />
        <h3 className="text-sm font-bold text-gray-700">
          Pickup Order — No Delivery Partner
        </h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm px-6">
          This is a customer pickup order. No rider assignment is needed. The
          customer will collect their order directly from the pharmacy.
        </p>
        {order.delivery_otp && (
          <div className="mt-4 px-6 py-3 rounded-xl bg-orange-50 border border-orange-200">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              Customer Pickup Code
            </p>
            <p className="text-2xl font-extrabold text-orange-800 font-mono tracking-[0.3em] mt-1">
              {order.delivery_otp}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Guard 1: PLACED status ──
  if (order.status === "PLACED") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Store size={36} className="text-amber-400 mb-3" />
        <h3 className="text-sm font-bold text-gray-700">
          Awaiting Shop Acceptance
        </h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm px-6">
          The pharmacy must accept this order before a delivery partner can be
          assigned.
        </p>
      </div>
    );
  }

  // ── Guard 1b: Same Day — awaiting batch assignment ──
  if (order.fulfillment_type === "SAME_DAY" && !order.delivery?.rider_id) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Truck size={36} className="text-cyan-400 mb-3" />
        <h3 className="text-sm font-bold text-gray-700">
          Awaiting Batch Assignment
        </h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm px-6 leading-relaxed">
          This is a Same Day delivery order. It will be grouped with other Same
          Day orders and assigned to a team rider by the Cureli admin before end
          of day.
        </p>
        <div className="mt-4 px-5 py-2.5 rounded-xl bg-cyan-50 border border-cyan-200">
          <p className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
            Batch Assignment
          </p>
          <p className="text-[11px] text-cyan-600 mt-1 font-medium">
            Use the Orders table → filter by "Same Day" → select orders → Assign
            Batch
          </p>
        </div>
        
        {order.pickup_otp && (
          <div className="mt-4 px-6 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Pickup OTP (rider → pharmacy)
            </p>
            <p className="text-2xl font-extrabold text-amber-800 font-mono tracking-[0.3em] mt-1">
              {order.pickup_otp}
            </p>
          </div>
        )}
        {order.delivery_otp && (
          <div className="mt-3 px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Delivery OTP (rider → customer)
            </p>
            <p className="text-2xl font-extrabold text-emerald-800 font-mono tracking-[0.3em] mt-1">
              {order.delivery_otp}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Guard 2: Terminal status ──
  if (
    ["REJECTED", "CANCELLED"].includes(order.status) &&
    !order.delivery?.rider_id
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <AlertCircle size={36} className="text-red-400 mb-3" />
        <h3 className="text-sm font-bold text-gray-700">Order Terminated</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          This order was {order.status.toLowerCase()} — delivery is suspended.
        </p>
      </div>
    );
  }

  const hasAssignedRider = order.delivery?.rider_id && !forceReassign;

  // ── Active Tracking view (60/40 Split) ──
  if (hasAssignedRider) {
    return (
      <ActiveTrackingView
        order={order}
        onUpdated={onUpdated}
        toast={toast}
        isLoaded={isLoaded}
        loadError={loadError}
        onRequestReassign={() => setForceReassign(true)}
      />
    );
  }

  // ── Rider Assignment Split View (60/40 Split) ──
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(88vh-180px)]">
      {/* Left Side: 60% Interactive Map */}
      <div className="lg:col-span-3 h-full">
        <RiderMapView
          isLoaded={isLoaded}
          loadError={loadError}
          pharmacy={
            pharmacyRef.current || {
              shop_name: order.shop?.business_name,
              latitude: order.branch?.latitude,
              longitude: order.branch?.longitude,
            }
          }
          customerAddress={{
            latitude: order.delivery_address?.latitude,
            longitude: order.delivery_address?.longitude,
          }}
          riders={riders}
          selectedRider={selectedRider}
          onRiderSelect={setSelectedRider}
        />
      </div>

      {/* Right Side: 40% Rider List Column */}
      <div className="lg:col-span-2 h-full">
        <RiderAssignList
          riders={riders}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          onRiderSelect={setSelectedRider}
          selectedRider={selectedRider}
          onAssign={handleAssign}
          assigningId={assigningId}
          loading={loading}
          onRefresh={fetchRiders}
        />
      </div>
    </div>
  );
};

export default DeliveryTrackingPanel;
