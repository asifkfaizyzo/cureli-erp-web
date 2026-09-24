// backend/src/modules/cadmin/tickets/cadminTickets.service.js (do not remove this comment)
// ============================================
// backend\src\modules\cadmin\tickets\cadminTickets.service.js
// ============================================

import prisma from "../../../config/prisma.js";
import { notifyAsync } from "../../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";
import * as audit from "../../audit/index.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate priority based on reopen count
 */
function calculatePriority(reopenCount) {
  if (reopenCount === 0) return "LOW";
  if (reopenCount <= 2) return "MEDIUM";
  if (reopenCount <= 4) return "HIGH";
  return "CRITICAL";
}

/**
 * Get reopen count range for priority filter
 */
function getPriorityReopenRange(priority) {
  switch (priority) {
    case "LOW":
      return { equals: 0 };
    case "MEDIUM":
      return { in: [1, 2] };
    case "HIGH":
      return { in: [3, 4] };
    case "CRITICAL":
      return { in: [5, 6] };
    default:
      return undefined;
  }
}

/**
 * Transform ticket for CAdmin response
 */
function transformTicketForCAdmin(ticket) {
  const priority = calculatePriority(ticket.reopen_count || 0);

  return {
    ticket_id: ticket.ticket_id,
    ticket_number: ticket.ticket_number,

    shop_id: ticket.shop_id,
    shop_name: ticket.shop?.business_name || null,
    branch_id: ticket.branch_id,
    branch_name: ticket.branch?.branch_name || null,

    created_by_user_id: ticket.created_by_user_id,
    created_by_name: ticket.created_by?.full_name || null,
    created_by_role: ticket.created_by?.role || null,
    created_by_phone: ticket.created_by?.phone_number || null,
    created_by_email: ticket.created_by?.email || null,

    contact_number: ticket.contact_number,
    category: ticket.category,
    other_category_text: ticket.other_category_text,
    subject: ticket.subject,
    description: ticket.description,
    preferred_slot: ticket.preferred_slot,

    status: ticket.status,
    priority,
    admin_notes: ticket.admin_notes,

    cancelled_at: ticket.cancelled_at,
    cancelled_by_id: ticket.cancelled_by_id,
    cancelled_by_name: ticket.cancelled_by?.full_name || null,
    cancellation_reason: ticket.cancellation_reason,

    reopened_at: ticket.reopened_at,
    reopened_by_id: ticket.reopened_by_id,
    reopened_by_name: ticket.reopened_by?.full_name || null,
    reopen_count: ticket.reopen_count || 0,
    reopen_reason: ticket.reopen_reason,

    attachments: ticket.attachments || [],
    attachment_count:
      ticket._count?.attachments || ticket.attachments?.length || 0,

    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

// ============================================
// GET ALL TICKETS
// ============================================

export async function getAllTickets({
  page = 1,
  limit = 10,
  search,
  status,
  category,
  priority,
  shop_name,
  date_from,
  date_to,
  sort_by = "created_at",
  sort_order = "desc",
}) {
  try {
    const where = {};

    if (search) {
      where.OR = [
        { ticket_number: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { shop: { business_name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      const reopenRange = getPriorityReopenRange(priority);
      if (reopenRange) {
        where.reopen_count = reopenRange;
      }
    }

    if (shop_name) {
      where.shop = {
        ...where.shop,
        business_name: { contains: shop_name, mode: "insensitive" },
      };
    }

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) {
        where.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setDate(endDate.getDate() + 1);
        where.created_at.lt = endDate;
      }
    }

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort_by]: sort_order },
        include: {
          shop: {
            select: {
              shop_id: true,
              business_name: true,
            },
          },
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
            },
          },
          created_by: {
            select: {
              user_id: true,
              full_name: true,
              role: true,
            },
          },
          cancelled_by: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          reopened_by: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          _count: {
            select: { attachments: true },
          },
        },
      }),
    ]);

    return {
      tickets: tickets.map(transformTicketForCAdmin),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("getAllTickets error:", error);
    throw error;
  }
}

// ============================================
// GET TICKET STATS
// ============================================

export async function getTicketStats() {
  try {
    const [total, pending, in_progress, resolved, closed, cancelled] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "PENDING" } }),
        prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
        prisma.ticket.count({ where: { status: "RESOLVED" } }),
        prisma.ticket.count({ where: { status: "CLOSED" } }),
        prisma.ticket.count({ where: { status: "CANCELLED" } }),
      ]);

    return {
      total,
      pending,
      in_progress,
      resolved,
      closed,
      cancelled,
    };
  } catch (error) {
    console.error("getTicketStats error:", error);
    throw error;
  }
}

// ============================================
// GET TICKET BY ID
// ============================================

export async function getTicketById(ticket_id) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
      include: {
        shop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        created_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
            phone_number: true,
            email: true,
          },
        },
        cancelled_by: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        reopened_by: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        attachments: {
          select: {
            attachment_id: true,
            storage_key: true,
            original_name: true,
            mime_type: true,
            file_size: true,
            uploaded_at: true,
          },
        },
      },
    });

    if (!ticket) return null;

    return transformTicketForCAdmin(ticket);
  } catch (error) {
    console.error("getTicketById error:", error);
    throw error;
  }
}

