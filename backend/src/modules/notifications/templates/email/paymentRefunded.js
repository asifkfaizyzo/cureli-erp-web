// backend/src/modules/notifications/templates/email/paymentRefunded.js (do not remove this comment)
import { baseStyles } from "./_baseStyles.js";

/**
 * Email template for payment refund notification.
 *
 * @param {Object} params
 * @param {string} params.customerName
 * @param {string} params.orderNumber
 * @param {string} params.totalAmount
 * @param {boolean} params.isPartial
 * @returns {string} HTML email
 */
export default function paymentRefundedTemplate({
  customerName,
  orderNumber,
  totalAmount,
  isPartial = false,
}) {
  const label = isPartial ? "partially refunded" : "refunded";
  const heading = isPartial ? "Partial Refund Initiated" : "Refund Initiated";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="${baseStyles.body}">
  <table width="100%" cellpadding="0" cellspacing="0" style="${baseStyles.wrapper}">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="${baseStyles.card}">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center;">
              <h1 style="${baseStyles.h1}">${heading}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="${baseStyles.p}">
                Hi ${customerName},
              </p>
              <p style="${baseStyles.p}">
                Your payment for order <strong>${orderNumber}</strong> has been <strong>${label}</strong>.
              </p>
              <p style="${baseStyles.p}">
                Our team will review and process the refund shortly. You will receive a confirmation once it is completed.
              </p>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" cellpadding="12" cellspacing="0" style="background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                <tr>
                  <td style="font-size: 13px; color: #6b7280;">Order Number</td>
                  <td align="right" style="font-size: 13px; font-weight: 600; color: #1f2937;">${orderNumber}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6b7280;">Order Amount</td>
                  <td align="right" style="font-size: 13px; font-weight: 600; color: #1f2937;">₹${totalAmount}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #6b7280;">Status</td>
                  <td align="right" style="font-size: 13px; font-weight: 600; color: #7c3aed;">${isPartial ? "Partially Refunded" : "Refunded"}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                If you have any questions, please contact our support team.
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0;">
                &copy; Cureli Health
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}