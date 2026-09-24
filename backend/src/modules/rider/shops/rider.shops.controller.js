import { fail, success } from "../../../utils/response.js";
import { nearbyShopsQuerySchema } from "./rider.shops.schema.js";
import { getNearbyShops } from "./rider.shops.service.js";

// ── GET /rider/nearby-shops ──────────────────────────────────

export async function handleGetNearbyShops(req, res) {
  const parsed = nearbyShopsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const { lat, lng, radius_km } = parsed.data;
    const shops = await getNearbyShops(lat, lng, radius_km);
    return success(res, { shops, count: shops.length }, "Nearby shops retrieved");
  } catch (err) {
    console.error("[RiderShops] Error:", err.message);
    return fail(res, "Failed to fetch nearby shops", 500);
  }
}