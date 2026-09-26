// pharmacy-web/src/api/marketplaceDashboard.js (do not remove this comment)
// src/api/marketplaceDashboard.js

import api from './axios';

/**
 * Fetch the full marketplace dashboard payload.
 * Single endpoint — all aggregation happens server-side.
 *
 * @returns {Promise<AxiosResponse>}
 */
const getDashboard = () => api.get('/marketplace/dashboard');

const marketplaceDashboardAPI = { getDashboard };

export default marketplaceDashboardAPI;