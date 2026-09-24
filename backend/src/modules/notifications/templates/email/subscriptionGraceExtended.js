// backend/src/modules/notifications/templates/email/subscriptionGraceExtended.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionGraceExtended.js
// ============================================
// SUBSCRIPTION GRACE EXTENDED EMAIL TEMPLATE
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

export function subscriptionGraceExtendedTemplate(context) {
  const {
    recipientName,
    shop_name,
    plan_name,
    days_extended,
    previous_grace_end,
    new_grace_end,
    reason,
  } = context;

  const subject = ' Good News: Your grace period has been extended';

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Grace Period Extended - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: CHECK icon replaces  -->
    <div class="header-success" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.SUCCESS} 0%,${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Grace Period Extended</h1>
      <p class="days-display days-extended" style="margin:12px 0 0;font-size:36px;font-weight:700;letter-spacing:-1px;color:#ffffff;-webkit-text-fill-color:#ffffff;">+${days_extended} days</p>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9;color:#d1fae5;">Additional Time Granted</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Great news! Your grace period for
        <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${shop_name || "your shop"}</strong>
        has been extended by the <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> support team.
      </p>

      <!-- Extension Details -->
      <div class="success-box" style="background-color:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 14px;font-size:13px;color:#065f46;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #a7f3d0;padding-bottom:8px;background-color:#ecfdf5;">
          Extension Details
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          ${
            plan_name
              ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#065f46;font-size:13px;width:130px;background-color:#ecfdf5;">Plan</td>
            <td class="success-text" style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#065f46;background-color:#ecfdf5;">${plan_name}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td class="table-label" style="padding:8px 0;color:#065f46;font-size:13px;background-color:#ecfdf5;">Extended By</td>
            <td class="days-extended" style="padding:8px 0;font-weight:700;font-size:16px;text-align:right;color:${EMAIL_CONFIG.COLORS.SUCCESS};background-color:#ecfdf5;-webkit-text-fill-color:${EMAIL_CONFIG.COLORS.SUCCESS};">
              +${days_extended} days
            </td>
          </tr>
          ${
            formattedPreviousEnd
              ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#065f46;font-size:13px;background-color:#ecfdf5;">Old Deadline</td>
            <td style="padding:8px 0;font-size:13px;text-align:right;text-decoration:line-through;color:#9ca3af;background-color:#ecfdf5;">
              ${formattedPreviousEnd}
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td class="table-label" style="padding:8px 0;color:#065f46;font-size:13px;background-color:#ecfdf5;">New Deadline</td>
            <td class="success-text" style="padding:8px 0;font-weight:700;font-size:15px;text-align:right;color:${EMAIL_CONFIG.COLORS.SUCCESS};background-color:#ecfdf5;">
              ${new_grace_end ? new Date(new_grace_end).toLocaleDateString('en-IN', { 
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
              }) : 'Extended'} 
            </td>
          </tr>
        </table>
      </div>

      ${
        reason
          ? `
      <!-- Support Note: NOTE_DARK icon replaces 📝 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 6px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;font-weight:600;background-color:#e0f2fe;"> Note from ${EMAIL_CONFIG.COMPANY.NAME} Support:</p>
        <p class="info-text" style="margin:0;color:#374151;font-size:13px;line-height:1.6;font-style:italic;background-color:#e0f2fe;">
          "${reason}"
        </p>
      </div>
      `
          : ""
      }

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:20px 0;background-color:#ffffff;">
        Please use this additional time to complete your payment and maintain uninterrupted access to
        <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong>.
      </p>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/settings/upgrade`, text: 'Complete Payment Now' })}

      <!-- Reminder Warning: WARNING icon replaces ⚠️ -->
      <div class="warning-box" style="background-color:#fef3c7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;line-height:1.6;background-color:#fef3c7;">
           <strong>Important Reminder:</strong> This extension is a one-time courtesy. Please ensure payment is completed before the new deadline to maintain your ${EMAIL_CONFIG.COMPANY.NAME} subscription.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Need help? Contact us at ${getSupportLink()}
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

export default subscriptionGraceExtendedTemplate;
