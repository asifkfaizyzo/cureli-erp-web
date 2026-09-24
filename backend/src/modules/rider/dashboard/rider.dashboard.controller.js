// backend/src/modules/rider/dashboard/rider.dashboard.controller.js (do not remove this comment)
import { fail, success } from "../../../utils/response.js";
import { getDashboard } from "./rider.dashboard.service.js";

// ── GET /rider/dashboard ─────────────────────────────────────

export async function handleGetDashboard(req, res) {
  try {
    const dashboard = await getDashboard(req.rider.rider_id);
    return success(res, dashboard, "Dashboard retrieved");
  } catch (err) {
    console.error("[RiderDashboard] Error:", err.message);
    return fail(res, "Failed to fetch dashboard", 500);
  }
}