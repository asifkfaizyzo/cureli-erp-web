// backend/src/utils/cadminTokens.js (do not remove this comment)
// backend/src/utils/cadminTokens.js

import jwt from "jsonwebtoken";
import {
  ADMIN_ACCESS_EXPIRES,
  ADMIN_REFRESH_EXPIRES,
  ADMIN_ACCESS_SECRET,
  ADMIN_REFRESH_SECRET,
} from "../config/cadmin_jwt.js";

export function generateCAdminAccessToken(payload) {
  return jwt.sign(payload, ADMIN_ACCESS_SECRET, { expiresIn: ADMIN_ACCESS_EXPIRES });
}

export function generateCAdminRefreshToken(payload) {
  return jwt.sign(payload, ADMIN_REFRESH_SECRET, { expiresIn: ADMIN_REFRESH_EXPIRES });
}

export function verifyCAdminAccessToken(token) {
  return jwt.verify(token, ADMIN_ACCESS_SECRET);
}

export function verifyCAdminRefreshToken(token) {
  return jwt.verify(token, ADMIN_REFRESH_SECRET);
}