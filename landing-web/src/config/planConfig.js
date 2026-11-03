// landing-web/src/config/planConfig.js (do not remove this comment)
// Landing page plan configuration

// ============================================
// BILLING
// ============================================

export const BILLING = {
  cycle: "year",
  displayText: "/year",
  currency: "₹",
  currencyCode: "INR",
};

// ============================================
// INTRO TRIGGER TYPES
// ============================================

export const INTRO_TRIGGER_TYPE = {
  DURATION: "duration",
  DATE: "date",
};

// ============================================
// THEMES — Only 4 card styles
// ============================================

export const CARD_THEMES = {
  free: {
    border: "border-emerald-200",
    bg: "bg-white",
    hoverGradient: "from-emerald-600 to-teal-600",
    accentColor: "text-emerald-600",
    buttonBase: "bg-emerald-600 text-white",
    badgeBg: "bg-[#05015A]",
    checkColor: "text-emerald-500",
    checkHover: "group-hover:text-emerald-300",
  },
  default: {
    border: "border-gray-200",
    bg: "bg-white",
    hoverGradient: "from-[#05015A] to-[#1a1a8a]",
    accentColor: "text-[#05015A]",
    buttonBase: "bg-[#05015A] text-white",
    badgeBg: "bg-[#05015A]",
    checkColor: "text-[#05015A]/60",
    checkHover: "group-hover:text-white/70",
  },
  featured: {
    border: "border-[#05015A]",
    bg: "bg-[#05015A]",
    hoverGradient: "from-[#0a0a6a] to-[#1a1a8a]",
    accentColor: "text-white",
    buttonBase: "bg-white text-[#05015A]",
    badgeBg: "bg-amber-500",
    checkColor: "text-white/60",
    checkHover: "group-hover:text-white/70",
    isDark: true,
  },
  custom: {
    border: "border-amber-300 border-dashed",
    bg: "bg-white",
    hoverGradient: "from-amber-500 to-orange-500",
    accentColor: "text-amber-600",
    buttonBase: "bg-amber-600 text-white",
    badgeBg: "bg-amber-600",
    checkColor: "text-amber-500",
    checkHover: "group-hover:text-amber-300",
  },
};

// ============================================
// BADGE COLOURS — unified to navy
// except featured (gold) and custom (amber)
// ============================================

export const BADGE_COLORS = {
  intro:    "bg-[#05015A]",
  promo:    "bg-[#05015A]",
  bonus:    "bg-[#05015A]",
  discount: "bg-[#05015A]",
  featured: "bg-[#3b2fd4]",
};

// ============================================
// FORMATTERS
// ============================================

export const formatPrice = (price) => {
  if (price === 0) return "FREE";
  return `${BILLING.currency}${Number(price).toLocaleString("en-IN")}`;
};

export const formatLimit = (value) => {
  if (value === -1) return "Unlimited";
  return value.toString();
};

export const formatDuration = (years) => {
  if (!years) return "";
  const numYears = Number(years);
  if (numYears === 1) return "1 year";
  return `${numYears} years`;
};

// ============================================
// DISCOUNT
// ============================================

export const calculateDiscountPercent = (compareAtPrice, price) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
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

export const getChargeablePrice = (plan) => {
  const promoActive =
    plan.is_promo_active ||
    (plan.promo_free_until && new Date(plan.promo_free_until) > new Date());

  if (plan.price === 0 || promoActive) return 0;

  if (isIntroPriceActive(plan) && plan.intro_price !== null) {
    return plan.intro_price;
  }

  return plan.price;
};

export const getIntroPhaseBadgeText = (plan) => {
  if (!isIntroPriceActive(plan)) return null;

  const formattedPrice = formatPrice(plan.intro_price);

  if (plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION) {
    if (!plan.intro_duration_years) return null;
    const durationText = formatDuration(plan.intro_duration_years);
    return `${formattedPrice} for first ${durationText}`;
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

// ============================================
// THEME SELECTION
// ============================================

export const getCardTheme = (plan) => {
  if (plan.is_featured) return CARD_THEMES.featured;
  if (plan.price === 0) return CARD_THEMES.free;
  return CARD_THEMES.default;
};

// ============================================
// BADGE — only ONE per card, priority order
// ============================================

export const getPlanBadge = (plan) => {
  // 1. Intro pricing — highest priority for paid plans
  if (isIntroPriceActive(plan) && plan.price > 0) {
    const badgeText = getIntroPhaseBadgeText(plan);
    if (badgeText) {
      return {
        text: badgeText.toUpperCase(),
        type: "intro",
        bgColor: BADGE_COLORS.intro,
      };
    }
  }

  // 2. Promo free-until
  if (plan.is_promo_active && plan.promo_free_until) {
    const date = new Date(plan.promo_free_until).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    return {
      text: `FREE UNTIL ${date.toUpperCase()}`,
      type: "promo",
      bgColor: BADGE_COLORS.promo,
    };
  }

  // 3. Bonus months
  if (plan.bonus_months > 0) {
    return {
      text: `+${plan.bonus_months} MONTHS FREE`,
      type: "bonus",
      bgColor: BADGE_COLORS.bonus,
    };
  }

  // 4. Discount from compare_at_price
  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price
  );
  if (discountPercent && plan.price > 0 && !plan.is_promo_active) {
    return {
      text: `SAVE ${discountPercent}%`,
      type: "discount",
      bgColor: BADGE_COLORS.discount,
    };
  }

  // 5. Featured / popular
  if (plan.is_featured) {
    return {
      text: "MOST POPULAR",
      type: "featured",
      bgColor: BADGE_COLORS.featured,
    };
  }

  return null;
};

// ============================================
// FEATURE GENERATION — exactly 4 per card
// ============================================

export const generateFeatures = (plan) => {
  const features = [];
  const isTrulyFree = plan.price === 0 && !plan.is_promo_active;
  const hasBonus = plan.bonus_months > 0;
  const hasIntro = isIntroPriceActive(plan);

  // 1. Users
  const usersText =
    plan.max_users === -1
      ? "Unlimited Users"
      : `Up to ${plan.max_users} User${plan.max_users > 1 ? "s" : ""}`;
  features.push({ text: usersText, highlight: false });

  // 2. Branches
  const branchesText =
    plan.max_branches === -1
      ? "Unlimited Branches"
      : plan.max_branches === 1
        ? "Single Branch"
        : `Up to ${plan.max_branches} Branches`;
  features.push({ text: branchesText, highlight: false });

  // 3 & 4 — contextual
  if (isTrulyFree) {
    features.push({ text: "Basic Support", highlight: false });
    features.push({ text: "Email Assistance", highlight: false });
  } else if (hasIntro) {
    const durationLabel = plan.intro_duration_years
      ? `First ${formatDuration(plan.intro_duration_years)}`
      : "Limited period";

    features.push({
      text: `${durationLabel}: ${formatPrice(plan.intro_price)}${BILLING.displayText}`,
      highlight: true,
      type: "intro",
    });
    features.push({
      text: `Then ${formatPrice(plan.price)}${BILLING.displayText} onwards`,
      highlight: false,
    });
  } else if (hasBonus) {
    features.push({
      text: `+${plan.bonus_months} Month${plan.bonus_months > 1 ? "s" : ""} Free`,
      highlight: true,
      type: "bonus",
    });
    features.push({ text: "Priority Support", highlight: false });
  } else {
    features.push({ text: "Priority Support", highlight: false });
    features.push({ text: "All Core Features", highlight: false });
  }

  return features;
};