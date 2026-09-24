// backend/src/modules/mobile/support/mobile.support.controller.js (do not remove this comment)
import { success, fail } from "../../../utils/response.js";
import {
  createTicketSchema,
  addReplySchema,
  listTicketsSchema,
} from "./mobile.support.schema.js";
import * as supportService from "./mobile.support.service.js";

export async function createTicketHandler(req, res) {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0].message, 400);
    }

    const ticket = await supportService.createCustomerTicket({
      customerId: req.mobileUser.id,
      orderId: parsed.data.order_id,
      category: parsed.data.category,
      otherCategoryText: parsed.data.other_category_text,
      subject: parsed.data.subject,
      description: parsed.data.description,
      files: req.files || [],
    });

    return success(res, { ticket }, "Support ticket created successfully", 201);
  } catch (err) {
    console.error("[Mobile Support] createTicketHandler error:", err);
    return fail(res, err.message || "Failed to create support ticket", err.status || 500);
  }
}

export async function getMyTicketsHandler(req, res) {
  try {
    const parsed = listTicketsSchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0].message, 400);
    }

    const result = await supportService.getCustomerTickets(req.mobileUser.id, parsed.data);
    return success(res, result, "Tickets fetched successfully");
  } catch (err) {
    console.error("[Mobile Support] getMyTicketsHandler error:", err);
    return fail(res, "Failed to fetch tickets", 500);
  }
}

export async function getTicketDetailHandler(req, res) {
  try {
    const ticket = await supportService.getCustomerTicketDetail(
      req.params.id,
      req.mobileUser.id
    );
    return success(res, { ticket }, "Ticket details fetched");
  } catch (err) {
    console.error("[Mobile Support] getTicketDetailHandler error:", err);
    return fail(res, err.message || "Failed to fetch ticket", err.status || 500);
  }
}

export async function replyTicketHandler(req, res) {
  try {
    const parsed = addReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0].message, 400);
    }

    const result = await supportService.addCustomerReply(
      req.params.id,
      req.mobileUser.id,
      parsed.data.message
    );
    return success(res, result, "Reply added successfully");
  } catch (err) {
    console.error("[Mobile Support] replyTicketHandler error:", err);
    return fail(res, err.message || "Failed to submit reply", err.status || 500);
  }
}