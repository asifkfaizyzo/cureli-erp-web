import { z } from "zod";

const phoneField = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const purposeField = z
  .enum(["login", "register", "reset"])
  .default("register");

const deviceFields = {
  device_id:         z.string().optional(),
  device_name:       z.string().optional(),
  device_platform:   z.string().optional(),
  device_os_version: z.string().optional(),
  app_version:       z.string().optional(),
};

export const checkPhoneSchema = z.object({
  phone: phoneField,
});

export const sendOtpSchema = z.object({
  phone: phoneField,
  purpose: purposeField,
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  purpose: purposeField,
  ...deviceFields,
});

export const loginSchema = z.object({
  phone: phoneField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  ...deviceFields,
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
  ...deviceFields,
});

export const resetPasswordSchema = z.object({
  reset_token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});