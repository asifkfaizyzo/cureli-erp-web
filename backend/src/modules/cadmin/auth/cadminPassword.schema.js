// backend/src/modules/cadmin/auth/cadminPassword.schema.js (do not remove this comment)
import { z } from "zod";

export const cadminForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const cadminResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});
