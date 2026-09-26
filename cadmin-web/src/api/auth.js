// cadmin-web/src/api/auth.js (do not remove this comment)
import CAdminAPI from "./axios";

// LOGIN WITH OTP → sends OTP
export function loginCAdmin(data) {
  return CAdminAPI.post("/login", data);
}

// LOGIN WITHOUT OTP → returns access token directly
export function loginCAdminDirect(data) {
  return CAdminAPI.post("/login-direct", data);
}

// VERIFY OTP → returns access token
export function verifyOtpCAdmin(data) {
  return CAdminAPI.post("/verify-otp", data);
}

// FORGOT PASSWORD
export function forgotPasswordCAdmin(data) {
  return CAdminAPI.post("/forgot-password", data);
}

// RESET PASSWORD
export function resetPasswordCAdmin(data) {
  return CAdminAPI.post("/reset-password", data);
}