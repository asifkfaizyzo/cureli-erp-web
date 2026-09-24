// pharmacy-web/src/api/tickets.js (do not remove this comment)
// pharmacy-web/src/api/tickets.js

import API from "./axios";

// Get tickets with filters & pagination
export const getTickets = (params = {}) => {
  const queryParams = new URLSearchParams();

  const {
    status,
    category,
    branch_id,
    search,
    date_from,
    date_to,
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "desc",
  } = params;

  if (status) queryParams.append("status", status);
  if (category) queryParams.append("category", category);
  if (branch_id) queryParams.append("branch_id", branch_id);
  if (search) queryParams.append("search", search);
  if (date_from) queryParams.append("date_from", date_from);
  if (date_to) queryParams.append("date_to", date_to);
  queryParams.append("page", page);
  queryParams.append("limit", limit);
  queryParams.append("sort_by", sort_by);
  queryParams.append("sort_order", sort_order);

  return API.get(`/tickets?${queryParams.toString()}`);
};

// Get ticket statistics
export const getTicketStats = () => API.get("/tickets/stats");

// Get single ticket by ID
export const getTicketById = (ticket_id) => API.get(`/tickets/${ticket_id}`);

export const getTicketActivities = (ticket_id) =>
  API.get(`/tickets/${ticket_id}/activities`);

// Create new ticket (with optional file attachments)
export const createTicket = (ticketData) => {
  const hasFiles = ticketData.attachments?.length > 0;

  if (hasFiles) {
    const formData = new FormData();

    // Add text fields
    if (ticketData.branch_id)
      formData.append("branch_id", ticketData.branch_id);
    if (ticketData.category) formData.append("category", ticketData.category);
    if (ticketData.other_category_text)
      formData.append("other_category_text", ticketData.other_category_text);
    if (ticketData.subject) formData.append("subject", ticketData.subject);
    if (ticketData.description)
      formData.append("description", ticketData.description);
    if (ticketData.contact_number)
      formData.append("contact_number", ticketData.contact_number);
    if (ticketData.preferred_slot)
      formData.append("preferred_slot", ticketData.preferred_slot);

    // Add files
    ticketData.attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    return API.post("/tickets", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  return API.post("/tickets", ticketData);
};

// Cancel ticket
export const cancelTicket = (ticket_id, reason) =>
  API.post(`/tickets/${ticket_id}/cancel`, { reason });

// Reopen ticket
export const reopenTicket = (ticket_id, reason) =>
  API.post(`/tickets/${ticket_id}/reopen`, { reason });
