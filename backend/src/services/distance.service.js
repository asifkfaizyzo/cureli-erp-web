//backend\src\services\distance.service.js

/**
 * Shared Distance Service
 * Uses Google Distance Matrix API for real driving distances.
 * Falls back to Haversine × 1.3 when the API is unavailable.
 */

const PLACES_BASE = "https://maps.googleapis.com/maps/api";

function getApiKey() {
  const key = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("No Google Maps API key configured");
  return key;
}

/**
 * Haversine straight-line distance in km.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get real driving distance between two coordinates.
 * Falls back to Haversine × 1.3 if Google API fails.
 *
 * @returns {Promise<{ distanceKm: number, durationSecs: number, isEstimate: boolean }>}
 */
export async function getDrivingDistance(originLat, originLng, destLat, destLng) {
  if (!originLat || !originLng || !destLat || !destLng) {
    return { distanceKm: 0, durationSecs: 0, isEstimate: true };
  }

  try {
    const params = new URLSearchParams({
      origins: `${originLat},${originLng}`,
      destinations: `${destLat},${destLng}`,
      mode: "driving",
      units: "metric",
      key: getApiKey(),
    });

    const url = `${PLACES_BASE}/distancematrix/json?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.status !== "OK") throw new Error(data.status);

    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") throw new Error(element?.status ?? "NO_ROUTE");

    return {
      distanceKm: parseFloat((element.distance.value / 1000).toFixed(2)),
      durationSecs: element.duration.value,
      isEstimate: false,
    };
  } catch (err) {
    console.warn("[DistanceService] Google API failed, using fallback:", err.message);
    const straight = haversineKm(
      Number(originLat), Number(originLng),
      Number(destLat), Number(destLng)
    );
    const estimated = Math.round(straight * 1.3 * 100) / 100;
    return {
      distanceKm: estimated,
      durationSecs: Math.round(estimated * 120),
      isEstimate: true,
    };
  }
}

/**
 * Quick Haversine estimate for display/sorting (no API call).
 * Applies × 1.3 urban road factor.
 */
export function estimateDrivingDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const straight = haversineKm(Number(lat1), Number(lng1), Number(lat2), Number(lng2));
  return Math.round(straight * 1.3 * 100) / 100;
}