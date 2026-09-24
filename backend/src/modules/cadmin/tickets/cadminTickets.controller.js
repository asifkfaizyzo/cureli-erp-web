// backend/src/modules/cadmin/tickets/cadminTickets.controller.js (do not remove this comment)
//backend\src\modules\cadmin\tickets\cadminTickets.controller.js
import { success, fail } from "../../../utils/response.js";
import * as svc from "../../tickets/tickets.service.js";
// ↑ CADMIN imports the SAME service as user side
import * as audit from "../../audit/index.js";

export async function getAllTicketsController(req, res) {
  try {
    const result = await svc.getAllTickets(req.validated);
    return success(res, result);
  } catch (err) {
    return fail(res, "Failed to fetch tickets", 500);
  }
}

export async function getTicketStatsController(req, res) {
  try {
    const stats = await svc.getCAdminTicketStats();
    return success(res, stats);
  } catch (err) {
    return fail(res, "Failed to fetch stats", 500);
  }
}

export async function getTicketByIdController(req, res) {
  try {
    const ticket = await svc.getTicketById(
      req.params.ticket_id,
      null, // no shop scope — cadmin sees all
      "CADMIN",
    );
    if (!ticket) return fail(res, "Ticket not found", 404);
    return success(res, { ticket });
  } catch (err) {
    return fail(res, "Failed to fetch ticket", 500);
  }
}

export async function getTicketActivitiesController(req, res) {
  try {
    const activities = await svc.getTicketActivities(
      req.params.ticket_id,
      "CADMIN",
    );
    return success(res, { activities });
  } catch (err) {
    if (err.code === "TICKET_NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, "Failed to fetch activities", 500);
  }
}

export async function updateTicketStatusController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { status, note, is_internal } = req.validated;
    const { cadmin_id } = req.cadmin;

    // ── Fetch cadmin name from DB to guarantee actor_name is never undefined ──
    const prisma = (await import("../../../config/prisma.js")).default;
    const cadmin = await prisma.cAdmin.findUnique({
      where: { cadmin_id },
      select: { name: true },
    });
    const actor_name = cadmin?.name || "Admin";

    const ticket = await svc.applyTicketTransition({
      ticket_id,
      shop_id: null,
      to_status: status,
      actor_type: "CADMIN",
      actor_id: cadmin_id,
      actor_name, // ← guaranteed string
      actor_role: "CADMIN",
      note,
      is_internal: is_internal || false,
      auditContext: audit.extractRequestContext(req),
    });

    return success(res, { ticket }, "Ticket updated successfully");
  } catch (err) {
    const MAP = {
      TICKET_NOT_FOUND: 404,
      INVALID_TRANSITION: 400,
      REOPEN_LIMIT_EXCEEDED: 400,
      NOTE_REQUIRED: 400,
      CANNOT_UPDATE_CANCELLED: 400,
    };
    return fail(res, err.message, MAP[err.code] || 500);
  }
}

export async function addCommentController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { note, is_internal } = req.validated;
    const { cadmin_id } = req.cadmin;

    const prisma = (await import("../../../config/prisma.js")).default;
    const cadmin = await prisma.cAdmin.findUnique({
      where: { cadmin_id },
      select: { name: true },
    });
    const actor_name = cadmin?.name || "Admin";

    await svc.addTicketComment({
      ticket_id,
      shop_id: null,
      actor_type: "CADMIN",
      actor_id: cadmin_id,
      actor_name, // ← guaranteed string
      actor_role: "CADMIN",
      note,
      is_internal: is_internal || false,
    });

    return success(res, {}, "Comment added");
  } catch (err) {
    if (err.code === "TICKET_NOT_FOUND") return fail(res, err.message, 404);
    return fail(res, err.message, 400);
  }
}
