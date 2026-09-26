// backend/src/config/cadmin_jwt.js (do not remove this comment)
// src/config/cadmin_jwt.js
import dotenv from "dotenv";
dotenv.config();

const ADMIN_ACCESS_EXPIRES = process.env.ADMIN_ACCESS_TOKEN_EXPIRES || "15m";
const ADMIN_REFRESH_EXPIRES = process.env.ADMIN_REFRESH_TOKEN_EXPIRES || "7d";
const ADMIN_ACCESS_SECRET = process.env.ADMIN_JWT_ACCESS_SECRET;
const ADMIN_REFRESH_SECRET = process.env.ADMIN_JWT_REFRESH_SECRET;

if (!ADMIN_ACCESS_SECRET || !ADMIN_REFRESH_SECRET) {
  console.error(" CRITICAL: ADMIN_JWT secrets not set in .env");
  process.exit(1);
}

export {
  ADMIN_ACCESS_EXPIRES,
  ADMIN_REFRESH_EXPIRES,
  ADMIN_ACCESS_SECRET,
  ADMIN_REFRESH_SECRET,
};
