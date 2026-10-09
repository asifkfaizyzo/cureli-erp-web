// pharmacy-web/src/api/marketplacePayouts.js

import API from "./axios";

const BASE = "/marketplace/payouts";

export const getCurrentWeekPayout = () =>
  API.get(`${BASE}/current`).then((r) => r.data);

export const getEarningsSummary = () =>
  API.get(`${BASE}/summary`).then((r) => r.data);

export const getPayoutHistory = (params = {}) =>
  API.get(`${BASE}/history`, { params }).then((r) => r.data);

export const getPayoutDetail = (payoutId) =>
  API.get(`${BASE}/${payoutId}`).then((r) => r.data);