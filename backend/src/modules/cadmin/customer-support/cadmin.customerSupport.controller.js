// backend/src/modules/cadmin/customer-support/cadmin.customerSupport.controller.js (do not remove this comment)
import { success, fail } from "../../../utils/response.js";
import {
  listCustomerTicketsSchema,
  updateStatusSchema,
  addReplySchema,
} from "./cadmin.customerSupport.schema.js";
import * as service from "./cadmin.customerSupport.service.js";
import prisma from "../../../config/prisma.js";

async function getAdminName(cadmin_id) {
  const cadmin = await prisma.cAdmin.findUnique({
    where: { cadmin_id },
    select: { name: true },
  });
  return cadmin?.name || "Admin";
}

export async function getAllTicketsHandler(req, res) {
  try {
    const parsed = listCustomerTicketsSchema.safeParse(req.query);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const result = await service.getAllCustomerTickets(parsed.data);
    return success(res, result);
  } catch (err) {
    console.error("[CAdmin Support] getAllTicketsHandler error:", err);
    return fail(res, "Failed to fetch customer tickets", 500);
  }
}

export async function getStatsHandler(_req, res) {
  try {
    const stats = await service.getCustomerTicketStats();
    return success(res, stats);
  } catch (err) {
    console.error("[CAdmin Support] getStatsHandler error:", err);
    return fail(res, "Failed to fetch ticket stats", 500);
  }
}

export async function getTicketDetailHandler(req, res) {
  try {
    const ticket = await service.getCustomerTicketById(req.params.id);
    if (!ticket) return fail(res, "Ticket not found", 404);
    return success(res, { ticket });
  } catch (err) {
    console.error("[CAdmin Support] getTicketDetailHandler error:", err);
    return fail(res, "Failed to fetch ticket detail", 500);
  }
}

export async function updateStatusHandler(req, res) {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const adminName = await getAdminName(req.cadmin.cadmin_id);

    const ticket = await service.updateCustomerTicketStatus({
      ticketId: req.params.id,
      toStatus: parsed.data.status,
      cadminId: req.cadmin.cadmin_id,
      cadminName: adminName,
      note: parsed.data.note,
    });

    return success(res, { ticket }, "Status updated successfully");
  } catch (err) {
    console.error("[CAdmin Support] updateStatusHandler error:", err);
    return fail(res, err.message || "Failed to update status", err.status || 500);
  }
}

export async function replyHandler(req, res) {
  try {
    const parsed = addReplySchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const adminName = await getAdminName(req.cadmin.cadmin_id);

    const activity = await service.addCAdminReply({
      ticketId: req.params.id,
      cadminId: req.cadmin.cadmin_id,
      cadminName: adminName,
      message: parsed.data.message,
      isInternal: parsed.data.is_internal,
    });

    return success(res, { activity }, "Reply added successfully");
  } catch (err) {
    console.error("[CAdmin Support] replyHandler error:", err);
    return fail(res, err.message || "Failed to submit reply", err.status || 500);
  }
}