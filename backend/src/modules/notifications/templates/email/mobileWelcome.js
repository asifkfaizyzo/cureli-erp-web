// backend/src/modules/notifications/templates/email/mobileWelcome.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/mobileWelcome.js
// ============================================
// MOBILE USER WELCOME EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  renderButton,
  getSupportLink,
} from './_helpers.js';

/**
 * Welcome email sent when a mobile user completes onboarding
 * and sets their email for the first time.
 *
 * Context: { recipientName }
 */
export function mobileWelcomeTemplate(context) {
  const { recipientName } = context;

  const subject = `Welcome to Cureli Health! 🎉`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Welcome to ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: Success/Celebration Theme -->
    <div class="header-success" style="background:linear-gradient(135deg,#047857 0%,#059669 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Welcome to Cureli!</h1>
      <p style="margin:10px 0 0;opacity:0.95;font-size:15px;color:#ffffff;">Your health, delivered to your doorstep</p>
    </div>

    <!-- Main Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;">
        Hi <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.7;margin:0 0 24px;">
        We're thrilled to have you on board! Your account is all set up and ready to go. Here's what you can do right now:
      </p>

      <!-- Quick Start Cards -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 12px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:40px;vertical-align:top;padding-right:14px;">
              <span style="display:inline-block;width:32px;height:32px;background-color:#dbeafe;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">💊</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Browse Medicines</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Search from thousands of medicines across trusted pharmacies near you.</p>
            </td>
          </tr>
        </table>
      </div>

      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 12px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:40px;vertical-align:top;padding-right:14px;">
              <span style="display:inline-block;width:32px;height:32px;background-color:#fce7f3;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">📋</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Upload Prescriptions</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Snap a photo of your prescription and let pharmacies come to you with quotes.</p>
            </td>
          </tr>
        </table>
      </div>

      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:40px;vertical-align:top;padding-right:14px;">
              <span style="display:inline-block;width:32px;height:32px;background-color:#d1fae5;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">🚚</span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Track Your Orders</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Get real-time updates on your orders from confirmation to delivery.</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Info Box -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;line-height:1.6;">
          <strong>Pro tip:</strong> Add your family members to your profile so you can order medicines for everyone from a single account.
        </p>
      </div>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}`, text: 'Start Shopping', color: 'success' })}

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Need help getting started? Reach out at ${getSupportLink()}
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

export default mobileWelcomeTemplate;