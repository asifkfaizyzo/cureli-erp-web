// backend/src/modules/notifications/templates/email/systemBroadcast.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/systemBroadcast.js
// ============================================
// SYSTEM BROADCAST EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  getSupportLink,
} from './_helpers.js';
import { ICONS } from './_icons.js';

export function systemBroadcastTemplate(context) {
  const {
    recipientName,
    subject: broadcastSubject,
    message,
    sender_name = `${EMAIL_CONFIG.COMPANY.NAME} Team`,
  } = context;

  const subject = broadcastSubject || `Important Announcement from ${EMAIL_CONFIG.COMPANY.NAME}`;

  // Convert newlines to <br> for HTML
  const formattedMessage = (message || '').replace(/\n/g, '<br/>');

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Announcement - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: MEGAPHONE icon replaces 📢 -->
    <div class="header-primary" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.PRIMARY} 0%,${EMAIL_CONFIG.COLORS.PRIMARY_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Important Announcement</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#e0e0e0;">From the ${EMAIL_CONFIG.COMPANY.NAME} Team</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 20px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <!-- Announcement Message -->
      <div class="message-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:20px;margin:20px 0;border-radius:0 10px 10px 0;">
        <div class="message-text" style="font-size:14px;color:#1e3a5f;line-height:1.7;background-color:#e0f2fe;">
          ${formattedMessage}
        </div>
      </div>

      <!-- Signature -->
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p class="signature-text" style="font-size:14px;color:#666666;margin:0 0 6px;background-color:#ffffff;">
          Best regards,
        </p>
        <p class="signature-name" style="font-size:15px;color:${EMAIL_CONFIG.COLORS.PRIMARY};margin:0;font-weight:600;background-color:#ffffff;">
          ${sender_name}
        </p>
        <p class="text-muted" style="font-size:12px;color:#9ca3af;margin:4px 0 0;background-color:#ffffff;">
          ${EMAIL_CONFIG.COMPANY.NAME}
        </p>
      </div>

      <!-- Contact Info: CHAT_DARK icon replaces 💬 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef9e7;">
           Questions? Contact us at ${getSupportLink()}
        </p>
      </div>

    </div>

    <!-- Custom Footer (with automated note) -->
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo('WHITE', 'footer')}
      <p style="margin:0 0 6px;color:#d1d5db;">© ${EMAIL_CONFIG.CURRENT_YEAR} <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong></p>
      <p style="margin:0;color:#6b7280;font-size:11px;">This is a system announcement. Please do not reply to this email.</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default systemBroadcastTemplate;