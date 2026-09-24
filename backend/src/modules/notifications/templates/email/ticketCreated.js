// backend/src/modules/notifications/templates/email/ticketCreated.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/ticketCreated.js
// ============================================
// TICKET CREATED EMAIL TEMPLATE
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

export function ticketCreatedTemplate(context) {
  const {
    recipientName,
    ticket_number,
    ticketNumber,
    subject: ticketSubject,
    category,
  } = context;

  const ticketNum = ticket_number || ticketNumber;
  const displayCategory = category?.replace(/_/g, ' ') || 'General';

  const subject = `[${ticketNum}] Ticket Created - We've received your request`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Ticket Created - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: TICKET icon replaces 🎫 -->
    <div class="header-primary" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.PRIMARY} 0%,${EMAIL_CONFIG.COLORS.PRIMARY_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Ticket Created</h1>
      <p style="margin:10px 0 0;opacity:0.95;font-size:18px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px;color:#ffffff;">${ticketNum}</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Thank you for contacting <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> support. Your ticket has been
        successfully created and assigned to our team.
      </p>

      <!-- Ticket Info Box -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:24px 0;">
        <h3 style="margin:0 0 14px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;background-color:#f9fafb;">
          Ticket Details
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;background-color:#f9fafb;">Ticket #</td>
            <td class="ticket-code" style="padding:8px 0;font-weight:700;font-size:14px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-family:'Courier New',monospace;background-color:#f9fafb;-webkit-text-fill-color:${EMAIL_CONFIG.COLORS.PRIMARY};">
              ${ticketNum}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Subject</td>
            <td class="table-value" style="padding:8px 0;font-weight:600;font-size:14px;color:#111827;background-color:#f9fafb;">
              ${ticketSubject || 'N/A'}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Category</td>
            <td class="table-value" style="padding:8px 0;font-size:14px;color:#374151;background-color:#f9fafb;">
              ${displayCategory}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Status</td>
            <td style="padding:8px 0;background-color:#f9fafb;">
              <span style="background-color:#fef3c7;color:${EMAIL_CONFIG.COLORS.WARNING};padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">
                PENDING
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Response Time: STOPWATCH icon replaces ⏱️ -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;line-height:1.6;background-color:#e0f2fe;">
           <strong>Response Time:</strong> Our support team typically responds within <strong>24 business hours</strong>. You'll receive an email notification when your ticket is updated.
        </p>
      </div>

      <!-- What's Next: TICKET_SMALL icon replaces 📋 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="warning-text" style="margin:0 0 8px;color:#92400e;font-size:13px;font-weight:600;background-color:#fef9e7;"> What Happens Next:</p>
        <ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.6;">
          <li class="warning-text" style="color:#78350f;">Our team will review your ticket</li>
          <li class="warning-text" style="color:#78350f;">You'll receive updates via email</li>
          <li class="warning-text" style="color:#78350f;">Track progress in your tickets dashboard</li>
        </ul>
      </div>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/tickets`, text: 'View Your Tickets' })}

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Need urgent help? Contact us at ${getSupportLink()}
      </p>

    </div>

    <!-- Custom Footer -->
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo('WHITE', 'footer')}
      <p style="margin:0 0 6px;color:#d1d5db;">© ${EMAIL_CONFIG.CURRENT_YEAR} <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> Support</p>
      <p style="margin:0;color:#9ca3af;">All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default ticketCreatedTemplate;