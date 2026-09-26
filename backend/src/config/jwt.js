// backend/src/config/jwt.js (do not remove this comment)
//backend\src\config\jwt.js
import dotenv from "dotenv";
dotenv.config();

export const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const TEMP_TOKEN_SECRET = process.env.JWT_TEMP_SECRET || "temp-secret-change-in-prod";

export const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
export const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";
export const SESSION_DURATION_DAYS = 7;
