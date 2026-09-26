// backend/src/modules/auth/auth.schema.js (do not remove this comment)
//backend/src/modules/auth/auth.schema.js
import { z } from "zod";

// Password format regex - for use in registration/password change only
const passwordFormatRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Login: Only check fields exist (don't validate format - let controller handle auth)
export const loginSchema = z.object({
  username: z.string().min(1, "Username required").trim(),
  password: z.string().min(1, "Password required").trim(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim(),
});

// Password reset: Validate format (user is setting NEW password)
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token required").trim(),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordFormatRegex,
      "Password must include uppercase, lowercase, number, and symbol"
    ),
});

export const verifyLoginOtpSchema = z.object({
  temp_token: z.string().min(1, "Session token required"),
  otp: z.string().length(4, "OTP must be 4 digits"),
});

export const resendLoginOtpSchema = z.object({
  temp_token: z.string().min(1, "Token is required"),
});