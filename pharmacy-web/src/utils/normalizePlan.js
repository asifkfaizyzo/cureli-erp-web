// pharmacy-web/src/utils/normalizePlan.js (do not remove this comment)
// pharmacy-web/src/utils/normalizePlan.js

/**
 * Normalizes a single raw plan from the API.
 *
 * Ensures all fields have safe defaults so UI components
 * never have to guard against undefined.
 *
 * @param {Object} raw - Raw plan object from API
 * @returns {Object} Normalized plan
 */
export function normalizePlan(raw) {
  return {
    // ── Identity ─────────────────────────────────────────────────────────
    plan_id: raw.plan_id ?? null,
    name: raw.name ?? "Unnamed Plan",
    description: raw.description ?? "",
    type: raw.type ?? "PRE_MADE",

    // ── Pricing ──────────────────────────────────────────────────────────
    price: raw.price != null ? Number(raw.price) : 0,
    compare_at_price:
      raw.compare_at_price != null ? Number(raw.compare_at_price) : null,

    // ── Limits ───────────────────────────────────────────────────────────
    max_users: raw.max_users ?? 1,
    max_branches: raw.max_branches ?? 1,

    // ── Billing duration ─────────────────────────────────────────────────
    billing_cycle_months: raw.billing_cycle_months ?? 12,
    bonus_months: raw.bonus_months ?? 0,
    total_duration_months: raw.total_duration_months ?? 12,

    // ── Promo fields ─────────────────────────────────────────────────────
    promo_free_until: raw.promo_free_until ?? null,
    is_promo_active: raw.is_promo_active ?? false,

    // ── Intro pricing fields ─────────────────────────────────────────────
    intro_price: raw.intro_price != null ? Number(raw.intro_price) : null,
    intro_trigger_type: raw.intro_trigger_type ?? null,
    intro_duration_years: raw.intro_duration_years ?? null,
    intro_end_date: raw.intro_end_date ?? null,
    is_intro_active: raw.is_intro_active ?? false,

    // ── Flags ─────────────────────────────────────────────────────────────
    is_featured: raw.is_featured ?? false,
    is_customizable: raw.is_customizable ?? false,

    // ── Timestamps ───────────────────────────────────────────────────────
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

/**
 * Normalizes an array of raw plans.
 *
 * @param {Array} rawPlans - Array of raw plan objects from API
 * @returns {Array} Array of normalized plans
 */
export function normalizePlans(rawPlans) {
  if (!Array.isArray(rawPlans)) return [];
  return rawPlans.map(normalizePlan);
}
