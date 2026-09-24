// pharmacy-web/src/api/otp.js (do not remove this comment)
// src/api/otp.js

import API from "./axios";

// SEND EMAIL OTP
export const sendSignupOtp = ({ pending_id, isResend = false }) =>
  API.post("/pending/signup/email-otp", { pending_id, isResend });

// VERIFY EMAIL OTP
export const verifySignupOtp = ({ pending_id, otp }) =>
  API.post("/pending/signup/verify-email", { pending_id, otp });

// SEND SMS OTP
export const sendSmsOtp = (data) =>
  API.post("/pending/signup/sms-otp", data);

// RESEND SMS OTP (explicit resend)
export const resendSmsOtp = ({ pending_id, phone }) =>
  API.post("/pending/signup/sms-otp", { pending_id, phone, isResend: true });

// VERIFY SMS OTP
export const verifySmsOtp = (data) =>
  API.post("/pending/signup/verify-sms", data);