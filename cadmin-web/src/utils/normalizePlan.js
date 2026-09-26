// cadmin-web/src/utils/normalizePlan.js (do not remove this comment)
// cadmin-web/src/utils/normalizePlan.js

/**
 * Normalizes a single raw plan from the API.
 *
 * Ensures all fields have safe defaults so UI components
 * never have to guard against undefined.
 *
 * @param {Object} raw - Raw plan object from API
 * @param {Object} options
 * @param {boolean} options.flagForReview - Whether to compute _needs_review
 * @returns {Object} Normalized plan
 */
export function normalizePlan(raw, options = {}) {
  const { flagForReview = false } = options;

  const normalized = {
    // ── Identity ───────────────────────────────────────────────────────────
    plan_id: raw.plan_id ?? null,
    name: raw.name ?? "Unnamed Plan",
    description: raw.description ?? "",
    type: raw.type ?? "PRE_MADE",
    status: raw.status ?? "DRAFT",

    // ── Pricing ────────────────────────────────────────────────────────────
    price: raw.price != null ? Number(raw.price) : 0,
    compare_at_price:
      raw.compare_at_price != null ? Number(raw.compare_at_price) : null,

    // ── Limits ─────────────────────────────────────────────────────────────
    max_users: raw.max_users ?? 1,
    max_branches: raw.max_branches ?? 1,

    // ── Billing duration ───────────────────────────────────────────────────
    billing_cycle_months: raw.billing_cycle_months ?? 12,
    bonus_months: raw.bonus_months ?? 0,
    total_duration_months: raw.total_duration_months ?? 12,

    // ── Promo fields ───────────────────────────────────────────────────────
    promo_free_until: raw.promo_free_until ?? null,
    is_promo_active: raw.is_promo_active ?? false,

    // ── Intro pricing fields ───────────────────────────────────────────────
    intro_price: raw.intro_price != null ? Number(raw.intro_price) : null,
    intro_trigger_type: raw.intro_trigger_type ?? null,
    intro_duration_years: raw.intro_duration_years ?? null,

    intro_end_date: raw.intro_end_date ?? null,
    is_intro_active: raw.is_intro_active ?? false,

    // ── Flags ──────────────────────────────────────────────────────────────
    is_featured: raw.is_featured ?? false,
    is_customizable: raw.is_customizable ?? false,

    // ── Counts ─────────────────────────────────────────────────────────────
    subscriber_count: raw.subscriber_count ?? 0,

    // ── Custom plan ────────────────────────────────────────────────────────
    created_for_shop_id: raw.created_for_shop_id ?? null,
    created_for_shop: raw.created_for_shop ?? null,

    // ── Metadata ───────────────────────────────────────────────────────────
    created_by: raw.created_by ?? null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    activated_at: raw.activated_at ?? null,
    suspended_at: raw.suspended_at ?? null,
    deleted_at: raw.deleted_at ?? null,
    creator: raw.creator ?? null,

    // ── Review flag (computed below) ───────────────────────────────────────
    _needs_review: false,
  };

  if (flagForReview) {
    normalized._needs_review = computeNeedsReview(normalized);
  }

  return normalized;
}

/**
 * Determines if a plan needs admin attention.
 *
 * Conditions:
 * 1. promo_free_until is set AND has expired
 * 2. intro_trigger_type = "date" AND intro_end_date is set AND has expired
 *
 * Duration-based intros do NOT expire at the plan level
 * (they expire per-subscription), so no flag needed.
 *
 * @param {Object} plan - Already normalized plan
 * @returns {boolean}
 */
function computeNeedsReview(plan) {
  const now = new Date();

  // Condition 1: expired promo_free_until
  if (plan.promo_free_until) {
    const promoDate = new Date(plan.promo_free_until);
    if (promoDate <= now) return true;
  }

  // Condition 2: expired date-based intro pricing
  if (plan.intro_trigger_type === "date" && plan.intro_end_date) {
    const introDate = new Date(plan.intro_end_date);
    if (introDate <= now) return true;
  }

  return false;
}

/**
 * Normalizes an array of raw plans.
 *
 * @param {Array} rawPlans - Array of raw plan objects from API
 * @param {Object} options - Same options as normalizePlan
 * @returns {Array} Array of normalized plans
 */
export function normalizePlans(rawPlans, options = {}) {
  if (!Array.isArray(rawPlans)) return [];
  return rawPlans.map((plan) => normalizePlan(plan, options));
}

/**
 * Counts how many plans in an array need review.
 *
 * @param {Array} plans - Array of normalized plans
 * @returns {number}
 */
export function countPlansNeedingReview(plans) {
  if (!Array.isArray(plans)) return 0;
  return plans.filter((p) => p._needs_review === true).length;
}
