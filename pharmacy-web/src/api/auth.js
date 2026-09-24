// pharmacy-web/src/api/auth.js (do not remove this comment)
// src/api/auth.js

import API from "./axios";

// ============================================
//  AUTH APIs
// ============================================

export const signupUser = (data) =>
  API.post("/pending/signup/start", data);

export const loginUser = (data) =>
  API.post("/auth/login", data);

export const verifyLoginOtp = (data) =>
  API.post("/auth/verify-login-otp", data);

// NEW: Resend Login OTP
export const resendLoginOtp = (data) =>
  API.post("/auth/resend-login-otp", data);

export const saveUsername = (data) =>
  API.post("/pending/signup/username", data);

export const checkUsernameAvailability = (username) =>
  API.post("/pending/signup/check-username", { username });

export const completeSignup = (data) =>
  API.post("/pending/signup/complete", data);

export const forgotPassword = (data) =>
  API.post("/auth/forgot-password", data);

export const resetPassword = (data) =>
  API.post("/auth/reset-password", data);

export const googleSignup = (data) =>
  API.post("/pending/signup/google", data);

export const googleSetPassword = (data) =>
  API.post("/pending/signup/google/set-password", data);

export const completeOnboarding = () =>
  API.post("/auth/complete-onboarding");

export const updateOnboardingStep = (step) =>
  API.post("/auth/onboarding-step", { step });

export const getOnboardingStatus = () =>
  API.get("/auth/onboarding-status");

export const getUserPermissions = () =>
  API.get("/auth/permissions");

export const logoutUser = () =>
  API.post("/auth/logout");