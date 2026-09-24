import { fail, success } from "../../../utils/response.js";
import {
  updateLocationSchema,
  toggleAvailabilitySchema,
} from "./rider.presence.schema.js";
import {
  updateLocation,
  toggleAvailability,
} from "./rider.presence.service.js";

// ── POST /rider/location ─────────────────────────────────────

export async function handleUpdateLocation(req, res) {
  const parsed = updateLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    await updateLocation(req.rider.rider_id, parsed.data);
    return res.status(204).end();
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 404,
      RATE_LIMITED: 429,
      LOW_ACCURACY: 422,
      SPEED_ANOMALY: 422,
    };
    return fail(res, err.message, statusMap[err.code] ?? 500);
  }
}

// ── PUT /rider/availability ──────────────────────────────────

export async function handleToggleAvailability(req, res) {
  const parsed = toggleAvailabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message, 400);
  }

  try {
    const result = await toggleAvailability(req.rider.rider_id, parsed.data);
    return success(res, result, result.is_online ? "Rider is now online" : "Rider is now offline");
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 404,
      NOT_APPROVED: 403,
      DOCS_INCOMPLETE: 403,
      ACTIVE_DELIVERY: 409,
    };
    const statusCode = statusMap[err.code] ?? 500;
    const responseBody = {
      success: false,
      message: err.message,
    };

    // Include active delivery ID in 409 response
    if (err.code === "ACTIVE_DELIVERY") {
      responseBody.active_delivery_id = err.active_delivery_id;
      responseBody.delivery_status = err.delivery_status;
    }

    return res.status(statusCode).json(responseBody);
  }
}