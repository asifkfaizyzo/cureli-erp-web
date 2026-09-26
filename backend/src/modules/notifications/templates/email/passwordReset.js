// backend/src/modules/notifications/templates/email/passwordReset.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/passwordReset.js
// ============================================
// PASSWORD RESET EMAIL TEMPLATE
// ============================================

import { 
  EMAIL_CONFIG, 
  getBaseHeadContent, 
  renderLogo, 
  renderFooter,
  renderButton 
} from './_helpers.js';
import { ICONS } from './_icons.js';

export function passwordResetTemplate(context) {
  const { recipientName, resetUrl } = context;

  const subject = 'Reset Your Password - Cureli';

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent('Reset Your Password - Cureli Health')}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header: LOCK_KEY icon replaces 🔐 -->
    <div class="header-primary" style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'normal')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Reset Your Password</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#e0e0e0;">Password Recovery</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hi <strong class="brand-text" style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        You requested to reset your password for your 
        <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> account. Click the 
        button below to create a new password.
      </p>

      <!-- CTA Button -->
      ${renderButton({ href: resetUrl, text: 'Reset Password', color: 'primary' })}

      <!-- Alternative Link (no emoji originally, unchanged) -->
      <div class="card-bg" style="background-color:#f9fafb;padding:14px;border-radius:8px;margin:20px 0;">
        <p class="text-muted" style="font-size:12px;color:#666666;margin:0 0 6px;background-color:#f9fafb;">
          Or copy this link:
        </p>
        <p style="word-break:break-all;font-size:12px;margin:0;background-color:#f9fafb;">
          <a href="${resetUrl}" class="brand-text" 
             style="color:#05015A;text-decoration:none;">${resetUrl}</a>
        </p>
      </div>

      <!-- Expiry Warning: WARNING icon replaces ⚠️ -->
      <div class="warning-box" style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef3c7;">
           <strong>Important:</strong> This link expires in <strong>15 minutes</strong>
        </p>
      </div>

      <!-- Security Note: SHIELD icon replaces 🛡️ -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p class="info-text" style="margin:0;color:#0c4a6e;font-size:13px;background-color:#e0f2fe;">
           <strong>Didn't request this?</strong> You can safely ignore this email — your password won't change.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        For security reasons, never share this link with anyone.
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

export default passwordResetTemplate;