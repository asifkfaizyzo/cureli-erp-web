// backend/src/modules/notifications/templates/email/cadminPasswordReset.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/cadminPasswordReset.js
// ============================================
// CADMIN PASSWORD RESET EMAIL TEMPLATE
// ============================================

import { 
  EMAIL_CONFIG, 
  getBaseHeadContent, 
  renderLogo, 
  renderFooter,
  renderButton 
} from './_helpers.js';
import { ICONS } from './_icons.js';

export function cadminPasswordResetTemplate(context) {
  const { recipientName, resetUrl } = context;

  const subject = 'Reset Your Cureli Health Admin Password';

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent('Reset Your Cureli Health Password')}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div class="header-primary" style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'normal')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">
        ${EMAIL_CONFIG.COMPANY.NAME} Admin Panel
      </h1>
      <p style="margin:6px 0 0;opacity:0.9;font-size:13px;color:#e0e0e0;">
        Secure Access Management
      </p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <h2 class="text-primary" style="color:#05015A;font-size:20px;margin:0 0 16px;font-weight:600;background-color:#ffffff;">
        Reset Your Password
      </h2>

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 24px;background-color:#ffffff;">
        We received a request to reset your password for your 
        ${EMAIL_CONFIG.COMPANY.NAME} Admin account. Click the button 
        below to set a new password.
      </p>

      <!-- CTA Button -->
      ${renderButton({ href: resetUrl, text: 'Reset Password', color: 'primary' })}

      <!-- Alternative Link -->
      <div class="card-bg" style="background-color:#f9fafb;padding:14px;border-radius:8px;margin:20px 0;">
        <p class="text-muted" style="font-size:12px;color:#666666;margin:0 0 6px;background-color:#f9fafb;">
          Or copy this link:
        </p>
        <p style="word-break:break-all;font-size:12px;margin:0;background-color:#f9fafb;">
          <a href="${resetUrl}" class="brand-text" 
             style="color:#05015A;text-decoration:none;">${resetUrl}</a>
        </p>
      </div>

      <!-- Warning: CLOCK icon replaces ⏰ -->
      <div class="warning-box" style="background-color:#fef3c7;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef3c7;">
           This link expires in <strong>15 minutes</strong>
        </p>
      </div>

      <!-- Security Note -->
      <p class="text-muted" style="font-size:13px;color:#888888;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Didn't request this? You can safely ignore this email — 
        your password won't change.
      </p>

    </div>

    <!-- Footer -->
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo('WHITE', 'small')}
      <p style="margin:0 0 6px;color:#d1d5db;">
        © 2025 <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> — Admin Panel
      </p>
      <p style="margin:0;color:#9ca3af;">Secure authentication system</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default cadminPasswordResetTemplate;