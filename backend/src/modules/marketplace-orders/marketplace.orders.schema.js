// backend/src/modules/marketplace-orders/marketplace.orders.schema.js (do not remove this comment)
// ============================================
// backend/src/modules/marketplace-orders/marketplace.orders.schema.js
// ============================================

import { z } from 'zod';

export const rejectOrderSchema = z
  .object({
    rejection_reason: z.enum(
      ['OUT_OF_STOCK', 'PRESCRIPTION_INVALID', 'STORE_CLOSED', 'OTHER'],
      {
        errorMap: (issue, _ctx) => {
          if (issue.code === 'invalid_enum_value') {
            return { message: 'rejection_reason must be one of: OUT_OF_STOCK, PRESCRIPTION_INVALID, STORE_CLOSED, OTHER' };
          }
          return { message: _ctx.defaultError };
        },
      }
    ),
    rejection_reason_other: z
      .string()
      .max(300)
      .nullable()
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // Conditional logic: if reason is OTHER, the "other" field is required
    if (data.rejection_reason === 'OTHER' && !data.rejection_reason_other?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'rejection_reason_other is required when reason is OTHER',
        path: ['rejection_reason_other'],
      });
    }
  });

export const listOrdersSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});