// cadmin-web/src/config/modules/subscriptionConfig.js (do not remove this comment)
import {
  FileEdit,
  CheckCircle2,
  Clock,
  XCircle,
  LayoutGrid,
} from "lucide-react";

// ============================================
// PLAN STATUSES
// ============================================
export const PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  DEPRECATED: "DEPRECATED",
  SUSPENDED: "SUSPENDED",
};

export const STATUS_CONFIG = {
  [PLAN_STATUS.DRAFT]: {
    label: "Draft",
    icon: FileEdit,
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    description: "Plan is in draft mode and can be edited",
  },
  [PLAN_STATUS.ACTIVE]: {
    label: "Active",
    icon: CheckCircle2,
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    description: "Plan is live and accepting subscriptions",
  },
  [PLAN_STATUS.DEPRECATED]: {
    label: "Deprecated",
    icon: Clock,
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    dotColor: "bg-orange-500",
    description: "Plan is phasing out, existing subscribers continue",
  },
  [PLAN_STATUS.SUSPENDED]: {
    label: "Suspended",
    icon: XCircle,
    badgeColor: "bg-red-100 text-red-700 border-red-200",
    dotColor: "bg-red-500",
    description: "Plan is inactive and not accepting subscriptions",
  },
};

// ============================================
// ACTIONS PER STATUS
// ============================================
export const ALLOWED_ACTIONS = {
  [PLAN_STATUS.DRAFT]: ["edit", "activate", "clone", "delete"],
  [PLAN_STATUS.ACTIVE]: ["view", "suspend", "clone"],
  [PLAN_STATUS.DEPRECATED]: ["view", "clone"],
  [PLAN_STATUS.SUSPENDED]: ["view", "reactivate", "clone", "trash"],
};

// ============================================
// CARD THEMES
// ============================================
export const CARD_THEMES = {
  free: {
    gradient: "from-emerald-50 to-teal-100",
    hoverGradient: "hover:from-emerald-600 hover:to-teal-600",
    accentColor: "text-emerald-600",
    borderAccent: "border-emerald-200",
  },
  default: {
    gradient: "from-[#afccf4] to-[#e7e9ec]",
    hoverGradient: "hover:from-[#05015A] hover:to-[#05015A]",
    accentColor: "text-[#05015A]",
    borderAccent: "border-blue-200",
  },
  featured: {
    gradient: "from-violet-100 to-purple-100",
    hoverGradient: "hover:from-violet-600 hover:to-purple-600",
    accentColor: "text-violet-600",
    borderAccent: "border-violet-300",
  },
  promo: {
    gradient: "from-amber-50 to-orange-100",
    hoverGradient: "hover:from-amber-500 hover:to-orange-500",
    accentColor: "text-amber-600",
    borderAccent: "border-amber-300",
  },
  intro: {
    gradient: "from-sky-50 to-indigo-100",
    hoverGradient: "hover:from-sky-500 hover:to-indigo-500",
    accentColor: "text-sky-600",
    borderAccent: "border-sky-300",
  },
};

// ============================================
// FILTER OPTIONS
// ============================================
export const FILTER_OPTIONS = [
  {
    key: "all",
    label: "All Plans",
    icon: LayoutGrid,
    activeColor: "bg-[#05015A]",
  },
  {
    key: PLAN_STATUS.DRAFT,
    label: "Draft",
    icon: FileEdit,
    activeColor: "bg-amber-600",
  },
  {
    key: PLAN_STATUS.ACTIVE,
    label: "Active",
    icon: CheckCircle2,
    activeColor: "bg-emerald-600",
  },
  {
    key: PLAN_STATUS.DEPRECATED,
    label: "Deprecated",
    icon: Clock,
    activeColor: "bg-orange-600",
  },
  {
    key: PLAN_STATUS.SUSPENDED,
    label: "Suspended",
    icon: XCircle,
    activeColor: "bg-red-600",
  },
];

