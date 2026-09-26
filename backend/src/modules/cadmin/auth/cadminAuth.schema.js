// backend/src/modules/cadmin/auth/cadminAuth.schema.js (do not remove this comment)
import { z } from "zod";

export const cadminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const cadminVerifyOtpSchema = z.object({
  username: z.string().min(1),
  otp: z.string().min(1),
});
