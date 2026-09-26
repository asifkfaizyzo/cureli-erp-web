// backend/src/modules/notifications/templates/email/emailChangeOtp.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/emailChangeOtp.js
// ============================================
// EMAIL CHANGE OTP TEMPLATE
// ============================================

import { 
  EMAIL_CONFIG, 
  getBaseHeadContent, 
  renderLogo, 
  renderFooter 
} from './_helpers.js';
import { ICONS } from './_icons.js';

export function emailChangeOtpTemplate(context) {
  const { recipientName, otp, expires_in_minutes = 10 } = context;

  const subject = 'Verify Your New Email - Cureli Health';

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent('Verify Your New Email - Cureli Health')}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header: EMAIL icon replaces 📧 -->
    <div class="header-primary" style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'normal')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Verify Your New Email</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;color:#e0e0e0;">Email Change Verification</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hi <strong class="brand-text" style="color:#05015A;">
          ${recipientName || 'there'}
        </strong>,
      </p>
      
      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        You requested to change your email address. Please use the 
        verification code below to complete the process.
      </p>

      <!-- OTP Code Box (no emoji here originally, unchanged) -->
      <div class="otp-box" style="background-color:#f0f4f8;border:3px solid #05015A;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
        <p class="otp-label" style="margin:0 0 12px;font-size:12px;color:#555555;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;background-color:#f0f4f8;">
          Your Verification Code
        </p>
        <div style="background-color:#05015A;border-radius:8px;padding:16px 8px;display:inline-block;">
          <span class="otp-code" style="color:#ffffff;letter-spacing:12px;font-size:36px;font-weight:700;font-family:'Courier New',Courier,monospace;-webkit-text-fill-color:#ffffff;">
            ${otp}
          </span>
        </div>
      </div>

      <!-- Expiry Warning: CLOCK icon replaces ⏰ -->
      <div class="warning-box" style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef3c7;">
           This code expires in <strong>${expires_in_minutes} minutes</strong>
        </p>
      </div>

      <!-- Security Note: LOCK_BLUE icon replaces 🔒 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p class="info-text" style="margin:0;color:#0c4a6e;font-size:13px;background-color:#e0f2fe;">
           <strong>Security:</strong> Never share this code with anyone. ${EMAIL_CONFIG.COMPANY.NAME} will never ask for it.
        </p>
      </div>

      <p class="text-muted" style="color:#888888;font-size:13px;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        If you didn't request this email change, please ignore this message 
        or contact support if you have concerns.
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

export default emailChangeOtpTemplate;