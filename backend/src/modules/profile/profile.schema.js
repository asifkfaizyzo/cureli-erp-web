// backend/src/modules/profile/profile.schema.js (do not remove this comment)
// src/modules/profile/profile.schema.js

import { z } from "zod";

// Password regex - same as your existing resetPasswordSchema
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ============================================
// BUSINESS UPDATE
// ============================================
export const updateBusinessSchema = z.object({
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name too long")
    .trim(),
  address_line_1: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address too long")
    .trim(),
  address_line_2: z
    .string()
    .max(200, "Address too long")
    .trim()
    .optional()
    .nullable(),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City name too long")
    .trim(),
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State name too long")
    .trim(),
  pincode: z
    .string()
    .regex(/^[0-9]{6}$/, "Pincode must be 6 digits"),
});

// ============================================
// PASSWORD CHANGE
// ============================================
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must include uppercase, lowercase, number, and symbol"
      ),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

// ============================================
// EMAIL CHANGE
// ============================================
export const initiateEmailChangeSchema = z.object({
  current_password: z.string().min(1, "Password is required"),
  new_email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
});

export const verifyEmailChangeSchema = z.object({
  otp: z
    .string()
    .min(4, "OTP is required")
    .max(6, "OTP too long"),
});

// ============================================
// PHONE CHANGE - OTP METHOD
// ============================================

// Step 1b: Verify old phone OTP
export const verifyOldPhoneOtpSchema = z.object({
  otp: z
    .string()
    .min(4, "OTP is required")
    .max(6, "OTP too long"),
});

// Step 2: Send OTP to new phone (after old verified)
export const initiatePhoneChangeNewSchema = z.object({
  new_phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
});

// Step 3: Verify new phone OTP
export const verifyPhoneChangeNewSchema = z.object({
  otp: z
    .string()
    .min(4, "OTP is required")
    .max(6, "OTP too long"),
});

// ============================================
// PHONE CHANGE - PASSWORD METHOD
// ============================================

// Step 1: Verify password + send OTP to new phone
export const initiatePhoneChangeWithPasswordSchema = z.object({
  current_password: z.string().min(1, "Password is required"),
  new_phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
});