// backend/src/modules/notifications/templates/email/emailChanged.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/emailChanged.js
// ============================================
// EMAIL CHANGED NOTIFICATION TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
} from "./_helpers.js";
import { ICONS } from "./_icons.js";

export function emailChangedTemplate(context) {
  const { recipientName, old_email, new_email, notification_type } = context;

  const isOldEmail = notification_type === "old_email";

  const subject = isOldEmail
    ? `Email Address Changed - ${EMAIL_CONFIG.COMPANY.NAME}`
    : `Welcome to ${EMAIL_CONFIG.COMPANY.NAME} - Email Verified`;

  // WARNING icon replaces ⚠️
  const content = isOldEmail
    ? `
      <p class="text-secondary" style="font-size:15px;color:#444444;line-height:1.6;background-color:#ffffff;">
        Your email address has been changed from 
        <strong style="color:#dc2626;">${old_email}</strong> to 
        <strong style="color:#059669;">${new_email}</strong>.
      </p>
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p class="error-text" style="margin:0;color:#991b1b;font-size:14px;background-color:#fef2f2;">
          <strong> If you did not make this change, please contact support immediately.</strong>
        </p>
      </div>
    `
    : `
      <p class="text-secondary" style="font-size:15px;color:#444444;line-height:1.6;background-color:#ffffff;">
        Your email has been successfully changed to this address.
      </p>
      <p class="text-secondary" style="font-size:15px;color:#444444;line-height:1.6;background-color:#ffffff;">
        You will now receive all communications at this email.
      </p>
    `;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`${isOldEmail ? "Email Changed" : "Email Verified"} - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- 
      Header:
        isOldEmail  → EMAIL icon replaces 📧
        !isOldEmail → EMAIL_VERIFIED icon replaces  
    -->
    <div class="header-primary" style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">${isOldEmail ? ' Email Changed' : ' Email Verified'}</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#e0e0e0;">Account Notification</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 16px;background-color:#ffffff;">
        Hi <strong class="brand-text" style="color:#05015A;">
          ${recipientName || "there"}
        </strong>,
      </p>
      
      <div style="font-size:14px;color:#555555;line-height:1.7;">
        ${content}
      </div>

      <!-- Info Box: LOCK icon replaces 🔒 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid #05015A;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="info-text" style="margin:0;color:#05015A;font-size:13px;background-color:#e0f2fe;">
          ${ICONS.LOCK}
          <strong style="vertical-align:middle;">Security Tip:</strong>
          <span style="vertical-align:middle;">
            If you didn't make this change, please contact support immediately.
          </span>
        </p>
      </div>

      <!-- Help Note -->
      <p class="text-muted" style="font-size:13px;color:#888888;margin:20px 0 0;line-height:1.5;text-align:center;background-color:#ffffff;">
        Questions? Contact us at 
        <a href="mailto:${EMAIL_CONFIG.COMPANY.SUPPORT_EMAIL}" 
           style="color:#05015A;text-decoration:none;font-weight:500;">
          ${EMAIL_CONFIG.COMPANY.SUPPORT_EMAIL}
        </a>
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

export default emailChangedTemplate;
