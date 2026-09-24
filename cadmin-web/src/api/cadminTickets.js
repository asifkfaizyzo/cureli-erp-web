// cadmin-web/src/api/cadminTickets.js (do not remove this comment)
// cadmin-web/src/api/cadminTickets.js

import CAdminAPI from "./axios";

/**
 * Get all tickets with filters and pagination
 */
export const getAllTickets = (params = {}) => {
  return CAdminAPI.get("/tickets", { params });
};

/**
 * Get ticket by ID
 */
export const getTicketById = (ticketId) => {
  return CAdminAPI.get(`/tickets/${ticketId}`);
};

/**
 * Get ticket status history
 */
export const getTicketActivities = (ticketId) =>
  CAdminAPI.get(`/tickets/${ticketId}/activities`);

export const addTicketComment = (ticketId, data) =>
  CAdminAPI.post(`/tickets/${ticketId}/comment`, data);

/**
 * Update ticket status
 */
export const updateTicketStatus = (ticketId, data) => {
  return CAdminAPI.patch(`/tickets/${ticketId}/status`, data);
};

/**
 * Get ticket statistics
 */
export const getTicketStats = () => {
  return CAdminAPI.get("/tickets/stats");
};
