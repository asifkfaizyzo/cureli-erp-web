// backend/src/modules/tickets/tickets.controller.js (do not remove this comment)
import { success, fail } from "../../utils/response.js";
import * as svc from "./tickets.service.js";
import * as audit from "../audit/index.js";

export async function createTicketController(req, res) {
  try {
    const { shop_id, branch_id: userBranchId, user_id, role } = req.user;
    if (!shop_id) return fail(res, "Shop not found", 400);

    const ticket = await svc.createTicket({
      shop_id,
      branch_id:       req.body.branch_id || userBranchId || null,
      user_id,
      user_branch_id:  userBranchId,
      user_role:       role,
      contact_number:  req.body.contact_number,
      category:        req.body.category,
      subject:         req.body.subject,
      description:     req.body.description,
      other_category_text: req.body.other_category_text,
      preferred_slot:  req.body.preferred_slot,
      files:           req.files || [],
      auditContext:    audit.extractRequestContext(req),
    });

    return success(res, { ticket }, "Ticket created successfully", 201);
  } catch (err) {
    const MAP = {
      INVALID_BRANCH:        400,
      BRANCH_ACCESS_DENIED:  403,
      RATE_LIMIT_EXCEEDED:   429,
      DUPLICATE_TICKET:      409,
    };
    return fail(res, err.message, MAP[err.code] || 500);
  }
}

export async function getTicketsController(req, res) {
  try {
    const { shop_id, role, branch_id } = req.user;
    if (!shop_id) return fail(res, "Shop not found", 400);

    const result = await svc.getTickets({
      shop_id,
      requester_role:      role,
      requester_branch_id: branch_id,
      ...req.query,
    });
    return success(res, result);
  } catch (err) {
    return fail(res, "Failed to fetch tickets", 500);
  }
}

export async function getTicketController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { shop_id, role, branch_id } = req.user;

    const ok = await svc.canAccessTicket(ticket_id, shop_id, role, branch_id);
    if (!ok) return fail(res, "Ticket not found or access denied", 404);

    const ticket = await svc.getTicketById(ticket_id, shop_id, "ERP_USER");
    if (!ticket) return fail(res, "Ticket not found", 404);

    return success(res, { ticket });
  } catch (err) {
    return fail(res, "Failed to fetch ticket", 500);
  }
}

export async function getTicketStatsController(req, res) {
  try {
    const { shop_id, role, branch_id } = req.user;
    const stats = await svc.getTicketStats(shop_id, role, branch_id);
    return success(res, { stats });
  } catch (err) {
    return fail(res, "Failed to fetch stats", 500);
  }
}

// ── Both cancel and reopen now go through applyTicketTransition ──────────────

export async function cancelTicketController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { shop_id, user_id, role, branch_id } = req.user;
    const { reason } = req.body;

    const ok = await svc.canAccessTicket(ticket_id, shop_id, role, branch_id);
    if (!ok) return fail(res, "Ticket not found or access denied", 404);

    const actor = await import("../../config/prisma.js").then((m) =>
      m.default.user.findUnique({
        where:  { user_id },
        select: { full_name: true },
      })
    );

    const ticket = await svc.applyTicketTransition({
      ticket_id,
      shop_id,
      to_status:   "CANCELLED",
      actor_type:  "ERP_USER",
      actor_id:    user_id,
      actor_name:  actor?.full_name || "User",
      actor_role:  role,
      note:        reason,
      is_internal: false,
      auditContext: audit.extractRequestContext(req),
    });

    return success(res, { ticket }, "Ticket cancelled successfully");
  } catch (err) {
    const MAP = {
      TICKET_NOT_FOUND:   404,
      INVALID_TRANSITION: 400,
      NOTE_REQUIRED:      400,
    };
    return fail(res, err.message, MAP[err.code] || 500);
  }
}

export async function reopenTicketController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { shop_id, user_id, role, branch_id } = req.user;
    const { reason } = req.body;

    const ok = await svc.canAccessTicket(ticket_id, shop_id, role, branch_id);
    if (!ok) return fail(res, "Ticket not found or access denied", 404);

    const actor = await import("../../config/prisma.js").then((m) =>
      m.default.user.findUnique({
        where:  { user_id },
        select: { full_name: true },
      })
    );

    const ticket = await svc.applyTicketTransition({
      ticket_id,
      shop_id,
      to_status:   "PENDING",
      actor_type:  "ERP_USER",
      actor_id:    user_id,
      actor_name:  actor?.full_name || "User",
      actor_role:  role,
      note:        reason,
      is_internal: false,
      auditContext: audit.extractRequestContext(req),
    });

    return success(res, { ticket }, "Ticket reopened successfully");
  } catch (err) {
    const MAP = {
      TICKET_NOT_FOUND:      404,
      INVALID_TRANSITION:    400,
      REOPEN_LIMIT_EXCEEDED: 400,
      NOTE_REQUIRED:         400,
    };
    return fail(res, err.message, MAP[err.code] || 500);
  }
}