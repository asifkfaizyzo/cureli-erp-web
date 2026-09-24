// backend/src/modules/cadmin/users/cadminUser.schema.js (do not remove this comment)
//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\cadmin\users\cadminUser.schema.js

import { fail } from "../../../utils/response.js";

const ALLOWED_LIMITS = [6, 8, 10, 12, 14, 20];
const ALLOWED_SORT_BY = ["full_name", "username", "last_login_at"];
const ALLOWED_SORT_ORDER = ["asc", "desc"];
const ALLOWED_STATUS = ["active", "inactive", ""];
const ALLOWED_ROLES = ["super_admin", "branch_admin", "staff", ""];

export function validateCAdminUsersQuery(req, res, next) {
  try {
    const raw = req.query || {};

    // normalize
    const search = typeof raw.search === "string" && raw.search.trim() ? raw.search.trim() : "";
    const status = typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "";
    const role = typeof raw.role === "string" ? raw.role.trim().toLowerCase() : "";
    const login_start = raw.login_start ? new Date(raw.login_start) : null;
    const login_end = raw.login_end ? new Date(raw.login_end) : null;
    const sort_by = typeof raw.sort_by === "string" && ALLOWED_SORT_BY.includes(raw.sort_by) ? raw.sort_by : null;
    const sort_order = typeof raw.sort_order === "string" && ALLOWED_SORT_ORDER.includes(raw.sort_order) ? raw.sort_order : "desc";

    const page = Number.isInteger(Number(raw.page)) && Number(raw.page) > 0 ? Number(raw.page) : 1;
    let limit = Number.isInteger(Number(raw.limit)) ? Number(raw.limit) : 10;
    if (!ALLOWED_LIMITS.includes(limit)) limit = 10;

    // validate enums
    if (!ALLOWED_STATUS.includes(status)) {
      return fail(res, "Invalid status filter", 400);
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return fail(res, "Invalid role filter", 400);
    }
    if (login_start && isNaN(login_start.getTime())) {
      return fail(res, "Invalid login_start date", 400);
    }
    if (login_end && isNaN(login_end.getTime())) {
      return fail(res, "Invalid login_end date", 400);
    }

    // attach validated object
    req.validated = {
      search,
      status,
      role,
      login_start,
      login_end,
      sort_by,
      sort_order,
      page,
      limit,
    };

    return next();
  } catch (err) {
    return fail(res, "Invalid query parameters", 400);
  }
}
