// backend/src/modules/mobile/places/mobile.places.routes.js (do not remove this comment)
// src/modules/mobile/places/mobile.places.routes.js

import { Router } from "express";
import { mobileAuth } from "../../../middleware/mobile.auth.js";
import {
  handleSearchPlaces,
  handleGetPlaceDetails,
  handleReverseGeocode,
  handleGetDrivingDistance,
} from "./mobile.places.controller.js";

const router = Router();

// All places routes require mobile authentication
router.use(mobileAuth);


/**
 * GET /mobile/places/search?query=
 * Text search → place predictions
 */
router.get("/search", handleSearchPlaces);

/**
 * GET /mobile/places/details?place_id=
 * place_id → full address + geometry
 */
router.get("/details", handleGetPlaceDetails);

/**
 * GET /mobile/places/reverse?lat=&lng=
 * Coordinates → nearest address
 */
router.get("/reverse", handleReverseGeocode);

/**
 * GET /mobile/places/distance?originLat=&originLng=&destLat=&destLng=
 * Driving distance + duration between two coordinate pairs
 */
router.get("/distance", handleGetDrivingDistance);

export default router;