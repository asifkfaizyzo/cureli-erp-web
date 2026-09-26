// backend/src/modules/notifications/templates/email/subscriptionGraceEnding.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionGraceEnding.js
// ============================================
// SUBSCRIPTION GRACE ENDING EMAIL TEMPLATE
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

export function subscriptionGraceEndingTemplate(context) {
  const {
    recipientName,
    shop_name,
    grace_period_until,
  } = context;

  const subject = ' URGENT: Your account will be suspended tomorrow';

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Final Warning - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: ALERT icon replaces 🚨 -->
    <div class="header-error" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.ERROR} 0%,${EMAIL_CONFIG.COLORS.ERROR_DARK} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;"> FINAL WARNING</h1>
      <p style="margin:8px 0 0;font-size:15px;opacity:0.95;font-weight:600;color:#fee2e2;">Account Suspension Imminent</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 16px;background-color:#ffffff;">
        Hello <strong style="color:${EMAIL_CONFIG.COLORS.ERROR};">${recipientName}</strong>,
      </p>

      <!-- Critical Alert: ALERT icon replaces 🚨 -->
      <div class="critical-box" style="background-color:#fef2f2;border:3px solid ${EMAIL_CONFIG.COLORS.ERROR};border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
        <p class="critical-text" style="margin:0;color:#991b1b;font-size:18px;font-weight:700;background-color:#fef2f2;-webkit-text-fill-color:#991b1b;">
           Your grace period ends TOMORROW!
        </p>
        <p class="critical-text" style="margin:12px 0 0;color:#7f1d1d;font-size:14px;font-weight:600;background-color:#fef2f2;">
          Grace Period Ends: ${formattedGraceDate}
        </p>
      </div>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        This is your <strong style="color:${EMAIL_CONFIG.COLORS.ERROR};">FINAL WARNING</strong>.
        Your shop <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${shop_name || 'your shop'}</strong>
        will be <strong style="color:${EMAIL_CONFIG.COLORS.ERROR};">SUSPENDED</strong> if you don't renew your
        <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> subscription immediately.
      </p>

      <!-- Consequences Box: LIGHTNING icon replaces ⚡ -->
      <div class="warning-box" style="background-color:#fff7ed;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="warning-text" style="margin:0 0 10px;color:#92400e;font-size:14px;font-weight:700;background-color:#fff7ed;">
           What Happens When Suspended:
        </p>
        <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;">
          <li class="warning-text" style="color:#78350f;"><strong>Your shop and all branches will be inaccessible</strong></li>
          <li class="warning-text" style="color:#78350f;">Your staff cannot log in to ${EMAIL_CONFIG.COMPANY.NAME}</li>
          <li class="warning-text" style="color:#78350f;">All business operations will be halted</li>
          <li class="warning-text" style="color:#78350f;">No access to inventory, sales, or reports</li>
          <li class="warning-text" style="color:#78350f;">Data remains safe but locked until renewal</li>
        </ul>
      </div>

      <!-- Urgent CTA -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/subscription`, text: 'RENEW NOW - Avoid Suspension', color: 'error' })}

      <!-- Help Section: LIGHTBULB icon replaces 💡 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;line-height:1.6;background-color:#e0f2fe;">
           <strong>Need Immediate Help?</strong><br>
          Contact our support team right away. We're here to help you avoid suspension.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        <strong>Emergency Support:</strong>
        <a href="mailto:${EMAIL_CONFIG.COMPANY.SUPPORT_EMAIL}"
           style="color:${EMAIL_CONFIG.COLORS.ERROR};text-decoration:none;font-weight:600;">
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

export default subscriptionGraceEndingTemplate;