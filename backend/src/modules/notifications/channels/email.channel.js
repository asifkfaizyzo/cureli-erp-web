// backend/src/modules/notifications/channels/email.channel.js

import { sendMail } from '../../../utils/email.js';
import { getEmailTemplate } from '../templates/email/index.js';

/**
 * Send notifications via email channel
 * 
 * @param {string} eventType - Notification event type
 * @param {Array} recipients - Array of recipient objects
 * @param {Object} context - Event context data
 * @returns {Promise<{sent: number, failed: number, errors: Array}>}
 */
export async function sendViaEmail(eventType, recipients, context) {
  const result = { sent: 0, failed: 0, errors: [] };

  if (!recipients || recipients.length === 0) {
    return result;
  }

  // Get template for this event
  const template = getEmailTemplate(eventType);
  if (!template) {
    console.warn(`[Email Channel] No template for event: ${eventType}`);
    return result;
  }

  // Extract attachments if passed down inside context
  const attachments = context.attachments || [];

  // Send to each recipient
  const sendPromises = recipients.map(async (recipient) => {
    try {
      // Generate personalized content
      const { subject, html } = template({
        ...context,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
      });

      // Pass attachments downstream safely
      await sendMail(recipient.email, subject, html, attachments);
      result.sent++;

    } catch (error) {
      console.error(`[Email Channel] Failed to send to ${recipient.email}:`, error.message);
      result.failed++;
      result.errors.push({
        email: recipient.email,
        error: error.message,
      });
    }
  });

  await Promise.allSettled(sendPromises);

  console.log(`[Email Channel] ${eventType}: ${result.sent} sent, ${result.failed} failed`);
  return result;
}

export default { sendViaEmail };