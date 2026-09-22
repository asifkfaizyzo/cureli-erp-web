// backend/src/modules/notifications/templates/email/marketplaceOrderBilled.js

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
  renderButton,
  getSupportLink,
} from './_helpers.js';

/**
 * Marketplace Order Billed Email Template
 * Receives: recipientName, orderNumber, pharmacyName, grandTotal, orderDate, invoiceUrl
 */
export function marketplaceOrderBilledTemplate(context) {
  const {
    recipientName,
    orderNumber,
    pharmacyName,
    grandTotal,
    orderDate,
    invoiceUrl,
  } = context;

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const formattedAmount = typeof grandTotal === 'number'
    ? `₹${grandTotal.toFixed(2)}`
    : grandTotal || '—';

  const subject = `Your Invoice for Order ${orderNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Invoice Generated - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header Banner: Success Theme -->
    <div class="header-success" style="background:linear-gradient(135deg,#047857 0%,#059669 100%);color:#ffffff;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;">Invoice Ready</h1>
      <p style="margin:10px 0 0;opacity:0.95;font-size:15px;color:#ffffff;">Your order has been billed and is ready for dispatch</p>
    </div>

    <!-- Main Card Container -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="font-size:15px;color:#333333;margin:0 0 12px;">
        Hello <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${recipientName}</strong>,
      </p>

      <p class="text-secondary" style="font-size:14px;color:#555555;line-height:1.6;margin:0 0 20px;">
        Good news! Your order <strong>${orderNumber}</strong> has been confirmed and packed. We have attached the digital tax invoice to this email for your records.
      </p>

      <!-- Order Details Summary Card -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:24px 0;">
        <h3 style="margin:0 0 14px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">
          Order Summary
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">Order Number</td>
            <td class="table-value" style="padding:8px 0;font-weight:700;font-size:14px;color:#111827;font-family:'Courier New',monospace;">
              ${orderNumber}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;">Pharmacy Partner</td>
            <td class="table-value" style="padding:8px 0;font-weight:600;font-size:14px;color:#111827;">
              ${pharmacyName}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;">Billed Date</td>
            <td class="table-value" style="padding:8px 0;font-size:14px;color:#374151;">
              ${formattedDate}
            </td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;">Grand Total</td>
            <td class="table-value" style="padding:8px 0;font-weight:700;font-size:15px;color:#059669;">
              ${formattedAmount}
            </td>
          </tr>
        </table>
      </div>

      <!-- Quick Delivery Warning Info Box -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p class="info-text" style="margin:0;color:${EMAIL_CONFIG.COLORS.PRIMARY};font-size:13px;line-height:1.6;">
          <strong>Digital Copy:</strong> The digital invoice copy is attached directly to this email. You can also securely access it anytime from your dashboard.
        </p>
      </div>

      <!-- Primary Action CTA Button -->
      ${renderButton({ href: invoiceUrl, text: 'Download Digital Invoice', color: 'success' })}

      <p class="text-muted" style="font-size:13px;color:#888888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Questions about your bill? Get in touch with us at ${getSupportLink()}
      </p>

    </div>

    <!-- Standard Core Footer -->
    ${renderFooter()}

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default marketplaceOrderBilledTemplate;