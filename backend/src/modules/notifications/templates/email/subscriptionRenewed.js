// backend/src/modules/notifications/templates/email/subscriptionRenewed.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionRenewed.js
// ============================================
// SUBSCRIPTION RENEWED EMAIL TEMPLATE
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

export function subscriptionRenewedTemplate(context) {
  const {
    recipientName,
    shop_name,
    business_name,
    plan_name,
    new_end_date,
    amount_paid,
  } = context;

  const subject = ` Subscription Renewed Successfully - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Renewal Successful - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: CELEBRATE icon replaces 🎉 -->
    <div class="header-success" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT} 0%,${EMAIL_CONFIG.COLORS.SUCCESS} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:24px;font-weight:600;color:#ffffff;"> Renewal Successful!</h1>
      <p style="margin:8px 0 0;opacity:0.95;font-size:14px;color:#d1fae5;">Your subscription has been renewed</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 16px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <!-- Success Banner: CHECK icon replaces  -->
      <div class="success-banner" style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border:2px solid ${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT};padding:20px;border-radius:10px;margin:20px 0;text-align:center;">
        <p class="success-text" style="margin:0;font-size:18px;font-weight:700;color:#065f46;background:transparent;">
           Subscription Renewed Successfully!
        </p>
      </div>

      <!-- Renewal Details -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:120px;background-color:#f9fafb;">Shop</td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">${shopName}</td>
          </tr>
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">Plan</td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">${plan_name || "Standard"}</td>
          </tr>
          ${
            amount_paid
              ? `
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">Amount Paid</td>
            <td class="amount-text" style="padding:12px 16px;color:${EMAIL_CONFIG.COLORS.SUCCESS};font-weight:700;font-size:15px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ₹${Number(amount_paid).toLocaleString("en-IN")}
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;background-color:#f9fafb;">Valid Until</td>
            <td class="valid-date" style="padding:12px 16px;color:${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT};font-weight:700;font-size:14px;background-color:#f9fafb;-webkit-text-fill-color:${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT};">
              ${endDateFormatted}
            </td>
          </tr>
        </table>
      </div>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:20px 0;background-color:#ffffff;">
        Great news! Your <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> subscription for <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${shopName}</strong> has been renewed successfully. You'll continue to have uninterrupted access to all features. 
      </p>

      <!-- Benefits Box: SPARKLE icon replaces ✨ -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 8px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;font-weight:600;background-color:#e0f2fe;"> Continue Enjoying:</p>
        <ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.6;">
          <li class="info-text" style="color:#0c4a6e;">Full access to all ${EMAIL_CONFIG.COMPANY.NAME} features</li>
          <li class="info-text" style="color:#0c4a6e;">Uninterrupted service and support</li>
          <li class="info-text" style="color:#0c4a6e;">Regular updates and improvements</li>
          <li class="info-text" style="color:#0c4a6e;">Comprehensive reports and analytics</li>
        </ul>
      </div>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/dashboard`, text: 'Continue to Dashboard', color: 'success' })}

      <!-- Thank You: THANKYOU icon replaces 🙏 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;text-align:center;background-color:#fef9e7;">
           <strong>Thank you for your continued trust in ${EMAIL_CONFIG.COMPANY.NAME}!</strong>
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Questions? We're here to help at ${getSupportLink()}
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

export default subscriptionRenewedTemplate;
