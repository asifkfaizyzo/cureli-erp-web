// backend/src/modules/pending/pending.schema.js (do not remove this comment)
import { z } from "zod";

export const pendingSignupSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include uppercase, lowercase, number, and special character",
    ),
  recaptchaToken: z.string().min(1, "reCAPTCHA token is required"), //  ADD THIS
});

export const checkUsernameSchema = z.object({
  username: z
    .string()
    .min(4, "Username must be at least 4 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores",
    ),
});

export const usernameSchema = z.object({
  pending_id: z.string().uuid(),
  username: z
    .string()
    .min(4, "Username must be at least 4 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Only letters, numbers, underscore, dot allowed",
    ),
});

// import { z } from "zod";

// export const pendingSignupSchema = z.object({
//   first_name: z.string().min(1),
//   last_name: z.string().min(1),
//   email: z.string().email(),
//   password: z
//     .string()
//     .min(8)
//     .regex(
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
//       "Password must include uppercase, lowercase, number, and symbol"
//     ),

// });

// export const checkUsernameSchema = z.object({
//   username: z
//     .string()
//     .min(4, "Username must be at least 4 characters")
//     .max(30, "Username cannot exceed 30 characters")
//     .regex(
//       /^[a-z0-9_]+$/,
//       "Username can only contain lowercase letters, numbers, and underscores"
//     ),
// });

// export const usernameSchema = z.object({
//   pending_id: z.string().uuid(),
//   username: z
//     .string()
//     .min(4)
//     .max(20)
//     .regex(/^[a-zA-Z0-9_.]+$/, "Only letters, numbers, underscore, dot allowed"),
// });
