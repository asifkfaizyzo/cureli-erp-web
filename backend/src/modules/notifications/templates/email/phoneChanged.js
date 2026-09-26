// backend/src/modules/notifications/templates/email/phoneChanged.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/phoneChanged.js
// ============================================
// PHONE CHANGED NOTIFICATION TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  getSupportLink,
} from "./_helpers.js";
import { ICONS } from "./_icons.js";

export function phoneChangedTemplate(context) {
  const { recipientName, old_phone, new_phone } = context;

  const subject = `Phone Number Changed - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Phone Number Changed - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: PHONE icon replaces 📱 -->
    <div class="header-primary" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.PRIMARY} 0%,${EMAIL_CONFIG.COLORS.PRIMARY_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">\ Phone Number Changed</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#e0e0e0;">Security Notification</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hi <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName || "there"}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        This is a confirmation that your phone number has been successfully updated on your
        <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> account.
      </p>

      <!-- Change Details -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;background-color:#f9fafb;">
              Old Number
            </td>
            <td style="padding:8px 0;font-family:'Courier New',monospace;font-size:14px;color:${EMAIL_CONFIG.COLORS.ERROR};text-decoration:line-through;background-color:#f9fafb;">
              ${old_phone}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">
              New Number
            </td>
            <td class="success-text" style="padding:8px 0;font-family:'Courier New',monospace;font-size:14px;color:${EMAIL_CONFIG.COLORS.SUCCESS};font-weight:600;background-color:#f9fafb;">
              ${new_phone}
            </td>
          </tr>
        </table>
      </div>

      <!-- Success Confirmation: CHECK_CIRCLE icon replaces  -->
      <div class="success-box" style="background-color:#f0fdf4;border-left:4px solid ${EMAIL_CONFIG.COLORS.SUCCESS};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="success-text" style="margin:0;color:#065f46;font-size:13px;background-color:#f0fdf4;">
           <strong>Change Successful:</strong> Your new phone number is now active.
        </p>
      </div>

      <!-- Security Warning: WARNING_RED icon replaces ⚠️ -->
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid ${EMAIL_CONFIG.COLORS.ERROR};padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="error-text" style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;background-color:#fef2f2;">
           <strong>Didn't make this change?</strong><br>
          If you did not authorize this change, please contact our support team immediately to secure your account.
        </p>
      </div>

      <!-- Security Tips: SHIELD icon replaces 🛡️ -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 8px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;font-weight:600;background-color:#e0f2fe;"> Security Reminder:</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:12px;line-height:1.6;">
          <li class="info-text" style="color:#0c4a6e;">Keep your contact information up to date</li>
          <li class="info-text" style="color:#0c4a6e;">Never share your OTP or verification codes</li>
          <li class="info-text" style="color:#0c4a6e;">Enable two-factor authentication for added security</li>
        </ul>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Questions? Contact us at ${getSupportLink()}
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

export default phoneChangedTemplate;
