// backend/src/modules/users/users.schema.js (do not remove this comment)
// src/modules/users/users.schema.js

import { z } from "zod";

/**
 * Query params for listing users
 */
export const getUsersQuerySchema = z.object({
  // Filtering
  branch_id: z.string().uuid().optional(),
  role: z.enum(["branch_admin", "staff"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().max(100).optional(),
  
  // Pagination
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, "Page must be at least 1"),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  
  // Sorting
  sort_by: z.enum(["full_name", "username", "role", "created_at", "last_login_at"]).optional().default("created_at"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Create user request body
 */
export const createUserSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters")
    .transform((val) => val.trim()),
  
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
    )
    .transform((val) => val.toLowerCase()),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
  
  role: z.enum(["branch_admin", "staff"], {
    errorMap: () => ({ message: "Role must be 'branch_admin' or 'staff'" }),
  }),
  
  branch_id: z.string().uuid("Invalid branch ID"),
  
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .nullable()
    .transform((val) => val?.toLowerCase() || null),
});

/**
 * Update user request body
 */
export const updateUserSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters")
    .transform((val) => val.trim())
    .optional(),
  
  phone_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .optional(),
  
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    )
    .transform((val) => val.toLowerCase())
    .optional(),
  
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .nullable()
    .transform((val) => val?.toLowerCase() || null),
  
  // SA only fields
  role: z.enum(["branch_admin", "staff"]).optional(),
  branch_id: z.string().uuid("Invalid branch ID").optional(),
  is_active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

/**
 * Reset password request body
 */
export const resetPasswordSchema = z.object({
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

/**
 * Check username availability
 */
export const checkUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    )
    .transform((val) => val.toLowerCase()),
  
  // Optional: exclude a specific user (for edit mode)
  exclude_user_id: z.string().uuid().optional(),
});

/**
 * Check phone availability
 */
export const checkPhoneSchema = z.object({
  phone_number: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  
  // Optional: exclude a specific user (for edit mode)
  exclude_user_id: z.string().uuid().optional(),
});