// backend/src/modules/notifications/templates/email/paymentSuccess.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/paymentSuccess.js
// ============================================
// PAYMENT SUCCESS EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  renderButton,
} from "./_helpers.js";
import { ICONS } from "./_icons.js";

export function paymentSuccessTemplate(context) {
  const {
    recipientName,
    shop_name,
    amount,
    transaction_id,
    plan_name,
    payment_date,
  } = context;

  const subject = ` Payment Successful - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const formattedAmount = amount
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
    : "N/A";

  const formattedDate = payment_date
    ? new Date(payment_date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN");

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Payment Successful - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: CHECK icon replaces  -->
    <div class="header-success" style="background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Payment Successful</h1>
      <p style="margin:12px 0 0;font-size:32px;font-weight:700;letter-spacing:-1px;color:#ffffff;">${formattedAmount}</p>
      <p style="margin:4px 0 0;opacity:0.9;font-size:13px;color:#d1fae5;">Thank you for your payment</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:#05015A;">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Your payment has been processed successfully! Here are your transaction details:
      </p>

      <!-- Payment Details Table -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">

          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:120px;background-color:#f9fafb;">
              Shop
            </td>
            <td class="table-value" style="padding:12px 16px;font-weight:600;font-size:14px;color:#1f2937;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ${shop_name || "N/A"}
            </td>
          </tr>

          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              Amount Paid
            </td>
            <td class="success-text" style="padding:12px 16px;font-weight:700;font-size:16px;color:#059669;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ${formattedAmount}
            </td>
          </tr>

          ${
            plan_name
              ? `
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              Plan
            </td>
            <td class="table-value" style="padding:12px 16px;font-weight:600;font-size:14px;color:#1f2937;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ${plan_name}
            </td>
          </tr>
          `
              : ""
          }

          ${
            transaction_id
              ? `
          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              Transaction ID
            </td>
            <td class="table-value" style="padding:12px 16px;font-family:'Courier New',monospace;font-size:12px;color:#374151;border-bottom:1px solid #e5e7eb;background-color:#f9fafb;">
              ${transaction_id}
            </td>
          </tr>
          `
              : ""
          }

          <tr>
            <td class="table-label" style="padding:12px 16px;color:#6b7280;font-size:13px;background-color:#f9fafb;">
              Payment Date
            </td>
            <td class="table-value" style="padding:12px 16px;font-size:13px;color:#374151;background-color:#f9fafb;">
              ${formattedDate}
            </td>
          </tr>

        </table>
      </div>

      <!-- Receipt Note: DOCUMENT icon replaces 🧾 -->
      <div class="success-box" style="background-color:#f0fdf4;border-left:4px solid #059669;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="success-text" style="margin:0;color:#065f46;font-size:13px;background-color:#f0fdf4;">
           <strong>Receipt Generated:</strong> A receipt has been sent to your email for your records.
        </p>
      </div>

      <!-- Info Box: CLIPBOARD icon replaces 📊 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0;color:#05015A;font-size:13px;background-color:#e0f2fe;">
           You can view your complete payment history and subscription details in your dashboard.
        </p>
      </div>

      <!-- CTA Button -->
      ${renderButton({ 
        href: `${EMAIL_CONFIG.FRONTEND_URL}/subscription`, 
        text: 'View Subscription', 
        color: 'primary' 
      })}

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Questions about your payment? Contact us at
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

export default paymentSuccessTemplate;
