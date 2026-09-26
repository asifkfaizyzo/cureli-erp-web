// cadmin-web/src/api/cadminProfile.js (do not remove this comment)
import CAdminAPI from "./axios";

/** Full profile + pending counts — called by AuthContext on every mount */
export const getMyProfile = () =>
  CAdminAPI.get("/me");

/** Sidebar badge counts only */
export const getPendingCounts = () =>
  CAdminAPI.get("/pending-counts");

/** Update email and/or phone number */
export const updateContact = (data) =>
  CAdminAPI.patch("/me/contact", data);

/** Update name and/or username (super admin only) */
export const updateIdentity = (data) =>
  CAdminAPI.patch("/me/identity", data);

/** Change password */
export const changePassword = (data) =>
  CAdminAPI.post("/me/change-password", data);

/** Paginated activity log for the current admin */
export const getMyActivity = (params = {}) =>
  CAdminAPI.get("/me/activity", { params });

/** Logout */
export const logoutAdmin = () =>
  CAdminAPI.post("/logout");