// backend/src/modules/notifications/templates/email/subscriptionGraceStarted.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionGraceStarted.js
// ============================================
// SUBSCRIPTION GRACE STARTED EMAIL TEMPLATE
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

export function subscriptionGraceStartedTemplate(context) {
  const {
    recipientName,
    shop_name,
    business_name,
    grace_period_until,
    plan_name,
  } = context;

  const shopName = shop_name || business_name || 'your shop';

  const graceEndDate = grace_period_until
    ? new Date(grace_period_until).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'soon';

  const subject = ` Your subscription has expired - Grace period active - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Grace Period Active - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: WARNING icon replaces ⚠️ -->
    <div class="header-warning" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.WARNING} 0%,${EMAIL_CONFIG.COLORS.WARNING_DARK} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Grace Period Active</h1>
      <p style="margin:8px 0 0;opacity:0.95;font-size:14px;color:#fef3c7;">Your subscription has expired</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 16px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <!-- Alert Box: CLOCK icon replaces inline warning -->
      <div class="warning-box" style="background-color:#fffbeb;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:16px 20px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="warning-text" style="margin:0 0 8px;color:#b45309;font-weight:600;font-size:14px;background-color:#fffbeb;">
          Your <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> subscription for <strong>${shopName}</strong> has expired.
        </p>
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fffbeb;">
          ${ICONS.CLOCK}
          <span style="vertical-align:middle;">
            You are now in a grace period until
            <strong class="grace-date" style="color:${EMAIL_CONFIG.COLORS.ERROR};-webkit-text-fill-color:${EMAIL_CONFIG.COLORS.ERROR};">${graceEndDate}</strong>.
          </span>
        </p>
      </div>

      <!-- Account Details -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:100px;background-color:#f9fafb;">Shop</td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">${shopName}</td>
          </tr>
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">Plan</td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">${plan_name || 'Standard'}</td>
          </tr>
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">Status</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              <span style="background-color:#fef3c7;color:${EMAIL_CONFIG.COLORS.WARNING};padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">
                GRACE PERIOD
              </span>
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;background-color:#f9fafb;">Grace Ends</td>
            <td class="grace-date" style="padding:12px 16px;color:${EMAIL_CONFIG.COLORS.ERROR};font-weight:700;font-size:14px;background-color:#f9fafb;-webkit-text-fill-color:${EMAIL_CONFIG.COLORS.ERROR};">
              ${graceEndDate}
            </td>
          </tr>
        </table>
      </div>

      <!-- Important Info: WARNING_RED icon replaces ⚠️ -->
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid ${EMAIL_CONFIG.COLORS.ERROR};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="error-text" style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;background-color:#fef2f2;">
           <strong>Important:</strong> During the grace period, you still have access to your dashboard. However, if you don't renew before <strong>${graceEndDate}</strong>, your account will be <strong>SUSPENDED</strong>.
        </p>
      </div>

      <!-- What Happens: BAN icon replaces 🚫 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 8px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;font-weight:600;background-color:#e0f2fe;"> What Happens If You Don't Renew:</p>
        <ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.6;">
          <li class="info-text" style="color:#0c4a6e;">Complete loss of access to ${EMAIL_CONFIG.COMPANY.NAME}</li>
          <li class="info-text" style="color:#0c4a6e;">Your shop and branches will be locked</li>
          <li class="info-text" style="color:#0c4a6e;">Staff cannot log in or perform operations</li>
          <li class="info-text" style="color:#0c4a6e;">All business activities will halt</li>
        </ul>
      </div>

      <!-- Urgent CTA -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/subscription`, text: 'Renew Now - Avoid Suspension',  color: 'error' })}

      <!-- Support: LIGHTBULB_AMBER icon replaces 💡 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef9e7;">
           <strong>Need Help?</strong> Contact our support team immediately for assistance with renewal.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        <strong>Support:</strong>
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

export default subscriptionGraceStartedTemplate;