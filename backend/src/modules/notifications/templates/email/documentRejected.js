// backend/src/modules/notifications/templates/email/documentRejected.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/documentRejected.js
// ============================================
// DOCUMENT REJECTED EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  renderButton,
} from "./_helpers.js";
import { ICONS } from "./_icons.js";

export function documentRejectedTemplate(context) {
  const {
    recipientName,
    shop_name,
    business_name,
    reason,
    summary = {},
  } = context;

  const shopName = shop_name || business_name || "your shop";
  const { approved = 0, rejected = 0, pending = 0 } = summary;

  const subject = "Action Required: Document review feedback - Cureli Health";

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent("Document Review Result - Cureli Health")}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header: DOCUMENT icon replaces 📄 -->
    <div class="header-error" style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'normal')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Document Review Result</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#fee2e2;">Action Required</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        The admin has reviewed your documents for 
        <strong class="brand-text" style="color:#05015A;">${shopName}</strong>.
      </p>

      <!-- Summary Box -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 22px;margin:24px 0;">
        <p class="table-label" style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;background-color:#f9fafb;">
          Review Summary:
        </p>
        <table style="width:100%;border-collapse:collapse;">

          <!-- Approved row: CHECK icon replaces  -->
          <tr>
            <td class="table-label" style="padding:10px 0;color:#059669;font-weight:600;font-size:14px;background-color:#f9fafb;"> Approved</td>
            <td class="success-text" style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#059669;background-color:#f9fafb;">${approved}</td>
          </tr>

          <!-- Rejected row: CROSS icon replaces  -->
          <tr style="border-top:1px solid #e5e7eb;">
            <td class="table-label" style="padding:10px 0;color:#dc2626;font-weight:600;font-size:14px;background-color:#f9fafb;"> Rejected</td>
            <td class="error-text" style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#dc2626;background-color:#f9fafb;">${rejected}</td>
          </tr>

          <!-- Pending row: HOURGLASS icon replaces ⏳ -->
          <tr style="border-top:1px solid #e5e7eb;">
            <td class="table-label" style="padding:10px 0;color:#f59e0b;font-weight:600;font-size:14px;background-color:#f9fafb;"> Pending</td>
            <td class="warning-text" style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#f59e0b;background-color:#f9fafb;">${pending}</td>
          </tr>

        </table>
      </div>

      ${
        reason
          ? `
      <!-- Rejection Reason: CROSS icon replaces  -->
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="error-text" style="margin:0 0 6px;font-weight:600;color:#991b1b;font-size:13px;background-color:#fef2f2;"> Reason for Rejection:</p>
        <p class="error-text" style="margin:0;color:#7f1d1d;font-style:italic;font-size:14px;line-height:1.5;background-color:#fef2f2;">"${reason}"</p>
      </div>
      `
          : ""
      }

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 24px;background-color:#ffffff;">
        Please log in to review the rejected documents. You can make 
        corrections and resubmit for another review.
      </p>

      <!-- CTA Button -->
      ${renderButton({ 
        href: `${EMAIL_CONFIG.FRONTEND_URL}/onboarding?resume_step=documents`, 
        text: 'Review Documents →', 
        color: 'primary' 
      })}

      <!-- Help Note -->
      <p class="text-muted" style="font-size:13px;color:#888888;margin:20px 0 0;line-height:1.5;text-align:center;background-color:#ffffff;">
        Need help? Contact our support team for assistance.
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

export default documentRejectedTemplate;
