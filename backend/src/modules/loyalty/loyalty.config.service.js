// backend/src/modules/loyalty/loyalty.config.service.js (do not remove this comment)
// backend/src/modules/loyalty/loyalty.config.service.js

import prisma from "../../config/prisma.js";
import { normaliseLoyaltyConfig } from "./loyalty.engine.js";

// ─────────────────────────────────────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────────────────────────────────────

let _configCache = null;
let _configVersion = null;

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  is_enabled: false,
  earn_rate_amount: 100,
  earn_basis: "TOTAL_PAYABLE", // ◄ Default to Total Payable
  redemption_value: 1,
  min_redeem_points: 50,
  min_order_amount: 299,
  max_redeem_points: null,
  max_redeem_percent: null,
  points_expiry_days: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────────────

const VALIDATION_RULES = {
  is_enabled: (v) => typeof v === "boolean" || "is_enabled must be a boolean",

  earn_rate_amount: (v) =>
    (typeof v === "number" && v > 0) || "earn_rate_amount must be a positive number",

  earn_basis: (v) =>
    v === "SUBTOTAL" || v === "TOTAL_PAYABLE" || "earn_basis must be 'SUBTOTAL' or 'TOTAL_PAYABLE'",

  redemption_value: (v) =>
    (typeof v === "number" && v > 0) || "redemption_value must be a positive number",

  min_redeem_points: (v) =>
    (Number.isInteger(v) && v >= 1) || "min_redeem_points must be a positive integer",

  min_order_amount: (v) =>
    (typeof v === "number" && v >= 0) || "min_order_amount must be a non-negative number",

  max_redeem_points: (v) =>
    v === null || v === undefined || (Number.isInteger(v) && v >= 1)
      ? true
      : "max_redeem_points must be null or a positive integer",

  max_redeem_percent: (v) =>
    v === null || v === undefined || (typeof v === "number" && v > 0 && v <= 100)
      ? true
      : "max_redeem_percent must be null or a number between 0 and 100",

  points_expiry_days: (v) =>
    v === null || v === undefined || (Number.isInteger(v) && v >= 1)
      ? true
      : "points_expiry_days must be null or a positive integer",
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CONFIG (cached)
// ─────────────────────────────────────────────────────────────────────────────

export async function getLoyaltyConfig() {
  let row = await prisma.loyaltyConfig.findFirst();

  if (!row) {
    row = await prisma.loyaltyConfig.create({
      data: DEFAULTS,
    });
  }

  const version = row.version;
  if (_configVersion !== version || !_configCache) {
    _configCache = normaliseLoyaltyConfig(row);
    _configVersion = version;
  }

  return _configCache;
}

export async function getLoyaltyConfigRaw() {
  let row = await prisma.loyaltyConfig.findFirst();

  if (!row) {
    row = await prisma.loyaltyConfig.create({
      data: DEFAULTS,
    });
  }

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export async function updateLoyaltyConfig(updates, actor) {
  const allowedKeys = new Set(Object.keys(VALIDATION_RULES));

  for (const key of Object.keys(updates)) {
    if (!allowedKeys.has(key)) {
      const err = new Error(`Unknown loyalty config key: "${key}"`);
      err.code = "VALIDATION_ERROR";
      err.status = 400;
      throw err;
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    const rule = VALIDATION_RULES[key];
    const result = rule(value);

    if (result !== true) {
      const err = new Error(result);
      err.code = "VALIDATION_ERROR";
      err.status = 400;
      throw err;
    }
  }

  const existing = await prisma.loyaltyConfig.findFirst();

  const data = {
    ...updates,
    updated_by_cadmin_id: actor.cadminId,
    updated_by_name: actor.cadminName,
  };

  let row;

  if (existing) {
    row = await prisma.loyaltyConfig.update({
      where: { config_id: existing.config_id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  } else {
    row = await prisma.loyaltyConfig.create({
      data: {
        ...DEFAULTS,
        ...data,
        version: 1,
      },
    });
  }

  _configCache = null;
  _configVersion = null;

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE HELPER
// ─────────────────────────────────────────────────────────────────────────────

export async function getLoyaltyConfigForMobile() {
  const config = await getLoyaltyConfig();

  return {
    isEnabled: config.is_enabled,
    earnRateAmount: config.earn_rate_amount,
    earnBasis: config.earn_basis, // ◄ Expose to mobile
    redemptionValue: config.redemption_value,
    minRedeemPoints: config.min_redeem_points,
    minOrderAmount: config.min_order_amount,
    maxRedeemPoints: config.max_redeem_points,
    maxRedeemPercent: config.max_redeem_percent,
    pointsExpiryDays: config.points_expiry_days,
  };
}