// ============================================
// BILLING
// ============================================
export const BILLING = {
  duration: "year",
  displayText: "/year",
  currency: "₹",
  currencyCode: "INR",
};

// ============================================
// INTRO PRICING CONSTANTS
// ============================================
export const INTRO_TRIGGER_TYPE = {
  DURATION: "duration",
  DATE: "date",
};

export const INTRO_TRIGGER_CONFIG = {
  [INTRO_TRIGGER_TYPE.DURATION]: {
    label: "After N Years",
    description: "Intro price applies for the first N yearly renewals (5 max)",
    inputLabel: "Intro Duration (years)",
    inputPlaceholder: "e.g., 2",
  },
  [INTRO_TRIGGER_TYPE.DATE]: {
    label: "Until a Date",
    description: "Intro price applies until a specific calendar date",
    inputLabel: "Intro End Date",
    inputPlaceholder: "Select date",
  },
};

// ============================================
// DURATION FORMATTING
// ============================================
export const formatDuration = (months) => {
  if (!months) return "";
  if (months === 12) return "1 year";
  if (months % 12 === 0) return `${months / 12} years`;
  if (months > 12) {
    const yrs = Math.floor(months / 12);
    const mnts = months % 12;
    return `${yrs} year${yrs > 1 ? "s" : ""} ${mnts} month${mnts > 1 ? "s" : ""}`;
  }
  return `${months} month${months > 1 ? "s" : ""}`;
};

// ============================================
// PROMO HELPERS
// ============================================
export const isPromoActive = (plan) => {
  if (!plan?.promo_free_until) return false;
  return new Date(plan.promo_free_until) > new Date();
};

export const hasActivePromo = (plan) => {
  if (!plan) return false;
  const hasComparePrice =
    plan.compare_at_price && plan.compare_at_price > plan.price;
  const hasBonusMonths = plan.bonus_months && plan.bonus_months > 0;
  const hasFreeUntil = isPromoActive(plan);
  return hasComparePrice || hasBonusMonths || hasFreeUntil;
};

export const getTotalDurationMonths = (plan) => {
  if (!plan) return 12;
  return (plan.billing_cycle_months || 12) + (plan.bonus_months || 0);
};

export const getDiscountPercentage = (plan) => {
  if (!plan?.compare_at_price || !plan?.price) return null;
  if (plan.compare_at_price <= plan.price) return null;
  const discount =
    ((plan.compare_at_price - plan.price) / plan.compare_at_price) * 100;
  return Math.round(discount);
};

export const formatPromoDate = (plan) => {
  if (!plan?.promo_free_until) return null;
  return new Date(plan.promo_free_until).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getBonusMonthsBadge = (plan) => {
  if (!plan?.bonus_months || plan.bonus_months <= 0) return null;
  return `+${plan.bonus_months} months free`;
};

export const getFreeUntilBadge = (plan) => {
  if (!isPromoActive(plan)) return null;
  return `Free until ${formatPromoDate(plan)}`;
};

// ============================================
// INTRO PRICING HELPERS
// ============================================
export const isIntroPriceActive = (plan) => {
  if (!plan?.intro_price || !plan?.intro_trigger_type) return false;

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
    return plan.intro_end_date
      ? new Date(plan.intro_end_date) > new Date()
      : false;
  }

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    return true;
  }

  return false;
};

export const isIntroExpired = (plan) => {
  if (!plan?.intro_price) return false;
  if (plan.intro_trigger_type !== INTRO_TRIGGER_TYPE.DATE) return false;
  if (!plan.intro_end_date) return false;
  return new Date(plan.intro_end_date) <= new Date();
};

