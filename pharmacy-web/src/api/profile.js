// pharmacy-web/src/api/profile.js (do not remove this comment)
// src/api/profile.js

import API from "./axios";

// ============================================
// GET PROFILE
// ============================================
export const getProfile = () => API.get("/profile");

// ============================================
// BUSINESS INFO
// ============================================
export const updateBusiness = (data) => API.put("/profile/business", data);

// ============================================
// PASSWORD
// ============================================
export const changePassword = (data) => API.post("/profile/password", data);

// ============================================
// EMAIL CHANGE
// ============================================
export const initiateEmailChange = (data) => API.post("/profile/email/initiate", data);
export const verifyEmailChange = (data) => API.post("/profile/email/verify", data);

// ============================================
// PHONE CHANGE - OTP METHOD
// ============================================
// Step 1: Send OTP to old phone
export const initiatePhoneVerifyOld = () => API.post("/profile/phone/verify-old");

// Step 1b: Verify old phone OTP (separate from sending to new)
export const verifyOldPhoneOtp = (data) => API.post("/profile/phone/verify-old-otp", data);

// Step 2: Send OTP to new phone (after old verified)
export const initiatePhoneNew = (data) => API.post("/profile/phone/initiate-new", data);

// Step 3: Verify new phone OTP
export const verifyPhoneNew = (data) => API.post("/profile/phone/verify-new", data);

// ============================================
// PHONE CHANGE - PASSWORD METHOD
// ============================================
// Step 1: Verify password + send OTP to new phone
export const initiatePhoneChangeWithPassword = (data) => 
  API.post("/profile/phone/change-with-password", data);

// Step 2: Same as above - verifyPhoneNew

// ============================================
// SESSIONS
// ============================================
export const getSessions = () => API.get("/profile/sessions");
export const logoutSession = (sessionId) => API.delete(`/profile/sessions/${sessionId}`);
export const logoutOtherSessions = () => API.delete("/profile/sessions/others");