// backend/src/modules/suppliers/supplier.schema.js (do not remove this comment)
// backend/src/modules/suppliers/supplier.schema.js
import { z } from "zod";

//  GST Regex: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

//  PAN Regex: 5 letters + 4 digits + 1 letter
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

//  Phone: Only 10 digits
const PHONE_REGEX = /^[0-9]{10}$/;

//  Pincode: Only 6 digits
const PINCODE_REGEX = /^[0-9]{6}$/;

//  Drug License formats (common Indian formats)
// Format: XX/XXX/XX/XXXX or DL-XXX-XX-XXXXXX etc.
const DRUG_LICENSE_REGEX = /^[A-Z0-9\-\/]{8,25}$/;

//  IFSC Code: 4 letters + 0 + 6 alphanumeric
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

//  Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper to allow empty string or null
const optionalString = (schema) =>
  schema.optional().nullable().or(z.literal(""));

// Helper for phone validation
const phoneSchema = z
  .string()
  .transform((val) => val?.replace(/\D/g, "")) // Remove non-digits
  .refine((val) => !val || PHONE_REGEX.test(val), {
    message: "Phone number must be exactly 10 digits",
  })
  .optional()
  .nullable()
  .or(z.literal(""));

export const createSupplierSchema = z
  .object({
    // Required field
    name: z
      .string()
      .min(1, "Supplier name is required")
      .max(200, "Supplier name cannot exceed 200 characters")
      .trim(),

    // Contact - at least office phone required
    office_phone: z
      .string()
      .min(1, "Office phone is required")
      .transform((val) => val?.replace(/\D/g, "")) // Remove non-digits
      .refine((val) => PHONE_REGEX.test(val), {
        message: "Office phone must be exactly 10 digits",
      }),

    personal_phone: z
      .string()
      .transform((val) => val?.replace(/\D/g, "") || "")
      .refine((val) => !val || PHONE_REGEX.test(val), {
        message: "Personal phone must be exactly 10 digits",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    email: z
      .string()
      .refine((val) => !val || EMAIL_REGEX.test(val), {
        message:
          "Please enter a valid email address (e.g., example@domain.com)",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    // GST - 15 characters with specific format
    gst_number: z
      .string()
      .toUpperCase()
      .refine((val) => !val || GST_REGEX.test(val), {
        message:
          "Invalid GST format. Must be 15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric (e.g., 27AABCU9603R1ZM)",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    // PAN - 10 characters with specific format
    pan_number: z
      .string()
      .toUpperCase()
      .refine((val) => !val || PAN_REGEX.test(val), {
        message:
          "Invalid PAN format. Must be 10 characters: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    // Drug License
    drug_license_no: z
      .string()
      .toUpperCase()
      .refine((val) => !val || DRUG_LICENSE_REGEX.test(val), {
        message:
          "Invalid Drug License format. Use format like: 20B/12345/2024 or DL-MH-12-123456",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    // Address fields
    address_line_1: z.string().max(500).optional().nullable().or(z.literal("")),
    address_line_2: z.string().max(500).optional().nullable().or(z.literal("")),
    city: z.string().max(100).optional().nullable().or(z.literal("")),
    state: z.string().max(100).optional().nullable().or(z.literal("")),

    pincode: z
      .string()
      .refine((val) => !val || PINCODE_REGEX.test(val), {
        message: "Pincode must be exactly 6 digits",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    // Contact person
    contact_person: z.string().max(100).optional().nullable().or(z.literal("")),
    supplier_code: z.string().max(50).optional().nullable().or(z.literal("")),

    // Credit terms
    credit_days: z
      .number()
      .int("Credit days must be a whole number")
      .min(0, "Credit days cannot be negative")
      .max(365, "Credit days cannot exceed 365")
      .default(0),

    credit_limit: z
      .number()
      .min(0, "Credit limit cannot be negative")
      .optional()
      .nullable(),

    // Banking details
    bank_name: z.string().max(100).optional().nullable().or(z.literal("")),
    account_number: z
      .string()
      .refine((val) => !val || /^[0-9]{9,18}$/.test(val), {
        message: "Account number must be 9-18 digits",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    ifsc_code: z
      .string()
      .toUpperCase()
      .refine((val) => !val || IFSC_REGEX.test(val), {
        message:
          "Invalid IFSC format. Must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0001234)",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    // Branch ID (will be extracted separately)
    branch_id: z.string().uuid().optional(),
  })
  .transform((data) => {
    // Clean up empty strings to null
    const cleaned = { ...data };

    const optionalStringFields = [
      "supplier_code",
      "contact_person",
      "personal_phone",
      "email",
      "address_line_1",
      "address_line_2",
      "city",
      "state",
      "pincode",
      "gst_number",
      "pan_number",
      "drug_license_no",
      "bank_name",
      "account_number",
      "ifsc_code",
    ];

    for (const field of optionalStringFields) {
      if (cleaned[field] === "" || cleaned[field] === undefined) {
        cleaned[field] = null;
      }
    }

    // Remove branch_id from supplier data
    delete cleaned.branch_id;

    return cleaned;
  });

export const updateSupplierSchema = z
  .object({
    name: z
      .string()
      .min(1, "Supplier name is required")
      .max(200, "Supplier name cannot exceed 200 characters")
      .trim()
      .optional(),

    office_phone: z
      .string()
      .transform((val) => val?.replace(/\D/g, "") || "")
      .refine((val) => !val || PHONE_REGEX.test(val), {
        message: "Office phone must be exactly 10 digits",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    personal_phone: z
      .string()
      .transform((val) => val?.replace(/\D/g, "") || "")
      .refine((val) => !val || PHONE_REGEX.test(val), {
        message: "Personal phone must be exactly 10 digits",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    email: z
      .string()
      .refine((val) => !val || EMAIL_REGEX.test(val), {
        message: "Please enter a valid email address",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    gst_number: z
      .string()
      .toUpperCase()
      .refine((val) => !val || GST_REGEX.test(val), {
        message:
          "Invalid GST format. Must be 15 characters (e.g., 27AABCU9603R1ZM)",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    pan_number: z
      .string()
      .toUpperCase()
      .refine((val) => !val || PAN_REGEX.test(val), {
        message: "Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    drug_license_no: z
      .string()
      .toUpperCase()
      .refine((val) => !val || DRUG_LICENSE_REGEX.test(val), {
        message: "Invalid Drug License format",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    address_line_1: z.string().max(500).optional().nullable().or(z.literal("")),
    address_line_2: z.string().max(500).optional().nullable().or(z.literal("")),
    city: z.string().max(100).optional().nullable().or(z.literal("")),
    state: z.string().max(100).optional().nullable().or(z.literal("")),

    pincode: z
      .string()
      .refine((val) => !val || PINCODE_REGEX.test(val), {
        message: "Pincode must be exactly 6 digits",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    contact_person: z.string().max(100).optional().nullable().or(z.literal("")),

    credit_days: z.number().int().min(0).max(365).optional(),

    credit_limit: z.number().min(0).optional().nullable(),

    bank_name: z.string().max(100).optional().nullable().or(z.literal("")),
    account_number: z
      .string()
      .refine((val) => !val || /^[0-9]{9,18}$/.test(val), {
        message: "Account number must be 9-18 digits",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    ifsc_code: z
      .string()
      .toUpperCase()
      .refine((val) => !val || IFSC_REGEX.test(val), {
        message: "Invalid IFSC format (e.g., HDFC0001234)",
      })
      .optional()
      .nullable()
      .or(z.literal("")),

    is_active: z.boolean().optional(),
  })
  .transform((data) => {
    const cleaned = { ...data };

    const optionalStringFields = [
      "contact_person",
      "office_phone",
      "personal_phone",
      "email",
      "address_line_1",
      "address_line_2",
      "city",
      "state",
      "pincode",
      "gst_number",
      "pan_number",
      "drug_license_no",
      "bank_name",
      "account_number",
      "ifsc_code",
    ];

    for (const field of optionalStringFields) {
      if (cleaned[field] === "" || cleaned[field] === undefined) {
        cleaned[field] = null;
      }
    }

    return cleaned;
  });

// For adding/removing supplier from a single branch
export const branchActionSchema = z.object({
  branch_id: z.string().uuid("Invalid branch ID"),
});

// For bulk updating supplier branches
export const bulkBranchUpdateSchema = z.object({
  branch_ids: z.array(z.string().uuid()).min(1, "At least one branch required"),
});
