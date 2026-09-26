// pharmacy-web/src/hooks/useGoogleMaps.js (do not remove this comment)
// src/hooks/useGoogleMaps.js

import { useJsApiLoader } from "@react-google-maps/api";

/**
 * Single shared Google Maps JS API loader.
 *
 * Call this ONCE at the page level (BranchConfigurationStep).
 * Pass { isLoaded, loadError } as props down to LocationPicker.
 *
 * DO NOT call useJsApiLoader inside LocationPicker directly —
 * multiple calls on the same page will throw.
 *
 * Libraries:
 *   - "geocoding" is required for reverse geocode on pin drag.
 *   - We do NOT load "places" here — Places autocomplete/details
 *     go through our backend proxy, not the JS SDK.
 */
const LIBRARIES = ["geocoding"];

export const useGoogleMaps = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  return { isLoaded, loadError };
};