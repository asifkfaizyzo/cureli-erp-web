// pharmacy-web/src/pages/settings/plans/comps/PlanCard.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/comps/PlanCard.jsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Check,
  Gift,
  Sparkles,
  ArrowRight,
  Loader2,
  Clock,
  Tag,
  Crown,
  TrendingDown,
} from "lucide-react";
import {
  formatPrice,
  getCardTheme,
  generateFeatures,
  getPlanBadge,
  calculateDiscountPercent,
  isIntroPriceActive,
  getChargeablePrice,
  BILLING,
  CARD_THEMES,
} from "../../../../config/planConfig";
import { analyzePlanChange } from "../../../../utils/planChangeUtils";

const BadgeIcon = ({ type }) => {
  const size = 10;
  switch (type) {
    case "intro":
      return <TrendingDown size={size} />;
    case "bonus":
      return <Gift size={size} />;
    case "promo":
      return <Clock size={size} />;
    case "discount":
      return <Tag size={size} />;
    default:
      return <Sparkles size={size} />;
  }
};

const PlanCard = ({ plan, currentPlan, usage, onSelect, disabled }) => {
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const badge = getPlanBadge(plan);
  const isDark = theme.isDark || false;

  const introActive = isIntroPriceActive(plan);
  const chargeablePrice = getChargeablePrice(plan);
  const isEffectivelyFree = chargeablePrice === 0;
  const hasPromoWithPrice = plan.is_promo_active && plan.price > 0;

  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price,
  );
  const showComparePrice =
    discountPercent && !plan.is_promo_active && !introActive && plan.price > 0;

  // ── Plan relationship ────────────────────────────────────────────────────
  const analysis = useMemo(() => {
    if (!currentPlan) return { direction: "select", isCurrent: false };
    const result = analyzePlanChange(currentPlan, plan, usage);
    return { ...result, isCurrent: currentPlan.plan_id === plan.plan_id };
  }, [currentPlan, plan, usage]);

  const isCurrent = analysis.isCurrent;
  const direction = analysis.direction;
  const canHover = !isCurrent || direction === "renew";

  // ── Button config ────────────────────────────────────────────────────────
  const getButtonConfig = () => {
    // Disabled current plan — no flip, no scale
    if (isCurrent && direction !== "renew") {
      return {
        text: "Current Plan",
        baseClasses: "bg-gray-200 text-gray-500 cursor-not-allowed",
        hoverClasses: "",
        disabled: true,
      };
    }
    if (direction === "renew") {
      return {
        text: "Renew Plan",
        baseClasses: "bg-emerald-600 text-white",
        hoverClasses: "group-hover:bg-white group-hover:text-emerald-600",
        disabled: false,
      };
    }
    if (direction === "upgrade") {
      return {
        text: "Upgrade Plan",
        baseClasses: "bg-[#05015A] text-white",
        hoverClasses: "group-hover:bg-white group-hover:text-[#05015A]",
        disabled: false,
      };
    }
    if (direction === "downgrade") {
      return {
        text: "Choose Plan",
        baseClasses: "bg-orange-500 text-white",
        hoverClasses: "group-hover:bg-white group-hover:text-orange-500",
        disabled: false,
      };
    }
    // Fallback / select — follow theme
    if (isDark) {
      // Featured dark card: white bg + navy text → card hover: navy bg + white text
      return {
        text: isEffectivelyFree ? "Start Free" : "Get Started",
        baseClasses: "bg-white text-[#05015A]",
        hoverClasses:
          "group-hover:bg-[#05015A] group-hover:text-white group-hover:ring-1 group-hover:ring-white/30",
        disabled: false,
      };
    }
    if (theme.accentColor === "text-emerald-600") {
      return {
        text: isEffectivelyFree ? "Start Free" : "Get Started",
        baseClasses: "bg-emerald-600 text-white",
        hoverClasses: "group-hover:bg-white group-hover:text-emerald-600",
        disabled: false,
      };
    }
    return {
      text: isEffectivelyFree ? "Start Free" : "Get Started",
      baseClasses: "bg-[#05015A] text-white",
      hoverClasses: "group-hover:bg-white group-hover:text-[#05015A]",
      disabled: false,
    };
  };

  const buttonConfig = getButtonConfig();

  const handleClick = () => {
    if (buttonConfig.disabled || disabled) return;
    onSelect(plan);
  };

  // ── Text colours ─────────────────────────────────────────────────────────
  const txt = {
    heading: isCurrent
      ? CARD_THEMES.current.accentColor
      : isDark
        ? "text-white"
        : "text-gray-800",
    sub: isCurrent
      ? "text-amber-700"
      : isDark
        ? "text-white/60"
        : "text-gray-600",
    subHover: !isCurrent && !isDark ? "group-hover:text-white/80" : "",
    body: isCurrent
      ? "text-amber-700"
      : isDark
        ? "text-white/70"
        : "text-gray-700",
    bodyHover: !isCurrent && !isDark ? "group-hover:text-white/90" : "",
    muted: isCurrent
      ? "text-amber-600/60"
      : isDark
        ? "text-white/40"
        : "text-gray-400",
    mutedHover: !isCurrent && !isDark ? "group-hover:text-white/50" : "",
    accent: isCurrent
      ? CARD_THEMES.current.accentColor
      : isDark
        ? "text-white"
        : theme.accentColor,
  };

  return (
    <motion.div
      whileHover={canHover ? { y: -4 } : {}}
      className={`
        group relative flex flex-col rounded-2xl
        w-[260px] min-h-[380px] flex-shrink-0
        ${disabled ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      {/* ── Base layer ── */}
      <div
        className={`
          absolute inset-0 rounded-2xl border-2 shadow-md
          transition-shadow duration-300
          ${canHover ? "group-hover:shadow-xl" : ""}
          ${
            isCurrent
              ? `bg-gradient-to-b ${CARD_THEMES.current.gradient}
               ${CARD_THEMES.current.borderAccent}
               ring-2 ${CARD_THEMES.current.glowColor}`
              : isDark
                ? `bg-gradient-to-b ${theme.gradient} ${theme.borderAccent}`
                : `bg-white ${theme.borderAccent}`
          }
        `}
      />

      {/* ── Light non-current cards: hover gradient overlay ── */}
      {canHover && !isCurrent && !isDark && (
        <div
          className={`
            absolute inset-0 rounded-2xl overflow-hidden
            bg-gradient-to-b ${theme.hoverGradient}
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300 ease-out pointer-events-none
          `}
        />
      )}

      {/* ── Featured dark card: base gradient + hover brightness lift ── */}
      {isDark && !isCurrent && (
        <>
          {/* permanent base */}
          <div
            className={`
              absolute inset-0 rounded-2xl overflow-hidden
              bg-gradient-to-b ${theme.hoverGradient}
              pointer-events-none
            `}
          />
          {/* hover brightness lift */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden
                       bg-gradient-to-b from-[#0d0570] to-[#2525aa]
                       opacity-0 group-hover:opacity-100
                       transition-opacity duration-400 ease-out pointer-events-none"
          />
        </>
      )}

      {/* ── Badge ── */}
      {isCurrent ? (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <div
            className={`
              whitespace-nowrap flex items-center gap-1.5 px-3 py-1
              ${CARD_THEMES.current.badgeBg}
              text-white text-[10px] font-bold rounded-full shadow-lg
              uppercase tracking-wider
            `}
          >
            <Crown size={10} />
            CURRENT PLAN
          </div>
        </div>
      ) : badge ? (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <div
            className={`
              whitespace-nowrap flex items-center gap-1.5
              px-3 py-1 text-white text-[10px] font-bold
              rounded-full shadow-lg uppercase tracking-wider
              ${badge.bgColor}
            `}
          >
            <BadgeIcon type={badge.type} />
            {badge.text}
          </div>
        </div>
      ) : null}

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex flex-col p-5 pt-7">
        <h2
          className={`
            text-lg font-bold text-center leading-tight mb-1
            transition-colors duration-300
            ${txt.heading}
            ${!isCurrent ? "group-hover:text-white" : ""}
          `}
        >
          {plan.name}
        </h2>

        <p
          className={`
            text-xs text-center line-clamp-2 min-h-[32px] mb-3
            transition-colors duration-300
            ${txt.sub} ${txt.subHover}
          `}
        >
          {plan.description || "Perfect for getting started"}
        </p>

        {/* ── Price ── */}
        <div className="flex flex-col items-center mb-3">
          {showComparePrice && (
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs line-through transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}
              >
                {formatPrice(plan.compare_at_price)}
              </span>
              <span
                className="text-[10px] font-bold text-emerald-600
                               bg-emerald-50 px-1.5 py-0.5 rounded"
              >
                {discountPercent}% OFF
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-1">
            <span
              className={`
                text-3xl font-extrabold tracking-tight
                transition-colors duration-300
                ${txt.accent}
                ${!isCurrent ? "group-hover:text-white" : ""}
              `}
            >
              {isEffectivelyFree
                ? "FREE"
                : introActive
                  ? formatPrice(plan.intro_price)
                  : formatPrice(plan.price)}
            </span>
            {!isEffectivelyFree && (
              <span
                className={`text-xs transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}
              >
                {BILLING.displayText}
              </span>
            )}
          </div>

          <div className="mt-1 min-h-[16px] text-center">
            {introActive && !isEffectivelyFree && !isCurrent && (
              <p
                className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}
              >
                then{" "}
                <span
                  className={`font-semibold transition-colors duration-300
                                  ${txt.body} ${txt.bodyHover}`}
                >
                  {formatPrice(plan.price)}
                </span>
                {BILLING.displayText} onwards
              </p>
            )}
            {hasPromoWithPrice && !introActive && (
              <p
                className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}
              >
                then{" "}
                <span
                  className={`font-semibold transition-colors duration-300
                                  ${txt.body} ${txt.bodyHover}`}
                >
                  {formatPrice(plan.price)}
                </span>
                /year after promo
              </p>
            )}
            {isEffectivelyFree && !hasPromoWithPrice && (
              <p
                className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}
              >
                14-day trial · No card required
              </p>
            )}
            {!introActive &&
              !hasPromoWithPrice &&
              !isEffectivelyFree &&
              !showComparePrice && (
                <p
                  className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}
                >
                  Billed annually
                </p>
              )}
          </div>
        </div>

        {/* ── Limits ── */}
        <div
          className={`
            flex justify-center gap-6 mb-3 text-xs
            transition-colors duration-300
            ${txt.body}
            ${!isCurrent ? "group-hover:text-white/80" : ""}
          `}
        >
          <div className="flex items-center gap-1.5">
            <Users
              size={14}
              className={`transition-colors duration-300 ${txt.muted}
                         ${!isCurrent ? "group-hover:text-white/50" : ""}`}
            />
            <span>{plan.max_users === -1 ? "∞" : plan.max_users} Users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2
              size={14}
              className={`transition-colors duration-300 ${txt.muted}
                         ${!isCurrent ? "group-hover:text-white/50" : ""}`}
            />
            <span>
              {plan.max_branches === -1 ? "∞" : plan.max_branches}{" "}
              {plan.max_branches === 1 ? "Branch" : "Branches"}
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className={`
            h-px w-full mb-3 transition-colors duration-300
            ${
              isCurrent
                ? "bg-amber-200"
                : isDark
                  ? "bg-white/10 group-hover:bg-white/20"
                  : "bg-gray-200 group-hover:bg-white/20"
            }
          `}
        />

        {/* ── Features ── */}
        <ul className="space-y-2 flex-1 mb-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span
                className={`
                  flex-shrink-0 mt-0.5 transition-colors duration-300
                  ${
                    feature.type === "intro" || feature.type === "bonus"
                      ? isCurrent
                        ? "text-amber-500"
                        : "text-amber-500 group-hover:text-amber-300"
                      : isCurrent
                        ? "text-amber-500"
                        : isDark
                          ? "text-white/60 group-hover:text-white/70"
                          : "text-emerald-500 group-hover:text-emerald-300"
                  }
                `}
              >
                {feature.type === "intro" ? (
                  <TrendingDown size={13} />
                ) : feature.type === "bonus" ? (
                  <Gift size={13} />
                ) : (
                  <Check size={13} strokeWidth={2.5} />
                )}
              </span>
              <span
                className={`
                  leading-tight transition-colors duration-300
                  ${
                    feature.highlight ||
                    feature.type === "intro" ||
                    feature.type === "bonus"
                      ? isCurrent
                        ? "font-semibold text-amber-800"
                        : isDark
                          ? "font-semibold text-amber-200"
                          : "font-semibold text-gray-800 group-hover:text-white"
                      : `${txt.body} ${!isCurrent ? txt.bodyHover : ""}`
                  }
                `}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        {/* ── CTA Button ── */}
        {/*
          Light cards:    colour bg + white text  →  card hover: white bg + colour text
          Featured dark:  white bg + navy text    →  card hover: navy bg + white text (sinks in)
          Current plan:   gray, no flip, no scale
          Self-hover: scale only
        */}
        <button
          onClick={handleClick}
          disabled={buttonConfig.disabled || disabled}
          className={`
            w-full py-2.5 rounded-xl text-sm font-semibold
            transition-colors duration-300
            ${
              !buttonConfig.disabled
                ? "hover:scale-[1.03] active:scale-[0.98]"
                : "cursor-not-allowed"
            }
            shadow-sm flex items-center justify-center gap-2
            ${buttonConfig.baseClasses}
            ${buttonConfig.hoverClasses}
          `}
        >
          {disabled ? (
            <Loader2 size={15} className="animate-spin" />
          ) : buttonConfig.disabled ? (
            buttonConfig.text
          ) : (
            <>
              {buttonConfig.text}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PlanCard;
