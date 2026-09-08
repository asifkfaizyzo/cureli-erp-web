//backend\src\modules\rider\onboarding\rider.onboarding.schema.js

import { z } from "zod";

// ── Personal Details (Step 1) ─────────────────────────────────

export const personalDetailsSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name too long"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(255, "Email too long"),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .refine((val) => {
      const dob = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age >= 18;
    }, "You must be at least 18 years old"),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

// ── Location (Step 2) ─────────────────────────────────────────

export const locationSchema = z.object({
  current_city: z
    .string()
    .trim()
    .min(2, "City name required")
    .max(100, "City name too long"),
  residential_address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address too long"),
  preferred_lat: z.number().min(-90).max(90).optional(),
  preferred_lng: z.number().min(-180).max(180).optional(),
  preferred_address: z.string().trim().max(500).optional(),
});

// ── Vehicle Details (Step 3) ──────────────────────────────────

export const vehicleDetailsSchema = z.object({
  vehicle_type: z.enum(["BIKE", "SCOOTER", "EV", "OTHER"]),
  vehicle_number: z
    .string()
    .trim()
    .min(4, "Enter a valid vehicle registration number")
    .max(20, "Vehicle number too long")
    .toUpperCase(),
  vehicle_make_model: z
    .string()
    .trim()
    .max(100, "Vehicle make/model too long")
    .optional(),
});

// ── Bank Details (Post-approval) ──────────────────────────────

export const bankDetailsSchema = z.object({
  bank_account_number: z
    .string()
    .trim()
    .min(9, "Account number must be at least 9 digits")
    .max(18, "Account number too long")
    .regex(/^\d+$/, "Account number must be numeric"),
  bank_ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  bank_holder_name: z
    .string()
    .trim()
    .min(2, "Account holder name required")
    .max(200, "Name too long"),
  bank_name: z
    .string()
    .trim()
    .min(2, "Bank name required")
    .max(100, "Bank name too long"),
});

// ── Emergency Contact ─────────────────────────────────────────

export const emergencyContactSchema = z.object({
  emergency_contact_name: z
    .string()
    .trim()
    .min(2, "Contact name required")
    .max(200),
  emergency_contact_phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
});