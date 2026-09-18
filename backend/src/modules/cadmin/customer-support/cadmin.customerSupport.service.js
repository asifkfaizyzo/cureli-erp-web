//backend\src\modules\cadmin\customer-support\cadmin.customerSupport.service.js

import prisma from "../../../config/prisma.js";
import * as fileStorage from "../../../services/fileStorage.service.js";
import { canTransitionCustomerTicket } from "../../../config/customerTicketStateMachine.js";
import { MobilePush } from "../../mobile/push/mobile.push.service.js";

export async function getAllCustomerTickets({
  page = 1,
  limit = 10,
  search,
  status,
  category,
  shop_id,
  date_from,
  date_to,
  sort_by = "created_at",
  sort_order = "desc",
}) {
  const p = Number(page);
  const l = Number(limit);
  const where = {};

  if (status) where.status = status;
  if (category) where.category = category;
  if (shop_id) where.shop_id = shop_id;

  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at.gte = new Date(date_from);
    if (date_to) {
      const end = new Date(date_to);
      end.setDate(end.getDate() + 1);
      where.created_at.lt = end;
    }
  }

  if (search) {
    where.OR = [
      { ticket_number: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { customer: { full_name: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search, mode: "insensitive" } } },
      { order: { order_number: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, tickets] = await Promise.all([
    prisma.customerSupportTicket.count({ where }),
    prisma.customerSupportTicket.findMany({
      where,
      skip: (p - 1) * l,
      take: l,
      orderBy: { [sort_by]: sort_order },
      include: {
        customer: { select: { id: true, full_name: true, phone: true, email: true } },
        order: { select: { order_id: true, order_number: true, total_amount: true } },
        shop: { select: { shop_id: true, business_name: true } },
      },
    }),
  ]);

  return {
    tickets,
    pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
  };
}

export async function getCustomerTicketStats() {
  const [total, open, in_progress, resolved, closed] = await Promise.all([
    prisma.customerSupportTicket.count(),
    prisma.customerSupportTicket.count({ where: { status: "OPEN" } }),
    prisma.customerSupportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.customerSupportTicket.count({ where: { status: "RESOLVED" } }),
    prisma.customerSupportTicket.count({ where: { status: "CLOSED" } }),
  ]);

  return { total, open, in_progress, resolved, closed };
}

export async function getCustomerTicketById(ticketId) {
  const ticket = await prisma.customerSupportTicket.findUnique({
    where: { ticket_id: ticketId },
    include: {
      customer: { select: { id: true, full_name: true, phone: true, email: true } },
      order: {
        select: {
          order_id: true,
          order_number: true,
          total_amount: true,
          placed_at: true,
          completed_at: true,
          items: {
            select: {
              item_id: true,
              medicine_name_snapshot: true,
              brand_snapshot: true,
              quantity: true,
              unit_price_snapshot: true,
              line_total: true,
            },
          },
        },
      },
      shop: { select: { shop_id: true, business_name: true } },
      attachments: { orderBy: { uploaded_at: "asc" } },
      activities: { orderBy: { created_at: "asc" } },
    },
  });

  if (!ticket) return null;

  // Generate accessible URLs for attachments
  const attachmentsWithUrls = await Promise.all(
    ticket.attachments.map(async (att) => {
      let url = null;
      try {
        url = await fileStorage.getSignedUrl({
          folder: "customer_tickets",
          filename: att.storage_key,
        });
      } catch {
        // Fallback to proxy path if direct S3 signed URL fails
        url = fileStorage.getPublicUrl({
          folder: "customer_tickets",
          filename: att.storage_key,
        });
      }
      return { ...att, url };
    })
  );

  return { ...ticket, attachments: attachmentsWithUrls };
}

export async function updateCustomerTicketStatus({
  ticketId,
  toStatus,
  cadminId,
  cadminName,
  note,
}) {
  const ticket = await prisma.customerSupportTicket.findUnique({
    where: { ticket_id: ticketId },
    select: { ticket_id: true, status: true, customer_id: true, ticket_number: true },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.status = 404;
    throw err;
  }

  const fromStatus = ticket.status;

  if (!canTransitionCustomerTicket(fromStatus, toStatus, "CADMIN")) {
    const err = new Error(`Cannot transition ticket from ${fromStatus} to ${toStatus}`);
    err.status = 400;
    throw err;
  }

  const updateData = {
    status: toStatus,
    updated_at: new Date(),
  };
  if (toStatus === "RESOLVED") updateData.resolved_at = new Date();
  if (toStatus === "CLOSED") updateData.closed_at = new Date();

  const updatedTicket = await prisma.$transaction(async (tx) => {
    const updated = await tx.customerSupportTicket.update({
      where: { ticket_id: ticketId },
      data: updateData,
    });

    await tx.customerSupportTicketActivity.create({
      data: {
        ticket_id: ticketId,
        type: "STATUS_CHANGED",
        from_status: fromStatus,
        to_status: toStatus,
        actor_type: "CADMIN",
        actor_id: cadminId,
        actor_name: cadminName,
        message: note || `Status changed to ${toStatus}`,
        is_internal: false,
      },
    });

    return updated;
  });

  // Dispatch push notification to user asynchronously
  MobilePush.ticketStatusUpdated(
    ticket.customer_id,
    ticket.ticket_id,
    ticket.ticket_number,
    toStatus
  ).catch(console.error);

  return updatedTicket;
}

export async function addCAdminReply({
  ticketId,
  cadminId,
  cadminName,
  message,
  isInternal = false,
}) {
  const ticket = await prisma.customerSupportTicket.findUnique({
    where: { ticket_id: ticketId },
    select: { ticket_id: true, customer_id: true, ticket_number: true, status: true },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.status = 404;
    throw err;
  }

  const activity = await prisma.$transaction(async (tx) => {
    const act = await tx.customerSupportTicketActivity.create({
      data: {
        ticket_id: ticketId,
        type: isInternal ? "INTERNAL_NOTE" : "CADMIN_REPLY",
        actor_type: "CADMIN",
        actor_id: cadminId,
        actor_name: cadminName,
        message: message.trim(),
        is_internal: isInternal,
      },
    });

    await tx.customerSupportTicket.update({
      where: { ticket_id: ticketId },
      data: {
        activity_count: { increment: 1 },
        updated_at: new Date(),
      },
    });

    return act;
  });

  // Notify customer only if public reply
  if (!isInternal) {
    const snippet = message.length > 80 ? `${message.substring(0, 77)}...` : message;
    MobilePush.ticketReplyReceived(
      ticket.customer_id,
      ticket.ticket_id,
      ticket.ticket_number,
      snippet
    ).catch(console.error);
  }

  return activity;
}