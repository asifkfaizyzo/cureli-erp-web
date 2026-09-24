// backend/src/modules/cadmin/marketplace/cadmin.places.service.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace/cadmin.places.service.js

import axios from "axios";

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

// ─────────────────────────────────────────────
// AUTOCOMPLETE
// GET /cadmin/marketplace/places/search?query=...
// ─────────────────────────────────────────────
export const searchPlaces = async (query) => {
  if (!GOOGLE_KEY) {
    throw new Error("Google Places API key not configured");
  }

  const response = await axios.get(`${BASE_URL}/autocomplete/json`, {
    params: {
      input: query,
      key: GOOGLE_KEY,
      types: "establishment|geocode",
      components: "country:in",
    },
    timeout: 5000,
  });

  if (
    response.data.status !== "OK" &&
    response.data.status !== "ZERO_RESULTS"
  ) {
    console.error(
      "[cadmin.places] Autocomplete error:",
      response.data.status,
      response.data.error_message
    );
    throw new Error("Places search failed");
  }

  return (response.data.predictions || []).map((p) => ({
    place_id: p.place_id,
    description: p.description,
    main_text: p.structured_formatting?.main_text ?? "",
    secondary_text: p.structured_formatting?.secondary_text ?? "",
  }));
};

// ─────────────────────────────────────────────
// PLACE DETAILS
// GET /cadmin/marketplace/places/details?place_id=...
// ─────────────────────────────────────────────
export const getPlaceDetails = async (place_id) => {
  if (!GOOGLE_KEY) {
    throw new Error("Google Places API key not configured");
  }

  const response = await axios.get(`${BASE_URL}/details/json`, {
    params: {
      place_id,
      fields: "geometry,formatted_address,name",
      key: GOOGLE_KEY,
    },
    timeout: 5000,
  });

  if (response.data.status !== "OK") {
    console.error(
      "[cadmin.places] Details error:",
      response.data.status,
      response.data.error_message
    );
    throw new Error("Failed to get place details");
  }

  const result = response.data.result;

  return {
    place_id,
    name: result.name ?? "",
    formatted_address: result.formatted_address ?? "",
    latitude: result.geometry?.location?.lat ?? null,
    longitude: result.geometry?.location?.lng ?? null,
  };
};