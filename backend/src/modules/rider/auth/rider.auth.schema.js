//backend\src\modules\rider\auth\rider.auth.schema.js
import { z } from "zod";

export const checkPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  device_id:         z.string().optional(),
  device_name:       z.string().optional(),
  device_platform:   z.string().optional(),
  device_os_version: z.string().optional(),
  app_version:       z.string().optional(),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  device_id:         z.string().optional(),
  device_name:       z.string().optional(),
  device_platform:   z.string().optional(),
  device_os_version: z.string().optional(),
  app_version:       z.string().optional(),
});

export const setPasswordSchema = z.object({
  temp_token: z.string().min(1, "Temp token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
  device_id:         z.string().optional(),
  device_name:       z.string().optional(),
  device_platform:   z.string().optional(),
  device_os_version: z.string().optional(),
  app_version:       z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});