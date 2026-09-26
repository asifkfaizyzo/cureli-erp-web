// cadmin-web/src/api/cadminCustomerTickets.js (do not remove this comment)
//cadmin-web\src\api\cadminCustomerTickets.js
import api from "./axios";

export const getAllCustomerTickets = (params) => {
  return api.get("/customer-tickets", { params });
};

export const getCustomerTicketStats = () => {
  return api.get("/customer-tickets/stats");
};

export const getCustomerTicketById = (ticketId) => {
  return api.get(`/customer-tickets/${ticketId}`);
};

export const updateCustomerTicketStatus = (ticketId, data) => {
  return api.patch(`/customer-tickets/${ticketId}/status`, data);
};

export const addCustomerTicketReply = (ticketId, data) => {
  return api.post(`/customer-tickets/${ticketId}/reply`, data);
};