export const getIntroPhaseBadge = (plan) => {
  if (!plan?.intro_price || !plan?.intro_trigger_type) return null;

  const formattedPrice = formatPrice(plan.intro_price);

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    if (!plan.intro_duration_years) return null;
    const years = plan.intro_duration_years;
    const durationText = `${years} year${years > 1 ? "s" : ""}`;
    return `${formattedPrice} for ${durationText}`;
  }

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
    if (!plan.intro_end_date) return null;
    const dateStr = new Date(plan.intro_end_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${formattedPrice} until ${dateStr}`;
  }

  return null;
};

export const getIntroPhaseDescription = (plan) => {
  if (!plan?.intro_price || !plan?.intro_trigger_type) return null;

  const introFormatted = formatPrice(plan.intro_price);
  const regularFormatted = formatPrice(plan.price);

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    if (!plan.intro_duration_years) return null;
    const years = plan.intro_duration_years;
    const durationText = `${years} year${years > 1 ? "s" : ""}`;
    return `${introFormatted}/year for first ${durationText}, then ${regularFormatted}/year`;
  }

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE) {
    if (!plan.intro_end_date) return null;
    const dateStr = new Date(plan.intro_end_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${introFormatted}${BILLING.displayText} until ${dateStr}, then ${regularFormatted}${BILLING.displayText}`;
  }

  return null;
};

export const getIntroPriceWarning = (introPrice, regularPrice) => {
  const intro = Number(introPrice);
  const regular = Number(regularPrice);

  if (isNaN(intro) || isNaN(regular)) return null;

  if (intro === 0) {
    return "Intro price is zero — subscribers will pay nothing during the intro period.";
  }

  if (intro > regular) {
    return "Intro price is higher than the regular price. Subscribers will pay more initially.";
  }

  if (intro === regular) {
    return "Intro price equals the regular price — there is no effective discount.";
  }

  return null;
};

// ============================================
// CARD THEME HELPERS
// ============================================
export const getCardTheme = (plan) => {
  if (isPromoActive(plan)) return CARD_THEMES.promo;
  if (isIntroPriceActive(plan)) return CARD_THEMES.intro;
  if (plan.price === 0) return CARD_THEMES.free;
  if (plan.is_featured) return CARD_THEMES.featured;
  return CARD_THEMES.default;
};

// ============================================
// FEATURE GENERATION
// ============================================
export const generateFeatures = (plan) => {
  const features = [];

  const users = plan.max_users;
  const branches = plan.max_branches;

  if (users !== undefined) {
    if (users === -1) {
      features.push("Unlimited users");
    } else {
      features.push(`Up to ${users} users`);
    }
  }

  if (branches !== undefined) {
    if (branches === -1) {
      features.push("Unlimited branches");
    } else if (branches === 1) {
      features.push("Single branch");
    } else {
      features.push(`Up to ${branches} branches`);
    }
  }

  const totalMonths = getTotalDurationMonths(plan);
  if (plan.bonus_months && plan.bonus_months > 0) {
    features.push(`${totalMonths} months access`);
  }

  return features;
};

// ============================================
// PRICE FORMATTING
// ============================================
export const formatPrice = (price) => {
  if (price === 0) return "FREE";
  return `${BILLING.currency}${Number(price).toLocaleString("en-IN")}`;
};

export const formatPriceComparison = (plan) => {
  if (!plan?.compare_at_price || plan.compare_at_price <= plan.price) {
    return null;
  }

  const original = plan.compare_at_price;
  const current = plan.price;
  const savings = original - current;
  const percentage = getDiscountPercentage(plan);

  return {
    original: formatPrice(original),
    current: formatPrice(current),
    savings: formatPrice(savings),
    percentage,
  };
};

// ============================================
// CLONE NAME GENERATOR
// ============================================
export const generateCloneName = (originalName, existingPlans) => {
  let baseName = originalName.replace(/\s*\(Copy(?:\s*\d+)?\)\s*$/, "");
  let copyName = `${baseName} (Copy)`;
  let counter = 1;

  const existingNames = existingPlans.map((p) => p.name.toLowerCase());

  while (existingNames.includes(copyName.toLowerCase())) {
    counter++;
    copyName = `${baseName} (Copy ${counter})`;
  }

  return copyName;
};