// ============================================
// GET TICKET STATUS HISTORY
// ============================================

export async function getTicketStatusHistory(ticket_id) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
      select: { ticket_id: true },
    });

    if (!ticket) {
      const err = new Error("Ticket not found");
      err.code = "TICKET_NOT_FOUND";
      throw err;
    }

    const history = await prisma.ticketStatusHistory.findMany({
      where: { ticket_id },
      orderBy: { created_at: "desc" },
    });

    return history;
  } catch (error) {
    console.error("getTicketStatusHistory error:", error);
    throw error;
  }
}

// ============================================
// UPDATE TICKET STATUS
// ============================================

export async function updateTicketStatus(
  ticket_id,
  status,
  note,
  cadmin_id,
  auditContext = {},
) {
  try {
    // Get ticket with creator info
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
      include: {
        created_by: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        shop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
      },
    });

    if (!ticket) {
      const err = new Error("Ticket not found");
      err.code = "TICKET_NOT_FOUND";
      throw err;
    }

    // Cannot update cancelled tickets
    if (ticket.status === "CANCELLED") {
      const err = new Error("Cannot update a cancelled ticket");
      err.code = "CANNOT_UPDATE_CANCELLED";
      throw err;
    }

    // Validate status (CAdmin cannot set CANCELLED)
    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!validStatuses.includes(status)) {
      const err = new Error("Invalid status");
      err.code = "INVALID_STATUS";
      throw err;
    }

    // Skip if status is the same
    if (ticket.status === status) {
      const err = new Error("Status is already " + status);
      err.code = "SAME_STATUS";
      throw err;
    }

    // Get admin info
    const admin = await prisma.cAdmin.findUnique({
      where: { cadmin_id },
      select: { name: true },
    });

    const previousStatus = ticket.status;

    // Build admin_notes update (append with timestamp)
    let updatedAdminNotes = ticket.admin_notes || "";
    if (note) {
      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const newNoteEntry = `[${timestamp}] ${admin?.name || "Admin"} (${previousStatus} → ${status}): ${note}`;
      updatedAdminNotes = updatedAdminNotes
        ? `${updatedAdminNotes}\n\n${newNoteEntry}`
        : newNoteEntry;
    }

    // Use transaction to update ticket, create history, and audit log
    const result = await prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { ticket_id },
        data: {
          status,
          admin_notes: updatedAdminNotes || ticket.admin_notes,
          updated_at: new Date(),
        },
        include: {
          shop: {
            select: {
              shop_id: true,
              business_name: true,
            },
          },
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
            },
          },
          created_by: {
            select: {
              user_id: true,
              full_name: true,
              role: true,
              email: true,
            },
          },
          cancelled_by: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          reopened_by: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          attachments: {
            select: {
              attachment_id: true,
              storage_key: true,
              original_name: true,
              mime_type: true,
              file_size: true,
            },
          },
        },
      });

      // Create legacy status history entry
      await tx.ticketStatusHistory.create({
        data: {
          ticket_id,
          changed_by_type: "CADMIN",
          changed_by_id: cadmin_id,
          changed_by_name: admin?.name || "Admin",
          from_status: previousStatus,
          to_status: status,
          note: note || null,
        },
      });

      //  AUDIT: Determine which action to log
      let auditAction;
      if (status === "RESOLVED") {
        auditAction = audit.AuditAction.TICKET_RESOLVED_BY_ADMIN;
      } else if (status === "CLOSED") {
        auditAction = audit.AuditAction.TICKET_CLOSED_BY_ADMIN;
      } else {
        auditAction = audit.AuditAction.TICKET_STATUS_UPDATED_BY_ADMIN;
      }

      await audit.log(
        {
          action: auditAction,
          entity_type: audit.EntityType.TICKET,
          entity_id: ticket_id,
          shop_id: ticket.shop?.shop_id || null,
          ...auditContext,
          reason_code: audit.AuditReasonCode.ADMIN_ACTION,
          metadata: {
            ticket_number: ticket.ticket_number,
            previous_status: previousStatus,
            new_status: status,
            updated_by_cadmin_id: cadmin_id,
            note: note || null,
            category: ticket.category,
            reopen_count: ticket.reopen_count,
          },
        },
        { tx },
      );

      return updatedTicket;
    });

    //  Send notification to ticket creator
    if (ticket.created_by?.email) {
      notifyAsync({
        type: NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED,
        context: {
          ticket_id: ticket.ticket_id,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          from_status: previousStatus,
          to_status: status,
          admin_note: note || null,
          email: ticket.created_by.email,
          name: ticket.created_by.full_name || "Customer",
        },
      });
    } else {
      console.warn(
        `⚠️ No email for ticket ${ticket.ticket_number} creator - skipping notification`,
      );
    }

    return transformTicketForCAdmin(result);
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    throw error;
  }
}
