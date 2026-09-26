// cadmin-web/src/api/cadminCoupons.js (do not remove this comment)
// cadmin-web/src/api/cadminCoupons.js
import CAdminAPI from "./axios";

export const listCoupons = (params) => 
  CAdminAPI.get("/coupons", { params });

export const getCouponDetail = (id) => 
  CAdminAPI.get(`/coupons/${id}`);

export const createCoupon = (data) => 
  CAdminAPI.post("/coupons", data);

export const updateCoupon = (id, data) => 
  CAdminAPI.patch(`/coupons/${id}`, data);

export const toggleCouponActive = (id, is_active) => 
  CAdminAPI.patch(`/coupons/${id}/toggle`, { is_active });

export const deleteCoupon = (id) => 
  CAdminAPI.delete(`/coupons/${id}`);