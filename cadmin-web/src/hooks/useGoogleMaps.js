// cadmin-web/src/hooks/useGoogleMaps.js (do not remove this comment)
// cadmin-web/src/hooks/useGoogleMaps.js

import { useEffect, useState } from "react";

const CALLBACK_NAME = "__cadminGoogleMapsReady";
let isLoaded = false;
let isLoading = false;
const listeners = [];

export const useGoogleMaps = () => {
  const [loaded, setLoaded] = useState(isLoaded);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded) {
      setLoaded(true);
      return;
    }

    // Register this component as a listener
    const listener = ({ error: err } = {}) => {
      if (err) setError(err);
      else setLoaded(true);
    };
    listeners.push(listener);

    if (isLoading) return;

    isLoading = true;

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      const err = new Error("VITE_GOOGLE_MAPS_API_KEY is not set");
      listeners.forEach((l) => l({ error: err }));
      return;
    }

    window[CALLBACK_NAME] = () => {
      isLoaded = true;
      isLoading = false;
      listeners.forEach((l) => l({}));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      const err = new Error("Failed to load Google Maps script");
      isLoading = false;
      listeners.forEach((l) => l({ error: err }));
    };
    document.head.appendChild(script);

    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return { isLoaded: loaded, loadError: error };
};