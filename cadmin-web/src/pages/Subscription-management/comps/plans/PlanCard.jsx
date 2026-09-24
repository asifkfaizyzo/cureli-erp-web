// cadmin-web/src/pages/Subscription-management/comps/plans/PlanCard.jsx (do not remove this comment)
// cadmin-web/src/pages/Subscription-management/comps/plans/PlanCard.jsx

import {
  Pencil,
  Eye,
  Copy,
  Power,
  PlayCircle,
  PauseCircle,
  Sparkles,
  Users,
  Trash2,
  Store,
  Gift,
  Calendar,
  Percent,
  Clock,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  PLAN_STATUS,
  STATUS_CONFIG,
  ALLOWED_ACTIONS,
  getCardTheme,
  generateFeatures,
  formatPrice,
  formatPriceComparison,
  isPromoActive,
  getBonusMonthsBadge,
  getFreeUntilBadge,
  getDiscountPercentage,
  getTotalDurationMonths,
  getIntroPhaseBadge,
  isIntroPriceActive,
  BILLING,
  INTRO_TRIGGER_TYPE,
} from "../../../../config/modules/subscriptionConfig";

export default function PlanCard({
  plan,
  onAction,
  needsReview = false,
  canEdit   = true,
  canDelete = true,
}) {
  const statusConfig = STATUS_CONFIG[plan.status];
  const features     = generateFeatures(plan);
  const actions      = ALLOWED_ACTIONS[plan.status] ?? [];

  // ── Promo / intro state ───────────────────────────────────────────────────
  const isFree         = plan.price === 0;
  const isCustom       = plan.type === "CUSTOM";
  const promoActive    = isPromoActive(plan);
  const introActive    = isIntroPriceActive(plan);
  const priceComparison = formatPriceComparison(plan);
  const bonusMonthsBadge = getBonusMonthsBadge(plan);
  const freeUntilBadge   = getFreeUntilBadge(plan);
  const discountPercent  = getDiscountPercentage(plan);
  const totalDuration    = getTotalDurationMonths(plan);
  const introBadge       = getIntroPhaseBadge(plan);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const themeKey = (() => {
    if (promoActive)    return "promo";
    if (introActive)    return "intro";
    if (isFree)         return "free";
    if (plan.is_featured) return "featured";
    return "default";
  })();

  const themeClasses = {
    free: {
      container:
        "from-emerald-50 to-teal-100 hover:from-emerald-600 hover:to-teal-600 border-emerald-200",
    },
    featured: {
      container:
        "from-violet-100 to-purple-100 hover:from-violet-600 hover:to-purple-600 border-violet-300",
    },
    promo: {
      container:
        "from-amber-50 to-orange-100 hover:from-amber-500 hover:to-orange-500 border-amber-300",
    },
    intro: {
      container:
        "from-sky-50 to-indigo-100 hover:from-sky-500 hover:to-indigo-500 border-sky-300",
    },
    default: {
      container:
        "from-[#afccf4] to-[#e7e9ec] hover:from-[#05015A] hover:to-[#05015A] border-blue-200",
    },
  };

  const theme = themeClasses[themeKey];

  const handleAction = (actionType) => onAction(actionType, plan);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`group relative h-full flex flex-col rounded-xl p-5
        shadow-md border transition-all duration-300
        bg-gradient-to-b ${theme.container}
        ${isCustom    ? "ring-2 ring-violet-200" : ""}
        ${needsReview ? "ring-2 ring-red-300"    : ""}
        hover:shadow-xl hover:-translate-y-1`}
    >
      {/* Needs-review indicator */}
      {needsReview && (
        <div className="absolute -top-2 -right-2 z-10">
          <div
            className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-md"
            title="Needs review"
          >
            <AlertTriangle size={11} className="text-white" />
          </div>
        </div>
      )}

      {/* ── Top row: badges + action icons ───────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">

        {/* Left: status & feature badges */}
        <div className="flex flex-wrap items-center gap-1.5 max-w-[65%]">
          {/* Status */}
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
              border flex items-center gap-1 ${statusConfig.badgeColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
            {statusConfig.label}
          </div>

          {/* Custom */}
          {isCustom && (
            <div className="px-2 py-0.5 rounded-full bg-violet-500 text-white
                            text-[10px] font-semibold flex items-center gap-1">
              <Sparkles size={10} />
              Custom
            </div>
          )}

          {/* Featured */}
          {!isCustom && plan.is_featured && !promoActive && !introActive && (
            <div className="px-2 py-0.5 rounded-full bg-amber-500 text-white
                            text-[10px] font-semibold flex items-center gap-1">
              <Sparkles size={10} />
              Featured
            </div>
          )}

          {/* Promo active */}
          {promoActive && (
            <div className="px-2 py-0.5 rounded-full bg-blue-500 text-white
                            text-[10px] font-semibold flex items-center gap-1 animate-pulse">
              <Calendar size={10} />
              Promo
            </div>
          )}

          {/* Intro active */}
          {introActive && !promoActive && (
            <div className="px-2 py-0.5 rounded-full bg-sky-500 text-white
                            text-[10px] font-semibold flex items-center gap-1">
              <TrendingDown size={10} />
              Intro
            </div>
          )}
        </div>

        {/* Right: action icon buttons */}
        <div className="flex gap-1">
          {actions.includes("edit") && canEdit && (
            <ActionButton
              icon={Pencil}
              tooltip="Edit Plan"
              onClick={() => handleAction("edit")}
            />
          )}
          {actions.includes("view") && (
            <ActionButton
              icon={Eye}
              tooltip="View Details"
              onClick={() => handleAction("view")}
            />
          )}
          {actions.includes("delete") && canDelete && (
            <ActionButton
              icon={Trash2}
              tooltip="Delete Draft"
              onClick={() => handleAction("delete")}
              className="bg-red-500 text-black"
            />
          )}
          {/* ── NEW: Trash button for suspended plans ─────────────────────── */}
          {actions.includes("trash") && canDelete && (
            <ActionButton
              icon={Trash2}
              tooltip="Move to Trash"
              onClick={() => handleAction("trash")}
              className="hover:bg-red-50 hover:text-red-600"
            />
          )}
          {/* ─────────────────────────────────────────────────────────────── */}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="mt-12 flex flex-col flex-1">

        {/* Plan name */}
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-white mb-1 line-clamp-1">
          {plan.name}
        </h2>

        {/* Custom plan shop link */}
        {isCustom && plan.created_for_shop && (
          <div className="flex items-center gap-1.5 text-xs text-violet-600
                          group-hover:text-violet-200 mb-2 font-medium">
            <Store size={12} />
            <span className="truncate">
              {plan.created_for_shop.business_name}
            </span>
          </div>
        )}

        {/* Free promo banner */}
        {freeUntilBadge && (
          <div className="mb-2 p-2 rounded-lg bg-blue-100 group-hover:bg-blue-900/30
                          border border-blue-200 group-hover:border-blue-400">
            <div className="flex items-center gap-1.5">
              <Calendar
                size={14}
                className="text-blue-600 group-hover:text-blue-300"
              />
              <span className="text-xs font-semibold text-blue-700 group-hover:text-blue-200">
                {freeUntilBadge}
              </span>
            </div>
          </div>
        )}

        {/* Intro pricing banner */}
        {introActive && !promoActive && (
          <div className="mb-2 p-2 rounded-lg bg-sky-100 group-hover:bg-sky-900/30
                          border border-sky-200 group-hover:border-sky-400">
            <div className="flex items-start gap-1.5">
              <TrendingDown
                size={14}
                className="text-sky-600 group-hover:text-sky-300 mt-0.5 flex-shrink-0"
              />
              <div>
                <span className="text-xs font-semibold text-sky-700 group-hover:text-sky-200 block">
                  Two-Phase Pricing
                </span>
                <span className="text-[10px] text-sky-600 group-hover:text-sky-300">
                  {plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION &&
                  plan.intro_duration_years
                    ? `${formatPrice(plan.intro_price)} for first ${plan.intro_duration_years} month${plan.intro_duration_years !== 1 ? "s" : ""}`
                    : plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DATE &&
                      plan.intro_end_date
                    ? `${formatPrice(plan.intro_price)} until ${new Date(
                        plan.intro_end_date,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`
                    : `Intro: ${formatPrice(plan.intro_price)}`}
                  {" → then "}
                  {formatPrice(plan.price)}
                  {BILLING.displayText}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Price section */}
        <div className="mb-3">
          {/* Strike-through compare price */}
          {priceComparison && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-400 line-through group-hover:text-white/50">
                {priceComparison.original}
              </span>
              {discountPercent && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700
                                 text-[10px] font-bold rounded
                                 group-hover:bg-green-500 group-hover:text-white">
                  -{discountPercent}%
                </span>
              )}
            </div>
          )}

          {/* Main displayed price */}
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold group-hover:text-white
                ${promoActive
                  ? "text-blue-600"
                  : introActive
                  ? "text-sky-600"
                  : isFree
                  ? "text-emerald-600"
                  : "text-[#05015A]"
                }`}
            >
              {promoActive
                ? "FREE"
                : introActive
                ? formatPrice(plan.intro_price)
                : formatPrice(plan.price)}
            </span>
            {!isFree && !promoActive && (
              <span className="text-sm text-gray-500 group-hover:text-white/70">
                {BILLING.displayText}
              </span>
            )}
          </div>

          {/* Intro: show "then ₹X/year" */}
          {introActive && !promoActive && (
            <p className="text-xs text-gray-500 group-hover:text-white/60 mt-0.5">
              then {formatPrice(plan.price)}
              {BILLING.displayText}
            </p>
          )}

          {/* Promo: show original price note */}
          {promoActive && plan.price > 0 && (
            <p className="text-xs text-gray-500 group-hover:text-white/60 mt-1">
              Then {formatPrice(plan.price)}
              {BILLING.displayText}
            </p>
          )}
        </div>

        {/* Promo / Intro badges row */}
        {(bonusMonthsBadge || introBadge || (priceComparison && !promoActive)) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {introBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-1
                               bg-sky-100 text-sky-700 rounded-full text-[10px]
                               font-semibold group-hover:bg-sky-500 group-hover:text-white">
                <TrendingDown size={10} />
                {introBadge}
              </span>
            )}

            {bonusMonthsBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-1
                               bg-emerald-100 text-emerald-700 rounded-full
                               text-[10px] font-semibold
                               group-hover:bg-emerald-500 group-hover:text-white">
                <Gift size={10} />
                {bonusMonthsBadge}
              </span>
            )}

            {priceComparison && !promoActive && (
              <span className="inline-flex items-center gap-1 px-2 py-1
                               bg-amber-100 text-amber-700 rounded-full
                               text-[10px] font-semibold
                               group-hover:bg-amber-500 group-hover:text-white">
                <Percent size={10} />
                Save {priceComparison.savings}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-gray-600 group-hover:text-white/80 mb-3 line-clamp-2">
          {plan.description}
        </p>

        {/* Divider */}
        <div className="h-px w-full bg-gray-300 group-hover:bg-white/30 mb-3" />

        {/* Features */}
        <ul className="space-y-1.5 mb-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-emerald-500 group-hover:text-emerald-300 flex-shrink-0">
                ✓
              </span>
              <span className="text-gray-700 group-hover:text-white">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Duration info */}
        {plan.bonus_months > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500
                          group-hover:text-white/60 mb-3">
            <Clock size={12} />
            <span>
              Total: {totalDuration} months ({plan.billing_cycle_months || 12}{" "}
              + {plan.bonus_months} bonus)
            </span>
          </div>
        )}

        {/* Subscriber count */}
        {(plan.status === PLAN_STATUS.ACTIVE ||
          plan.status === PLAN_STATUS.DEPRECATED) && (
          <div className="flex items-center gap-2 text-xs text-gray-500
                          group-hover:text-white/70 mb-3 p-2 rounded-lg
                          bg-white/50 group-hover:bg-white/10">
            <Users size={14} />
            <span>{plan.subscriber_count || 0} active subscribers</span>
          </div>
        )}

        {/* Needs review note */}
        {needsReview && (
          <div className="flex items-center gap-1.5 text-xs text-red-600
                          group-hover:text-red-200 mb-3 p-2 rounded-lg
                          bg-red-50 group-hover:bg-red-900/20
                          border border-red-200 group-hover:border-red-400">
            <AlertTriangle size={12} />
            <span>Has expired promotional settings</span>
          </div>
        )}
      </div>

      {/* ── Bottom action buttons ──────────────────────────────────────────── */}
      <div className="mt-auto pt-3 flex gap-2">
        {/* Activate */}
        {actions.includes("activate") && (
          <button
            onClick={() => handleAction("activate")}
            className="flex-1 flex items-center justify-center gap-1.5
                       py-2 rounded-lg text-xs font-semibold
                       bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
          >
            <PlayCircle size={14} />
            Activate
          </button>
        )}

        {/* Suspend */}
        {actions.includes("suspend") && (
          <button
            onClick={() => handleAction("suspend")}
            className="flex-1 flex items-center justify-center gap-1.5
                       py-2 rounded-lg text-xs font-semibold
                       bg-orange-500 text-white hover:bg-orange-600 transition-all"
          >
            <PauseCircle size={14} />
            Suspend
          </button>
        )}

        {/* Reactivate */}
        {actions.includes("reactivate") && (
          <button
            onClick={() => handleAction("reactivate")}
            className="flex-1 flex items-center justify-center gap-1.5
                       py-2 rounded-lg text-xs font-semibold
                       bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
          >
            <Power size={14} />
            Reactivate
          </button>
        )}

        {/* Clone */}
        {!isCustom && (
          <button
            onClick={() => handleAction("clone")}
            className="flex items-center justify-center gap-1.5
                       px-3 py-2 rounded-lg text-xs font-semibold
                       bg-white text-[#05015A] border border-[#05015A]/20
                       hover:bg-[#05015A] hover:text-white
                       group-hover:bg-white group-hover:text-[#05015A]
                       transition-all"
          >
            <Copy size={14} />
            Clone
          </button>
        )}

        {/* View for custom plans */}
        {isCustom && (
          <button
            onClick={() => handleAction("view")}
            className="flex items-center justify-center gap-1.5
                       px-3 py-2 rounded-lg text-xs font-semibold
                       bg-white text-violet-600 border border-violet-200
                       hover:bg-violet-600 hover:text-white transition-all"
          >
            <Eye size={14} />
            View
          </button>
        )}
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, tooltip, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`p-1.5 rounded-lg bg-white/80 text-gray-600
        hover:bg-white hover:text-[#05015A] hover:shadow-md
        transition-all duration-200 ${className}`}
    >
      <Icon size={14} />
    </button>
  );
}