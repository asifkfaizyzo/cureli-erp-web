// backend/src/modules/mobile/push/mobile.push.controller.js (do not remove this comment)
// backend/src/modules/mobile/push/mobile.push.controller.js

import prisma from '../../../config/prisma.js';

// ── Register push token ───────────────────────────────────────────────────────
// Called by mobile app after getting Expo push token.
// Stores token on the current session (identified by JWT sessionId).

export async function registerPushToken(req, res) {
  try {
    const { push_token, push_token_type = 'expo' } = req.body;
    const sessionId = req.mobileSession.id;

    if (!push_token || typeof push_token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'push_token is required',
      });
    }

    // Validate it looks like an Expo push token
    if (
      !push_token.startsWith('ExponentPushToken[') &&
      !push_token.startsWith('ExpoPushToken[')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push token format',
      });
    }

    await prisma.cureliMobileSession.update({
      where: { id: sessionId },
      data: {
        push_token:            push_token,
        push_token_type:       push_token_type,
        push_token_updated_at: new Date(),
      },
    });

    console.log(
      `[Push] Token registered for session ${sessionId}: ${push_token.slice(0, 30)}...`,
    );

    return res.json({
      success: true,
      message: 'Push token registered',
      data:    {},
    });
  } catch (err) {
    console.error('[Push] Register token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register push token',
    });
  }
}

// ── Remove push token ─────────────────────────────────────────────────────────
// Called on logout so the device stops receiving notifications.

export async function removePushToken(req, res) {
  try {
    const sessionId = req.mobileSession.id;

    await prisma.cureliMobileSession.update({
      where: { id: sessionId },
      data: {
        push_token:            null,
        push_token_type:       null,
        push_token_updated_at: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Push token removed',
      data:    {},
    });
  } catch (err) {
    console.error('[Push] Remove token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove push token',
    });
  }
}

// ── Get preferences ───────────────────────────────────────────────────────────

export async function getPreferences(req, res) {
  try {
    const userId = req.mobileUser.id;

    let pref = await prisma.cureliMobilePushPreference.findUnique({
      where: { user_id: userId },
    });

    // Auto-create with defaults if not exists
    if (!pref) {
      pref = await prisma.cureliMobilePushPreference.create({
        data: { user_id: userId },
      });
    }

    return res.json({
      success: true,
      message: 'Preferences loaded',
      data: {
        master_enabled:       pref.master_enabled,
        order_updates:        pref.order_updates,
        promotions:           pref.promotions,
        prescription_updates: pref.prescription_updates,
        system_messages:      pref.system_messages,
        cart_abandonment:     pref.cart_abandonment,
      },
    });
  } catch (err) {
    console.error('[Push] Get preferences error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load preferences',
    });
  }
}

// ── Update preferences ────────────────────────────────────────────────────────
// PATCH — partial update, only the fields sent are updated.

export async function updatePreferences(req, res) {
  try {
    const userId = req.mobileUser.id;

    const allowed = [
      'master_enabled',
      'order_updates',
      'promotions',
      'prescription_updates',
      'system_messages',
      'cart_abandonment',
    ];

    // Only pick known fields and validate they are booleans
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: `${key} must be a boolean`,
          });
        }
        updateData[key] = req.body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided',
      });
    }

    const pref = await prisma.cureliMobilePushPreference.upsert({
      where:  { user_id: userId },
      create: { user_id: userId, ...updateData },
      update: updateData,
    });

    return res.json({
      success: true,
      message: 'Preferences updated',
      data: {
        master_enabled:       pref.master_enabled,
        order_updates:        pref.order_updates,
        promotions:           pref.promotions,
        prescription_updates: pref.prescription_updates,
        system_messages:      pref.system_messages,
        cart_abandonment:     pref.cart_abandonment,
      },
    });
  } catch (err) {
    console.error('[Push] Update preferences error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
    });
  }
}

// ── Get notification inbox ────────────────────────────────────────────────────
// Returns paginated list of notifications for the mobile user.

export async function getNotificationInbox(req, res) {
  try {
    const userId  = req.mobileUser.id;
    const page    = Math.max(1, parseInt(req.query.page  ?? '1'));
    const limit   = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '20')));
    const skip    = (page - 1) * limit;
    const unreadOnly = req.query.unread_only === 'true';

    const where = { user_id: userId };
    if (unreadOnly) where.is_read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.cureliMobileNotification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id:         true,
          title:      true,
          body:       true,
          category:   true,
          data:       true,
          is_read:    true,
          read_at:    true,
          created_at: true,
        },
      }),
      prisma.cureliMobileNotification.count({ where }),
      prisma.cureliMobileNotification.count({
        where: { user_id: userId, is_read: false },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Notifications loaded',
      data: {
        notifications,
        unread_count: unreadCount,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
          has_more:    page * limit < total,
        },
      },
    });
  } catch (err) {
    console.error('[Push] Get inbox error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load notifications',
    });
  }
}

// ── Mark notification(s) as read ──────────────────────────────────────────────

export async function markNotificationsRead(req, res) {
  try {
    const userId = req.mobileUser.id;
    const { notification_ids, mark_all = false } = req.body;

    if (mark_all) {
      await prisma.cureliMobileNotification.updateMany({
        where:  { user_id: userId, is_read: false },
        data:   { is_read: true, read_at: new Date() },
      });
    } else {
      if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'notification_ids must be a non-empty array',
        });
      }

      await prisma.cureliMobileNotification.updateMany({
        where: {
          id:      { in: notification_ids },
          user_id: userId, // Scope to this user — prevent marking others' notifications
          is_read: false,
        },
        data: { is_read: true, read_at: new Date() },
      });
    }

    // Return updated unread count
    const unreadCount = await prisma.cureliMobileNotification.count({
      where: { user_id: userId, is_read: false },
    });

    return res.json({
      success: true,
      message: 'Marked as read',
      data:    { unread_count: unreadCount },
    });
  } catch (err) {
    console.error('[Push] Mark read error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
    });
  }
}