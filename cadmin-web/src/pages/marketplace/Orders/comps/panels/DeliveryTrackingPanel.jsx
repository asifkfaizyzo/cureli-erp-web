// cadmin-web/src/pages/marketplace/Orders/comps/panels/DeliveryTrackingPanel.jsx (do not remove this comment)
import { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import {
  Truck,
  RefreshCw,
  Search,
  Loader2,
  Navigation,
  CheckCircle2,
  AlertCircle,
  User,
  Key,
  Compass,
  UserCheck,
  Store,
} from "lucide-react";
import {
  getAvailableRidersForOrder,
  assignRiderToOrder,
} from "../../../../../api/cadminDelivery";
import { useToast } from "../../../../../components/common/Toast";
import { useGoogleMaps } from "../../../../../hooks/useGoogleMaps";
import { lightMapStyle } from "../../../../../constants/mapStyle";
import useMarketplaceSSE from "../hooks/useMarketplaceSSE";

// ─────────────────────────────────────────────
// REUSABLE UI PRIMITIVES
// ─────────────────────────────────────────────

const SectionTitle = ({ icon: Icon, title, action = null }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-[#05015A]" />
      </div>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
        {title}
      </p>
    </div>
    {action}
  </div>
);

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm ${className}`}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────
// MAP CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────

const MAP_OPTIONS = {
  styles: lightMapStyle,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: "cooperative",
};

const PHARMACY_MARKER_SVG = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#05015A",
  fillOpacity: 1,
  strokeWeight: 1.5,
  strokeColor: "#FFFFFF",
  scale: 1.4,
  anchor: { x: 12, y: 22 },
};

const CUSTOMER_MARKER_SVG = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#6A20CD",
  fillOpacity: 1,
  strokeWeight: 1.5,
  strokeColor: "#FFFFFF",
  scale: 1.4,
  anchor: { x: 12, y: 22 },
};

// Pure SVG circle path — works consistently without depending on window.google at parse time
const CIRCLE_SVG_PATH = "M 0, 0 m -6, 0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0";

const RIDER_DOT_SVG = (isBusy, isSelected) => ({
  path: CIRCLE_SVG_PATH,
  fillColor: isSelected ? "#05015A" : isBusy ? "#F59E0B" : "#10B981",
  fillOpacity: 1,
  strokeWeight: isSelected ? 2.5 : 1.5,
  strokeColor: "#FFFFFF",
  scale: isSelected ? 1.4 : 1.1,
});

const ROUTE_LINE_OPTIONS = {
  strokeColor: "#6366F1",
  strokeOpacity: 0.8,
  strokeWeight: 3,
  icons: [
    {
      icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2 },
      offset: "0",
      repeat: "10px",
    },
  ],
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

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return (
    Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3 * 100) /
    100
  );
}

// ─────────────────────────────────────────────
// MAP VIEW (60% WIDTH)
// ─────────────────────────────────────────────

const RiderMapView = ({
  isLoaded,
  loadError,
  pharmacy,
  customerAddress,
  riders,
  selectedRider,
  onRiderSelect,
}) => {
  const mapRef = useRef(null);
  const [activeInfoWindowRider, setActiveInfoWindowRider] = useState(null);

  // Track if we have already fitted the map boundary constraints during this order lifecycle
  const hasFitBoundsRef = useRef(false);

  // If selecting a different order or changing pharmacy/customer locations, reset tracking flag
  useEffect(() => {
    hasFitBoundsRef.current = false;
  }, [
    pharmacy?.latitude,
    pharmacy?.longitude,
    customerAddress?.latitude,
    customerAddress?.longitude,
  ]);

  const getBounds = useCallback(() => {
    if (!window.google?.maps?.LatLngBounds) return null;
    const bounds = new window.google.maps.LatLngBounds();

    if (pharmacy?.latitude && pharmacy?.longitude) {
      bounds.extend({
        lat: Number(pharmacy.latitude),
        lng: Number(pharmacy.longitude),
      });
    }
    if (customerAddress?.latitude && customerAddress?.longitude) {
      bounds.extend({
        lat: Number(customerAddress.latitude),
        lng: Number(customerAddress.longitude),
      });
    }

    riders.forEach((rider) => {
      if (rider.current_lat && rider.current_lng && rider.is_online) {
        bounds.extend({
          lat: Number(rider.current_lat),
          lng: Number(rider.current_lng),
        });
      }
    });

    return bounds;
  }, [pharmacy, customerAddress, riders]);

  // Execute boundary auto-zoom ONCE. Do NOT let recurring GPS location ticks snap the user's viewport constraints!
  useEffect(() => {
    if (mapRef.current && isLoaded && !hasFitBoundsRef.current) {
      const bounds = getBounds();
      if (bounds && !bounds.isEmpty()) {
        console.log(
          "🗺️ [Map Engine] Constraints initialized. Adjusting map boundaries.",
        );
        mapRef.current.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        });
        hasFitBoundsRef.current = true; // Lock boundaries. Allow smooth marker panning on following ticks
      }
    }
  }, [getBounds, isLoaded]);

  useEffect(() => {
    if (
      mapRef.current &&
      selectedRider?.current_lat &&
      selectedRider?.current_lng
    ) {
      console.log(
        `🗺️ [Map Engine] Panning camera to active rider tracking target: ${selectedRider.rider_id}`,
      );
      mapRef.current.panTo({
        lat: Number(selectedRider.current_lat),
        lng: Number(selectedRider.current_lng),
      });
      mapRef.current.setZoom(15);
    }
  }, [selectedRider]);

  if (loadError) {
    return (
      <div className="h-full w-full rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={28} className="text-red-500 mb-2" />
        <p className="text-xs font-semibold text-gray-700">Map Loading Error</p>
        <p className="text-[10px] text-gray-400 mt-0.5 max-w-xs">
          {loadError.message}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={24} className="animate-spin text-[#05015A] mb-2" />
        <p className="text-xs text-gray-500 font-semibold">
          Initializing Logistics Map...
        </p>
      </div>
    );
  }

  const defaultCenter = pharmacy?.latitude
    ? { lat: Number(pharmacy.latitude), lng: Number(pharmacy.longitude) }
    : { lat: 13.0827, lng: 80.2707 };

  const polylinePath =
    pharmacy?.latitude && customerAddress?.latitude
      ? [
          { lat: Number(pharmacy.latitude), lng: Number(pharmacy.longitude) },
          {
            lat: Number(customerAddress.latitude),
            lng: Number(customerAddress.longitude),
          },
        ]
      : [];

  return (
    <div className="h-full w-full relative rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm bg-gray-100 min-h-[350px] lg:min-h-0">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={defaultCenter}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {pharmacy?.latitude && (
          <Marker
            position={{
              lat: Number(pharmacy.latitude),
              lng: Number(pharmacy.longitude),
            }}
            icon={PHARMACY_MARKER_SVG}
            title={pharmacy.shop_name || "Pharmacy"}
          />
        )}

        {customerAddress?.latitude && (
          <Marker
            position={{
              lat: Number(customerAddress.latitude),
              lng: Number(customerAddress.longitude),
            }}
            icon={CUSTOMER_MARKER_SVG}
            title="Destination"
          />
        )}

        {polylinePath.length > 0 && (
          <Polyline path={polylinePath} options={ROUTE_LINE_OPTIONS} />
        )}

        {riders
          .filter((r) => r.current_lat && r.current_lng && r.is_online)
          .map((rider) => {
            const isSelected = selectedRider?.rider_id === rider.rider_id;
            return (
              <Marker
                key={rider.rider_id}
                position={{
                  lat: Number(rider.current_lat),
                  lng: Number(rider.current_lng),
                }}
                icon={RIDER_DOT_SVG(rider.has_active_delivery, isSelected)}
                onClick={() => {
                  onRiderSelect(rider);
                  setActiveInfoWindowRider(rider);
                }}
              />
            );
          })}

        {activeInfoWindowRider && (
          <InfoWindow
            position={{
              lat: Number(activeInfoWindowRider.current_lat),
              lng: Number(activeInfoWindowRider.current_lng),
            }}
            onCloseClick={() => setActiveInfoWindowRider(null)}
          >
            <div className="p-2 font-poppins min-w-[160px] text-slate-800">
              <h5 className="text-[11px] font-bold">
                {activeInfoWindowRider.full_name}
              </h5>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                {activeInfoWindowRider.phone}
              </p>
              <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-100">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeInfoWindowRider.has_active_delivery
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-600">
                  {activeInfoWindowRider.has_active_delivery ? "Busy" : "Ready"}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map Legend HUD */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-xl p-2.5 shadow-sm border border-gray-100 text-[10px] space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#05015A] border border-white flex-shrink-0" />
          <span className="font-bold text-gray-700">Pharmacy Location</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#6A20CD] border border-white flex-shrink-0" />
          <span className="font-bold text-gray-700">Patient Destination</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10B981] border border-white flex-shrink-0 animate-pulse" />
          <span className="font-bold text-gray-700">Online & Free</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-white flex-shrink-0" />
          <span className="font-bold text-gray-700">Assigned / Busy</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// RIDER LIST (40% WIDTH)
// ─────────────────────────────────────────────

const RiderAssignList = ({
  riders,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onRiderSelect,
  selectedRider,
  onAssign,
  assigningId,
  loading,
  onRefresh,
}) => {
  const listContainerRef = useRef(null);

  useEffect(() => {
    if (selectedRider && listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector(
        `[data-rider-id="${selectedRider.rider_id}"]`,
      );
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedRider]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-sm flex flex-col h-full min-h-[350px] lg:min-h-0">
      <SectionTitle
        icon={Truck}
        title="Assign Partner"
        action={
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh Rider List"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />

      {/* Search & Filter Header */}
      <div className="space-y-2 mt-1 mb-4 flex-shrink-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search partners by name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/30 focus:ring-2 focus:ring-[#05015A]/10 transition-all font-semibold"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTypeFilter("TEAM")}
            className={`flex-1 py-1.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all text-center ${
              typeFilter === "TEAM"
                ? "bg-white text-[#05015A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Fixed (Team)
          </button>
          <button
            onClick={() => setTypeFilter("INDEPENDENT")}
            className={`flex-1 py-1.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all text-center ${
              typeFilter === "INDEPENDENT"
                ? "bg-white text-[#05015A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Independent
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#05015A] mb-2" />
            <p className="text-xs text-gray-400 font-medium">
              Scanning logistics grid...
            </p>
          </div>
        ) : riders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
            <Search size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">
              No active drivers found
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Check spelling or online statuses.
            </p>
          </div>
        ) : (
          riders.map((rider) => {
            const isBusy = rider.has_active_delivery || !rider.is_online;
            const isSelected = selectedRider?.rider_id === rider.rider_id;

            return (
              <div
                key={rider.rider_id}
                data-rider-id={rider.rider_id}
                onClick={() => onRiderSelect(rider)}
                className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  isBusy
                    ? "bg-gray-50/50 border-gray-100 opacity-60 pointer-events-none"
                    : isSelected
                      ? "bg-[#05015A]/[0.02] border-[#05015A]/40 shadow-sm"
                      : "bg-white border-gray-100 hover:border-[#05015A]/25"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-gray-800 truncate">
                      {rider.full_name}
                    </h4>
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        rider.is_online
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {rider.phone}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2 font-semibold">
                    {rider.distance_to_pharmacy_km != null ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px]">
                        <Navigation size={9} />
                        {rider.is_estimate ? "~" : ""}
                        {rider.distance_to_pharmacy_km} km
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">
                        GPS missing
                      </span>
                    )}

                    {rider.has_active_delivery ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] uppercase tracking-wider">
                        Busy
                      </span>
                    ) : (
                      rider.is_online && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-wider">
                          Ready
                        </span>
                      )
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign(rider.rider_id, rider.full_name);
                  }}
                  disabled={isBusy || assigningId != null}
                  className="flex-shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#05015A] text-white hover:bg-[#05015A]/90 disabled:bg-gray-100 disabled:text-gray-400 inline-flex items-center gap-1 transition-all"
                >
                  {assigningId === rider.rider_id ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Truck size={10} />
                  )}
                  Assign
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

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
  }, [order.order_id, searchQuery, typeFilter, toast]);

  useEffect(() => {
    if (
      (!order.delivery?.rider_id &&
        ["ACCEPTED", "READY_FOR_PICKUP"].includes(order.status)) ||
      forceReassign
    ) {
      fetchRiders();
    }
  }, [order.delivery?.rider_id, order.status, forceReassign, fetchRiders]);

  // ── 2. Real-time SSE updates (No polling!) ──
  const handleRiderAvailability = useCallback((payload) => {
    if (!payload?.rider_id) return;
    console.log(`👤 [DeliveryPanel] Rider availability changed:`, payload);
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

    console.log(
      `📍 [DeliveryPanel] Rider GPS tick received: ${payload.rider_id}`,
    );

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
      console.log(`📦 [DeliveryPanel] Delivery status changed:`, payload);
      // Trigger parent to re-fetch order data so milestones update
      onUpdated();
    },
    [order.order_id, onUpdated],
  );

  // ── Real-time order status updates ─────────────────────────────────
  const handleStatusChanged = useCallback(
    (payload) => {
      if (!payload?.order_id || payload.order_id !== order.order_id) return;
      console.log(`📋 [DeliveryPanel] Order status changed:`, payload);
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
    const delivery = order.delivery;
    const milestones = [
      { key: "RIDER_NOTIFIED", label: "Rider Notified" },
      { key: "ACCEPTED", label: "Accepted" },
      { key: "ARRIVED_AT_PHARMACY", label: "Arrived at Shop" },
      { key: "PICKED_UP", label: "Picked Up" },
      { key: "DELIVERED", label: "Delivered" },
    ];

    const activeIndex = (() => {
      const s = delivery.status;
      if (s === "PENDING_ASSIGNMENT") return -1;
      if (s === "RIDER_NOTIFIED") return 0;
      if (s === "ACCEPTED") return 1;
      if (s === "ARRIVED_AT_PHARMACY") return 2;
      if (["PICKED_UP", "EN_ROUTE"].includes(s)) return 3;
      if (["ARRIVED_AT_CUSTOMER", "DELIVERED"].includes(s)) return 4;
      return 0;
    })();

    const activeRidersArray = delivery.rider
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
          <Card className="border-l-4 border-l-[#05015A]">
            <SectionTitle icon={UserCheck} title="Assigned Rider" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#05015A]/10 flex items-center justify-center">
                  <User size={18} className="text-[#05015A]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">
                    {delivery.rider?.full_name || "Driver"}
                  </h4>
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
                {delivery.total_rider_earning != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">
                      Rider Earning
                    </span>
                    <span className="text-emerald-600">
                      ₹{delivery.total_rider_earning}
                    </span>
                  </div>
                )}
              </div>

              {[
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
                    onClick={() => setForceReassign(true)}
                    className="flex-1 py-2 border border-dashed border-gray-200 hover:border-[#05015A]/30 text-[11px] font-bold text-gray-600 hover:text-[#05015A] rounded-lg transition-all"
                  >
                    Reassign
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Unassign ${delivery.rider?.full_name || "rider"}?`,
                        )
                      )
                        return;
                      try {
                        const { unassignRiderFromOrder } =
                          await import("../../../../../api/cadminDelivery");
                        await unassignRiderFromOrder(order.order_id);
                        toast.success(
                          "Unassigned",
                          "Rider removed from delivery.",
                        );
                        onUpdated();
                      } catch (err) {
                        toast.error(
                          "Failed",
                          err.response?.data?.message || "Could not unassign.",
                        );
                      }
                    }}
                    className="flex-1 py-2 border border-dashed border-red-200 hover:border-red-400 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-all"
                  >
                    Unassign
                  </button>
                </div>
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
                {milestones.map((step, idx) => {
                  const completed = idx <= activeIndex;
                  const active = idx === activeIndex;
                  return (
                    <div
                      key={step.key}
                      className="relative flex items-start gap-4"
                    >
                      {idx < milestones.length - 1 && (
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
