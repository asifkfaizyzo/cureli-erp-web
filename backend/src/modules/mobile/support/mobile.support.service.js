// backend/src/modules/mobile/support/mobile.support.service.js (do not remove this comment)
import prisma from "../../../config/prisma.js";
import * as fileStorage from "../../../services/fileStorage.service.js";
import { isReopenTransition } from "../../../config/customerTicketStateMachine.js";
import { MobilePush } from "../push/mobile.push.service.js";

const MAX_ORDER_AGE_DAYS = 7;

// Generate Ticket Number: CST-YYYYMMDD-XXXX
async function generateCustomerTicketNumber(tx) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `CST-${dateStr}`;

  const count = await tx.customerSupportTicket.count({
    where: {
      ticket_number: { startsWith: prefix },
    },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}

export async function createCustomerTicket({
  customerId,
  orderId,
  category,
  otherCategoryText,
  subject,
  description,
  files = [],
}) {
  // 1. Fetch and validate order
  const order = await prisma.marketplaceOrder.findFirst({
    where: { order_id: orderId, customer_id: customerId },
    select: {
      order_id: true,
      order_number: true,
      shop_id: true,
      status: true,
      completed_at: true,
      customer: { select: { full_name: true, phone: true } },
    },
  });

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  if (order.status !== "COMPLETED") {
    const err = new Error("Tickets can only be raised for completed orders");
    err.status = 400;
    throw err;
  }

  // 2. Check 7-day completion window
  if (order.completed_at) {
    const windowMs = MAX_ORDER_AGE_DAYS * 24 * 60 * 60 * 1000;
    const isWithinWindow =
      Date.now() - new Date(order.completed_at).getTime() <= windowMs;
    if (!isWithinWindow) {
      const err = new Error(
        `Tickets can only be raised within ${MAX_ORDER_AGE_DAYS} days of order completion`,
      );
      err.status = 400;
      throw err;
    }
  }

  // 3. Check for existing active ticket on this order
  const activeTicket = await prisma.customerSupportTicket.findFirst({
    where: {
      order_id: orderId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    select: { ticket_id: true, ticket_number: true },
  });

  if (activeTicket) {
    const err = new Error(
      `An active ticket (${activeTicket.ticket_number}) already exists for this order`,
    );
    err.status = 409;
    throw err;
  }

  const customerName = order.customer?.full_name || "Customer";

  // 4. Create Ticket + Upload Files in Transaction
  return await prisma.$transaction(async (tx) => {
    const ticket_number = await generateCustomerTicketNumber(tx);

    const ticket = await tx.customerSupportTicket.create({
      data: {
        ticket_number,
        customer_id: customerId,
        order_id: orderId,
        shop_id: order.shop_id,
        category,
        other_category_text:
          category === "OTHER" ? otherCategoryText?.trim() : null,
        subject: subject.trim(),
        description: description.trim(),
        status: "OPEN",
        activity_count: 1,
      },
    });

    // Create Initial Activity
    await tx.customerSupportTicketActivity.create({
      data: {
        ticket_id: ticket.ticket_id,
        type: "CREATED",
        to_status: "OPEN",
        actor_type: "CUSTOMER",
        actor_id: customerId,
        actor_name: customerName,
        message: description.trim(),
        is_internal: false,
      },
    });

    // Upload files if provided
    if (files.length > 0) {
      const attachmentData = [];
      for (const file of files) {
        const uploaded = await fileStorage.uploadFile({
          buffer: file.buffer,
          folder: "customer_tickets", // ◄ Matched to whitelist
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });

        attachmentData.push({
          ticket_id: ticket.ticket_id,
          storage_key: uploaded.storage_key,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
        });
      }

      await tx.customerSupportTicketAttachment.createMany({
        data: attachmentData,
      });
      await tx.customerSupportTicket.update({
        where: { ticket_id: ticket.ticket_id },
        data: { attachment_count: attachmentData.length },
      });
    }

    return ticket;
  });
}

export async function getCustomerTickets(customerId, { page = 1, limit = 10 }) {
  const p = Number(page);
  const l = Number(limit);
  const where = { customer_id: customerId };

  const [total, tickets] = await Promise.all([
    prisma.customerSupportTicket.count({ where }),
    prisma.customerSupportTicket.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (p - 1) * l,
      take: l,
      include: {
        order: {
          select: {
            order_number: true,
            total_amount: true,
            shop: { select: { business_name: true } },
          },
        },
      },
    }),
  ]);

  const formatted = tickets.map((t) => ({
    ticket_id: t.ticket_id,
    ticket_number: t.ticket_number,
    category: t.category,
    subject: t.subject,
    status: t.status,
    order_id: t.order_id,
    order_number: t.order?.order_number,
    shop_name: t.order?.shop?.business_name,
    attachment_count: t.attachment_count,
    created_at: t.created_at,
    resolved_at: t.resolved_at,
  }));

  return {
    tickets: formatted,
    pagination: { page: p, limit: l, total, total_pages: Math.ceil(total / l) },
  };
}

