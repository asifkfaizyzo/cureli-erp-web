import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";

// ============================================
// HELPER — Check if limiter should be bypassed via .env
// ============================================
const shouldSkip = (specificEnvVar) => () => {
  // Master kill-switch or specific limiter flag
  if (process.env.DISABLE_ALL_RATE_LIMITERS === "true") return true;
  if (process.env[specificEnvVar] === "true") return true;
  return false;
};

// ============================================
// KEY GENERATOR — per-user or per-IP fallback
// ============================================
const userOrIpKey = (req) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.split(" ")[1];
      const payload = jwt.decode(token);
      if (payload?.user_id) {
        return `user:${payload.user_id}`;
      }
      // Rider tokens use `sub` instead of `user_id`
      if (payload?.sub) {
        return `user:${payload.sub}`;
      }
    }
  } catch {
    // decode failed — fall through to IP
  }
  return `ip:${ipKeyGenerator(req)}`;
};

// ============================================
// GLOBAL API LIMITER — for /api/* (ERP users)
// ============================================
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  keyGenerator: userOrIpKey,
  skip: shouldSkip("DISABLE_GLOBAL_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// RELAXED LIMITER — for system-driven polling endpoints
// ============================================
export const relaxedLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 600,
  keyGenerator: userOrIpKey,
  skip: shouldSkip("DISABLE_RELAXED_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// CADMIN API LIMITER — for /cadmin/* (internal admins)
// ============================================
export const cadminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  keyGenerator: userOrIpKey,
  skip: shouldSkip("DISABLE_CADMIN_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// AUTH LIMITER — login, OTP verify, password reset
// ============================================
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skip: shouldSkip("DISABLE_AUTH_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

// ============================================
// OTP SEND LIMITER — explicit resend endpoints only
// ============================================
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skip: shouldSkip("DISABLE_OTP_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "OTP request limit exceeded. Please try again later.",
  },
});

// ============================================
// SIGNUP LIMITER — registration flow
// ============================================
export const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: shouldSkip("DISABLE_SIGNUP_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many signup attempts. Please try again later.",
  },
});

// ============================================
// MOBILE API LIMITER — for /mobile/* (customer app)
// ============================================
export const mobileLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  keyGenerator: userOrIpKey,
  skip: shouldSkip("DISABLE_MOBILE_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ============================================
// MOBILE AUTH LIMITER — OTP send + verify only
// ============================================
export const mobileAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `ip:${ipKeyGenerator(req)}`,
  skip: shouldSkip("DISABLE_MOBILE_AUTH_LIMITER"),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});