// cadmin-web/src/api/cadminDashboard.js (do not remove this comment)
// src/api/cadminDashboard.js

import CAdminAPI from "./axios";

const log = (...args) => {
  if (process.env.NODE_ENV !== "production") {
    // console.log("[DASHBOARD API]", ...args);
  }
};

export async function getDashboardOverview(period = "30d") {
  try {
    const response = await CAdminAPI.get("/dashboard/overview", { params: { period } });
    return response.data;
  } catch (error) {
    log("Overview error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getRevenueData(period = "30d") {
  try {
    const response = await CAdminAPI.get("/dashboard/revenue", { params: { period } });
    return response.data;
  } catch (error) {
    log("Revenue error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getUserGrowthData(period = "30d") {
  try {
    const response = await CAdminAPI.get("/dashboard/user-growth", { params: { period } });
    return response.data;
  } catch (error) {
    log("User growth error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getSubscriptionDistribution() {
  try {
    const response = await CAdminAPI.get("/dashboard/subscriptions");
    return response.data;
  } catch (error) {
    log("Subscription distribution error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getRecentOnboarding(page = 1, limit = 5) {
  try {
    const response = await CAdminAPI.get("/dashboard/onboarding", { params: { page, limit } });
    return response.data;
  } catch (error) {
    log("Onboarding error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getTopShops(period = "30d", page = 1, limit = 5) {
  try {
    const response = await CAdminAPI.get("/dashboard/top-shops", { params: { period, page, limit } });
    return response.data;
  } catch (error) {
    log("Top shops error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getRecentActivity(limit = 10) {
  try {
    const response = await CAdminAPI.get("/dashboard/activity", { params: { limit } });
    return response.data;
  } catch (error) {
    log("Activity error:", error.response?.data || error.message);
    throw error;
  }
}

export async function getDashboardAlerts() {
  try {
    const response = await CAdminAPI.get("/dashboard/alerts");
    return response.data;
  } catch (error) {
    log("Alerts error:", error.response?.data || error.message);
    throw error;
  }
}

export default {
  getDashboardOverview,
  getRevenueData,
  getUserGrowthData,
  getSubscriptionDistribution,
  getRecentOnboarding,
  getTopShops,
  getRecentActivity,
  getDashboardAlerts,
};