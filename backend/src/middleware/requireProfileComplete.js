// backend/src/middleware/requireProfileComplete.js (do not remove this comment)
// src/middleware/requireProfileComplete.js

import { fail } from "../utils/response.js";

/**
 * Gate middleware — blocks access if user has not completed their profile.
 *
 * Required profile fields: full_name, date_of_birth, sex.
 * profile_complete is set to true by updateMobileProfile once all three
 * are filled. It never reverts to false.
 *
 * Apply AFTER mobileAuth (which populates req.mobileUser).
 *
 * Routes that must NOT use this middleware:
 *   - PATCH /mobile/users/profile
 *   - GET  /mobile/auth/me
 *   - POST /mobile/auth/logout
 *   - POST /mobile/auth/logout-all
 *   - POST /mobile/users/account/delete/*
 *   - GET/POST/PATCH/DELETE /mobile/users/members
 */
export function requireProfileComplete(req, res, next) {
  if (!req.mobileUser.profile_complete) {
    return fail(res, "Please complete your profile to continue.", 403, {
      code: "PROFILE_INCOMPLETE",
    });
  }
  next();
}