// backend/src/modules/notifications/templates/email/ticketStatusChanged.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/ticketStatusChanged.js
// ============================================
// TICKET STATUS CHANGED EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  renderButton,
  getSupportLink,
} from './_helpers.js';
import { ICONS } from './_icons.js';

const STATUS_DISPLAY = {
  PENDING:     { label: 'Pending',     color: EMAIL_CONFIG.COLORS.WARNING,       bgColor: '#fef3c7', message: 'Your ticket is awaiting review by our support team.' },
  IN_PROGRESS: { label: 'In Progress', color: '#3b82f6',                          bgColor: '#dbeafe', message: 'Our support team is actively working on your ticket.' },
  RESOLVED:    { label: 'Resolved',    color: EMAIL_CONFIG.COLORS.SUCCESS_LIGHT,  bgColor: '#d1fae5', message: "Your issue has been resolved. If you're still experiencing problems, you can reopen this ticket." },
  CLOSED:      { label: 'Closed',      color: EMAIL_CONFIG.COLORS.GRAY,           bgColor: '#f3f4f6', message: 'This ticket has been closed. Thank you for contacting support.' },
  CANCELLED:   { label: 'Cancelled',   color: EMAIL_CONFIG.COLORS.ERROR,          bgColor: '#fee2e2', message: 'This ticket has been cancelled.' },
};

export function ticketStatusChangedTemplate(context) {
  const {
    recipientName,
    name,
    ticket_number,
    subject: ticketSubject,
    from_status,
    to_status,
    admin_note,
  } = context;

  const displayName  = recipientName || name || 'Customer';
  const toConfig     = STATUS_DISPLAY[to_status]   || STATUS_DISPLAY.PENDING;
  const fromConfig   = from_status ? STATUS_DISPLAY[from_status] : null;

  const statusChangeHtml = fromConfig
    ? `
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background-color:${fromConfig.bgColor};color:${fromConfig.color};">
          ${fromConfig.label}
        </span>
        <span style="color:#9ca3af;font-size:24px;margin:0 12px;font-weight:300;">→</span>
        <span style="display:inline-block;padding:8px 18px;border-radius:20px;font-size:13px;font-weight:700;background-color:${toConfig.bgColor};color:${toConfig.color};">
          ${toConfig.label}
        </span>
      </div>
    `
    : `
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;padding:10px 24px;border-radius:20px;font-size:15px;font-weight:700;background-color:${toConfig.bgColor};color:${toConfig.color};">
          ${toConfig.label}
        </span>
      </div>
    `;

  // Admin note: NOTE_DARK icon replaces 📝
  const adminNoteHtml = admin_note
    ? `
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:16px 20px;border-radius:0 10px 10px 0;margin:24px 0;">
        <p class="info-text" style="margin:0 0 8px;font-weight:600;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;background-color:#e0f2fe;"> Note from ${EMAIL_CONFIG.COMPANY.NAME} Support:</p>
        <p class="info-text" style="margin:0;color:#374151;white-space:pre-wrap;line-height:1.6;font-size:14px;background-color:#e0f2fe;">${admin_note}</p>
      </div>
    `
    : '';

  // Reopen hint: LIGHTBULB icon replaces 💡
  const reopenHintHtml = to_status === 'RESOLVED'
    ? `
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p class="warning-text" style="margin:0;font-size:13px;color:#92400e;line-height:1.6;background-color:#fef9e7;">
          ${ICONS.LIGHTBULB_AMBER}
          <strong style="vertical-align:middle;">Not fully resolved?</strong>
          <span style="vertical-align:middle;">
            You can reopen this ticket from your dashboard if you're still experiencing issues.
          </span>
        </p>
      </div>
    `
    : '';

  const emailSubjects = {
    PENDING:     `[${ticket_number}] Your ticket is being reviewed - ${EMAIL_CONFIG.COMPANY.NAME}`,
    IN_PROGRESS: `[${ticket_number}] Support is working on your ticket - ${EMAIL_CONFIG.COMPANY.NAME}`,
    RESOLVED:    `[${ticket_number}] Your ticket has been resolved - ${EMAIL_CONFIG.COMPANY.NAME}`,
    CLOSED:      `[${ticket_number}] Your ticket has been closed - ${EMAIL_CONFIG.COMPANY.NAME}`,
    CANCELLED:   `[${ticket_number}] Your ticket has been cancelled - ${EMAIL_CONFIG.COMPANY.NAME}`,
  };

  const subject = emailSubjects[to_status] || `[${ticket_number}] Ticket Status Update - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Ticket Update - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: UPDATE icon replaces 🔄 -->
    <div class="header-primary" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.PRIMARY} 0%,${EMAIL_CONFIG.COLORS.PRIMARY_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Ticket Update</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#e0e0e0;">Your support ticket has been updated</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 16px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${displayName}</strong>,
      </p>

      <!-- Ticket Info Box -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;background-color:#f9fafb;">Ticket #</td>
            <td class="ticket-code" style="padding:6px 0;font-weight:700;font-size:14px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-family:'Courier New',monospace;background-color:#f9fafb;">
              ${ticket_number}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:6px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Subject</td>
            <td class="table-value" style="padding:6px 0;color:#1f2937;font-weight:600;font-size:14px;background-color:#f9fafb;">
              ${ticketSubject || 'N/A'}
            </td>
          </tr>
        </table>
      </div>

      <!-- Status Change -->
      <div class="status-box" style="background-color:#f9fafb;border-radius:10px;padding:20px;margin:24px 0;">
        <p class="table-label" style="margin:0 0 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;font-weight:600;background-color:#f9fafb;">
          Status Update
        </p>
        ${statusChangeHtml}
        <p class="text-secondary" style="margin:16px 0 0;color:#4b5563;font-size:14px;text-align:center;line-height:1.6;background-color:#f9fafb;">
          ${toConfig.message}
        </p>
      </div>

      ${adminNoteHtml}
      ${reopenHintHtml}

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/tickets`, text: 'View Ticket Details' })}

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Questions? Contact ${getSupportLink()}
      </p>

    </div>

    <!-- Custom Footer -->
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo('WHITE', 'footer')}
      <p style="margin:0 0 6px;color:#d1d5db;">© ${EMAIL_CONFIG.CURRENT_YEAR} <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> Support</p>
      <p style="margin:0;color:#6b7280;font-size:11px;">This is an automated notification regarding your support ticket.</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default ticketStatusChangedTemplate;