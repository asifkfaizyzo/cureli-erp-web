// cadmin-web/src/pages/marketplace/Shops/comps/BranchMarketplaceModal.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/comps/BranchMarketplaceModal.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import {
  X,
  Building2,
  MapPin,
  Clock,
  Phone,
  ShoppingBag,
  Truck,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldOff,
  ShieldCheck,
  Check,
  Shield,
  XCircle,
  Image,
  Upload,
} from "lucide-react";
import {
  searchPlaces,
  getPlaceDetails,
  updateBranchMarketplaceConfig,
  blockMarketplaceBranch,
  uploadMarketplaceAsset,
} from "../../../../api/cadminMarketplaceShops";
import { resolveFileUrl } from "../../../../utils/resolveFileUrl";

// ── Map styles ─────────────────────────────────────────────────
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

const MAP_OPTIONS = {
  styles: MAP_STYLES,
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "cooperative",
  clickableIcons: false,
};

const MAP_CONTAINER = { width: "100%", height: "100%" };

// ── Helpers ────────────────────────────────────────────────────
const isLinked = (branch) => !!branch.marketplaceSettings;

function validateForm(data) {
  const errors = {};
  if (!data.marketplace_enabled) return errors;
  if (!data.latitude || !data.longitude || !data.google_place_id) {
    errors.location = "Select a location from search results";
  }
  if (!data.pickup_enabled && !data.delivery_enabled) {
    errors.fulfillment = "Enable at least one: pickup or delivery";
  }
  if (!data.is_24_hours) {
    if (!data.opening_time) errors.opening_time = "Required";
    if (!data.closing_time) errors.closing_time = "Required";
  }
  return errors;
}

function completionCount(form) {
  if (!form.marketplace_enabled) return { done: 0, total: 0 };
  let done = 0;
  const total = 4;
  if (form.latitude && form.longitude && form.google_place_id) done++;
  if (form.pickup_enabled || form.delivery_enabled) done++;
  if (form.is_24_hours || (form.opening_time && form.closing_time)) done++;
  done++;
  return { done, total };
}

// ── Section ────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, required, done, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      <Icon size={12} className="text-gray-400" />
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        {title}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      {done && (
        <Check
          size={11}
          className="text-emerald-500 ml-auto flex-shrink-0"
          strokeWidth={3}
        />
      )}
    </div>
    {children}
  </div>
);

