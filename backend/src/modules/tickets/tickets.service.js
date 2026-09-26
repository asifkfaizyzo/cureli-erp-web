// backend/src/modules/tickets/tickets.service.js (do not remove this comment)
//backend\src\modules\tickets\tickets.service.js
import prisma from "../../config/prisma.js";
import * as SM from "../../config/ticketStateMachine.js";
import * as fileStorage from "../../services/fileStorage.service.js";
import * as audit from "../audit/index.js";
import { notifyAsync } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MAX_RETRY_ATTEMPTS = 3;

// ── INCLUDE CONFIG ────────────────────────────────────────────────────────────
const TICKET_INCLUDE = {
  shop: {
    select: { shop_id: true, business_name: true },
  },
  branch: {
    select: { branch_id: true, branch_name: true },
  },
  created_by: {
    select: { user_id: true, full_name: true, role: true, email: true },
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
    orderBy: { uploaded_at: "asc" },
  },
  activities: {
    orderBy: { created_at: "asc" },
  },
};

// ── TRANSFORM ─────────────────────────────────────────────────────────────────
export function transformTicket(ticket, callerType = "ERP_USER") {
  const priority = SM.calculatePriority(ticket.reopen_count || 0);

  // Filter activities based on caller
  // ERP_USER cannot see internal (cadmin-only) notes
  const activities = (ticket.activities || []).filter(
    (a) => callerType === "CADMIN" || !a.is_internal
  );

  return {
    ticket_id:     ticket.ticket_id,
    ticket_number: ticket.ticket_number,

    shop_id:       ticket.shop_id,
    shop_name:     ticket.shop?.business_name || null,
    branch_id:     ticket.branch_id,
    branch_name:   ticket.branch?.branch_name || null,

    created_by_user_id: ticket.created_by_user_id,
    created_by_name:    ticket.created_by?.full_name || null,
    created_by_role:    ticket.created_by?.role || null,
    created_by_email:   ticket.created_by?.email || null,

    contact_number:      ticket.contact_number,
    category:            ticket.category,
    other_category_text: ticket.other_category_text,
    subject:             ticket.subject,
    description:         ticket.description,
    preferred_slot:      ticket.preferred_slot,

    status:       ticket.status,
    priority,
    reopen_count: ticket.reopen_count || 0,

    attachments:      ticket.attachments || [],
    attachment_count: ticket.attachment_count || ticket.attachments?.length || 0,

    activities, // unified timeline

    resolved_at:  ticket.resolved_at,
    closed_at:    ticket.closed_at,
    cancelled_at: ticket.cancelled_at,
    created_at:   ticket.created_at,
    updated_at:   ticket.updated_at,
  };
}

// ── TICKET NUMBER GENERATOR ───────────────────────────────────────────────────
async function generateTicketNumber(shop_id, tx, attempt = 1) {
  const shopCode = shop_id.substring(0, 4).toUpperCase();

  const lastTicket = await tx.ticket.findFirst({
    where:   { shop_id },
    orderBy: { created_at: "desc" },
    select:  { ticket_number: true },
  });

  let seq;
  if (lastTicket?.ticket_number) {
    const parts = lastTicket.ticket_number.split("-");
    seq = String((parseInt(parts[2], 10) || 0) + attempt).padStart(5, "0");
  } else {
    seq = String(attempt).padStart(5, "0");
  }

  const ticketNumber = `TKT-${shopCode}-${seq}`;

  const existing = await tx.ticket.findUnique({
    where:  { ticket_number: ticketNumber },
    select: { ticket_id: true },
  });

  if (existing) {
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      return `TKT-${shopCode}-${Date.now().toString(36).toUpperCase()}`;
    }
    return generateTicketNumber(shop_id, tx, attempt + 1);
  }

  return ticketNumber;
}

