// backend/src/modules/mobile/orders/mobile.orders.schema.js (do not remove this comment)
// ============================================
// backend/src/modules/mobile/orders/mobile.orders.schema.js
// ============================================

import { z } from 'zod';

export const placeOrderSchema = z.object({
  branch_id: z
    .string({
      required_error: 'branch_id is required',
    })
    .uuid('branch_id must be a valid UUID'),

  delivery_address_id: z
    .string({
      required_error: 'delivery_address_id is required',
    })
    .uuid('delivery_address_id must be a valid UUID'),

  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(100),
      }),
      {
        required_error: 'items is required',
      }
    )
    .min(1, 'Order must contain at least one item')
    .max(20, 'Order cannot contain more than 20 items'),

  notes: z.string().max(500).nullable().optional(),

  prescription_files: z
    .array(
      z.object({
        prescription_key: z.string(),
        original_name: z.string(),
        mime_type: z.enum([
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/pdf',
        ]),
        file_size: z.number().int().min(1),
      })
    )
    .max(5)
    .optional()
    .default([]),
});

export const listMobileOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});