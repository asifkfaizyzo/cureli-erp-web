// backend/src/modules/mobile/users/mobile.users.schema.js (do not remove this comment)
// src/modules/mobile/users/mobile.users.schema.js

import { z } from "zod";

// ── Helpers ───────────────────────────────────────────────────

const indianPincode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "Pincode must be exactly 6 digits" });

const recipientPhone = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => {
      const stripped = val.replace(/^\+?91/, "");
      return /^[6-9]\d{9}$/.test(stripped);
    },
    { message: "Invalid Indian mobile number" }
  )
  .transform((val) => {
    const stripped = val.replace(/^\+?91/, "");
    return `+91${stripped}`;
  })
  .optional()
  .nullable();

const addressLabel = z.enum(["Home", "Work", "Other"], {
  errorMap: () => ({ message: "Label must be Home, Work, or Other" }),
});

// ── Profile Update ────────────────────────────────────────────
// All fields optional — PATCH semantics.
// At least one field required (validated at service layer).
// date_of_birth accepted as ISO string "YYYY-MM-DD" from client.

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(200, { message: "Name must not exceed 200 characters" })
    .optional(),

  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255)
    .optional()
    .nullable(),

  profile_image_key: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable(),

  date_of_birth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Date of birth must be in YYYY-MM-DD format",
    })
    .refine(
      (val) => {
        const date = new Date(val);
        if (isNaN(date.getTime())) return false;
        const now = new Date();
        const minDate = new Date("1900-01-01");
        // Must be in the past and after 1900
        return date < now && date >= minDate;
      },
      { message: "Please enter a valid date of birth" }
    )
    .optional()
    .nullable(),

  sex: z
    .enum(["MALE", "FEMALE", "OTHER"], {
      errorMap: () => ({ message: "Sex must be MALE, FEMALE, or OTHER" }),
    })
    .optional()
    .nullable(),
});

// ── Address ───────────────────────────────────────────────────

export const createAddressSchema = z
  .object({
    label: addressLabel,
    custom_label: z.string().trim().max(100).optional().nullable(),
    recipient_name: z.string().trim().max(200).optional().nullable(),
    recipient_phone: recipientPhone,
    address_line_1: z
      .string()
      .trim()
      .min(5, { message: "Address is too short" })
      .max(300),
    address_line_2: z.string().trim().max(300).optional().nullable(),
    landmark: z.string().trim().max(200).optional().nullable(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    pincode: indianPincode,
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    is_default: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.label === "Other" && !data.custom_label?.trim()) return false;
      return true;
    },
    {
      message: "Custom label is required when label is Other",
      path: ["custom_label"],
    }
  );

export const updateAddressSchema = z
  .object({
    label: addressLabel.optional(),
    custom_label: z.string().trim().max(100).optional().nullable(),
    recipient_name: z.string().trim().max(200).optional().nullable(),
    recipient_phone: recipientPhone,
    address_line_1: z.string().trim().min(5).max(300).optional(),
    address_line_2: z.string().trim().max(300).optional().nullable(),
    landmark: z.string().trim().max(200).optional().nullable(),
    city: z.string().trim().min(1).max(100).optional(),
    state: z.string().trim().min(1).max(100).optional(),
    pincode: indianPincode.optional(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    is_default: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.label === "Other" && data.custom_label !== undefined) {
        if (!data.custom_label?.trim()) return false;
      }
      return true;
    },
    {
      message: "Custom label is required when label is Other",
      path: ["custom_label"],
    }
  );

export const confirmDeleteAccountSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, { message: "OTP must be exactly 6 digits" })
    .regex(/^\d{6}$/, { message: "OTP must contain only digits" }),
});

// ── Family Members ────────────────────────────────────────────

const familyMemberDateOfBirth = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of birth must be in YYYY-MM-DD format",
  })
  .refine(
    (val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const now = new Date();
      const minDate = new Date("1900-01-01");
      return date < now && date >= minDate;
    },
    { message: "Please enter a valid date of birth" }
  );

const familyMemberSex = z.enum(["MALE", "FEMALE", "OTHER"], {
  errorMap: () => ({ message: "Sex must be MALE, FEMALE, or OTHER" }),
});

const familyMemberPhone = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => {
      const stripped = val.replace(/^\+?91/, "");
      return /^[6-9]\d{9}$/.test(stripped);
    },
    { message: "Invalid Indian mobile number" }
  )
  .transform((val) => {
    const stripped = val.replace(/^\+?91/, "");
    return `+91${stripped}`;
  })
  .optional()
  .nullable();

export const createFamilyMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(200, { message: "Name must not exceed 200 characters" }),
  date_of_birth: familyMemberDateOfBirth,
  sex: familyMemberSex,
  phone: familyMemberPhone,
});

export const updateFamilyMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(200, { message: "Name must not exceed 200 characters" })
    .optional(),
  date_of_birth: familyMemberDateOfBirth.optional(),
  sex: familyMemberSex.optional(),
  phone: familyMemberPhone,
});