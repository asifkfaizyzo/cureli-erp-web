// cadmin-web/src/pages/marketplace/Orders/comps/panels/delivery/RiderMapView.jsx (do not remove this comment)
import { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import { AlertCircle, Loader2, Coins } from "lucide-react";
import {
  MAP_OPTIONS,
  PHARMACY_MARKER_SVG,
  CUSTOMER_MARKER_SVG,
  RIDER_DOT_SVG,
  ROUTE_LINE_OPTIONS,
} from "./deliveryMapConstants";

// ─────────────────────────────────────────────
// MAP VIEW (60% WIDTH) — used both in Rider Assignment and Active Tracking
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
  const hasFitBoundsRef = useRef(false);

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

  useEffect(() => {
    if (mapRef.current && isLoaded && !hasFitBoundsRef.current) {
      const bounds = getBounds();
      if (bounds && !bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        });
        hasFitBoundsRef.current = true;
      }
    }
  }, [getBounds, isLoaded]);

  useEffect(() => {
    if (
      mapRef.current &&
      selectedRider?.current_lat &&
      selectedRider?.current_lng
    ) {
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

              {activeInfoWindowRider.rider_type === "INDEPENDENT" &&
                activeInfoWindowRider.estimated_earning && (
                  <p className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <Coins size={10} />₹
                    {activeInfoWindowRider.estimated_earning.total_earning.toFixed(
                      2,
                    )}{" "}
                    est. pay
                  </p>
                )}

              <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-100">
                {/* ── FIX: dot color classes were background-shade (50) instead of solid (500) ── */}
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

export default RiderMapView;