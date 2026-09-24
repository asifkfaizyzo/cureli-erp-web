// backend/src/modules/notifications/broadcast/broadcast.controller.js (do not remove this comment)
import { success, error } from '../../../utils/response.js';
import { sendBroadcast, previewBroadcastAudience } from './broadcast.service.js';

/**
 * POST /api/cadmin/broadcast
 * Send a broadcast notification
 */
export async function sendBroadcastController(req, res) {
  try {
    const { subject, message, channels, audience } = req.body;
    const sender_id = req.cadmin.cadmin_id;
    const sender_name = req.cadmin.name;

    const result = await sendBroadcast({
      subject,
      message,
      channels,
      audience,
      sender_id,
      sender_name,
    });

    return success(res, {
      message: 'Broadcast sent successfully',
      data: {
        recipientCount: result.recipientCount,
        channels: result.channels,
        success: result.success,
      },
    });

  } catch (err) {
    console.error('[Broadcast Controller] Error:', err);
    return error(res, err.message, 500);
  }
}

/**
 * POST /api/cadmin/broadcast/preview
 * Preview broadcast audience (dry run)
 */
export async function previewBroadcastController(req, res) {
  try {
    const { audience } = req.body;

    const preview = await previewBroadcastAudience(audience || {});

    return success(res, {
      message: 'Audience preview generated',
      data: preview,
    });

  } catch (err) {
    console.error('[Broadcast Preview] Error:', err);
    return error(res, err.message, 500);
  }
}

export default { sendBroadcastController, previewBroadcastController };