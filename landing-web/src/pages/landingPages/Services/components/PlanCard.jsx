// landing-web/src/pages/landingPages/Services/components/PlanCard.jsx (do not remove this comment)

import {
  Check,
  Users,
  Building2,
  Gift,
  TrendingDown,
  ArrowRight,
  Clock,
  Tag,
  Sparkles,
} from "lucide-react";

import {
  BILLING,
  formatPrice,
  getCardTheme,
  getPlanBadge,
  generateFeatures,
  getChargeablePrice,
  isIntroPriceActive,
  calculateDiscountPercent,
} from "../../../../config/planConfig";

const LOGIN_URL = import.meta.env.VITE_SIGN_IN_URL;

const BadgeIcon = ({ type }) => {
  const size = 10;
  switch (type) {
    case "intro":    return <TrendingDown size={size} />;
    case "bonus":    return <Gift size={size} />;
    case "promo":    return <Clock size={size} />;
    case "discount": return <Tag size={size} />;
    default:         return <Sparkles size={size} />;
  }
};

// ── Button classes per theme ─────────────────────────────────────────────────
// Light cards:    solid colour bg + white text  →  card hover: white bg + colour text
// Featured dark:  white bg + navy text          →  card hover: navy bg + white text
// Custom:         amber bg + white text         →  card hover: white bg + amber text
const getButtonClasses = (theme) => {
  if (theme.isDark) {
    // Featured — inverted flip (starts light, goes dark)
    return [
      "bg-white text-[#05015A]",
      "group-hover:bg-[#05015A] group-hover:text-white",
      "group-hover:ring-1 group-hover:ring-white/30",
    ].join(" ");
  }
  if (theme.accentColor === "text-emerald-600") {
    return "bg-emerald-600 text-white group-hover:bg-white group-hover:text-emerald-600";
  }
  if (theme.accentColor === "text-amber-600") {
    return "bg-amber-600 text-white group-hover:bg-white group-hover:text-amber-600";
  }
  // default navy
  return "bg-[#05015A] text-white group-hover:bg-white group-hover:text-[#05015A]";
};

