// backend/src/modules/notifications/templates/email/enquiryReceived.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/enquiryReceived.js
// ============================================
// ENQUIRY RECEIVED EMAIL TEMPLATE
// ============================================

import { 
  EMAIL_CONFIG, 
  getBaseHeadContent, 
  renderLogo, 
  renderFooter 
} from './_helpers.js';
import { ICONS } from './_icons.js';

export function enquiryReceivedTemplate(context) {
  const { recipientName, name, enquiry_number, message } = context;
  const displayName = recipientName || name || 'there';

  const subject = `[${enquiry_number}] We've received your enquiry - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Enquiry Received - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header: MAILBOX icon replaces 📬 -->
    <div class="header-primary" style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:24px;font-weight:600;color:#ffffff;"> Enquiry Received</h1>
      <p style="margin:10px 0 0;opacity:0.9;font-size:14px;color:#e0e0e0;">Reference: <strong>${enquiry_number}</strong></p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:#05015A;">${displayName}</strong>,
      </p>
      
      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Thank you for reaching out to <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong>! 
        We've received your enquiry and our team will review it shortly.
      </p>

      <!-- Reference Box (no emoji originally, unchanged) -->
      <div class="otp-box" style="background-color:#f0f4f8;border:2px solid #05015A;border-radius:10px;padding:16px 20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:1px;background-color:#f0f4f8;">Your Reference Number</p>
        <p class="otp-code" style="margin:0;color:#05015A;font-weight:700;font-size:20px;font-family:'Courier New',monospace;letter-spacing:2px;background-color:#f0f4f8;-webkit-text-fill-color:#05015A;">${enquiry_number}</p>
      </div>

      <!-- Message Box -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:24px 0;">
        <p class="text-secondary" style="margin:0 0 10px;font-weight:600;color:#374151;font-size:14px;background-color:#f9fafb;"> Your Message:</p>
        <p class="table-value" style="margin:0;color:#4b5563;white-space:pre-wrap;font-style:italic;line-height:1.6;font-size:14px;background-color:#f9fafb;">"${message}"</p>
      </div>

      <!-- Response Time -->
      <div class="success-box" style="background-color:#f0fdf4;border-left:4px solid #059669;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="success-text" style="margin:0;color:#065f46;font-size:13px;background-color:#f0fdf4;">
           <strong>Response Time:</strong> We typically respond within 24-48 business hours.
        </p>
      </div>

      <!-- Message Box: CHAT_DARK icon replaces 💬 -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:24px 0;">
        <p class="text-secondary" style="margin:0 0 10px;font-weight:600;color:#374151;font-size:14px;background-color:#f9fafb;">
          ${ICONS.CHAT_DARK}
          <span style="vertical-align:middle;">Your Message:</span>
        </p>
        <p class="table-value" style="margin:0;color:#4b5563;white-space:pre-wrap;font-style:italic;line-height:1.6;font-size:14px;background-color:#f9fafb;">
          "${message}"
        </p>
      </div>

      <!-- Response Time: STOPWATCH icon replaces ⏱ -->
      <div class="success-box" style="background-color:#f0fdf4;border-left:4px solid #059669;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="success-text" style="margin:0;color:#065f46;font-size:13px;background-color:#f0fdf4;">
          ${ICONS.STOPWATCH}
          <strong style="vertical-align:middle;">Response Time:</strong>
          <span style="vertical-align:middle;">
            We typically respond within 24-48 business hours.
          </span>
        </p>
      </div>

      <!-- Tip Box: LIGHTBULB icon replaces 💡 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid #05015A;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p class="info-text" style="margin:0;color:#05015A;font-size:13px;background-color:#e0f2fe;">
          <strong>Tip:</strong> Save this reference number for any follow-up communication.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        If your matter is urgent, please mention the reference number 
        when contacting us.
      </p>

    </div>

    <!-- Footer: HEART_BLUE icon replaces 💙 -->
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo('WHITE', 'footer')}
      <p style="margin:0 0 6px;color:#d1d5db;font-size:13px;">We'll be in touch soon! </p>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${EMAIL_CONFIG.CURRENT_YEAR} <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong></p>
      <p style="margin:0;color:#9ca3af;">All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default enquiryReceivedTemplate;