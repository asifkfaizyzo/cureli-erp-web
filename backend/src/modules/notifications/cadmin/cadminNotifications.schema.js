// backend/src/modules/notifications/cadmin/cadminNotifications.schema.js (do not remove this comment)
// ============================================
// backend/src/modules/notifications/cadmin/cadminNotifications.schema.js
// ============================================

import { z } from 'zod';

/**
 * GET /cadmin/notifications - List notifications
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread_only: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    .default('false'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  event_type: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Notification ID param
 */
export const notificationIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid notification ID' }),
});

/**
 * PATCH /cadmin/notifications/read-all - Mark all as read
 */
export const markAllAsReadBodySchema = z.object({
  event_types: z.array(z.string()).optional(),
  before_date: z.string().datetime({ message: 'Invalid ISO date format' }).optional(),
}).optional().default({});

export default {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  markAllAsReadBodySchema,
};