// backend/src/modules/notifications/templates/email/subscriptionSuspended.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionSuspended.js
// ============================================
// SUBSCRIPTION SUSPENDED EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  renderButton,
  getSupportLink,
} from "./_helpers.js";
import { ICONS } from "./_icons.js";

export function subscriptionSuspendedTemplate(context) {
  const { recipientName, shop_name } = context;

  const subject = ' Your account has been suspended';

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Account Suspended - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: LOCK icon replaces 🔒 -->
    <div class="header-suspended" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.GRAY} 0%,${EMAIL_CONFIG.COLORS.GRAY_DARK} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Account Suspended</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#e5e7eb;">Action Required to Restore Access</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 16px;background-color:#ffffff;">
        Hello <strong style="color:#374151;">${recipientName}</strong>,
      </p>

      <!-- Suspension Notice -->
      <div class="suspended-box" style="background-color:#f3f4f6;border-left:4px solid ${EMAIL_CONFIG.COLORS.GRAY};padding:16px 20px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="suspended-text" style="margin:0;color:#374151;font-weight:600;font-size:14px;background-color:#f3f4f6;">
          Your <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> account for
          <strong>${shop_name || "your shop"}</strong> has been suspended due to non-payment.
        </p>
      </div>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Your subscription has expired and the grace period has ended. As a result, your account
        is now suspended and access to all services has been temporarily disabled.
      </p>

      <!-- Impact Box: BAN icon replaces 🚫 -->
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid ${EMAIL_CONFIG.COLORS.ERROR};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="error-text" style="margin:0 0 8px;color:#991b1b;font-size:13px;font-weight:600;background-color:#fef2f2;"> Currently Unavailable:</p>
        <ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.6;">
          <li class="error-text" style="color:#7f1d1d;">Access to ${EMAIL_CONFIG.COMPANY.NAME} dashboard and all features</li>
          <li class="error-text" style="color:#7f1d1d;">Staff login and operations</li>
          <li class="error-text" style="color:#7f1d1d;">Inventory management and sales tracking</li>
          <li class="error-text" style="color:#7f1d1d;">Reports and analytics</li>
        </ul>
      </div>

      <!-- Restoration Steps: UNLOCK icon replaces 🔓 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 10px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:14px;font-weight:600;background-color:#e0f2fe;"> To Restore Access:</p>
        <ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;">
          <li class="info-text" style="color:#0c4a6e;">Log in to your ${EMAIL_CONFIG.COMPANY.NAME} account</li>
          <li class="info-text" style="color:#0c4a6e;">Navigate to Subscription settings</li>
          <li class="info-text" style="color:#0c4a6e;">Complete the payment to reactivate</li>
          <li class="info-text" style="color:#0c4a6e;">Access will be restored immediately</li>
        </ol>
      </div>

      <!-- Data Safety: CHECK icon replaces  -->
      <div class="success-box" style="background-color:#d1fae5;border:2px solid ${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT};border-radius:10px;padding:16px 20px;margin:24px 0;text-align:center;">
        <p class="success-text" style="margin:0;color:#065f46;font-size:14px;font-weight:600;background-color:#d1fae5;">
           <strong>Good News:</strong> Your data is completely safe!
        </p>
        <p class="success-text" style="margin:6px 0 0;color:#047857;font-size:12px;background-color:#d1fae5;">
          Once you renew, everything will be restored exactly as it was.
        </p>
      </div>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/subscription`, text: 'Reactivate Account Now', })}

      <!-- Support: LIGHTBULB_AMBER icon replaces 💡 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef9e7;">
           <strong>Need Help?</strong> Contact our support team for assistance with reactivation.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Support: ${getSupportLink()}
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

export default subscriptionSuspendedTemplate;
