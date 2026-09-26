// backend/src/modules/mobile/places/mobile.places.service.js (do not remove this comment)
//
// Places service for mobile users.
// Proxies Google Places API calls — keeps the API key server-side.
// Three operations:
//   1. searchPlaces   — text search → place predictions
//   2. getPlaceDetails — place_id → full address components + geometry
//   3. reverseGeocode  — lat/lng → nearest address
//
// IMPORTANT: getApiKey() is called inside each function — NOT at module level.
// This is required because ESM imports are hoisted and resolved before
// dotenv runs, so process.env would be undefined at module load time.

const PLACES_BASE = "https://maps.googleapis.com/maps/api";

// ── Key accessor ──────────────────────────────────────────────

function getApiKey() {
  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_KEY is not set in environment");
  return key;
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Extract structured address fields from Google's address_components array.
 * Returns only the fields we care about for the address form.
 */
function parseAddressComponents(components = []) {
  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name ?? null;

  const getShort = (type) =>
    components.find((c) => c.types.includes(type))?.short_name ?? null;

  return {
    street_number : get("street_number"),
    route         : get("route"),
    sublocality   : get("sublocality_level_1") ?? get("sublocality"),
    city          : get("locality") ?? get("administrative_area_level_2"),
    state         : get("administrative_area_level_1"),
    pincode       : get("postal_code"),
    country       : getShort("country"),
  };
}

/**
 * Build address_line_1 from street components.
 * Falls back to sublocality when street info is missing.
 */
function buildAddressLine1(parsed) {
  const parts = [parsed.street_number, parsed.route].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return parsed.sublocality ?? null;
}

// ── Service methods ───────────────────────────────────────────

/**
 * Text search → place predictions.
 * Uses Places Autocomplete API.
 * Biased toward India (components=country:in).
 *
 * @param {string} query - user input
 * @returns {Promise<Array>} array of { place_id, description, main_text, secondary_text }
 */
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    input      : query.trim(),
    key        : getApiKey(),          // ← called at request time
    components : "country:in",
    language   : "en",
  });

  const url = `${PLACES_BASE}/place/autocomplete/json?${params}`;
  const res  = await fetch(url);

  if (!res.ok) {
    throw new Error(`Places autocomplete request failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status}`);
  }

  return (data.predictions ?? []).map((p) => ({
    place_id       : p.place_id,
    description    : p.description,
    main_text      : p.structured_formatting?.main_text ?? p.description,
    secondary_text : p.structured_formatting?.secondary_text ?? "",
  }));
}

/**
 * place_id → full address details + geometry.
 * Uses Places Details API.
 *
 * @param {string} placeId
 * @returns {Promise<Object>} structured address fields + lat/lng
 */
export async function getPlaceDetails(placeId) {
  const params = new URLSearchParams({
    place_id : placeId,
    key      : getApiKey(),            // ← called at request time
    fields   : "address_components,formatted_address,geometry,name",
    language : "en",
  });

  const url = `${PLACES_BASE}/place/details/json?${params}`;
  const res  = await fetch(url);

  if (!res.ok) {
    throw new Error(`Place details request failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Place details API error: ${data.status}`);
  }

  const result   = data.result;
  const parsed   = parseAddressComponents(result.address_components ?? []);
  const location = result.geometry?.location ?? {};

  return {
    place_id          : placeId,
    name              : result.name ?? null,
    formatted_address : result.formatted_address ?? null,
    address_line_1    : buildAddressLine1(parsed),
    address_line_2    : parsed.sublocality ?? null,
    city              : parsed.city,
    state             : parsed.state,
    pincode           : parsed.pincode,
    country           : parsed.country,
    latitude          : location.lat ?? null,
    longitude         : location.lng ?? null,
  };
}

/**
 * lat/lng → nearest address (reverse geocode).
 * Uses Geocoding API.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object|null>} same shape as getPlaceDetails, or null if no result
 */
export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    latlng      : `${lat},${lng}`,
    key         : getApiKey(),         // ← called at request time
    language    : "en",
    result_type : "street_address|sublocality|locality",
  });

  const url = `${PLACES_BASE}/geocode/json?${params}`;
  const res  = await fetch(url);

  if (!res.ok) {
    throw new Error(`Reverse geocode request failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Geocoding API error: ${data.status}`);
  }

  if (!data.results || data.results.length === 0) {
    return null;
  }

  // Take the most specific result (first one)
  const result   = data.results[0];
  const parsed   = parseAddressComponents(result.address_components ?? []);
  const location = result.geometry?.location ?? {};

  return {
    place_id          : result.place_id ?? null,
    formatted_address : result.formatted_address ?? null,
    address_line_1    : buildAddressLine1(parsed),
    address_line_2    : parsed.sublocality ?? null,
    city              : parsed.city,
    state             : parsed.state,
    pincode           : parsed.pincode,
    country           : parsed.country,
    latitude          : location.lat ?? lat,
    longitude         : location.lng ?? lng,
  };
}

/**
 * Calculate driving distance between two coordinates.
 * Uses Distance Matrix API.
 *
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @returns {Promise<{ distanceKm: number, durationSecs: number, distanceText: string, durationText: string }>}
 */
export async function getDrivingDistance(originLat, originLng, destLat, destLng) {
  const params = new URLSearchParams({
    origins:      `${originLat},${originLng}`,
    destinations: `${destLat},${destLng}`,
    mode:         'driving',
    units:        'metric',
    key:          getApiKey(),
  });

  const url = `${PLACES_BASE}/distancematrix/json?${params}`;
  const res  = await fetch(url);

  if (!res.ok) {
    throw new Error(`Distance Matrix request failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== 'OK') {
    throw new Error(`Distance Matrix API error: ${data.status}`);
  }

  const element = data?.rows?.[0]?.elements?.[0];

  if (!element || element.status !== 'OK') {
    throw new Error(`No route found: ${element?.status ?? 'UNKNOWN'}`);
  }

  const distanceKm  = parseFloat((element.distance.value / 1000).toFixed(2));
  const durationSecs = element.duration.value;

  return {
    distanceKm,
    durationSecs,
    distanceText: element.distance.text,
    durationText: element.duration.text,
  };
}

/**
 * Calculate driving route with full polyline coordinates.
 * Uses Directions API.
 *
 * ⚠️  Requires "Directions API" to be enabled in Google Cloud Console.
 *
 * @returns {Promise<{ distanceKm: number, durationSecs: number, polyline: string, legs: Array }>}
 */
export async function getDrivingDirections(originLat, originLng, destLat, destLng) {
  const params = new URLSearchParams({
    origin: `${originLat},${originLng}`,
    destination: `${destLat},${destLng}`,
    mode: "driving",
    units: "metric",
    key: getApiKey(),
  });

  const url = `${PLACES_BASE}/directions/json?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

  if (!res.ok) throw new Error(`Directions request failed: ${res.status}`);

  const data = await res.json();
  if (data.status !== "OK") throw new Error(`Directions API error: ${data.status}`);

  const route = data.routes[0];
  const leg = route.legs[0];

  return {
    distanceKm: parseFloat((leg.distance.value / 1000).toFixed(2)),
    durationSecs: leg.duration.value,
    polyline: route.overview_polyline.points,
    startAddress: leg.start_address,
    endAddress: leg.end_address,
  };
}