// backend/src/modules/setup/setup.schema.js (do not remove this comment)
// src/modules/setup/setup.schema.js
import { z } from "zod";

/**
 * Schema for checking username availability
 */
export const checkUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ),
});

/**
 * Schema for checking phone availability
 */
export const checkPhoneSchema = z.object({
  phone_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
});

/**
 * Schema for a single branch in setup
 */
const branchSchema = z.object({
  temp_id: z.string().min(1, "Temporary ID is required"),
  branch_name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be at most 100 characters"),
  address_line_1: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z
    .string()
    .regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
  contact_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Contact number must be exactly 10 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * Schema for a single user in setup
 */
const userSchema = z.object({
  temp_id: z.string().min(1, "Temporary ID is required"),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  phone_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
  role: z.enum(["staff", "branch_admin"], {
    errorMap: () => ({ message: "Role must be 'staff' or 'branch_admin'" }),
  }),
  branch_temp_id: z.string().min(1, "Branch assignment is required"),
});

/**
 * Schema for complete setup submission
 */
export const completeSetupSchema = z
  .object({
    branches: z
      .array(branchSchema)
      .min(1, "At least one branch is required")
      .max(50, "Maximum 50 branches allowed"),
    users: z.array(userSchema).max(100, "Maximum 100 users allowed").default([]),
  })
  .refine(
    (data) => {
      // Validate that all user branch_temp_ids reference valid branches
      const branchTempIds = new Set(data.branches.map((b) => b.temp_id));
      return data.users.every((u) => branchTempIds.has(u.branch_temp_id));
    },
    {
      message: "All users must be assigned to valid branches",
      path: ["users"],
    }
  )
  .refine(
    (data) => {
      // Validate unique branch names
      const names = data.branches.map((b) => b.branch_name.toLowerCase());
      return new Set(names).size === names.length;
    },
    {
      message: "Branch names must be unique",
      path: ["branches"],
    }
  )
  .refine(
    (data) => {
      // Validate unique usernames
      const usernames = data.users.map((u) => u.username.toLowerCase());
      return new Set(usernames).size === usernames.length;
    },
    {
      message: "Usernames must be unique",
      path: ["users"],
    }
  )
  .refine(
    (data) => {
      // Validate unique phone numbers
      const phones = data.users.map((u) => u.phone_number);
      return new Set(phones).size === phones.length;
    },
    {
      message: "Phone numbers must be unique",
      path: ["users"],
    }
  );