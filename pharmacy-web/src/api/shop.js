// pharmacy-web/src/api/shop.js (do not remove this comment)
// src/api/shop.js

import API from "./axios";

// Existing - keep these
export const updateShopInfo = (data) =>
  API.patch("/shop/setup/info", data);

export const updateShopGst = (data) =>
  API.patch("/shop/setup/gst", data);

// NEW: Get full shop profile for invoice printing
export const getShopProfile = () =>
  API.get("/shop/profile");