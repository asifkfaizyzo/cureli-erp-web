// backend/src/modules/mobile/places/mobile.places.controller.js (do not remove this comment)
// src/modules/mobile/places/mobile.places.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  searchPlaces,
  getPlaceDetails,
  reverseGeocode,
  getDrivingDistance,
  getDrivingDirections,
} from "./mobile.places.service.js";

/**
 * GET /mobile/places/search?query=
 */
export async function handleSearchPlaces(req, res) {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return fail(res, "Query must be at least 2 characters", 400);
  }

  try {
    const results = await searchPlaces(query);
    return success(res, { results }, "Places fetched");
  } catch (err) {
    console.error("[mobile/places/search]", err.message);
    return fail(res, "Failed to search places", 502);
  }
}

/**
 * GET /mobile/places/details?place_id=
 */
export async function handleGetPlaceDetails(req, res) {
  const { place_id } = req.query;

  if (!place_id) {
    return fail(res, "place_id is required", 400);
  }

  try {
    const details = await getPlaceDetails(place_id);
    return success(res, { details }, "Place details fetched");
  } catch (err) {
    console.error("[mobile/places/details]", err.message);
    return fail(res, "Failed to fetch place details", 502);
  }
}

/**
 * GET /mobile/places/reverse?lat=&lng=
 */
export async function handleReverseGeocode(req, res) {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return fail(res, "Valid lat and lng are required", 400);
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return fail(res, "lat/lng out of valid range", 400);
  }

  try {
    const result = await reverseGeocode(lat, lng);

    if (!result) {
      return fail(res, "No address found for these coordinates", 404);
    }

    return success(res, { details: result }, "Reverse geocode successful");
  } catch (err) {
    console.error("[mobile/places/reverse]", err.message);
    return fail(res, "Reverse geocode failed", 502);
  }
}

/**
 * GET /mobile/places/distance?originLat=&originLng=&destLat=&destLng=
 */
export async function handleGetDrivingDistance(req, res) {
  const originLat = parseFloat(req.query.originLat);
  const originLng = parseFloat(req.query.originLng);
  const destLat = parseFloat(req.query.destLat);
  const destLng = parseFloat(req.query.destLng);

  if (
    isNaN(originLat) ||
    isNaN(originLng) ||
    isNaN(destLat) ||
    isNaN(destLng)
  ) {
    return fail(
      res,
      "Valid originLat, originLng, destLat, destLng are required",
      400,
    );
  }

  try {
    const result = await getDrivingDistance(
      originLat,
      originLng,
      destLat,
      destLng,
    );
    return success(res, result, "Distance calculated");
  } catch (err) {
    console.error("[mobile/places/distance]", err.message);
    return fail(res, "Failed to calculate distance", 502);
  }
}

export async function directionsHandler(req, res) {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res
        .status(400)
        .json({ success: false, message: "All four coordinates required" });
    }

    const result = await getDrivingDirections(
      Number(originLat),
      Number(originLng),
      Number(destLat),
      Number(destLng),
    );

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[Places] directions error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
