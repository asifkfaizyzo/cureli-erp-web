// landing-web/src/api/axios.js (do not remove this comment)
import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 15000,
});

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
API.interceptors.response.use(
  (response) => response,

  (error) => {
    // ── Backend offline / not running / network down / timeout ────────────
    // Normalize the error so ALL existing catch blocks work without changes.
    // Components doing err?.response?.data?.message will get the right text.
    if (error.request && !error.response) {
      const isTimeout = error.code === "ECONNABORTED";

      const message = isTimeout
        ? "Request timed out. Please try again."
        : "Unable to reach the server. Please check your connection.";

      error.response = {
        status: 503,
        data: {
          success: false,
          message,
        },
      };

      error.isNetworkError = true;
      error.isTimeout      = isTimeout;
    }

    return Promise.reject(error);
  },
);

export default API;