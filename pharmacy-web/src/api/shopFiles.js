// pharmacy-web/src/api/shopFiles.js (do not remove this comment)
// pharmacy-web/src/api/shopFiles.js

import API from "./axios";

// Upload file during onboarding
export const uploadShopFile = (formData) =>
  API.post("/shop/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Get verification status
export const getVerificationStatus = () =>
  API.get("/shop/files/verification-status");

// Get all rejected files for resubmission
export const getRejectedFiles = () => API.get("/shop/files/rejected");

// Resubmit a rejected file
export const resubmitFile = (file_id, formData) =>
  API.post(`/shop/files/${file_id}/resubmit`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Send message about a file
export const sendFileMessage = (file_id, message) =>
  API.post(`/shop/files/${file_id}/message`, { message });
