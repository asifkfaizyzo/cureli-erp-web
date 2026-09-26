// backend/src/modules/notifications/channels/sms.channel.js (do not remove this comment)
// ============================================
// SMS NOTIFICATION CHANNEL (STUB)
// ============================================

/**
 * Send notifications via SMS channel
 * 
 * STUB: This will integrate with SMS provider when ready
 * 
 * @param {string} eventType - Notification event type
 * @param {Array} recipients - Array of recipient objects
 * @param {Object} context - Event context data
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendViaSMS(eventType, recipients, context) {
  // TODO: Implement when SMS provider is added
  // 
  // Will need:
  // 1. SMS templates (shorter than email)
  // 2. Phone number validation
  // 3. Provider integration (Twilio, MessageCentral, etc.)
  // 4. Rate limiting

  console.log(`[SMS Channel] STUB: Would send ${eventType} to ${recipients.length} recipients`);

  return {
    sent: 0,
    failed: 0,
    stub: true,
    message: 'SMS notifications not yet implemented',
  };
}

export default { sendViaSMS };