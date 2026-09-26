// pharmacy-web/src/api/setup.js (do not remove this comment)
// src/api/setup.js
import API from "./axios";

/**
 * Get setup status
 * Checks if setup is complete for the current shop
 */
export const getSetupStatus = () => API.get("/setup/status");

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = (username) =>
  API.post("/setup/check-username", { username });

/**
 * Check if a phone number is already registered
 */
export const checkPhoneAvailability = (phone_number) =>
  API.post("/setup/check-phone", { phone_number });

/**
 * Submit complete setup data
 * Creates branches and users in one transaction
 */
export const submitSetup = (data) => API.post("/setup/complete", data);