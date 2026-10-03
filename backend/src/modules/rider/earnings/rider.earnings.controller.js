// backend/src/modules/rider/earnings/rider.earnings.controller.js (do not remove this comment)

import { success, fail } from "../../../utils/response.js";
import {
  getOverview,
  getWeeklyData,
  getOrders,
  getPayouts,
} from "./rider.earnings.service.js";
import { parsePagination, parseDateStr } from "./rider.earnings.schema.js";

export async function handleGetOverview(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const data = await getOverview(riderId);
    return success(res, data, "Earnings overview fetched");
  } catch (err) {
    if (err.code === "FORBIDDEN") return fail(res, err.message, 403);
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    console.error("Earnings overview error:", err);
    return fail(res, "Failed to fetch earnings overview", 500);
  }
}

export async function handleGetWeekly(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const { week_start } = req.query;

    if (!week_start || !/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
      return fail(res, "week_start is required (YYYY-MM-DD)", 400);
    }

    const data = await getWeeklyData(riderId, week_start);
    return success(res, data, "Weekly earnings fetched");
  } catch (err) {
    if (err.code === "FORBIDDEN") return fail(res, err.message, 403);
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    console.error("Earnings weekly error:", err);
    return fail(res, "Failed to fetch weekly earnings", 500);
  }
}

export async function handleGetOrders(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const { from, to, day } = req.query;
    const { page, limit } = parsePagination(req.query);

    // Validate date formats if provided
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      return fail(res, "Invalid from date format (YYYY-MM-DD)", 400);
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return fail(res, "Invalid to date format (YYYY-MM-DD)", 400);
    }
    if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return fail(res, "Invalid day date format (YYYY-MM-DD)", 400);
    }

    const data = await getOrders(riderId, { from, to, day, page, limit });
    return success(res, data, "Order earnings fetched");
  } catch (err) {
    if (err.code === "FORBIDDEN") return fail(res, err.message, 403);
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    console.error("Earnings orders error:", err);
    return fail(res, "Failed to fetch order earnings", 500);
  }
}

export async function handleGetPayouts(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const { page, limit } = parsePagination(req.query);

    const data = await getPayouts(riderId, { page, limit });
    return success(res, data, "Payout history fetched");
  } catch (err) {
    if (err.code === "FORBIDDEN") return fail(res, err.message, 403);
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    console.error("Earnings payouts error:", err);
    return fail(res, "Failed to fetch payout history", 500);
  }
}