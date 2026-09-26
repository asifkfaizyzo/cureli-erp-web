// backend/src/modules/enquiries/enquiries.service.js (do not remove this comment)
// backend/src/modules/enquiries/enquiries.service.js

import prisma from "../../config/prisma.js";
import { notify } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";
import * as audit from "../audit/index.js";

// Sanitize search input for LIKE patterns
const sanitizeSearchPattern = (search) => {
  if (!search) return search;
  return search.replace(/[%_\\]/g, "\\$&");
};

const generateEnquiryNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `ENQ-${dateStr}-`;

  const lastEnquiry = await prisma.enquiry.findFirst({
    where: { enquiry_number: { startsWith: prefix } },
    orderBy: { enquiry_number: "desc" },
  });

  let sequence = 1;
  if (lastEnquiry) {
    const lastSequence = parseInt(lastEnquiry.enquiry_number.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// No audit needed - enquiry creation is external, no authenticated user
export const createEnquiry = async (data) => {
  const enquiryNumber = await generateEnquiryNumber();

  const enquiry = await prisma.enquiry.create({
    data: {
      enquiry_number: enquiryNumber,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      message: data.message.trim(),
      status: "PENDING",
    },
  });

  notify({
    type: NOTIFICATION_EVENTS.ENQUIRY_RECEIVED,
    context: {
      email: enquiry.email,
      name: enquiry.name,
      enquiry_number: enquiry.enquiry_number,
      message: enquiry.message,
    },
  }).catch(console.error);

  return enquiry;
};

// Read-only, no audit needed
export const listEnquiries = async (options) => {
  const { page, limit, status, search, sortBy, sortOrder } = options;
  const skip = (page - 1) * limit;

  const where = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    const sanitizedSearch = sanitizeSearchPattern(search.trim());
    where.OR = [
      { name: { contains: sanitizedSearch, mode: "insensitive" } },
      { email: { contains: sanitizedSearch, mode: "insensitive" } },
      { enquiry_number: { contains: sanitizedSearch, mode: "insensitive" } },
    ];
  }

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        replies: {
          select: { reply_id: true, created_at: true },
          orderBy: { created_at: "desc" },
        },
        _count: { select: { replies: true } },
      },
    }),
    prisma.enquiry.count({ where }),
  ]);

  const enquiriesWithCount = enquiries.map((e) => ({
    enquiry_id: e.enquiry_id,
    enquiry_number: e.enquiry_number,
    name: e.name,
    email: e.email,
    phone: e.phone,
    message: e.message,
    status: e.status,
    created_at: e.created_at,
    updated_at: e.updated_at,
    reply_count: e._count.replies,
    last_replied_at: e.replies[0]?.created_at || null,
  }));

  return {
    enquiries: enquiriesWithCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Read-only, no audit needed
export const getEnquiryById = async (enquiryId) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
    include: {
      replies: {
        include: {
          replied_by: {
            select: { cadmin_id: true, name: true, username: true },
          },
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  return enquiry;
};

export const replyToEnquiry = async (enquiryId, adminId, data, auditContext, options = {}) => {
  const { tx } = options;
  const db = tx || prisma;

  const enquiry = await db.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
  });

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  // Get admin details for the email signature
  const admin = await db.cAdmin.findUnique({
    where: { cadmin_id: adminId },
    select: { name: true, email: true },
  });

  const adminName = admin?.name || "Support Team";
  const adminEmail = admin?.email || process.env.MAIL_USER || "support@cureli.com";

  let emailSent = false;
  let emailError = null;

  try {
    const result = await notify({
      type: NOTIFICATION_EVENTS.ENQUIRY_REPLIED,
      context: {
        email: enquiry.email,
        name: enquiry.name,
        enquiry_number: enquiry.enquiry_number,
        reply_subject: data.subject,
        reply_message: data.message,
        admin_name: adminName,
        admin_email: adminEmail,
      },
    });

    emailSent = result.success && result.channels?.email?.sent > 0;
  } catch (err) {
    emailError = err.message;
    console.error("Failed to send email:", err);
  }

  const reply = await db.$transaction(async (innerTx) => {
    const newReply = await innerTx.enquiryReply.create({
      data: {
        enquiry_id: enquiryId,
        replied_by_id: adminId,
        subject: data.subject.trim(),
        message: data.message.trim(),
        email_sent: emailSent,
        email_sent_at: emailSent ? new Date() : null,
        email_error: emailError,
      },
      include: {
        replied_by: {
          select: { cadmin_id: true, name: true, username: true, email: true },
        },
      },
    });

    await innerTx.enquiry.update({
      where: { enquiry_id: enquiryId },
      data: { status: "REPLIED" },
    });

    // Audit: Enquiry replied by CAdmin
    await audit.log({
      action: audit.AuditAction.ENQUIRY_REPLIED,
      entity_type: audit.EntityType.ENQUIRY,
      entity_id: enquiryId,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        reply_id: newReply.reply_id,
        subject: data.subject,
        email_sent: emailSent,
        enquiry_number: enquiry.enquiry_number,
      },
    }, { tx: innerTx });

    return newReply;
  });

  return { reply, emailSent, emailError };
};

export const updateEnquiryStatus = async (enquiryId, status, auditContext, options = {}) => {
  const { tx } = options;
  const db = tx || prisma;

  const existingEnquiry = await db.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
  });

  if (!existingEnquiry) {
    throw new Error("Enquiry not found");
  }

  const enquiry = await db.enquiry.update({
    where: { enquiry_id: enquiryId },
    data: { status },
  });

  // Audit: Enquiry status changed
  await audit.log({
    action: audit.AuditAction.ENQUIRY_STATUS_CHANGED,
    entity_type: audit.EntityType.ENQUIRY,
    entity_id: enquiryId,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      previous_status: existingEnquiry.status,
      new_status: status,
      enquiry_number: enquiry.enquiry_number,
    },
  }, { tx });

  return enquiry;
};

// Read-only, no audit needed
export const getEnquiryStats = async () => {
  const [pending, inProgress, replied, closed, total] = await Promise.all([
    prisma.enquiry.count({ where: { status: "PENDING" } }),
    prisma.enquiry.count({ where: { status: "IN_PROGRESS" } }),
    prisma.enquiry.count({ where: { status: "REPLIED" } }),
    prisma.enquiry.count({ where: { status: "CLOSED" } }),
    prisma.enquiry.count(),
  ]);

  return { pending, inProgress, replied, closed, total };
};

// No audit for deletion (administrative cleanup, not business event)
export const deleteEnquiry = async (enquiryId) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
  });

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  await prisma.enquiryReply.deleteMany({
    where: { enquiry_id: enquiryId },
  });

  await prisma.enquiry.delete({
    where: { enquiry_id: enquiryId },
  });

  return enquiry;
};