// ── DUPLICATE CHECK ───────────────────────────────────────────────────────────
async function checkDuplicate(shop_id, user_id, subject) {
  const ONE_MIN_AGO   = new Date(Date.now() - 60_000);
  const FIVE_MINS_AGO = new Date(Date.now() - 300_000);

  const [rateLimited, duplicate] = await Promise.all([
    prisma.ticket.findFirst({
      where:  { shop_id, created_by_user_id: user_id, created_at: { gte: ONE_MIN_AGO } },
      select: { ticket_id: true },
    }),
    prisma.ticket.findFirst({
      where:  { shop_id, created_by_user_id: user_id, subject: subject.trim(), created_at: { gte: FIVE_MINS_AGO } },
      select: { ticket_id: true },
    }),
  ]);

  if (rateLimited) {
    const err = new Error("Please wait before creating another ticket.");
    err.code  = "RATE_LIMIT_EXCEEDED";
    throw err;
  }
  if (duplicate) {
    const err = new Error("A ticket with the same subject was recently created.");
    err.code  = "DUPLICATE_TICKET";
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

// ── CREATE ────────────────────────────────────────────────────────────────────
export async function createTicket({
  shop_id, branch_id, user_id, user_branch_id, user_role,
  contact_number, category, subject, description,
  other_category_text, preferred_slot, files = [], auditContext = {},
}) {
  await checkDuplicate(shop_id, user_id, subject);

  // Validate branch
  if (branch_id) {
    const branch = await prisma.branch.findFirst({
      where:  { branch_id, shop_id, is_active: true },
      select: { branch_id: true },
    });
    if (!branch) {
      const err = new Error("Branch not found or inactive");
      err.code  = "INVALID_BRANCH";
      throw err;
    }
    if (user_role === "branch_admin" && branch_id !== user_branch_id) {
      const err = new Error("You can only create tickets for your own branch");
      err.code  = "BRANCH_ACCESS_DENIED";
      throw err;
    }
  }

  // Get actor name for the activity log
  const actor = await prisma.user.findUnique({
    where:  { user_id },
    select: { full_name: true },
  });

  const ticket = await prisma.$transaction(async (tx) => {
    const ticket_number = await generateTicketNumber(shop_id, tx);

    const newTicket = await tx.ticket.create({
      data: {
        ticket_number,
        shop_id,
        branch_id:           branch_id || null,
        created_by_user_id:  user_id,
        contact_number,
        category,
        subject:             subject.trim(),
        description:         description?.trim() || null,
        other_category_text: category === "OTHER" ? other_category_text?.trim() : null,
        preferred_slot,
        status:              "PENDING",
      },
    });

    // ── Activity: CREATED ──────────────────────────────────────────────────
    await tx.ticketActivity.create({
      data: {
        ticket_id:  newTicket.ticket_id,
        type:       "CREATED",
        to_status:  "PENDING",
        actor_type: "ERP_USER",
        actor_id:   user_id,
        actor_name: actor?.full_name || "User",
        actor_role: user_role,
        is_internal: false,
      },
    });

    // ── Upload attachments ─────────────────────────────────────────────────
    let attachmentCount = 0;
    if (files.length > 0) {
      const attachmentData = [];
      for (const file of files) {
        const uploaded = await fileStorage.uploadFile({
          buffer:       file.buffer,
          folder:       "tickets",
          originalName: file.originalname,
          mimetype:     file.mimetype,
          size:         file.size,
        });
        attachmentData.push({
          ticket_id:     newTicket.ticket_id,
          storage_key:   uploaded.storage_key,
          original_name: file.originalname,
          mime_type:     file.mimetype,
          file_size:     file.size,
        });
      }
      await tx.ticketAttachment.createMany({ data: attachmentData });
      attachmentCount = attachmentData.length;

      await tx.ticket.update({
        where: { ticket_id: newTicket.ticket_id },
        data:  { attachment_count: attachmentCount, activity_count: 1 },
      });
    } else {
      await tx.ticket.update({
        where: { ticket_id: newTicket.ticket_id },
        data:  { activity_count: 1 },
      });
    }

    return newTicket;
  });

  // Audit
  audit.log({
    action:      audit.AuditAction.TICKET_CREATED,
    entity_type: audit.EntityType.TICKET,
    entity_id:   ticket.ticket_id,
    actor_type:  audit.ActorType.ERP_USER,
    actor_id:    user_id,
    actor_role:  user_role,
    shop_id,
    branch_id:   branch_id || null,
    ...auditContext,
    metadata:    { ticket_number: ticket.ticket_number, category, subject },
  }).catch(console.error);

  const full = await prisma.ticket.findUnique({
    where:   { ticket_id: ticket.ticket_id },
    include: TICKET_INCLUDE,
  });

  // Notify
  if (full.created_by?.email) {
    notifyAsync({
      type:    NOTIFICATION_EVENTS.TICKET_CREATED,
      context: {
        ticket_id:     full.ticket_id,
        ticket_number: full.ticket_number,
        subject:       full.subject,
        category:      full.category,
        email:         full.created_by.email,
        name:          full.created_by.full_name || "Customer",
      },
    });
  }

  return transformTicket(full, "ERP_USER");
}

// ── CORE STATE MACHINE FUNCTION ───────────────────────────────────────────────
/**
 * The ONE function that handles ALL status changes.
 * Both user routes and cadmin routes call this.
 *
 * @param {object} opts
 * @param {string} opts.ticket_id
 * @param {string} opts.shop_id          - required for ERP_USER (scoping)
 * @param {string} opts.to_status
 * @param {string} opts.actor_type       - "ERP_USER" | "CADMIN"
 * @param {string} opts.actor_id
 * @param {string} opts.actor_name
 * @param {string} opts.actor_role
 * @param {string} [opts.note]           - reason / comment
 * @param {boolean} [opts.is_internal]   - cadmin-only note
 * @param {object} [opts.auditContext]
 */
export async function applyTicketTransition({
  ticket_id,
  shop_id,
  to_status,
  actor_type,
  actor_id,
  actor_name,
  actor_role,
  note,
  is_internal = false,
  auditContext = {},
}) {
  // 1. Fetch ticket
  const where = shop_id ? { ticket_id, shop_id } : { ticket_id };
  const ticket = await prisma.ticket.findFirst({
    where,
    select: {
      ticket_id:     true,
      ticket_number: true,
      status:        true,
      reopen_count:  true,
      shop_id:       true,
      branch_id:     true,
      created_by:    { select: { email: true, full_name: true } },
    },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code  = "TICKET_NOT_FOUND";
    throw err;
  }

  const from_status = ticket.status;

  // 2. State machine check
  if (!SM.canTransition(from_status, to_status, actor_type)) {
    const err = new Error(
      `Cannot move ticket from ${from_status} to ${to_status}`
    );
    err.code  = "INVALID_TRANSITION";
    throw err;
  }

  // 3. Reopen limit check
  const isReopen = SM.isReopenTransition(from_status, to_status);
  if (isReopen) {
    if (ticket.reopen_count >= SM.REOPEN_LIMIT) {
      const err = new Error(
        `This ticket has been reopened ${SM.REOPEN_LIMIT} times. Please create a new ticket.`
      );
      err.code  = "REOPEN_LIMIT_EXCEEDED";
      throw err;
    }
    // Note is required for reopen
    if (!note || note.trim().length < 10) {
      const err = new Error("Reopen reason must be at least 10 characters");
      err.code  = "NOTE_REQUIRED";
      throw err;
    }
  }

  // 4. Note required for cancel
  if (to_status === "CANCELLED" && (!note || note.trim().length < 10)) {
    const err = new Error("Cancellation reason must be at least 10 characters");
    err.code  = "NOTE_REQUIRED";
    throw err;
  }

  // 5. Build ticket update data
  const ticketUpdateData = {
    status:     to_status,
    updated_at: new Date(),
  };

  if (isReopen) {
    ticketUpdateData.reopen_count = { increment: 1 };
  }
  if (to_status === "RESOLVED") {
    ticketUpdateData.resolved_at = new Date();
  }
  if (to_status === "CLOSED") {
    ticketUpdateData.closed_at = new Date();
  }
  if (to_status === "CANCELLED") {
    ticketUpdateData.cancelled_at = new Date();
  }

  // 6. Determine activity type
  let activityType = "STATUS_CHANGED";
  if (to_status === "CANCELLED") activityType = "CANCELLED";
  if (isReopen)                  activityType = "REOPENED";

  // 7. Transaction: update ticket + write activity
  const updatedTicket = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where:   { ticket_id },
      data:    ticketUpdateData,
      include: TICKET_INCLUDE,
    });

    await tx.ticketActivity.create({
      data: {
        ticket_id,
        type:        activityType,
        from_status,
        to_status,
        actor_type,
        actor_id,
        actor_name,
        actor_role:  actor_role || null,
        note:        note?.trim() || null,
        is_internal,
      },
    });

    // Update activity counter
    await tx.ticket.update({
      where: { ticket_id },
      data:  { activity_count: { increment: 1 } },
    });

    return updated;
  });

  // 8. Audit log
  let auditAction = audit.AuditAction.TICKET_STATUS_UPDATED_BY_ADMIN;
  if (actor_type === "ERP_USER" && to_status === "CANCELLED") {
    auditAction = audit.AuditAction.TICKET_CANCELLED;
  } else if (actor_type === "ERP_USER" && isReopen) {
    auditAction = audit.AuditAction.TICKET_REOPENED;
  } else if (to_status === "RESOLVED") {
    auditAction = audit.AuditAction.TICKET_RESOLVED_BY_ADMIN;
  } else if (to_status === "CLOSED") {
    auditAction = audit.AuditAction.TICKET_CLOSED_BY_ADMIN;
  }

  audit.log({
    action:      auditAction,
    entity_type: audit.EntityType.TICKET,
    entity_id:   ticket_id,
    shop_id:     ticket.shop_id,
    branch_id:   ticket.branch_id,
    actor_type:  actor_type === "ERP_USER"
      ? audit.ActorType.ERP_USER
      : audit.ActorType.CADMIN,
    actor_id,
    actor_role,
    ...auditContext,
    metadata: {
      ticket_number:  ticket.ticket_number,
      from_status,
      to_status,
      reopen_count:   updatedTicket.reopen_count,
      note:           note || null,
      is_internal,
    },
  }).catch(console.error);

  // 9. Notify ticket creator (skip internal cadmin notes)
  if (!is_internal && ticket.created_by?.email) {
    notifyAsync({
      type:    NOTIFICATION_EVENTS.TICKET_STATUS_CHANGED,
      context: {
        ticket_id:     ticket.ticket_id,
        ticket_number: ticket.ticket_number,
        from_status,
        to_status,
        note:          note || null,
        email:         ticket.created_by.email,
        name:          ticket.created_by.full_name || "Customer",
      },
    });
  }

  return transformTicket(updatedTicket, actor_type);
}

