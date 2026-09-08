//backend\src\modules\rider\auth\rider.auth.routes.js
import { Router } from "express";
import { riderAuth } from "../../../middleware/rider.auth.js";
import {
  checkPhone,
  sendOtp,
  verifyOtp,
  login,
  setPassword,
  refreshToken,
  logout,
  logoutAll,
  getMe,
} from "./rider.auth.controller.js";

const router = Router();

// ── Public — no auth required ─────────────────────────────────
router.post("/check-phone",    checkPhone);
router.post("/send-otp",       sendOtp);
router.post("/verify-otp",     verifyOtp);
router.post("/login",          login);
router.post("/set-password",   setPassword);
router.post("/refresh",        refreshToken);

// ── Protected — requires valid rider session ──────────────────
router.post("/logout",         riderAuth, logout);
router.post("/logout-all",     riderAuth, logoutAll);
router.get("/me",              riderAuth, getMe);

export default router;