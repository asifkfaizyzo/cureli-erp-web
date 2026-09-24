// backend/src/modules/notifications/broadcast/broadcast.service.js (do not remove this comment)
import { notify, NOTIFICATION_EVENTS } from '../notification.service.js';

/**
 * Send a broadcast notification
 * 
 * @param {Object} params
 * @param {string} params.subject - Broadcast subject
 * @param {string} params.message - Broadcast message
 * @param {string[]} params.channels - Channels to use
 * @param {Object} params.audience - Audience filters
 * @param {string} params.sender_id - CAdmin ID who sent this
 * @param {string} params.sender_name - CAdmin name
 */
export async function sendBroadcast({
  subject,
  message,
  channels = ['email'],
  audience = {},
  sender_id,
  sender_name,
}) {
  const result = await notify({
    type: NOTIFICATION_EVENTS.SYSTEM_BROADCAST,
    context: {
      subject,
      message,
      sender_id,
      sender_name: sender_name || 'Cureli Team',
    },
    channels,
    audienceFilters: audience,
  });

  // Log broadcast
  console.log(`[Broadcast] Sent by ${sender_name || sender_id}: "${subject}" to ${result.recipientCount} recipients`);

  return result;
}

/**
 * Preview broadcast audience (dry run)
 */
export async function previewBroadcastAudience(audienceFilters) {
  const { resolveAudience } = await import('../notification.rules.js');
  
  const recipients = await resolveAudience(
    NOTIFICATION_EVENTS.SYSTEM_BROADCAST,
    {},
    audienceFilters
  );

  return {
    count: recipients.length,
    users: recipients.filter(r => r.type === 'user').length,
    cadmins: recipients.filter(r => r.type === 'cadmin').length,
    // Don't expose actual emails in preview for privacy
    sample: recipients.slice(0, 5).map(r => ({
      name: r.name,
      type: r.type,
    })),
  };
}

export default { sendBroadcast, previewBroadcastAudience };