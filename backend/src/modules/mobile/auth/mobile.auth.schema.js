// backend/src/modules/mobile/auth/mobile.auth.schema.js (do not remove this comment)
// src/modules/mobile/auth/mobile.auth.schema.js

import { z } from "zod";
import {
  isReviewMode,
  REVIEW_PHONE,
} from "../../../config/reviewCredentials.js";

// ── Shared ────────────────────────────────────────────────────

const rawPhone = z
  .string({ required_error: "Mobile number is required" })
  .trim()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => {
      const stripped = val.replace(/^\+?91/, "");

      // Let review phone pass when review mode is enabled
      if (isReviewMode() && stripped === REVIEW_PHONE) {
        return true;
      }

      return /^[6-9]\d{9}$/.test(stripped);
    },
    { message: "Enter a valid 10-digit Indian mobile number" },
  )
  .transform((val) => {
    const stripped = val.replace(/^\+?91/, "");
    return `+91${stripped}`;
  });

const otpCode = z
  .string({ required_error: "OTP is required" })
  .trim()
  .length(6, { message: "OTP must be exactly 6 digits" })
  .regex(/^\d{6}$/, { message: "OTP must contain only digits" });

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(6, { message: "Password must be at least 6 characters" })
  .max(128, { message: "Password must not exceed 128 characters" });

// ── Device Info ───────────────────────────────────────────────

const deviceInfo = z
  .object({
    device_id: z.string().max(255).optional(),
    device_name: z.string().max(200).optional(),
    device_platform: z.enum(["ios", "android"]).optional(),
    device_os_version: z.string().max(50).optional(),
    app_version: z.string().max(20).optional(),
  })
  .optional();

// ── Schemas ───────────────────────────────────────────────────

export const checkPhoneSchema = z.object({
  phone: rawPhone,
});

export const sendOtpSchema = z.object({
  phone: rawPhone,
});

export const verifyOtpSchema = z.object({
  phone: rawPhone,
  otp: otpCode,
  device_info: deviceInfo,
});

export const refreshSchema = z.object({
  refresh_token: z
    .string()
    .trim()
    .min(1, { message: "Refresh token required" }),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: "Phone or email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  device_info: deviceInfo,
});

export const sendResetOtpSchema = z.object({
  phone: rawPhone,
});

export const resetPasswordSchema = z.object({
  phone: rawPhone,
  otp: otpCode,
  new_password: passwordSchema,
});

export const registerSchema = z.object({
  phone: rawPhone,
  password: passwordSchema,
  email: z
    .union([
      z.string().trim().email({ message: "Invalid email address" }),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  full_name: z
    .union([z.string().trim().min(1), z.literal(""), z.null()])
    .optional(),
  device_info: deviceInfo,
});

export const registerVerifySchema = z.object({
  phone: rawPhone,
  password: passwordSchema,
  otp: otpCode,
  email: z
    .union([
      z.string().trim().email({ message: "Invalid email address" }),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  full_name: z
    .union([z.string().trim().min(1), z.literal(""), z.null()])
    .optional(),
  device_info: deviceInfo,
});
