// backend/src/modules/notifications/templates/email/enquiryReplied.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/enquiryReplied.js
// ============================================
// ENQUIRY REPLIED EMAIL TEMPLATE
// ============================================

import { 
  EMAIL_CONFIG, 
  getBaseHeadContent, 
  renderLogo, 
  renderFooter 
} from './_helpers.js';
import { ICONS } from './_icons.js';

export function enquiryRepliedTemplate(context) {
  const { recipientName, name, enquiry_number, reply_subject, reply_message } = context;
  const displayName = recipientName || name || 'there';

  const subject = `[${enquiry_number}] ${reply_subject} - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const formattedMessage = (reply_message || '').replace(/\n/g, '<br/>');

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Enquiry Response - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header: CHAT icon replaces 💬 -->
    <div class="header-primary" style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Response to Your Enquiry</h1>
      <p style="margin:10px 0 0;opacity:0.9;font-size:14px;color:#e0e0e0;">Reference: <strong>${enquiry_number}</strong></p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:#05015A;">${displayName}</strong>,
      </p>
      
      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Thank you for your patience. Here's our response to your enquiry:
      </p>

      <!-- Reference Info (no emoji originally, unchanged) -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:100px;background-color:#f9fafb;">
              Reference
            </td>
            <td class="table-value" style="padding:12px 16px;color:#05015A;font-weight:700;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ${enquiry_number}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;background-color:#f9fafb;">
              Subject
            </td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:500;font-size:14px;background-color:#f9fafb;">
              ${reply_subject}
            </td>
          </tr>
        </table>
      </div>

      <!-- Reply Message: INBOX icon replaces 📩 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid #05015A;padding:18px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 10px;font-weight:600;color:#05015A;font-size:13px;background-color:#e0f2fe;"> Our Response:</p>
        <p class="info-text" style="margin:0;color:#374151;line-height:1.7;font-size:14px;background-color:#e0f2fe;">
          ${formattedMessage}
        </p>
      </div>

      <!-- Follow-up Info: LIGHTBULB_AMBER icon replaces 💡 -->
      <div class="warning-box" style="background-color:#fefce8;border-left:4px solid #eab308;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#854d0e;font-size:13px;background-color:#fefce8;">
           <strong>Need more help?</strong> Reply to this email with your reference number.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Thank you for choosing 
        <strong class="brand-text" style="color:#05015A;">
          ${EMAIL_CONFIG.COMPANY.NAME}
        </strong>!
      </p>

    </div>

    <!-- Footer -->
    ${renderFooter()}

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default enquiryRepliedTemplate;