export async function getCustomerTicketDetail(ticketId, customerId) {
  const ticket = await prisma.customerSupportTicket.findFirst({
    where: { ticket_id: ticketId, customer_id: customerId },
    include: {
      order: {
        select: {
          order_id: true,
          order_number: true,
          total_amount: true,
          placed_at: true,
          completed_at: true,
          shop: { select: { business_name: true } },
          items: {
            select: {
              item_id: true,
              medicine_name_snapshot: true,
              quantity: true,
              unit_price_snapshot: true,
            },
          },
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
        orderBy: { uploaded_at: "asc" },
      },
      activities: {
        where: { is_internal: false },
        orderBy: { created_at: "asc" },
        select: {
          activity_id: true,
          type: true,
          from_status: true,
          to_status: true,
          actor_type: true,
          actor_name: true,
          message: true,
          created_at: true,
        },
      },
    },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.status = 404;
    throw err;
  }

  // Generate signed URLs for attachments
  const attachmentsWithUrls = await Promise.all(
    ticket.attachments.map(async (att) => {
      const url = await fileStorage
        .getSignedUrl({ folder: "customer_tickets", filename: att.storage_key })
        .catch(() => null);
      return { ...att, url };
    }),
  );

  return {
    ticket_id: ticket.ticket_id,
    ticket_number: ticket.ticket_number,
    category: ticket.category,
    other_category_text: ticket.other_category_text,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    created_at: ticket.created_at,
    resolved_at: ticket.resolved_at,
    closed_at: ticket.closed_at,
    order: {
      order_id: ticket.order?.order_id,
      order_number: ticket.order?.order_number,
      total_amount: ticket.order?.total_amount,
      shop_name: ticket.order?.shop?.business_name,
      completed_at: ticket.order?.completed_at,
      items: ticket.order?.items || [],
    },
    attachments: attachmentsWithUrls,
    activities: ticket.activities,
  };
}

export async function addCustomerReply(ticketId, customerId, message) {
  const ticket = await prisma.customerSupportTicket.findFirst({
    where: { ticket_id: ticketId, customer_id: customerId },
    include: {
      customer: { select: { full_name: true } },
    },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.status = 404;
    throw err;
  }

  if (ticket.status === "CLOSED") {
    const err = new Error("Cannot reply to a closed ticket");
    err.status = 400;
    throw err;
  }

  const customerName = ticket.customer?.full_name || "Customer";
  const shouldReopen = isReopenTransition(ticket.status, "OPEN");

  return await prisma.$transaction(async (tx) => {
    if (shouldReopen) {
      await tx.customerSupportTicket.update({
        where: { ticket_id: ticketId },
        data: {
          status: "OPEN",
          activity_count: { increment: 2 },
          updated_at: new Date(),
        },
      });

      await tx.customerSupportTicketActivity.create({
        data: {
          ticket_id: ticketId,
          type: "STATUS_CHANGED",
          from_status: "RESOLVED",
          to_status: "OPEN",
          actor_type: "CUSTOMER",
          actor_id: customerId,
          actor_name: customerName,
          message: "Ticket reopened by customer reply",
          is_internal: false,
        },
      });
    } else {
      await tx.customerSupportTicket.update({
        where: { ticket_id: ticketId },
        data: {
          activity_count: { increment: 1 },
          updated_at: new Date(),
        },
      });
    }

    const activity = await tx.customerSupportTicketActivity.create({
      data: {
        ticket_id: ticketId,
        type: "CUSTOMER_REPLY",
        actor_type: "CUSTOMER",
        actor_id: customerId,
        actor_name: customerName,
        message: message.trim(),
        is_internal: false,
      },
    });

    return { activity, reopened: shouldReopen };
  });
}
