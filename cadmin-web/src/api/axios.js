// cadmin-web/src/api/axios.js (do not remove this comment)
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const CAdminAPI = axios.create({
  baseURL: `${API_URL}/cadmin`,
  withCredentials: true,
  timeout: 15000,
});

// ============================================
// HELPER: Decode JWT and check expiry
// ============================================
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp - 60000;
  } catch {
    return true;
  }
}

// ============================================
// HELPER: Refresh token
// ============================================
async function refreshAccessToken() {
  try {
    const response = await CAdminAPI.get("/refresh");
    const newToken = response.data?.data?.access_token;
    if (newToken) {
      localStorage.setItem("cadmin_access_token", newToken);
      return newToken;
    }
    throw new Error("No token in response");
  } catch (error) {
    console.error("Token refresh failed:", error.message);
    localStorage.removeItem("cadmin_access_token");
    throw error;
  }
}

let isRefreshing   = false;
let refreshPromise = null;

// ============================================
// REQUEST INTERCEPTOR
// ============================================
CAdminAPI.interceptors.request.use(
  async (config) => {
    const skipUrls = [
      "/login",
      "/verify-otp",
      "/refresh",
      "/logout",
      "/forgot-password",
      "/reset-password",
    ];
    const shouldSkip = skipUrls.some((url) => config.url?.includes(url));

    if (shouldSkip) return config;

    let token = localStorage.getItem("cadmin_access_token");

    if (isTokenExpired(token)) {
      if (!isRefreshing) {
        isRefreshing   = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing   = false;
          refreshPromise = null;
        });
      }

      try {
        token = await refreshPromise;
      } catch (error) {
        window.location.href = "/";
        return Promise.reject(error);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
CAdminAPI.interceptors.response.use(
  (response) => response,

  async (error) => {
    // ── Backend offline / not running / network down / timeout ────────────
    // Normalize the error so ALL existing catch blocks work without changes.
    // Components doing err?.response?.data?.message will get the right text.
    if (error.request && !error.response) {
      const isTimeout = error.code === "ECONNABORTED";

      const message = isTimeout
        ? "Request timed out. Please try again."
        : "Unable to reach the server. The system may be offline. Please try again later.";

      error.response = {
        status: 503,
        data: {
          success: false,
          message,
        },
      };

      error.isNetworkError = true;
      error.isTimeout      = isTimeout;

      return Promise.reject(error);
    }

    // ── Handle 401 with token refresh ─────────────────────────────────────
    const originalRequest = error.config;

    const skipUrls   = ["/login", "/verify-otp", "/refresh", "/logout"];
    const shouldSkip = skipUrls.some((url) =>
      originalRequest.url?.includes(url),
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkip
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return CAdminAPI(originalRequest);
      } catch (refreshError) {
        // If refresh itself got a network error, it already has normalized response
        localStorage.removeItem("cadmin_access_token");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default CAdminAPI;