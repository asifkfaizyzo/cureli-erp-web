// backend/src/modules/notifications/templates/email/subscriptionActivated.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionActivated.js
// ============================================
// SUBSCRIPTION ACTIVATED EMAIL TEMPLATE
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

export function subscriptionActivatedTemplate(context) {
  const {
    recipientName,
    shop_name,
    plan_name,
    start_date,
    end_date,
  } = context;

  const subject = ` Subscription Activated - Welcome to ${EMAIL_CONFIG.COMPANY.NAME}!`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Subscription Activated - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: CELEBRATE icon replaces 🎉 -->
    <div class="header-success" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.SUCCESS} 0%,${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:24px;font-weight:600;color:#ffffff;"> Welcome to ${EMAIL_CONFIG.COMPANY.NAME}!</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.95;color:#d1fae5;">Your subscription is now active</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Great news! Your subscription for <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${shop_name || 'your shop'}</strong> has been successfully activated. 
      </p>

      <!-- Subscription Details -->
      <div class="success-box" style="background-color:#d1fae5;border:1px solid ${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT};border-radius:10px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 12px;font-size:13px;color:#065f46;text-transform:uppercase;letter-spacing:0.5px;background-color:#d1fae5;">
          Subscription Details
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          ${plan_name ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#065f46;font-size:13px;width:100px;background-color:#d1fae5;">Plan</td>
            <td class="success-text" style="padding:8px 0;font-weight:600;color:#065f46;font-size:14px;background-color:#d1fae5;">${plan_name}</td>
          </tr>
          ` : ''}
          ${start_date ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#065f46;font-size:13px;background-color:#d1fae5;">Start Date</td>
            <td class="success-text" style="padding:8px 0;font-weight:600;color:#065f46;font-size:14px;background-color:#d1fae5;">
              ${new Date(start_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
          </tr>
          ` : ''}
          ${end_date ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#065f46;font-size:13px;background-color:#d1fae5;">Valid Until</td>
            <td class="success-text" style="padding:8px 0;font-weight:600;color:#065f46;font-size:14px;background-color:#d1fae5;">
              ${new Date(end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Features Access: ROCKET_BLUE icon replaces 🚀 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 10px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:14px;font-weight:600;background-color:#e0f2fe;"> What's Next?</p>
        <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;">
          <li class="info-text" style="color:#0c4a6e;">Access all ${EMAIL_CONFIG.COMPANY.NAME} features</li>
          <li class="info-text" style="color:#0c4a6e;">Set up your inventory and products</li>
          <li class="info-text" style="color:#0c4a6e;">Manage sales and purchases</li>
          <li class="info-text" style="color:#0c4a6e;">Generate reports and analytics</li>
        </ul>
      </div>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:20px 0;text-align:center;background-color:#ffffff;">
        You now have full access to all features. Let's get started! 
      </p>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/dashboard`, text: 'Go to Dashboard' })}

      <!-- Help Section: LIGHTBULB_AMBER icon replaces 💡 -->
      <div class="warning-box" style="background-color:#fef3c7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef3c7;">
           <strong>Need help getting started?</strong> Check our documentation or contact support anytime.
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

export default subscriptionActivatedTemplate;