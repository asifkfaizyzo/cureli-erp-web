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
 * Welcome email sent when a mobile user completes onboarding / registration.
 *
 * Context: { recipientName }
 */
export function mobileWelcomeTemplate(context) {
  const { recipientName } = context;
  const displayName = recipientName && recipientName.trim() ? recipientName.trim() : 'there';

  const subject = `Welcome to Cureli Health`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Welcome to ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: Success Theme -->
    <div class="header-success" style="background:linear-gradient(135deg,#047857 0%,#059669 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Welcome to Cureli</h1>
      <p style="margin:10px 0 0;opacity:0.95;font-size:15px;color:#ffffff;">Your health, delivered to your doorstep</p>
    </div>

    <!-- Main Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;">
        Hi <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${displayName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.7;margin:0 0 24px;">
        We are thrilled to have you with us. Your Cureli account is now active and ready to use. Here is how you can get started:
      </p>

      <!-- Quick Start Cards with Clean Vector Icons -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 12px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:40px;vertical-align:top;padding-right:14px;">
              <span style="display:inline-block;width:34px;height:34px;background-color:#dbeafe;border-radius:8px;text-align:center;line-height:34px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              </span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Browse Medicines</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Search and order genuine medicines directly from licensed, verified pharmacies in your area.</p>
            </td>
          </tr>
        </table>
      </div>

      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 12px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:40px;vertical-align:top;padding-right:14px;">
              <span style="display:inline-block;width:34px;height:34px;background-color:#fce7f3;border-radius:8px;text-align:center;line-height:34px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
              </span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Upload Prescriptions</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Upload a photo of your prescription and let verified pharmacists review and prepare your order.</p>
            </td>
          </tr>
        </table>
      </div>

      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:40px;vertical-align:top;padding-right:14px;">
              <span style="display:inline-block;width:34px;height:34px;background-color:#d1fae5;border-radius:8px;text-align:center;line-height:34px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              </span>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">Fast Doorstep Delivery</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Track your medicine delivery with real-time status updates from dispatch to arrival.</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Info Box -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;line-height:1.6;">
          <strong>Tip:</strong> You can add family members under your profile to manage medicine orders for your entire household from one place.
        </p>
      </div>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}`, text: 'Start Exploring', color: 'success' })}

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Need help? Contact our support team anytime at ${getSupportLink()}
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