const PlanCard = ({ plan, index }) => {
  const theme = getCardTheme(plan);
  const badge = getPlanBadge(plan);
  const features = generateFeatures(plan);
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

  const txt = {
    heading:    isDark ? "text-white"    : "text-gray-900",
    sub:        isDark ? "text-white/60" : "text-gray-500",
    subHover:   isDark ? ""              : "group-hover:text-white/70",
    body:       isDark ? "text-white/70" : "text-gray-600",
    bodyHover:  isDark ? ""              : "group-hover:text-white/80",
    muted:      isDark ? "text-white/40" : "text-gray-400",
    mutedHover: isDark ? ""              : "group-hover:text-white/50",
    accent:     isDark ? "text-white"    : theme.accentColor,
  };

  const buttonLabel   = isEffectivelyFree ? "Start Free Trial" : "Get Started";
  const buttonClasses = getButtonClasses(theme);

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 75}
      className={`
        group relative rounded-2xl text-left
        transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        hover:-translate-y-2
        ${theme.bg} border-2 ${theme.border}
        hover:shadow-2xl hover:shadow-black/10
      `}
    >
      {/* ── Light card hover gradient overlay ── */}
      {!isDark && (
        <div
          className={`
            absolute inset-0 rounded-[14px] overflow-hidden
            bg-gradient-to-b ${theme.hoverGradient}
            opacity-0 group-hover:opacity-100
            transition-opacity duration-400 ease-out pointer-events-none
          `}
        />
      )}

      {/* ── Featured dark card: base gradient + hover brightness layer ── */}
      {isDark && (
        <>
          {/* permanent base */}
          <div
            className="absolute inset-0 rounded-[14px] overflow-hidden
                       bg-gradient-to-b from-[#0a0a6a] to-[#1a1a8a]
                       pointer-events-none"
          />
          {/* hover brightness lift */}
          <div
            className="absolute inset-0 rounded-[14px] overflow-hidden
                       bg-gradient-to-b from-[#0d0570] to-[#2525aa]
                       opacity-0 group-hover:opacity-100
                       transition-opacity duration-400 ease-out pointer-events-none"
          />
        </>
      )}

      {/* ── Badge ── */}
      {badge && (
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
      )}

      {/* ── Card Content ── */}
      <div className="relative z-10 flex flex-col h-full p-5 sm:p-6 pt-7">

        <h3
          className={`text-lg font-bold mb-1 transition-colors duration-300
                      ${txt.heading} group-hover:text-white`}
        >
          {plan.name}
        </h3>

        <p
          className={`text-xs leading-relaxed line-clamp-2 mb-4
                     transition-colors duration-300
                     ${txt.sub} ${txt.subHover}`}
        >
          {plan.description || "Perfect for getting started"}
        </p>

        {/* ── Price Block ── */}
        <div className="mb-4">
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
                           bg-emerald-50 px-1.5 py-0.5 rounded
                           group-hover:bg-white/20 group-hover:text-white
                           transition-colors duration-300"
              >
                {discountPercent}% OFF
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight
                          transition-colors duration-300
                          ${txt.accent} group-hover:text-white`}
            >
              {isEffectivelyFree
                ? "FREE"
                : introActive
                  ? formatPrice(plan.intro_price)
                  : formatPrice(plan.price)}
            </span>
            {!isEffectivelyFree && (
              <span
                className={`text-sm font-medium transition-colors duration-300
                            ${txt.sub} ${txt.subHover}`}
              >
                {BILLING.displayText}
              </span>
            )}
          </div>

          <div className="mt-1 min-h-[16px]">
            {introActive && !isEffectivelyFree && (
              <p className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}>
                then{" "}
                <span className={`font-semibold transition-colors duration-300
                                  ${txt.body} ${txt.bodyHover}`}>
                  {formatPrice(plan.price)}
                </span>
                {BILLING.displayText} onwards
              </p>
            )}
            {hasPromoWithPrice && !introActive && (
              <p className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}>
                then{" "}
                <span className={`font-semibold transition-colors duration-300
                                  ${txt.body} ${txt.bodyHover}`}>
                  {formatPrice(plan.price)}
                </span>
                /year after promo
              </p>
            )}
            {isEffectivelyFree && !hasPromoWithPrice && (
              <p className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}>
                14-day trial · No card required
              </p>
            )}
            {!introActive && !hasPromoWithPrice && !isEffectivelyFree && !showComparePrice && (
              <p className={`text-[11px] transition-colors duration-300
                            ${txt.muted} ${txt.mutedHover}`}>
                Billed annually
              </p>
            )}
          </div>
        </div>

        {/* ── Limits Row ── */}
        <div
          className={`flex gap-4 text-xs font-medium mb-4
                     transition-colors duration-300
                     ${txt.body} group-hover:text-white/80`}
        >
          <div className="flex items-center gap-1.5">
            <Users size={14}
                   className={`transition-colors duration-300
                               ${txt.muted} group-hover:text-white/50`} />
            <span>{plan.max_users === -1 ? "Unlimited" : plan.max_users} Users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 size={14}
                       className={`transition-colors duration-300
                                   ${txt.muted} group-hover:text-white/50`} />
            <span>
              {plan.max_branches === -1 ? "Unlimited" : plan.max_branches}{" "}
              {plan.max_branches === 1 ? "Branch" : "Branches"}
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className={`h-px w-full mb-4 transition-colors duration-300
                     ${isDark
                       ? "bg-white/10 group-hover:bg-white/20"
                       : "bg-gray-100 group-hover:bg-white/20"
                     }`}
        />

        {/* ── Features ── */}
        <ul className="space-y-2.5 mb-5 flex-1">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs">
              <span
                className={`
                  flex-shrink-0 mt-0.5 transition-colors duration-300
                  ${feature.type === "intro" || feature.type === "bonus"
                    ? "text-amber-500 group-hover:text-amber-300"
                    : `${theme.checkColor} ${theme.checkHover}`
                  }
                `}
              >
                {feature.type === "intro"  ? <TrendingDown size={14} /> :
                 feature.type === "bonus"  ? <Gift size={14} /> :
                                             <Check size={14} strokeWidth={2.5} />}
              </span>
              <span
                className={`
                  leading-tight transition-colors duration-300
                  ${feature.highlight ||
                    feature.type === "intro" ||
                    feature.type === "bonus"
                      ? isDark
                        ? "font-semibold text-amber-200"
                        : "font-semibold text-gray-800 group-hover:text-white"
                      : `${txt.body} ${txt.bodyHover}`
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
          Light cards:   colour bg + white text  →  card hover: white bg + colour text
          Featured dark: white bg + navy text    →  card hover: navy bg + white text
          Self-hover = scale only, no colour change
        */}
        <a
          href={LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            w-full py-2.5 rounded-xl text-sm font-semibold text-center
            transition-colors duration-300
            hover:scale-[1.03] active:scale-[0.98]
            shadow-sm flex items-center justify-center gap-2
            ${buttonClasses}
          `}
        >
          {buttonLabel}
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
};

export default PlanCard;