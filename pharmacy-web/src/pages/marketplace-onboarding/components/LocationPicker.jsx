// pharmacy-web/src/pages/marketplace-onboarding/components/LocationPicker.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/components/LocationPicker.jsx

import { useState, useRef, useEffect } from "react";
import { MapPin, Search, Loader2, Check, X, AlertCircle } from "lucide-react";
import { searchPlaces, getPlaceDetails } from "../../../api/marketplace";
import { useDebounce } from "../../../hooks/useDebounce";

/**
 * LocationPicker — search-only. No internal map.
 * Map rendering + pin dragging is handled by UnifiedBranchMap at step level.
 *
 * Props:
 *   value: { google_place_id, formatted_address, latitude, longitude } | null
 *   onChange: (locationData) => void
 *   disabled: boolean
 *   isLoaded: boolean
 *   loadError: Error | undefined
 */

const LocationPicker = ({
  value,
  onChange,
  disabled = false,
  isLoaded,   // kept in props for future use / API calls
  loadError,  // kept in props for consistency
}) => {
  const [query, setQuery] = useState(value?.formatted_address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(!!value?.google_place_id);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 500);

  // ─── Sync from outside (pin drag updates address via store) ─────
  // When the parent updates value.formatted_address (e.g. after pin drag),
  // sync the input text and confirmed state.
  useEffect(() => {
    if (!value?.formatted_address) return;
    // Only update if the address actually changed to avoid cursor-jump
    setQuery((prev) => {
      if (prev !== value.formatted_address) {
        return value.formatted_address;
      }
      return prev;
    });
    if (value.google_place_id || (value.latitude && value.longitude)) {
      setIsConfirmed(true);
    }
  }, [value?.formatted_address, value?.latitude, value?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Close dropdown on outside click ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Autocomplete suggestions ────────────────────────────────────
  useEffect(() => {
    if (isConfirmed) return;
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res = await searchPlaces(debouncedQuery);
        const results = res.data?.data || [];
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchError("Search failed. Please try again.");
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, isConfirmed]);

  // ─── Select suggestion ───────────────────────────────────────────
  const handleSelectSuggestion = async (suggestion) => {
    setShowDropdown(false);
    setQuery(suggestion.description);
    setIsFetchingDetails(true);
    setSearchError(null);

    try {
      const res = await getPlaceDetails(suggestion.place_id);
      const details = res.data?.data;

      if (!details?.latitude || !details?.longitude) {
        throw new Error("Could not retrieve location coordinates.");
      }

      onChange({
        google_place_id: details.place_id,
        formatted_address: details.formatted_address,
        latitude: details.latitude,
        longitude: details.longitude,
      });

      setIsConfirmed(true);
    } catch (err) {
      setSearchError(err.message || "Failed to get location details.");
      setIsConfirmed(false);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // ─── Clear ───────────────────────────────────────────────────────
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsConfirmed(false);
    setShowDropdown(false);
    setSearchError(null);
    onChange({
      google_place_id: null,
      formatted_address: null,
      latitude: null,
      longitude: null,
    });
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative space-y-2">

      {/* ── Search input ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {isFetchingDetails ? (
            <Loader2 size={16} className="text-white/40 animate-spin" />
          ) : isConfirmed ? (
            <MapPin size={16} className="text-emerald-400" />
          ) : (
            <Search size={16} className="text-white/40" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (isConfirmed) setIsConfirmed(false);
          }}
          disabled={disabled || isFetchingDetails}
          placeholder="Search for branch location..."
          className={`
            w-full pl-10 pr-10 py-3 rounded-xl text-sm
            bg-white/[0.04] border text-white placeholder-white/25
            focus:outline-none focus:ring-2 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isConfirmed
              ? "border-emerald-500/40 focus:ring-emerald-500/20"
              : searchError
                ? "border-red-500/40 focus:ring-red-500/20"
                : "border-white/10 focus:ring-white/20 focus:border-white/20"
            }
          `}
        />

        {(query || isConfirmed) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center
              text-white/25 hover:text-white/50 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {showDropdown && (
        <div
          className="absolute z-50 top-[52px] w-full rounded-xl border border-white/10
          bg-[#0d0a3a] shadow-2xl shadow-black/60 overflow-hidden"
        >
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6">
              <Loader2 size={16} className="text-white/40 animate-spin" />
              <span className="text-white/40 text-sm">Searching...</span>
            </div>
          ) : (
            <ul className="py-1 max-h-60 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5
                      transition-colors flex items-start gap-3"
                  >
                    <MapPin size={14} className="text-white/25 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/90 truncate">
                        {s.main_text}
                      </p>
                      <p className="text-xs text-white/35 truncate mt-0.5">
                        {s.secondary_text}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Search error ─────────────────────────────────────────── */}
      {searchError && (
        <p className="text-xs text-red-400 px-1 flex items-center gap-1.5">
          <AlertCircle size={12} />
          {searchError}
        </p>
      )}

      {/* ── Confirmed address pill ───────────────────────────────── */}
      {isConfirmed && value?.formatted_address && (
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl
          bg-emerald-500/[0.08] border border-emerald-500/15"
        >
          <Check size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-emerald-400/80 font-medium">
              Location set · drag the map pin to adjust
            </p>
            <p className="text-xs text-white/40 truncate mt-0.5">
              {value.formatted_address}
            </p>
            {value.latitude && (
              <p className="text-[10px] text-white/20 mt-0.5">
                {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;