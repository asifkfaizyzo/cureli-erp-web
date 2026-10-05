// backend/src/modules/rider/earnings/rider.earnings.schema.js (do not remove this comment)

/**
 * Lightweight query-param parsers for the earnings endpoints.
 * No external validation library needed — these mirror the
 * simple inline style used across the rider modules.
 */

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Parses a YYYY-MM-DD string into a local Date at midnight.
 * Returns null for invalid / missing input.
 */
export function parseDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const d = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
    0,
    0,
    0,
    0,
  );
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parses a YYYY-MM-DD string into Monday 6:00 AM local time.
 * The caller is expected to always pass the Monday of the desired week.
 */
export function parseWeekStart(weekStartStr) {
  if (!weekStartStr || typeof weekStartStr !== "string") return null;
  const parts = weekStartStr.split("-");
  if (parts.length !== 3) return null;
  const d = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
    6,
    0,
    0,
    0,
  );
  return isNaN(d.getTime()) ? null : d;
}