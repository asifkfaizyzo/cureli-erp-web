// backend/src/modules/notifications/templates/email/subscriptionPaymentReminder.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/subscriptionPaymentReminder.js
// ============================================
// SUBSCRIPTION PAYMENT REMINDER EMAIL TEMPLATE
// Manual reminder sent by CAdmin
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

export function subscriptionPaymentReminderTemplate(context) {
  const {
    recipientName,
    shop_name,
    plan_name,
    plan_price,
    end_date,
    grace_period_until,
    days_remaining,
    is_in_grace,
  } = context;

  const urgencyColor =
    days_remaining <= 3
      ? EMAIL_CONFIG.COLORS.ERROR
      : EMAIL_CONFIG.COLORS.WARNING;
  const urgencyBg = days_remaining <= 3 ? "#fef2f2" : "#fef3c7";

  const statusText = is_in_grace
    ? "Your subscription is in grace period"
    : `Your subscription expires in ${days_remaining} days`;

  const deadlineDate = is_in_grace ? grace_period_until : end_date;

  // Subject: no emoji
  const subject = is_in_grace
    ? ` Action Required: Complete payment to avoid suspension`
    : ` Payment Reminder: Renew your subscription`;

  const html = `
    <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Payment Reminder - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header: CREDIT_CARD icon replaces 💳 -->
    <div class="header-primary" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.PRIMARY} 0%,${EMAIL_CONFIG.COLORS.PRIMARY_LIGHT} 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;"> Payment Reminder</h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.9;color:#e0e0e0;">${statusText}</p>
    </div>

    <!-- Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;background-color:#ffffff;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;background-color:#ffffff;">
        This is a friendly reminder from the <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> team about your subscription
        for <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${shop_name || "your shop"}</strong>.
      </p>

      <!-- Subscription Details Box -->
      <div class="urgency-box" style="background-color:${urgencyBg};border:2px solid ${urgencyColor};border-radius:10px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 14px;font-size:13px;color:${urgencyColor};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:1px solid ${urgencyColor}40;padding-bottom:8px;background-color:${urgencyBg};">
          Subscription Details
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;width:130px;background-color:${urgencyBg};">Plan</td>
            <td class="table-value" style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#111827;background-color:${urgencyBg};">${plan_name || "Standard"}</td>
          </tr>
          ${
            plan_price
              ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:${urgencyBg};">Amount Due</td>
            <td class="amount-due" style="padding:8px 0;font-weight:700;font-size:16px;text-align:right;color:${urgencyColor};background-color:${urgencyBg};-webkit-text-fill-color:${urgencyColor};">
              ₹${Number(plan_price).toLocaleString("en-IN")}
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:${urgencyBg};">
              ${is_in_grace ? "Grace Ends" : "Expires On"}
            </td>
            <td class="urgency-text" style="padding:8px 0;font-weight:700;font-size:14px;text-align:right;color:${urgencyColor};background-color:${urgencyBg};">
              ${
                deadlineDate
                  ? new Date(deadlineDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Soon"
              }
            </td>
          </tr>
          ${
            days_remaining !== null
              ? `
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:${urgencyBg};">Time Left</td>
            <td class="days-left" style="padding:8px 0;font-weight:700;font-size:17px;text-align:right;color:${urgencyColor};background-color:${urgencyBg};-webkit-text-fill-color:${urgencyColor};">
              ${days_remaining} days
            </td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      ${
        is_in_grace
          ? `
      <!-- Grace Period Warning: ALERT icon replaces 🚨 -->
      <div class="error-box" style="background-color:#fef2f2;border-left:4px solid ${EMAIL_CONFIG.COLORS.ERROR};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="error-text" style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;background-color:#fef2f2;">
           <strong>Critical:</strong> Your account is in grace period. If payment is not received before the deadline, your subscription will be <strong>suspended</strong> and you will lose access to all ${EMAIL_CONFIG.COMPANY.NAME} services.
        </p>
      </div>
      `
          : ""
      }

      <!-- Action Required: CHECK_CIRCLE icon replaces  -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;line-height:1.6;background-color:#e0f2fe;">
           <strong>Action Required:</strong> Complete your payment to ensure uninterrupted access to all ${EMAIL_CONFIG.COMPANY.NAME} features and services.
        </p>
      </div>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:20px 0;text-align:center;background-color:#ffffff;">
        Please complete your payment at your earliest convenience.
      </p>

      <!-- CTA Button -->
      ${renderButton({ href: `${EMAIL_CONFIG.FRONTEND_URL}/settings/upgrade`, text: 'Complete Payment'})}

      <!-- Help Section: LIGHTBULB_AMBER icon replaces 💡 -->
      <div class="warning-box" style="background-color:#fef9e7;border-left:4px solid ${EMAIL_CONFIG.COLORS.WARNING};padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p class="warning-text" style="margin:0;color:#92400e;font-size:13px;background-color:#fef9e7;">
           <strong>Need Help?</strong> Our support team is ready to assist you with any payment questions.
        </p>
      </div>

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;background-color:#ffffff;">
        Contact us at ${getSupportLink()}
      </p>

    </div>

    <!-- Custom Footer (with automated note) -->
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo("WHITE", "footer")}
      <p style="margin:0 0 6px;color:#d1d5db;">© ${EMAIL_CONFIG.CURRENT_YEAR} <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong></p>
      <p style="margin:0;font-size:11px;color:#6b7280;">This is an automated reminder. Please do not reply to this email.</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default subscriptionPaymentReminderTemplate;
