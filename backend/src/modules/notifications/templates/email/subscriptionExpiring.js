// backend/src/modules/notifications/templates/email/subscriptionExpiring.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionExpiring.js
// ============================================
// SUBSCRIPTION EXPIRING EMAIL TEMPLATE
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

export function subscriptionExpiringTemplate(context) {
  const {
    recipientName,
    shop_name,
    daysLeft,
    end_date,
    plan_name,
  } = context;

  const isUrgent = daysLeft <= 3;
  const urgencyColor  = isUrgent ? EMAIL_CONFIG.COLORS.ERROR   : EMAIL_CONFIG.COLORS.WARNING;
  const urgencyBg     = isUrgent ? '#fef2f2'                   : '#fef3c7';

  const subject = daysLeft <= 3
    ? ` Urgent: Your subscription expires in ${daysLeft} days`
    : ` Reminder: Your subscription expires in ${daysLeft} days`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Subscription Expiring - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: ALERT or CLOCK icon replaces 🚨/⏰ -->
    <div class="header-urgency" style="background:linear-gradient(135deg,${urgencyColor} 0%,${urgencyColor}dd 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">
        ${isUrgent ? ICONS.ALERT : ICONS.CLOCK}
        <span style="vertical-align:middle;">Subscription Expiring Soon</span>
      </h1>
      <p class="days-display days-left" style="margin:12px 0 0;font-size:36px;font-weight:700;letter-spacing:-1px;color:#ffffff;-webkit-text-fill-color:#ffffff;">
        ${daysLeft} days left
      </p>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9;color:#ffffff;">
        Action Required
      </p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Your <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> subscription for
        <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${shop_name || 'your shop'}</strong>
        is expiring soon. Please renew to continue enjoying uninterrupted service.
      </p>

      <!-- Expiry Details -->
      <div class="urgency-box" style="background-color:${urgencyBg};border:2px solid ${urgencyColor};border-radius:10px;padding:18px 20px;margin:24px 0;">
        <h3 style="margin:0 0 12px;font-size:13px;color:${urgencyColor};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;background-color:${urgencyBg};">
          Subscription Details
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          ${plan_name ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;background-color:${urgencyBg};">Plan</td>
            <td class="table-value" style="padding:8px 0;font-weight:600;font-size:14px;color:#111827;background-color:${urgencyBg};">${plan_name}</td>
          </tr>
          ` : ''}
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:${urgencyBg};">Expires On</td>
            <td class="urgency-text" style="padding:8px 0;font-weight:700;font-size:14px;color:${urgencyColor};background-color:${urgencyBg};">
              ${end_date
                ? new Date(end_date).toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })
                : 'Soon'}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:${urgencyBg};">Time Left</td>
            <td class="days-left" style="padding:8px 0;font-weight:700;font-size:16px;color:${urgencyColor};background-color:${urgencyBg};-webkit-text-fill-color:${urgencyColor};">
              ${daysLeft} days
            </td>
          </tr>
        </table>
      </div>

      <!-- Urgency Message: WARNING icon replaces ⚠️ -->
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid ${EMAIL_CONFIG.COLORS.ERROR};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="error-text" style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;background-color:#fef2f2;">
           <strong>Important:</strong> To avoid service interruption, please renew your subscription before it expires.
        </p>
      </div>

      <!-- Benefits Reminder: SPARKLE icon replaces ✨ -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 8px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;font-weight:600;background-color:#e0f2fe;"> Continue Enjoying:</p>
        <ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.6;">
          <li class="info-text" style="color:#0c4a6e;">Full access to all ${EMAIL_CONFIG.COMPANY.NAME} features</li>
          <li class="info-text" style="color:#0c4a6e;">Uninterrupted inventory management</li>
          <li class="info-text" style="color:#0c4a6e;">Sales and purchase tracking</li>
          <li class="info-text" style="color:#0c4a6e;">Comprehensive reports and analytics</li>
        </ul>
      </div>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/subscription`, text: 'Renew Now' })}

      <!-- Grace Period Warning: NOTE icon replaces 📝 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:12px;line-height:1.6;background-color:#fef9e7;">
           <strong>Note:</strong> If you don't renew, your account will enter a grace period and may be suspended after expiry.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Questions about renewal? Contact us at ${getSupportLink()}
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

export default subscriptionExpiringTemplate;