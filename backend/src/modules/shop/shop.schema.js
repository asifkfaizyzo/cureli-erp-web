// backend/src/modules/shop/shop.schema.js (do not remove this comment)
import { z } from "zod";

export const shopInfoSchema = z.object({
  shop_id: z.string().uuid(),
  business_name: z.string().min(2),
  address_line_1: z.string().min(3),
  address_line_2: z.string().nullable().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6)
});

export const shopGstSchema = z.object({
  shop_id: z.string().uuid(),
  business_type: z.string().min(2),
  gst_number: z.string().min(15).max(15)
});
