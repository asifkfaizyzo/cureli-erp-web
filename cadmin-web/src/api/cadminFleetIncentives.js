// cadmin-web/src/api/cadminFleetIncentives.js

import CAdminAPI from "./axios";

const BASE = "/fleet/incentives";

// ============================================
// INCENTIVE TEMPLATES
// ============================================

export function getIncentiveTemplates(params = {}) {
  return CAdminAPI.get(`${BASE}/templates`, { params });
}

export function getIncentiveTemplate(id) {
  return CAdminAPI.get(`${BASE}/templates/${id}`);
}

export function createIncentiveTemplate(data) {
  return CAdminAPI.post(`${BASE}/templates`, data);
}

export function updateIncentiveTemplate(id, data) {
  return CAdminAPI.put(`${BASE}/templates/${id}`, data);
}

export function toggleIncentiveTemplate(id, data) {
  return CAdminAPI.patch(`${BASE}/templates/${id}/toggle`, data);
}

// ============================================
// CALENDAR & SCHEDULES
// ============================================

export function getCalendarSchedule(params = {}) {
  return CAdminAPI.get(`${BASE}/calendar`, { params });
}

export function assignSchedule(data) {
  return CAdminAPI.post(`${BASE}/calendar/assign`, data);
}

export function bulkAssignSchedule(data) {
  return CAdminAPI.post(`${BASE}/calendar/bulk-assign`, data);
}

export function deleteSchedule(scheduleId) {
  return CAdminAPI.delete(`${BASE}/calendar/${scheduleId}`);
}

// ============================================
// MANUAL SHIFT EVALUATION
// ============================================

export function evaluateShift(data) {
  return CAdminAPI.post(`${BASE}/evaluate-shift`, data);
}