// backend/src/modules/notifications/broadcast/broadcast.schema.js (do not remove this comment)
import Joi from 'joi';

export const sendBroadcastSchema = Joi.object({
  subject: Joi.string().min(5).max(200).required()
    .messages({
      'string.min': 'Subject must be at least 5 characters',
      'string.max': 'Subject cannot exceed 200 characters',
      'any.required': 'Subject is required',
    }),

  message: Joi.string().min(10).max(5000).required()
    .messages({
      'string.min': 'Message must be at least 10 characters',
      'string.max': 'Message cannot exceed 5000 characters',
      'any.required': 'Message is required',
    }),

  channels: Joi.array()
    .items(Joi.string().valid('email', 'inapp', 'sms'))
    .min(1)
    .default(['email'])
    .messages({
      'array.min': 'At least one channel is required',
    }),

  // Audience filters
  audience: Joi.object({
    // Include ERP users
    includeUsers: Joi.boolean().default(true),

    // Include CAdmins
    includeCAdmins: Joi.boolean().default(false),

    // User role filter
    roles: Joi.array()
      .items(Joi.string().valid('super_admin', 'owner', 'branch_admin', 'staff'))
      .optional(),

    // CAdmin role filter
    cadminRoles: Joi.array()
      .items(Joi.string().valid('SUPER_ADMIN', 'ANALYST', 'ACCOUNTING'))
      .optional(),

    // Shop verification status filter
    shopVerificationStatus: Joi.string()
      .valid('pending', 'pending_review', 'verified', 'partially_rejected', 'rejected')
      .optional(),

    // Subscription status filter
    subscriptionStatus: Joi.string()
      .valid('active', 'grace', 'expired', 'suspended', 'pending_payment')
      .optional(),

  }).default({ includeUsers: true, includeCAdmins: false }),

}).options({ stripUnknown: true });

export default { sendBroadcastSchema };