// ── ADD COMMENT (no status change) ───────────────────────────────────────────
export async function addTicketComment({
  ticket_id, shop_id, actor_type, actor_id,
  actor_name, actor_role, note, is_internal = false,
}) {
  const where  = shop_id ? { ticket_id, shop_id } : { ticket_id };
  const ticket = await prisma.ticket.findFirst({
    where,
    select: { ticket_id: true, status: true },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code  = "TICKET_NOT_FOUND";
    throw err;
  }

  if (!note?.trim() || note.trim().length < 2) {
    const err = new Error("Note must be at least 2 characters");
    err.code  = "NOTE_TOO_SHORT";
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.ticketActivity.create({
      data: {
        ticket_id,
        type:        "COMMENT",
        actor_type,
        actor_id,
        actor_name,
        actor_role:  actor_role || null,
        note:        note.trim(),
        is_internal,
      },
    });
    await tx.ticket.update({
      where: { ticket_id },
      data:  { activity_count: { increment: 1 }, updated_at: new Date() },
    });
  });

  return { success: true };
}

// ── GET TICKETS (list) ────────────────────────────────────────────────────────
export async function getTickets({
  shop_id, requester_role, requester_branch_id,
  status, category, search, date_from, date_to,
  page = 1, limit = 20, sort_by = "created_at", sort_order = "desc",
}) {
  const and = [{ shop_id }];

  if (requester_role === "branch_admin") {
    and.push({ branch_id: requester_branch_id || "no-match" });
  }
  if (status)   and.push({ status });
  if (category) and.push({ category });

  if (date_from || date_to) {
    const dateCondition = {};
    if (date_from) dateCondition.gte = new Date(date_from);
    if (date_to) {
      const end = new Date(date_to);
      end.setDate(end.getDate() + 1);
      dateCondition.lt = end;
    }
    and.push({ created_at: dateCondition });
  }

  if (search) {
    and.push({
      OR: [
        { ticket_number: { contains: search, mode: "insensitive" } },
        { subject:       { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where = { AND: and };
  const p     = Number(page);
  const l     = Number(limit);

  const [total, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include: {
        ...TICKET_INCLUDE,
        _count: { select: { attachments: true } },
      },
      orderBy: { [sort_by]: sort_order },
      skip:    (p - 1) * l,
      take:    l,
    }),
  ]);

  return {
    tickets:    tickets.map((t) => transformTicket(t, "ERP_USER")),
    pagination: { page: p, limit: l, total, total_pages: Math.ceil(total / l) },
  };
}

// ── GET ALL TICKETS (cadmin) ──────────────────────────────────────────────────
export async function getAllTickets({
  page = 1, limit = 10, search, status, category,
  priority, date_from, date_to,
  sort_by = "created_at", sort_order = "desc",
}) {
  const where = {};

  if (search) {
    where.OR = [
      { ticket_number: { contains: search, mode: "insensitive" } },
      { subject:       { contains: search, mode: "insensitive" } },
      { shop: { business_name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status)   where.status   = status;
  if (category) where.category = category;

  if (priority) {
    const filter = SM.priorityToReopenFilter(priority);
    if (filter) where.reopen_count = filter;
  }

  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at.gte = new Date(date_from);
    if (date_to) {
      const end = new Date(date_to);
      end.setDate(end.getDate() + 1);
      where.created_at.lt = end;
    }
  }

  const p = Number(page);
  const l = Number(limit);

  const [total, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      skip:    (p - 1) * l,
      take:    l,
      orderBy: { [sort_by]: sort_order },
      include: {
        ...TICKET_INCLUDE,
        _count: { select: { attachments: true } },
      },
    }),
  ]);

  return {
    tickets:    tickets.map((t) => transformTicket(t, "CADMIN")),
    pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
  };
}

// ── GET BY ID ─────────────────────────────────────────────────────────────────
export async function getTicketById(ticket_id, shop_id, callerType = "ERP_USER") {
  const where  = shop_id ? { ticket_id, shop_id } : { ticket_id };
  const ticket = await prisma.ticket.findFirst({
    where,
    include: TICKET_INCLUDE,
  });

  return ticket ? transformTicket(ticket, callerType) : null;
}

// ── GET ACTIVITIES (for cadmin history tab) ───────────────────────────────────
export async function getTicketActivities(ticket_id, callerType = "CADMIN") {
  const ticket = await prisma.ticket.findUnique({
    where:  { ticket_id },
    select: { ticket_id: true },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code  = "TICKET_NOT_FOUND";
    throw err;
  }

  const activities = await prisma.ticketActivity.findMany({
    where:   callerType === "CADMIN"
      ? { ticket_id }
      : { ticket_id, is_internal: false },
    orderBy: { created_at: "asc" },
  });

  return activities;
}

// ── ACCESS CHECK ──────────────────────────────────────────────────────────────
export async function canAccessTicket(ticket_id, shop_id, role, branch_id) {
  const ticket = await prisma.ticket.findFirst({
    where:  { ticket_id, shop_id },
    select: { branch_id: true },
  });

  if (!ticket) return false;
  if (role === "super_admin") return true;
  if (role === "branch_admin") return ticket.branch_id === branch_id;
  return false;
}

// ── STATS ─────────────────────────────────────────────────────────────────────
export async function getTicketStats(shop_id, role, branch_id) {
  const and = [{ shop_id }];
  if (role === "branch_admin") {
    and.push({ branch_id: branch_id || "no-match" });
  }
  const where = { AND: and };

  const [statusCounts, total, recent] = await Promise.all([
    prisma.ticket.groupBy({
      by:    ["status"],
      where,
      _count: { status: true },
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.count({
      where: {
        AND: [...and, { created_at: { gte: new Date(Date.now() - 7 * 86_400_000) } }],
      },
    }),
  ]);

  const by_status = { PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0, CANCELLED: 0, CLOSED: 0 };
  statusCounts.forEach((r) => { by_status[r.status] = r._count.status; });

  return { total, recent_7_days: recent, by_status };
}

export async function getCAdminTicketStats() {
  const [total, pending, in_progress, resolved, closed, cancelled] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "PENDING" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CLOSED" } }),
      prisma.ticket.count({ where: { status: "CANCELLED" } }),
    ]);

  return { total, pending, in_progress, resolved, closed, cancelled };
}