// backend/src/modules/notifications/templates/email/shopVerified.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/shopVerified.js
// ============================================
// SHOP VERIFIED EMAIL TEMPLATE
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

export function shopVerifiedTemplate(context) {
  const { recipientName, shop_name, business_name } = context;
  const shopName = shop_name || business_name || "your shop";

  const subject = `Congratulations! Your shop is verified - ${EMAIL_CONFIG.COMPANY.NAME}`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Verification Complete - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: CELEBRATE icon replaces 🎉 -->
    <div class="header-success" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.PRIMARY} 0%,${EMAIL_CONFIG.COLORS.PRIMARY_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:24px;font-weight:600;color:#ffffff;"> Verification Complete!</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;color:#e0e0e0;">Your shop is now verified</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        Great news! Your shop <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${shopName}</strong>
        has been successfully verified by our team. All your documents have been approved!
      </p>

      <!-- Success Box: CHECK icon replaces  -->
      <div class="success-box" style="background-color:#d1fae5;border-left:4px solid ${EMAIL_CONFIG.COLORS.SUCCESS_LIGHT};padding:20px;margin:24px 0;border-radius:0 10px 10px 0;text-align:center;">
        <p class="success-text" style="margin:0;color:#065f46;font-weight:700;font-size:16px;background-color:#d1fae5;">
          Your shop is now fully operational!
        </p>
      </div>

      <!-- Features Box: ROCKET_BLUE icon replaces 🚀 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0 0 10px;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:14px;font-weight:600;background-color:#e0f2fe;"> What's Next?</p>
        <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;">
          <li class="info-text" style="color:#0c4a6e;">Access all ${EMAIL_CONFIG.COMPANY.NAME} features</li>
          <li class="info-text" style="color:#0c4a6e;">Set up your inventory and products</li>
          <li class="info-text" style="color:#0c4a6e;">Configure your shop settings</li>
          <li class="info-text" style="color:#0c4a6e;">Start managing your business efficiently</li>
        </ul>
      </div>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:20px 0;text-align:center;background-color:#ffffff;">
        You can now access the complete <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> dashboard and unlock all features.
      </p>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/dashboard`, text: 'Go to Dashboard' })}

      <!-- Welcome Message: WAVE icon replaces 👋 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;line-height:1.6;background-color:#fef9e7;">
           <strong>Welcome to ${EMAIL_CONFIG.COMPANY.NAME}!</strong> Need help getting started? Check out our documentation or contact support anytime.
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

export default shopVerifiedTemplate;
