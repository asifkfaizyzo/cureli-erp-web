// pharmacy-web/src/api/axios.js (do not remove this comment)
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  timeout: 15000,
});

// ============================================
// HELPER: Clear auth state
// ============================================
const clearAuthAndRedirect = (reason) => {
  const logout = useAuthStore.getState().logout;
  logout();
  window.location.href = `/login?reason=${reason}`;
};

// ============================================
// HELPER: Handle maintenance mode
// ============================================
const handleMaintenanceMode = (data) => {
  sessionStorage.setItem("maintenance_mode", "true");
  sessionStorage.setItem(
    "maintenance_message",
    data?.message || "System is under maintenance",
  );

  if (!window.location.pathname.includes("/maintenance")) {
    window.location.replace("/maintenance");
  }
};

// ============================================
// REQUEST INTERCEPTOR - Attach access token + branch context
// ============================================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const state = useAuthStore.getState();
    const { branchContext } = state;

    if (branchContext) {
      config.headers["x-branch-mode"] = branchContext.mode;

      if (branchContext.mode === "BRANCH" && branchContext.branch_id) {
        config.headers["x-branch-id"] = branchContext.branch_id;
      }

      if (branchContext.branch_name) {
        config.headers["x-branch-name"] = encodeURIComponent(
          branchContext.branch_name,
        );
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================
// RESPONSE INTERCEPTOR - Handle errors
// ============================================
API.interceptors.response.use(
  (response) => {
    if (response.headers["x-maintenance-mode"] === "true") {
      handleMaintenanceMode({ message: "System is under maintenance" });
    }
    return response;
  },

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

    const originalRequest = error.config;

    // ── Handle maintenance mode (503) ─────────────────────────────────────
    if (error.response?.status === 503) {
      const data = error.response.data;

      if (data?.error === "maintenance" || data?.data?.maintenance_mode) {
        handleMaintenanceMode(data);
        return new Promise(() => {});
      }
    }

    // ── Handle branch context errors ──────────────────────────────────────
    if (error.response?.status === 403) {
      const errorCode = error.response.data?.code;

      if (errorCode === "BRANCH_REQUIRED") {
        console.warn(
          "🚫 Backend rejected: Write operation requires BRANCH mode",
        );
      }

      if (errorCode === "BRANCH_MISMATCH") {
        console.warn("🚫 Backend rejected: Branch access not allowed");
      }
    }

    // ── Handle session invalidation ───────────────────────────────────────
    if (error.response?.data?.data?.code === "SESSION_INVALIDATED") {
      console.warn("🔒 Session invalidated - logged in from another device");
      clearAuthAndRedirect("session_replaced");
      return Promise.reject(error);
    }

    // ── Handle token expiration - try to refresh ──────────────────────────
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh") &&
      !originalRequest.url?.includes("/login")
    ) {
      originalRequest._retry = true;

      try {
        const res = await API.post("/auth/refresh", {});

        const newToken = res.data?.data?.access_token;

        if (newToken) {
          localStorage.setItem("access_token", newToken);
          useAuthStore.getState().updateToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // refreshError already has normalized response if it was a network error
        if (
          refreshError.response?.status === 503 &&
          refreshError.response?.data?.error === "maintenance"
        ) {
          handleMaintenanceMode(refreshError.response.data);
          return new Promise(() => {});
        }

        if (refreshError.response?.data?.data?.code === "SESSION_INVALIDATED") {
          clearAuthAndRedirect("session_replaced");
        } else {
          clearAuthAndRedirect("session_expired");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default API;