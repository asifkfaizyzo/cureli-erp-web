// backend/src/modules/notifications/templates/email/returnApprovalToSupplier.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/returnApprovalToSupplier.js
// ============================================
// RETURN APPROVAL TO SUPPLIER EMAIL TEMPLATE
// ============================================

import {
  EMAIL_CONFIG,
  getBaseHeadContent,
  renderLogo,
  renderFooter,
} from './_helpers.js';
import { ICONS } from './_icons.js';

export const returnApprovalToSupplier = ({
  supplierName,
  returnInvoiceNumber,
  parentInvoiceNumber,
  returnReason,
  returnDate,
  totalAmount,
  itemCount,
  adjustmentType,
  creditNoteNumber,
  refundAmount,
  shopName,
  shopContact,
  items = [],
}) => {
  const adjustmentTypeLabels = {
    CREDIT_NOTE: 'Credit Note',
    CASH_REFUND: 'Cash Refund',
    OFFSET_NEXT_PURCHASE: 'Offset Against Future Purchase',
  };

  const returnReasonLabels = {
    DAMAGED_GOODS: 'Damaged Goods',
    EXPIRED_GOODS: 'Expired Goods',
    WRONG_ITEM_RECEIVED: 'Wrong Item Received',
    QUALITY_ISSUE: 'Quality Issue',
    EXCESS_STOCK: 'Excess Stock',
    PRICE_DIFFERENCE: 'Price Difference',
    OTHER: 'Other',
  };

  const itemsTable = items
    .map(
      (item, index) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td class="table-value" style="padding:12px 8px;text-align:center;color:#6b7280;background-color:#ffffff;">
        ${index + 1}
      </td>
      <td style="padding:12px 8px;background-color:#ffffff;">
        <div class="table-value" style="font-weight:600;color:#111827;">${item.name}</div>
        ${item.manufacturer
          ? `<div class="text-muted" style="font-size:12px;color:#9ca3af;">Mfr: ${item.manufacturer}</div>`
          : ''}
      </td>
      <td class="table-value" style="padding:12px 8px;text-align:center;font-family:monospace;font-size:13px;color:#374151;background-color:#ffffff;">
        ${item.batch_number}
      </td>
      <td class="qty-text" style="padding:12px 8px;text-align:center;font-weight:600;color:${EMAIL_CONFIG.COLORS.ERROR};background-color:#ffffff;">
        ${item.quantity}
      </td>
      <td class="table-value" style="padding:12px 8px;text-align:right;color:#374151;background-color:#ffffff;">
        ₹${parseFloat(item.purchase_rate).toFixed(2)}
      </td>
      <td class="amount-text" style="padding:12px 8px;text-align:right;font-weight:600;color:${EMAIL_CONFIG.COLORS.PRIMARY};background-color:#ffffff;">
        ₹${parseFloat(item.line_total).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  return {
    subject: `Return Approved - ${returnInvoiceNumber} | ${shopName} - ${EMAIL_CONFIG.COMPANY.NAME}`,
    html: `
      <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  ${getBaseHeadContent(`Purchase Return Approved - ${EMAIL_CONFIG.COMPANY.NAME}`)}
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f6fb;-webkit-font-smoothing:antialiased;">
  <div class="container" style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header: PACKAGE icon replaces 📦 -->
    <div class="header-primary" style="background:linear-gradient(135deg,${EMAIL_CONFIG.COLORS.PRIMARY} 0%,${EMAIL_CONFIG.COLORS.PRIMARY_LIGHT} 100%);border-radius:12px 12px 0 0;padding:32px;text-align:center;">
      ${renderLogo('WHITE', 'header')}
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;"> Purchase Return Approved</h1>
      <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">
        Action Required • Return #${returnInvoiceNumber}
      </p>
    </div>

    <!-- Main Content -->
    <div class="content-bg content" style="background-color:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;">

      <p class="text-primary" style="margin:0 0 12px;font-size:15px;color:#333333;background-color:#ffffff;">
        Dear <strong class="brand-text" style="color:${EMAIL_CONFIG.COLORS.PRIMARY};">${supplierName}</strong>,
      </p>

      <p class="text-secondary" style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555555;background-color:#ffffff;">
        This is to inform you that a purchase return has been
        <strong class="success-text" style="color:${EMAIL_CONFIG.COLORS.SUCCESS};">approved</strong>
        by <strong>${shopName}</strong>.
        <br><br>
        <strong>Please arrange to collect the returned medicines</strong> from the shop at the earliest.
      </p>

      <!-- Return Summary Card -->
      <div class="card-bg" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 16px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;background-color:#f9fafb;">
          Return Summary
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;background-color:#f9fafb;">Return Number</td>
            <td class="table-value" style="padding:8px 0;text-align:right;font-weight:600;color:#111827;font-family:'Courier New',monospace;font-size:13px;background-color:#f9fafb;">${returnInvoiceNumber}</td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Original Invoice</td>
            <td class="table-value" style="padding:8px 0;text-align:right;font-weight:600;color:#111827;font-family:'Courier New',monospace;font-size:13px;background-color:#f9fafb;">${parentInvoiceNumber}</td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Return Date</td>
            <td class="table-value" style="padding:8px 0;text-align:right;font-weight:600;color:#111827;font-size:13px;background-color:#f9fafb;">${returnDate}</td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Return Reason</td>
            <td class="reason-text" style="padding:8px 0;text-align:right;font-weight:600;color:${EMAIL_CONFIG.COLORS.ERROR};font-size:13px;background-color:#f9fafb;">${returnReasonLabels[returnReason] || returnReason}</td>
          </tr>
          <tr>
            <td class="table-label" style="padding:8px 0;color:#6b7280;font-size:13px;background-color:#f9fafb;">Items Returned</td>
            <td class="table-value" style="padding:8px 0;text-align:right;font-weight:600;color:#111827;font-size:13px;background-color:#f9fafb;">${itemCount}</td>
          </tr>
          <tr style="border-top:2px solid #e5e7eb;">
            <td class="table-label" style="padding:12px 0 0;color:#111827;font-size:14px;font-weight:600;background-color:#f9fafb;">Total Amount</td>
            <td class="total-amount" style="padding:12px 0 0;text-align:right;font-size:18px;font-weight:700;color:${EMAIL_CONFIG.COLORS.PRIMARY};background-color:#f9fafb;-webkit-text-fill-color:${EMAIL_CONFIG.COLORS.PRIMARY};">
              ₹${parseFloat(totalAmount).toFixed(2)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Payment Adjustment -->
      <div class="adjustment-box" style="background-color:${
        adjustmentType === 'CREDIT_NOTE' ? '#dbeafe'
        : adjustmentType === 'CASH_REFUND' ? '#dcfce7'
        : '#e0e7ff'
      };border-left:4px solid ${
        adjustmentType === 'CREDIT_NOTE' ? '#3b82f6'
        : adjustmentType === 'CASH_REFUND' ? '#10b981'
        : '#6366f1'
      };border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
        <h4 style="margin:0 0 6px;font-size:12px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;background-color:transparent;">
          Payment Adjustment
        </h4>
        <p class="table-value" style="margin:0;font-size:14px;font-weight:600;color:#111827;">
          ${adjustmentTypeLabels[adjustmentType]}
        </p>
        ${creditNoteNumber ? `
          <p class="text-secondary" style="margin:8px 0 0;font-size:13px;color:#4b5563;">
            Credit Note: <strong class="success-text" style="font-family:'Courier New',monospace;color:${EMAIL_CONFIG.COLORS.SUCCESS};">${creditNoteNumber}</strong>
          </p>
          <p class="text-muted" style="margin:4px 0 0;font-size:12px;color:#6b7280;">Valid for 1 year from issue date</p>
        ` : ''}
        ${refundAmount ? `
          <p class="text-secondary" style="margin:8px 0 0;font-size:13px;color:#4b5563;">
            Refund Amount: <strong class="success-text" style="color:${EMAIL_CONFIG.COLORS.SUCCESS};">₹${parseFloat(refundAmount).toFixed(2)}</strong>
          </p>
        ` : ''}
      </div>

      <!-- Next Steps: CLIPBOARD icon replaces 📋 -->
      <div class="info-box" style="background-color:#e0f2fe;border-left:4px solid ${EMAIL_CONFIG.COLORS.PRIMARY};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
        <h4 class="info-text" style="margin:0 0 8px;font-size:12px;color:${EMAIL_CONFIG.COLORS.PRIMARY};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;background-color:#e0f2fe;">
          ${ICONS.CLIPBOARD}
          <span style="vertical-align:middle;">Next Steps</span>
        </h4>
        <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;">
          <li class="info-text" style="color:#0c4a6e;">The returned medicines listed below are ready for pickup</li>
          <li class="info-text" style="color:#0c4a6e;">Please coordinate with <strong>${shopName}</strong> to collect the items</li>
          <li class="info-text" style="color:#0c4a6e;">Payment adjustments have been handled as mentioned above</li>
        </ul>
      </div>

      <!-- Items Table -->
      <h3 class="text-primary" style="margin:0 0 16px;font-size:15px;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:10px;background-color:#ffffff;">
        Returned Items
      </h3>

      <div style="overflow-x:auto;margin-bottom:24px;">
        <table class="items-table table-bg" style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background-color:#ffffff;">
          <thead>
            <tr class="table-header" style="background-color:#f9fafb;border-bottom:2px solid #e5e7eb;">
              <th style="padding:10px 8px;text-align:center;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;background-color:#f9fafb;">#</th>
              <th style="padding:10px 8px;text-align:left;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;background-color:#f9fafb;">Product</th>
              <th style="padding:10px 8px;text-align:center;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;background-color:#f9fafb;">Batch</th>
              <th style="padding:10px 8px;text-align:center;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;background-color:#f9fafb;">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;background-color:#f9fafb;">Rate</th>
              <th style="padding:10px 8px;text-align:right;font-weight:600;color:#6b7280;font-size:11px;text-transform:uppercase;background-color:#f9fafb;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
          </tbody>
        </table>
      </div>

      <!-- Contact Info -->
      <div class="warning-box" style="background-color: #fef3c7; border-left: 4px solid ${EMAIL_CONFIG.COLORS.WARNING}; border-radius: 0 8px 8px 0; padding: 12px 16px;">
        <p class="warning-text" style="margin: 0 0 6px; font-size: 12px; color: #92400e; font-weight: 600; background-color: #fef3c7;"> Need Clarification?</p>
        <p class="warning-text" style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5; background-color: #fef3c7;">
          Contact: <strong>${shopName}</strong><br>
          ${shopContact ? `Phone: <strong>${shopContact}</strong>` : ''}
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo('WHITE', 'footer')}
      <p style="margin:0 0 6px;color:#d1d5db;">
        Automated notification from <strong>${shopName}</strong>
      </p>
      <p style="margin:0;color:#9ca3af;">Powered by <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong> System</p>
    </div>

  </div>
</body>
</html>
    `,
    text: `
Dear ${supplierName},

Purchase Return Approved

Return Number: ${returnInvoiceNumber}
Original Invoice: ${parentInvoiceNumber}
Return Date: ${returnDate}
Return Reason: ${returnReasonLabels[returnReason] || returnReason}

Total Amount: ₹${parseFloat(totalAmount).toFixed(2)}

Payment Adjustment: ${adjustmentTypeLabels[adjustmentType]}
${creditNoteNumber ? `Credit Note: ${creditNoteNumber} (Valid for 1 year)` : ''}
${refundAmount ? `Refund Amount: ₹${parseFloat(refundAmount).toFixed(2)}` : ''}

Returned Items:
${items.map((item, i) => `${i + 1}. ${item.name} - Batch: ${item.batch_number} - Qty: ${item.quantity} - ₹${parseFloat(item.line_total).toFixed(2)}`).join('\n')}

For any clarification, please contact ${shopName}.
${shopContact ? `Phone: ${shopContact}` : ''}

---
This is an automated notification from ${shopName}
Powered by ${EMAIL_CONFIG.COMPANY.NAME} System
    `,
  };
};

export default returnApprovalToSupplier;