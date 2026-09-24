// pharmacy-web/src/pages/marketplace-onboarding/components/UnifiedBranchMap.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/components/UnifiedBranchMap.jsx

import { useCallback, useRef, useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";
import { darkMapStyles } from "./MapStyles";

const MAP_CONTAINER = {
  width: "100%",
  height: "100%",
  borderRadius: "12px",
};

const MAP_OPTIONS = {
  styles: darkMapStyles,
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
};

const UnifiedBranchMap = ({
  branches,
  activeBranchId,
  onMarkerClick,
  onLocationUpdate,
  isLoaded,
  loadError,
}) => {
  const mapRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [reverseGeocodeError, setReverseGeocodeError] = useState(null);

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      fitBounds(map, branches);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [branches.length]
  );

  useEffect(() => {
    if (mapRef.current && branches.length > 0) {
      fitBounds(mapRef.current, branches);
    }
  }, [branches.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current || !activeBranchId) return;
    const active = branches.find((b) => b.branch_id === activeBranchId);
    if (!active) return;
    mapRef.current.panTo({ lat: active.latitude, lng: active.longitude });
    mapRef.current.setZoom(16);
  }, [activeBranchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkerDragEnd = useCallback(
    (branchId, e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setIsDragging(false);
      setIsReverseGeocoding(true);
      setReverseGeocodeError(null);

      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: newLat, lng: newLng } },
          (results, status) => {
            const branch = branches.find((b) => b.branch_id === branchId);
            if (status === "OK" && results?.[0]) {
              onLocationUpdate(branchId, {
                formatted_address: results[0].formatted_address,
                latitude: newLat,
                longitude: newLng,
              });
            } else {
              setReverseGeocodeError("Couldn't resolve address. Coordinates updated.");
              onLocationUpdate(branchId, {
                formatted_address: branch?.formatted_address || "",
                latitude: newLat,
                longitude: newLng,
              });
            }
            setIsReverseGeocoding(false);
          }
        );
      } catch {
        setIsReverseGeocoding(false);
        setReverseGeocodeError("Reverse geocode failed.");
      }
    },
    [branches, onLocationUpdate]
  );

  // ─── Empty ─────────────────────────────────────────────────────
  if (branches.length === 0) {
    return (
      <div className="h-[220px] rounded-xl border border-dashed border-white/10
        bg-white/[0.02] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          <MapPin size={14} className="text-white/15" />
        </div>
        <p className="text-[11px] text-white/30 font-medium">No locations yet</p>
        <p className="text-[10px] text-white/15">Set a location on any branch</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-[220px] rounded-xl bg-white/[0.03] border border-white/10
        flex items-center justify-center">
        <p className="text-[10px] text-white/25">Map unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[220px] rounded-xl bg-white/[0.03] border border-white/10
        flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="text-white/25 animate-spin" />
          <span className="text-xs text-white/25">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-white/10 h-[220px]">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER}
          center={{ lat: branches[0].latitude, lng: branches[0].longitude }}
          zoom={14}
          options={MAP_OPTIONS}
          onLoad={onMapLoad}
        >
          {branches.map((branch) => {
            const isActive = branch.branch_id === activeBranchId;
            return (
              <Marker
                key={branch.branch_id}
                position={{ lat: branch.latitude, lng: branch.longitude }}
                title={branch.branch_name}
                onClick={() => onMarkerClick(branch.branch_id)}
                opacity={isActive ? 1 : 0.45}
                draggable={isActive}
                onDragStart={() => {
                  setIsDragging(true);
                  setReverseGeocodeError(null);
                }}
                onDragEnd={(e) => handleMarkerDragEnd(branch.branch_id, e)}
              />
            );
          })}
        </GoogleMap>

        {activeBranchId && !isDragging && !isReverseGeocoding && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2
            px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm
            border border-white/10 pointer-events-none">
            <p className="text-[10px] text-white/50 whitespace-nowrap">
              Drag pin to adjust
            </p>
          </div>
        )}

        {isReverseGeocoding && (
          <div className="absolute inset-0 flex items-center justify-center
            bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-2.5 py-1.5
              bg-[#0d0a3a]/90 rounded-lg border border-white/10">
              <Loader2 size={12} className="text-white/50 animate-spin" />
              <span className="text-[10px] text-white/50">Updating...</span>
            </div>
          </div>
        )}
      </div>

      {reverseGeocodeError && (
        <p className="text-[10px] text-amber-400 px-1">{reverseGeocodeError}</p>
      )}

      {branches.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {branches.map((branch) => (
            <button
              key={branch.branch_id}
              type="button"
              onClick={() => onMarkerClick(branch.branch_id)}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded-md
                text-[10px] font-medium transition-all border
                ${branch.isActive
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:border-white/12"
                }
              `}
            >
              <span
                className={`w-1 h-1 rounded-full flex-shrink-0 ${
                  branch.isPersisted ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {branch.branch_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function fitBounds(map, branches) {
  if (branches.length === 1) {
    map.setCenter({ lat: branches[0].latitude, lng: branches[0].longitude });
    map.setZoom(15);
    return;
  }
  const bounds = new window.google.maps.LatLngBounds();
  branches.forEach((b) => bounds.extend({ lat: b.latitude, lng: b.longitude }));
  map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
}

export default UnifiedBranchMap;