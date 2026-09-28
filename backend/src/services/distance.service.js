// backend/src/services/distance.service.js (do not remove this comment)

/**
 * Shared Distance Service
 * Uses Google Distance Matrix API for real driving distances.
 * Falls back to Haversine × 1.3 when the API is unavailable.
 *
 * ◄◄ PHASE 2: In-memory LRU cache (24h TTL, max 10k entries).
 *    Eliminates redundant Google API calls for repeated routes
 *    (e.g., same branch → same customer address).
 */

const PLACES_BASE = "https://maps.googleapis.com/maps/api";

function getApiKey() {
  const key = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("No Google Maps API key configured");
  return key;
}

// ── Haversine ──────────────────────────────────────────────────

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

// ── Distance Cache ─────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_MAX_ENTRIES = 10000;

/**
 * @type {Map<string, { distanceKm: number, durationSecs: number, cachedAt: number }>}
 *
 * Key format: "28.6139,77.2090->28.6353,77.2245" (4 decimal places ≈ 11m)
 * Insertion order is maintained by Map — oldest entries are first.
 */
const distanceCache = new Map();

/**
 * Build a cache key from two coordinate pairs.
 * Rounds to 4 decimal places (~11m precision) so that
 * minor GPS jitter doesn't bust the cache.
 */
function cacheKey(originLat, originLng, destLat, destLng) {
  const r = (n) => Number(n).toFixed(4);
  return `${r(originLat)},${r(originLng)}->${r(destLat)},${r(destLng)}`;
}

/**
 * Look up a cached distance. Returns null if missing or expired.
 * On hit, moves the entry to the end of the Map (most-recently-used).
 */
function cacheGet(key) {
  const entry = distanceCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    distanceCache.delete(key);
    return null;
  }

  // Move to end (mark as recently used)
  distanceCache.delete(key);
  distanceCache.set(key, entry);
  return entry;
}

/**
 * Store a distance result in the cache.
 * Evicts oldest entries if the cache exceeds the size limit.
 */
function cacheSet(key, distanceKm, durationSecs) {
  // Evict oldest entries if at capacity
  while (distanceCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = distanceCache.keys().next().value;
    distanceCache.delete(oldestKey);
  }

  distanceCache.set(key, {
    distanceKm,
    durationSecs,
    cachedAt: Date.now(),
  });
}

/**
 * Manually clear the cache (useful for testing or config changes).
 */
export function clearDistanceCache() {
  distanceCache.clear();
}

/**
 * Return current cache stats (useful for monitoring/debugging).
 */
export function getDistanceCacheStats() {
  return {
    size: distanceCache.size,
    maxEntries: CACHE_MAX_ENTRIES,
    ttlHours: CACHE_TTL_MS / (60 * 60 * 1000),
  };
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Get real driving distance between two coordinates.
 * Checks cache first. Falls back to Haversine × 1.3 if Google API fails.
 *
 * @returns {Promise<{ distanceKm: number, durationSecs: number, isEstimate: boolean }>}
 */
export async function getDrivingDistance(
  originLat,
  originLng,
  destLat,
  destLng,
) {
  if (!originLat || !originLng || !destLat || !destLng) {
    return { distanceKm: 0, durationSecs: 0, isEstimate: true };
  }

  // ── Cache check ──────────────────────────────────────────
  const key = cacheKey(originLat, originLng, destLat, destLng);
  const cached = cacheGet(key);
  if (cached) {
    return {
      distanceKm: cached.distanceKm,
      durationSecs: cached.durationSecs,
      isEstimate: false,
    };
  }

  // ── Google API call ──────────────────────────────────────
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
    if (!element || element.status !== "OK")
      throw new Error(element?.status ?? "NO_ROUTE");

    const distanceKm = parseFloat((element.distance.value / 1000).toFixed(2));
    const durationSecs = element.duration.value;

    // ── Store in cache ───────────────────────────────────
    cacheSet(key, distanceKm, durationSecs);

    return {
      distanceKm,
      durationSecs,
      isEstimate: false,
    };
  } catch (err) {
    console.warn(
      "[DistanceService] Google API failed, using fallback:",
      err.message,
    );
    const straight = haversineKm(
      Number(originLat),
      Number(originLng),
      Number(destLat),
      Number(destLng),
    );
    const estimated = Math.round(straight * 1.3 * 100) / 100;
    // Do NOT cache fallback estimates — they should be retried next time
    return {
      distanceKm: estimated,
      durationSecs: Math.round(estimated * 120),
      isEstimate: true,
    };
  }
}

