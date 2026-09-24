// cadmin-web/src/api/otp.js (do not remove this comment)
import API from "./axios";

// SEND EMAIL OTP
export const sendSignupOtp = ({ pending_id }) =>
  API.post("/pending/signup/email-otp", { pending_id });

// VERIFY EMAIL OTP
export const verifySignupOtp = ({ pending_id, otp }) =>
  API.post("/pending/signup/verify-email", { pending_id, otp });

// SEND SMS OTP
export const sendSmsOtp = (data) =>
  API.post("/pending/signup/sms-otp", data);

// VERIFY SMS OTP
export const verifySmsOtp = (data) =>
  API.post("/pending/signup/verify-sms", data);
