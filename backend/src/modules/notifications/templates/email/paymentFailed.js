// backend/src/modules/notifications/templates/email/paymentFailed.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/paymentFailed.js
// ============================================
// PAYMENT FAILED EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  renderButton,
} from "./_helpers.js";
import { ICONS } from "./_icons.js";

export function paymentFailedTemplate(context) {
  const {
    recipientName,
    shop_name,
    business_name,
    plan_name,
    amount,
    error_message,
    retry_url,
  } = context;

  const subject = ` Payment Failed - Action Required - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Payment Failed - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header: PAYMENT_FAILED icon replaces  -->
    <div class="header-error" style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Payment Failed</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#fee2e2;">Action Required</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 16px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <!-- Alert Box: WARNING_AMBER icon replaces ⚠️ -->
      <div class="error-box" style="background-color:#fef2f2;border:2px solid #dc2626;padding:18px;border-radius:10px;margin:20px 0;text-align:center;">
        <p class="error-text" style="margin:0;font-size:16px;font-weight:700;color:#dc2626;background-color:#fef2f2;">
           Your payment could not be processed
        </p>
      </div>

      <!-- Payment Details (no emoji originally, unchanged) -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:100px;background-color:#f9fafb;">
              Shop
            </td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:500;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ${shopName}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              Plan
            </td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:500;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ${plan_name || "Standard"}
            </td>
          </tr>
          ${
            amount
              ? `
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              Amount
            </td>
            <td class="table-value" style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ₹${Number(amount).toLocaleString("en-IN")}
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;background-color:#f9fafb;">
              Status
            </td>
            <td style="padding:12px 16px;background-color:#f9fafb;">
              <span style="background-color:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">
                FAILED
              </span>
            </td>
          </tr>
        </table>
      </div>

      ${
        error_message
          ? `
      <!-- Error Reason (no emoji originally, unchanged) -->
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="error-text" style="margin:0;color:#991b1b;font-size:13px;background-color:#fef2f2;">
          <strong>Reason:</strong> ${error_message}
        </p>
      </div>
      `
          : ""
      }

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:20px 0;background-color:#ffffff;">
        Don't worry! Payment failures can happen due to insufficient funds, 
        card limits, or temporary bank issues.
      </p>

      <!-- Action Steps: LIGHTBULB icon replaces 💡 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 10px;font-weight:600;color:#05015A;font-size:13px;background-color:#e0f2fe;"> What you can do:</p>
        <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;">
          <li class="info-text" style="color:#0c4a6e;">
            Check your card/bank account balance
          </li>
          <li class="info-text" style="color:#0c4a6e;">
            Try a different payment method
          </li>
          <li class="info-text" style="color:#0c4a6e;">
            Contact your bank if the issue persists
          </li>
          <li class="info-text" style="color:#0c4a6e;">
            Retry the payment below
          </li>
        </ul>
      </div>

      <!-- Retry Button -->
      ${renderButton({ 
        href: retry_url || `${EMAIL_CONFIG.FRONTEND_URL}/subscription`, 
        text: 'Retry Payment', 
        color: 'primary' 
      })}

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Need help? Contact us at 
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

export default paymentFailedTemplate;