// ── Fulfillment chip ───────────────────────────────────────────
const ToggleChip = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold
      flex items-center justify-center gap-2 transition-all
      ${
        active
          ? "bg-[#05015A]/[0.06] border-[#05015A]/20 text-[#05015A]"
          : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
      }`}
  >
    <Icon size={13} />
    {label}
    {active && <Check size={10} strokeWidth={3} />}
  </button>
);

// ── Slim toggle ────────────────────────────────────────────────
const SlimToggle = ({ checked, onChange, label, disabled = false }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{ height: "18px", width: "32px" }}
      className={`relative inline-flex items-center rounded-full
        transition-colors flex-shrink-0 ml-3
        ${checked ? "bg-[#05015A]" : "bg-gray-200"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full bg-white shadow
          transform transition-transform
          ${checked ? "translate-x-3.5" : "translate-x-0.5"}
        `}
      />
    </button>
  </div>
);

// ── Places search ──────────────────────────────────────────────
const PlacesSearchInput = ({ value, onChange, onSelect }) => {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlaces(val.trim());
        setResults(res.data?.data || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelect = async (prediction) => {
    setOpen(false);
    setQuery(prediction.description);
    setFetchingDetail(true);
    try {
      const res = await getPlaceDetails(prediction.place_id);
      const detail = res.data?.data;
      if (detail) onSelect(detail);
    } catch {
      // ignore
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange("");
    onSelect({
      latitude: null,
      longitude: null,
      place_id: null,
      formatted_address: "",
    });
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        {fetchingDetail ? (
          <Loader2
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2
              animate-spin text-gray-400"
          />
        ) : (
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search location on Google Maps..."
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200
            rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
            focus:border-[#05015A]/40 bg-white transition-all
            text-gray-800 placeholder-gray-300"
        />
        {searching && (
          <Loader2
            size={13}
            className="absolute right-8 top-1/2 -translate-y-1/2
              animate-spin text-gray-400"
          />
        )}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2
              text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-1 left-0 right-0 bg-white border
            border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full px-3 py-2.5 text-left hover:bg-gray-50
                transition-colors border-b border-gray-50 last:border-0
                flex items-start gap-2.5"
            >
              <MapPin
                size={12}
                className="text-gray-300 mt-0.5 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {r.main_text}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {r.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Draggable map ──────────────────────────────────────────────
const DraggableMap = ({
  latitude,
  longitude,
  onLocationUpdate,
  isLoaded,
  loadError,
}) => {
  const mapRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const center = useMemo(
    () => ({ lat: Number(latitude), lng: Number(longitude) }),
    [latitude, longitude]
  );

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleIdle = useCallback(() => {
    if (!mapRef.current) return;
    const newCenter = mapRef.current.getCenter();
    if (!newCenter) return;

    const newLat = newCenter.lat();
    const newLng = newCenter.lng();

    if (
      Math.abs(newLat - Number(latitude)) < 0.000001 &&
      Math.abs(newLng - Number(longitude)) < 0.000001
    ) {
      setIsPanning(false);
      return;
    }

    setIsPanning(false);
    setIsReverseGeocoding(true);

    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: newLat, lng: newLng } },
        (results, status) => {
          const address =
            status === "OK" && results?.[0]
              ? results[0].formatted_address
              : null;
          onLocationUpdate({
            latitude: newLat,
            longitude: newLng,
            formatted_address: address,
          });
          setIsReverseGeocoding(false);
        }
      );
    } catch {
      onLocationUpdate({
        latitude: newLat,
        longitude: newLng,
        formatted_address: null,
      });
      setIsReverseGeocoding(false);
    }
  }, [latitude, longitude, onLocationUpdate]);

  if (loadError) {
    return (
      <div
        className="h-48 rounded-xl bg-gray-50 border border-gray-200
          flex items-center justify-center"
      >
        <p className="text-xs text-gray-400">Map unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="h-48 rounded-xl bg-gray-50 border border-gray-200
          flex items-center justify-center gap-2"
      >
        <Loader2 size={14} className="animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 h-48">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER}
        center={center}
        zoom={16}
        options={{
          ...MAP_OPTIONS,
          draggableCursor: "grab",
          draggingCursor: "grabbing",
        }}
        onLoad={onMapLoad}
        onDragStart={() => setIsPanning(true)}
        onIdle={handleIdle}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full
          pointer-events-none z-10 flex flex-col items-center"
      >
        <div
          className={`w-3 h-1 rounded-full bg-black/20 blur-[2px]
            absolute bottom-[-2px] transition-transform duration-200
            ${isPanning ? "scale-75 opacity-50" : "scale-100 opacity-100"}`}
        />
        <div
          className={`transition-transform duration-200
            ${isPanning ? "-translate-y-2 scale-110" : "translate-y-0 scale-100"}`}
        >
          <svg
            width="32"
            height="42"
            viewBox="0 0 32 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z"
              fill="#05015A"
            />
            <circle cx="16" cy="16" r="7" fill="white" />
            <circle cx="16" cy="16" r="3.5" fill="#05015A" />
          </svg>
        </div>
      </div>

      {!isPanning && !isReverseGeocoding && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3
            py-1.5 rounded-lg bg-black/50 backdrop-blur-sm pointer-events-none"
        >
          <p className="text-[10px] text-white/90 whitespace-nowrap font-medium">
            Move map to adjust pin location
          </p>
        </div>
      )}

      {isPanning && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3
            py-1.5 rounded-lg bg-[#05015A]/80 backdrop-blur-sm pointer-events-none"
        >
          <p className="text-[10px] text-white whitespace-nowrap font-medium">
            Release to set location
          </p>
        </div>
      )}

      {isReverseGeocoding && (
        <div
          className="absolute inset-0 bg-white/40 backdrop-blur-[1px]
            flex items-center justify-center pointer-events-none"
        >
          <div
            className="flex items-center gap-2 px-3 py-2 bg-white
              rounded-lg border border-gray-200 shadow-sm"
          >
            <Loader2 size={13} className="animate-spin text-[#05015A]" />
            <span className="text-xs text-gray-600">Updating address...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Branch image upload ────────────────────────────────────────
const BranchImageUpload = ({
  currentUrl,
  onUploaded,
  onClear,
  isUploading,
  progress,
  error,
}) => {
  const inputRef = useRef(null);
  const displayUrl = resolveFileUrl(currentUrl);

  return (
    <div className="flex items-start gap-3">
      <div
        className="relative w-20 h-20 rounded-xl border-2 border-dashed
          overflow-hidden flex-shrink-0 cursor-pointer group transition-colors
          border-gray-200 hover:border-[#05015A]/30"
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        {displayUrl && !isUploading && (
          <>
            <img
              src={displayUrl}
              alt="Branch"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div
              className="absolute inset-0 bg-black/40 opacity-0
                group-hover:opacity-100 transition-opacity flex items-center
                justify-center"
            >
              <Upload size={14} className="text-white" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-1 right-1 w-4 h-4 rounded-full
                bg-black/60 flex items-center justify-center z-10
                opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={8} className="text-white" />
            </button>
          </>
        )}

        {isUploading && (
          <div
            className="absolute inset-0 bg-white/80 flex flex-col
              items-center justify-center gap-1.5"
          >
            <Loader2 size={14} className="animate-spin text-[#05015A]" />
            <div className="w-12 h-0.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-[#05015A] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!displayUrl && !isUploading && (
          <div
            className="absolute inset-0 flex flex-col items-center
              justify-center gap-1 text-gray-300 group-hover:text-[#05015A]/50
              transition-colors"
          >
            <Image size={18} />
            <span className="text-[9px] font-medium">Upload</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploaded(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex-1 pt-1 space-y-1">
        <p className="text-xs font-medium text-gray-600">Branch Photo</p>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Shown on the branch listing. Helps customers recognise your location.
        </p>
        <p className="text-[10px] text-gray-300">
          JPG, PNG or WebP · Max 5MB · Optional
        </p>
        {error && (
          <p className="text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle size={10} /> {error}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Main Modal ─────────────────────────────────────────────────
const BranchMarketplaceModal = ({ branch, shop, onClose, onSaved }) => {
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "",
    libraries: ["places"],
  });

  const linked = isLinked(branch);
  const ms = branch.marketplaceSettings;

  const [form, setForm] = useState({
    marketplace_enabled: ms?.marketplace_enabled ?? false,
    pickup_enabled: ms?.pickup_enabled ?? false,
    delivery_enabled: ms?.delivery_enabled ?? false,
    delivery_mode: ms?.delivery_mode ?? "CURELI", // <-- Added delivery mode
    is_24_hours: ms?.is_24_hours ?? false,
    opening_time: ms?.opening_time ?? "",
    closing_time: ms?.closing_time ?? "",
    contact_override: ms?.contact_override ?? "",
    latitude: ms?.latitude ? Number(ms.latitude) : null,
    longitude: ms?.longitude ? Number(ms.longitude) : null,
    google_place_id: ms?.google_place_id ?? null,
    formatted_address: ms?.formatted_address ?? "",
    shop_image_url: ms?.shop_image_url ?? null,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const patch = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    const relatedKeys = {
      pickup_enabled: ["fulfillment"],
      delivery_enabled: ["fulfillment"],
      opening_time: ["opening_time"],
      closing_time: ["closing_time"],
      is_24_hours: ["opening_time", "closing_time"],
    };
    const keys = relatedKeys[key] ?? [key];
    if (keys.some((k) => errors[k])) {
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  const handlePlaceSelect = (detail) => {
    setForm((prev) => ({
      ...prev,
      latitude: detail.latitude,
      longitude: detail.longitude,
      google_place_id: detail.place_id,
      formatted_address: detail.formatted_address,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.location;
      return next;
    });
  };

  const handleLocationUpdate = useCallback(
    ({ latitude, longitude, formatted_address }) => {
      setForm((prev) => ({
        ...prev,
        latitude,
        longitude,
        ...(formatted_address ? { formatted_address } : {}),
      }));
    },
    []
  );

  const handleImageUpload = async (file) => {
    setImageUploading(true);
    setImageProgress(0);
    setImageUploadError(null);
    try {
      const res = await uploadMarketplaceAsset(
        "branch_image",
        file,
        (pct) => setImageProgress(pct)
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error("No URL returned");
      patch("shop_image_url", url);
    } catch (err) {
      setImageUploadError(
        err.response?.data?.message || err.message || "Upload failed"
      );
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    setSubmitErr(null);
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await updateBranchMarketplaceConfig(shop.shop_id, branch.branch_id, {
        marketplace_enabled: form.marketplace_enabled,
        pickup_enabled: form.pickup_enabled,
        delivery_enabled: form.delivery_enabled,
        delivery_mode: form.delivery_mode || "CURELI", // <-- Included in payload
        is_24_hours: form.is_24_hours,
        opening_time: form.is_24_hours ? null : form.opening_time || null,
        closing_time: form.is_24_hours ? null : form.closing_time || null,
        contact_override: form.contact_override || null,
        latitude: form.latitude,
        longitude: form.longitude,
        google_place_id: form.google_place_id,
        formatted_address: form.formatted_address || null,
        shop_image_url: form.shop_image_url || null,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved();
      }, 900);
    } catch (err) {
      setSubmitErr(
        err.response?.data?.message || "Failed to save configuration"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBlockBranch = async () => {
    setBlocking(true);
    setSubmitErr(null);
    try {
      await blockMarketplaceBranch(
        shop.shop_id,
        branch.branch_id,
        branch.is_active
      );
      onSaved();
    } catch (err) {
      setSubmitErr(
        err.response?.data?.message || "Failed to update branch status"
      );
    } finally {
      setBlocking(false);
    }
  };

  const { done, total } = completionCount(form);
  const isLocationSet =
    !!form.latitude && !!form.longitude && !!form.google_place_id;
  const isFulfillmentSet = form.pickup_enabled || form.delivery_enabled;
  const isTimingSet =
    form.is_24_hours || (!!form.opening_time && !!form.closing_time);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4
          pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-lg max-h-[90vh] flex
            flex-col rounded-2xl bg-white shadow-2xl shadow-black/15
            border border-gray-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-5 py-4
            border-b border-gray-100 bg-gray-50/60 flex-shrink-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl bg-white border border-gray-200
                  shadow-sm flex items-center justify-center flex-shrink-0"
              >
                <Building2 size={16} className="text-[#05015A]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    className="text-sm font-bold text-gray-800 truncate
                      max-w-[180px]"
                  >
                    {branch.branch_name}
                  </h2>
                  {branch.branch_type === "main" && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold
                        bg-blue-50 text-blue-600 border border-blue-100
                        uppercase flex-shrink-0"
                    >
                      Main
                    </span>
                  )}
                  {linked ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px]
                        font-semibold px-2 py-0.5 rounded-full bg-emerald-50
                        text-emerald-700 border border-emerald-100 flex-shrink-0"
                    >
                      <CheckCircle2 size={9} /> Linked
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[10px]
                        font-semibold px-2 py-0.5 rounded-full bg-gray-100
                        text-gray-500 border border-gray-200 flex-shrink-0"
                    >
                      <XCircle size={9} /> Not Linked
                    </span>
                  )}
                  {!branch.is_active && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px]
                        font-semibold px-2 py-0.5 rounded-full bg-red-50
                        text-red-600 border border-red-100 flex-shrink-0"
                    >
                      <ShieldOff size={9} /> Blocked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {branch.city || "—"}
                  {branch.state ? `, ${branch.state}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:bg-gray-100
                transition-all ml-3 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Progress bar ── */}
          {form.marketplace_enabled && total > 0 && (
            <div
              className="px-5 py-2 border-b border-gray-100 bg-gray-50/40
                flex-shrink-0"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400 font-medium">
                  Configuration
                </span>
                <span className="text-[10px] text-gray-500 font-semibold">
                  {done}/{total}
                </span>
              </div>
              <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r
                    from-[#05015A] to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(done / total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {!branch.is_active && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                  bg-red-50 border border-red-100"
              >
                <AlertCircle
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-600 font-medium">
                  This branch is blocked. Unblock it to enable marketplace.
                </p>
              </div>
            )}

            <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <SlimToggle
                checked={form.marketplace_enabled}
                onChange={(v) => patch("marketplace_enabled", v)}
                label="Enable on Marketplace"
                disabled={!branch.is_active}
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Customers can discover and order from this branch
              </p>
            </div>

            <AnimatePresence initial={false}>
              {form.marketplace_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden space-y-5"
                >
                  {/* Branch image */}
                  <Section icon={Image} title="Branch Photo">
                    <BranchImageUpload
                      currentUrl={form.shop_image_url}
                      onUploaded={handleImageUpload}
                      onClear={() => patch("shop_image_url", null)}
                      isUploading={imageUploading}
                      progress={imageProgress}
                      error={imageUploadError}
                    />
                  </Section>

                  {/* Location */}
                  <Section
                    icon={MapPin}
                    title="Location"
                    required
                    done={isLocationSet}
                  >
                    <PlacesSearchInput
                      value={form.formatted_address}
                      onChange={(v) => patch("formatted_address", v)}
                      onSelect={handlePlaceSelect}
                    />

                    {isLocationSet && (
                      <div
                        className="flex items-start gap-2.5 px-3.5 py-3
                          rounded-xl bg-emerald-50 border border-emerald-100"
                      >
                        <Shield
                          size={13}
                          className="text-emerald-600 mt-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-emerald-700 font-medium">
                            Location set · drag the map pin to adjust
                          </p>
                          <p
                            className="text-[11px] text-emerald-600/80 mt-0.5
                              leading-relaxed"
                          >
                            {form.formatted_address}
                          </p>
                          <p className="text-[10px] text-emerald-500 mt-1">
                            {Number(form.latitude).toFixed(6)},{" "}
                            {Number(form.longitude).toFixed(6)}
                          </p>
                        </div>
                      </div>
                    )}

                    {isLocationSet && (
                      <DraggableMap
                        latitude={form.latitude}
                        longitude={form.longitude}
                        onLocationUpdate={handleLocationUpdate}
                        isLoaded={mapsLoaded}
                        loadError={mapsLoadError}
                      />
                    )}

                    {errors.location && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.location}
                      </p>
                    )}
                  </Section>

                  {/* Fulfillment + Timings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Section
                      icon={Truck}
                      title="Fulfillment"
                      required
                      done={isFulfillmentSet}
                    >
                      <div className="space-y-2.5">
                        <div className="flex gap-2">
                          <ToggleChip
                            icon={ShoppingBag}
                            label="Pickup"
                            active={form.pickup_enabled}
                            onClick={() =>
                              patch("pickup_enabled", !form.pickup_enabled)
                            }
                          />
                          <ToggleChip
                            icon={Truck}
                            label="Delivery"
                            active={form.delivery_enabled}
                            onClick={() =>
                              patch("delivery_enabled", !form.delivery_enabled)
                            }
                          />
                        </div>

                        {/* ── Delivery Provider Selector (CAdmin) ── */}
                        {form.delivery_enabled && (
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                            <p className="text-[10px] text-gray-500 font-semibold uppercase">
                              Delivery Provider
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => patch("delivery_mode", "CURELI")}
                                className={`flex-1 p-2 rounded-lg border text-left transition-all ${
                                  (form.delivery_mode || "CURELI") === "CURELI"
                                    ? "bg-[#05015A]/[0.08] border-[#05015A]/30 text-[#05015A]"
                                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                                }`}
                              >
                                <p className="text-xs font-semibold">Cureli Fleet</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">App riders</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => patch("delivery_mode", "SELF")}
                                className={`flex-1 p-2 rounded-lg border text-left transition-all ${
                                  form.delivery_mode === "SELF"
                                    ? "bg-[#05015A]/[0.08] border-[#05015A]/30 text-[#05015A]"
                                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                                }`}
                              >
                                <p className="text-xs font-semibold">Own Fleet</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">Shop boys</p>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {errors.fulfillment && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle size={11} /> {errors.fulfillment}
                        </p>
                      )}
                    </Section>

                    <Section
                      icon={Clock}
                      title="Operating Hours"
                      required
                      done={isTimingSet}
                    >
                      <div className="space-y-2">
                        <div
                          className="flex items-center gap-2.5 px-3 py-2.5
                            rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              patch("is_24_hours", !form.is_24_hours)
                            }
                            style={{ height: "18px", width: "32px" }}
                            className={`relative inline-flex items-center
                              rounded-full transition-colors flex-shrink-0
                              ${
                                form.is_24_hours
                                  ? "bg-[#05015A]"
                                  : "bg-gray-200"
                              }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 rounded-full
                                bg-white shadow transform transition-transform
                                ${
                                  form.is_24_hours
                                    ? "translate-x-3.5"
                                    : "translate-x-0.5"
                                }`}
                            />
                          </button>
                          <span className="text-xs text-gray-600 font-medium">
                            Open 24 hours
                          </span>
                        </div>

                        <AnimatePresence initial={false}>
                          {!form.is_24_hours && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label
                                    className="block text-[10px] text-gray-400
                                      font-medium mb-1"
                                  >
                                    Opens
                                  </label>
                                  <input
                                    type="time"
                                    value={form.opening_time || ""}
                                    onChange={(e) =>
                                      patch("opening_time", e.target.value)
                                    }
                                    className={`w-full text-xs border rounded-lg
                                      px-2.5 py-2 focus:outline-none
                                      focus:ring-2 focus:ring-[#05015A]/20
                                      bg-white text-gray-700 transition-all
                                      ${
                                        errors.opening_time
                                          ? "border-red-300"
                                          : "border-gray-200"
                                      }`}
                                  />
                                  {errors.opening_time && (
                                    <p className="text-[10px] text-red-500 mt-0.5">
                                      {errors.opening_time}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label
                                    className="block text-[10px] text-gray-400
                                      font-medium mb-1"
                                  >
                                    Closes
                                  </label>
                                  <input
                                    type="time"
                                    value={form.closing_time || ""}
                                    onChange={(e) =>
                                      patch("closing_time", e.target.value)
                                    }
                                    className={`w-full text-xs border rounded-lg
                                      px-2.5 py-2 focus:outline-none
                                      focus:ring-2 focus:ring-[#05015A]/20
                                      bg-white text-gray-700 transition-all
                                      ${
                                        errors.closing_time
                                          ? "border-red-300"
                                          : "border-gray-200"
                                      }`}
                                  />
                                  {errors.closing_time && (
                                    <p className="text-[10px] text-red-500 mt-0.5">
                                      {errors.closing_time}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Section>
                  </div>

                  {/* Contact override */}
                  <Section
                    icon={Phone}
                    title="Contact Override"
                    done={!!form.contact_override?.trim()}
                  >
                    <div className="relative">
                      <Phone
                        size={13}
                        className="absolute left-3 top-1/2
                          -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="tel"
                        value={form.contact_override}
                        onChange={(e) =>
                          patch("contact_override", e.target.value)
                        }
                        placeholder="Override phone shown to customers (optional)"
                        maxLength={15}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border
                          border-gray-200 rounded-xl focus:outline-none
                          focus:ring-2 focus:ring-[#05015A]/20
                          focus:border-[#05015A]/40 bg-white transition-all
                          text-gray-700 placeholder-gray-300"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Leave blank to use the branch default contact
                    </p>
                  </Section>
                </motion.div>
              )}
            </AnimatePresence>

            {submitErr && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl
                  bg-red-50 border border-red-100"
              >
                <AlertCircle
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-600">{submitErr}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between px-5 py-3.5
              border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
          >
            <button
              onClick={handleBlockBranch}
              disabled={blocking || saving}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs
                font-semibold transition-all disabled:opacity-50 border
                ${
                  branch.is_active
                    ? "text-red-600 hover:bg-red-50 border-red-100"
                    : "text-emerald-700 hover:bg-emerald-50 border-emerald-100"
                }`}
            >
              {blocking ? (
                <Loader2 size={12} className="animate-spin" />
              ) : branch.is_active ? (
                <ShieldOff size={13} />
              ) : (
                <ShieldCheck size={13} />
              )}
              {branch.is_active ? "Block Branch" : "Unblock Branch"}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm text-gray-500
                  hover:bg-gray-100 hover:text-gray-700 transition-all
                  disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || imageUploading}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl
                  text-sm font-bold transition-all disabled:opacity-50 shadow-sm
                  ${
                    saveSuccess
                      ? "bg-emerald-500 text-white"
                      : "bg-[#05015A] hover:bg-[#0a0280] text-white"
                  }`}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={13} /> Saved!
                  </>
                ) : (
                  "Save Config"
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default BranchMarketplaceModal;