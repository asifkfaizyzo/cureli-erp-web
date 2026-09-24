// backend/src/modules/notifications/user/userNotifications.schema.js (do not remove this comment)
// ============================================
// USER NOTIFICATIONS - VALIDATION SCHEMAS
// ============================================

import { z } from 'zod';

/**
 * GET /notifications - List notifications
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread_only: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default('false'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  event_type: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * GET /notifications/unread-count
 * No params needed, uses auth context
 */
export const unreadCountQuerySchema = z.object({});

/**
 * PATCH /notifications/:id/read - Mark single as read
 */
export const markAsReadParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid notification ID' }),
});

/**
 * PATCH /notifications/read-all - Mark all as read
 */
export const markAllAsReadBodySchema = z.object({
  event_types: z.array(z.string()).optional(),
  before_date: z.string().datetime({ message: 'Invalid ISO date format' }).optional(),
});

/**
 * DELETE /notifications/:id - Delete single notification
 */
export const deleteNotificationParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid notification ID' }),
});

/**
 * POST /notifications/clear-inventory-alerts - Clear inventory dedup alerts
 */
export const clearInventoryAlertsBodySchema = z.object({
  inventory_id: z.string().uuid({ message: 'Invalid inventory ID' }),
});

// ============================================
// GROUPED EXPORTS (matching original structure)
// ============================================

export const listNotificationsSchema = {
  query: listNotificationsQuerySchema,
};

export const unreadCountSchema = {
  query: unreadCountQuerySchema,
};

export const markAsReadSchema = {
  params: markAsReadParamsSchema,
};

export const markAllAsReadSchema = {
  body: markAllAsReadBodySchema,
};

export const deleteNotificationSchema = {
  params: deleteNotificationParamsSchema,
};

export const clearInventoryAlertsSchema = {
  body: clearInventoryAlertsBodySchema,
};

export default {
  listNotificationsSchema,
  unreadCountSchema,
  markAsReadSchema,
  markAllAsReadSchema,
  deleteNotificationSchema,
  clearInventoryAlertsSchema,
};