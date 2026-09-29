// backend/src/modules/rider/profile/rider.profile.controller.js

import { success, fail } from "../../../utils/response.js";
import { getRiderDocuments } from "./rider.profile.service.js";

export async function getDocuments(req, res) {
  try {
    const data = await getRiderDocuments(req.rider.rider_id);
    return success(res, data, "Documents retrieved");
  } catch (err) {
    console.error("[RiderProfile] getDocuments failed:", err);
    return fail(res, "Failed to fetch documents", 500);
  }
}