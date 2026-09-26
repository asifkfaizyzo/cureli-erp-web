// backend/src/modules/cadmin/cadminDocs/cadminDocs.schema.js (do not remove this comment)
// backend/src/modules/cadmin/cadminDocs/cadminDocs.schema.js

import { z } from "zod";

/**
 * Schema for rejecting a document
 * Reason is required and must be at least 3 characters
 */
export const rejectSchema = z.object({
  reason: z
    .string()
    .min(3, "Rejection reason must be at least 3 characters")
    .max(500, "Rejection reason cannot exceed 500 characters")
    .trim(),
});

/**
 * Custom validation middleware for list query parameters
 * Handles filtering, sorting, pagination for verification list
 */
export function validateVerificationQuery(req, res, next) {
  try {
    const raw = req.query || {};

    // Search (shop name, owner name, email, gst)
    const search =
      typeof raw.search === "string" && raw.search.trim()
        ? raw.search.trim()
        : "";

    // Status filter (pending_review, verified, partially_rejected, rejected)
    const status =
      typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "";
    const ALLOWED_STATUS = [
      "pending",
      "pending_review",
      "verified",
      "partially_rejected",
      "rejected",
      "",
    ];
    if (!ALLOWED_STATUS.includes(status)) {
      const e = new Error("Invalid status filter");
      e.status = 400;
      throw e;
    }

    // Resubmission count filter (minimum resubmission count)
    const resubmissionCountMin = raw.resubmissionCountMin
      ? Math.max(0, Number(raw.resubmissionCountMin))
      : 0;

    // Date filter (submission date range)
    const dateStart = raw.dateStart ? new Date(raw.dateStart) : null;
    const dateEnd = raw.dateEnd ? new Date(raw.dateEnd) : null;

    if (dateStart && isNaN(dateStart.getTime())) {
      const e = new Error("Invalid dateStart");
      e.status = 400;
      throw e;
    }
    if (dateEnd && isNaN(dateEnd.getTime())) {
      const e = new Error("Invalid dateEnd");
      e.status = 400;
      throw e;
    }

    // Sorting
    const ALLOWED_SORT_BY = [
      "business_name",
      "owner_name",
      "verification_status",
      "resubmission_count",
      "created_at",
    ];
    const sort_by =
      typeof raw.sort_by === "string" && ALLOWED_SORT_BY.includes(raw.sort_by)
        ? raw.sort_by
        : "created_at";
    const sort_order =
      typeof raw.sort_order === "string" &&
      ["asc", "desc"].includes(raw.sort_order)
        ? raw.sort_order
        : "desc";

    // Pagination
    const page =
      Number.isInteger(Number(raw.page)) && Number(raw.page) > 0
        ? Number(raw.page)
        : 1;

    let limit = Number.isInteger(Number(raw.limit)) ? Number(raw.limit) : 10;
    limit = Math.max(5, Math.min(50, limit));

    // Attach validated object to request
    req.validated = {
      search,
      status,
      resubmissionCountMin,
      dateStart,
      dateEnd,
      sort_by,
      sort_order,
      page,
      limit,
    };

    return next();
  } catch (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Invalid query parameters",
    });
  }
}