/**
 * Quick Haversine estimate for display/sorting (no API call, no cache).
 * Applies × 1.3 urban road factor.
 */
export function estimateDrivingDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const straight = haversineKm(
    Number(lat1),
    Number(lng1),
    Number(lat2),
    Number(lng2),
  );
  return Math.round(straight * 1.3 * 100) / 100;
}

/**
 * Batched driving distances for multiple origins → single destination.
 * Uses one Google Distance Matrix API call (up to 25 origins per request).
 * Checks cache per-origin before making the API call.
 * Falls back to Haversine × 1.3 per-origin if the API fails.
 *
 * @param {Array<{ lat: number, lng: number }>} origins
 * @param {number} destLat
 * @param {number} destLng
 * @returns {Promise<Array<{ distanceKm: number, durationSecs: number, isEstimate: boolean }>>}
 */
export async function getBatchedDrivingDistances(origins, destLat, destLng) {
  if (!origins.length || !destLat || !destLng) {
    return origins.map(() => ({
      distanceKm: 0,
      durationSecs: 0,
      isEstimate: true,
    }));
  }

  // ── Step 1: Check cache for each origin ──────────────────
  const results = new Array(origins.length);
  const uncachedIndices = [];
  const uncachedOrigins = [];

  for (let i = 0; i < origins.length; i++) {
    const o = origins[i];
    const key = cacheKey(o.lat, o.lng, destLat, destLng);
    const cached = cacheGet(key);

    if (cached) {
      results[i] = {
        distanceKm: cached.distanceKm,
        durationSecs: cached.durationSecs,
        isEstimate: false,
      };
    } else {
      uncachedIndices.push(i);
      uncachedOrigins.push(o);
    }
  }

  // If all origins were cached, return immediately (zero API calls)
  if (uncachedOrigins.length === 0) {
    return results;
  }

  // ── Step 2: Fetch uncached origins from Google API ───────
  const CHUNK_SIZE = 25;

  for (let i = 0; i < uncachedOrigins.length; i += CHUNK_SIZE) {
    const chunk = uncachedOrigins.slice(i, i + CHUNK_SIZE);
    const chunkIndices = uncachedIndices.slice(i, i + CHUNK_SIZE);

    try {
      const originsStr = chunk.map((o) => `${o.lat},${o.lng}`).join("|");
      const params = new URLSearchParams({
        origins: originsStr,
        destinations: `${destLat},${destLng}`,
        mode: "driving",
        units: "metric",
        key: getApiKey(),
      });

      const url = `${PLACES_BASE}/distancematrix/json?${params}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);

      for (let j = 0; j < chunk.length; j++) {
        const el = data.rows[j]?.elements[0];
        const origIdx = chunkIndices[j];

        if (!el || el.status !== "OK") {
          results[origIdx] = {
            distanceKm: 0,
            durationSecs: 0,
            isEstimate: true,
          };
          continue;
        }

        const distanceKm = parseFloat((el.distance.value / 1000).toFixed(2));
        const durationSecs = el.duration.value;

        // Cache each successful result individually
        const key = cacheKey(chunk[j].lat, chunk[j].lng, destLat, destLng);
        cacheSet(key, distanceKm, durationSecs);

        results[origIdx] = {
          distanceKm,
          durationSecs,
          isEstimate: false,
        };
      }
    } catch (err) {
      console.warn(
        `[DistanceService] Batched Google API failed for chunk ${i / CHUNK_SIZE + 1}:`,
        err.message,
      );
      // Fallback: Haversine × 1.3 for each origin in this chunk (not cached)
      for (let j = 0; j < chunk.length; j++) {
        const origIdx = chunkIndices[j];
        const straight = haversineKm(
          chunk[j].lat,
          chunk[j].lng,
          destLat,
          destLng,
        );
        const estimated = Math.round(straight * 1.3 * 100) / 100;
        results[origIdx] = {
          distanceKm: estimated,
          durationSecs: Math.round(estimated * 120),
          isEstimate: true,
        };
      }
    }
  }

  return results;
}
