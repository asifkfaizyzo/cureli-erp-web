// pharmacy-web/src/pages/plan-selection/comps/PlanConfirmModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/plan-selection/comps/PlanConfirmModal.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Check,
  Users,
  Building2,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  Shield,
  Sparkles,
  ArrowRight,
  Gift,
  Clock,
  Tag,
  TrendingDown,
} from "lucide-react";
import {
  BILLING,
  formatPrice,
  generateFeatures,
  getCardTheme,
  calculateDisplayDates,
  formatDate,
  calculateDiscountPercent,
  isIntroPriceActive,
  getChargeablePrice,
  getIntroPhaseDescription,
  INTRO_TRIGGER_TYPE,
} from "../../../config/planConfig";

export default function PlanConfirmModal({
  isOpen,
  onClose,
  plan,
  onConfirm,
  loading = false,
  error = null,
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isOpen || !plan) return null;

  // ── Pricing state ───────────────────────────────────────────────────────
  const introActive = isIntroPriceActive(plan);
  const chargeablePrice = getChargeablePrice(plan);
  const isEffectivelyFree = chargeablePrice === 0;
  const hasPromoWithPrice = plan.is_promo_active && plan.price > 0;
  const introPhaseDescription = getIntroPhaseDescription(plan);

  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const dates = calculateDisplayDates(plan);
  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price,
  );

  const handleConfirm = () => {
    if (!termsAccepted || loading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    setTermsAccepted(false);
    onClose();
  };

  const getHeaderAccent = () => {
    if (introActive) return "bg-sky-500";
    if (plan.is_featured) return "bg-violet-500";
    if (plan.price === 0) return "bg-emerald-500";
    return "bg-[#000060]";
  };

  const getCardBg = () => {
    if (introActive) return "bg-sky-50 border-sky-200";
    if (plan.is_featured) return "bg-violet-50 border-violet-200";
    if (plan.price === 0 && !plan.is_promo_active)
      return "bg-emerald-50 border-emerald-200";
    return "bg-blue-50 border-blue-200";
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                 justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative
                   overflow-hidden animate-[fadeIn_0.2s_ease-out]
                   max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent */}
        <div className={`h-1.5 ${getHeaderAccent()}`} />

        {/* Close */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100
                     hover:bg-gray-200 transition-all duration-300 z-10
                     disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleClose}
          disabled={loading}
        >
          <X size={16} />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-[#000060]">
              Confirm Your Plan
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Review the details before{" "}
              {isEffectivelyFree ? "activating" : "purchasing"}
            </p>
          </div>

          {/* ── Two columns ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT: Plan details */}
            <div className="space-y-3">
              {/* Plan name + price card */}
              <div className={`rounded-xl p-4 border-2 ${getCardBg()}`}>
                {/* Title + badges */}
                <div className="flex items-center flex-wrap gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-gray-800">
                    {plan.name}
                  </h3>

                  {introActive && (
                    <span
                      className="px-2 py-0.5 bg-sky-100 text-sky-700
                                     text-[10px] font-semibold rounded-full
                                     flex items-center gap-1"
                    >
                      <TrendingDown size={10} />
                      INTRO OFFER
                    </span>
                  )}
                  {plan.is_featured && (
                    <span
                      className="px-2 py-0.5 bg-violet-100 text-violet-700
                                     text-[10px] font-semibold rounded-full
                                     flex items-center gap-1"
                    >
                      <Sparkles size={10} />
                      POPULAR
                    </span>
                  )}
                  {plan.is_promo_active && (
                    <span
                      className="px-2 py-0.5 bg-blue-100 text-blue-700
                                     text-[10px] font-semibold rounded-full
                                     flex items-center gap-1"
                    >
                      <Clock size={10} />
                      PROMO ACTIVE
                    </span>
                  )}
                  {plan.price === 0 && !plan.is_promo_active && (
                    <span
                      className="px-2 py-0.5 bg-emerald-100 text-emerald-700
                                     text-[10px] font-semibold rounded-full"
                    >
                      FREE
                    </span>
                  )}
                  {discountPercent && !plan.is_promo_active && !introActive && (
                    <span
                      className="px-2 py-0.5 bg-green-100 text-green-700
                                     text-[10px] font-semibold rounded-full
                                     flex items-center gap-1"
                    >
                      <Tag size={10} />
                      {discountPercent}% OFF
                    </span>
                  )}
                  {plan.bonus_months > 0 && (
                    <span
                      className="px-2 py-0.5 bg-amber-100 text-amber-700
                                     text-[10px] font-semibold rounded-full
                                     flex items-center gap-1"
                    >
                      <Gift size={10} />+{plan.bonus_months} MONTHS
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-xs mb-2">
                  {plan.description || "Perfect for your business needs"}
                </p>

                {/* Price display */}
                <div className="flex flex-col">
                  {/* Strike-through (non-promo, non-intro discount) */}
                  {plan.compare_at_price &&
                    plan.compare_at_price > plan.price &&
                    !isEffectivelyFree &&
                    !introActive && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(plan.compare_at_price)}
                        </span>
                        <span className="text-xs font-medium text-green-600">
                          Save {formatPrice(plan.compare_at_price - plan.price)}
                        </span>
                      </div>
                    )}

                  {/* Main price */}
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-bold ${
                        isEffectivelyFree
                          ? "text-emerald-600"
                          : introActive
                            ? "text-sky-600"
                            : "text-[#000060]"
                      }`}
                    >
                      {isEffectivelyFree
                        ? "FREE"
                        : introActive
                          ? formatPrice(plan.intro_price)
                          : formatPrice(plan.price)}
                    </span>
                    {!isEffectivelyFree && (
                      <span className="text-gray-500 text-sm">
                        {BILLING.displayText}
                      </span>
                    )}
                  </div>

                  {/* Intro: "then ₹X/year" */}
                  {introActive && (
                    <p className="text-xs text-gray-500 mt-1">
                      then{" "}
                      <span className="font-bold text-gray-700">
                        {formatPrice(plan.price)}
                      </span>
                      {BILLING.displayText} after intro period
                    </p>
                  )}

                  {/* Promo: "then ₹X/year after date" */}
                  {hasPromoWithPrice && !introActive && (
                    <p className="text-xs text-gray-500 mt-1">
                      Then{" "}
                      <span className="font-bold text-gray-700">
                        {formatPrice(plan.price)}
                      </span>
                      /year after {formatDate(new Date(plan.promo_free_until))}
                    </p>
                  )}
                </div>

                {/* Intro phase full description */}
                {introPhaseDescription && (
                  <div
                    className="mt-3 p-2.5 bg-sky-100 rounded-lg
                                  border border-sky-200"
                  >
                    <div className="flex items-start gap-1.5">
                      <TrendingDown
                        size={14}
                        className="text-sky-600 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-sky-800 mb-0.5">
                          Two-Phase Pricing
                        </p>
                        <p className="text-xs text-sky-700">
                          {introPhaseDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subscription period */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar size={12} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    Subscription Period
                  </span>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Start</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(dates.startDate)}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300" />
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Valid Until</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(dates.endDate)}
                    </p>
                  </div>
                </div>

                {/* Duration breakdown */}
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  {/* Intro phase */}
                  {introActive && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-sky-600 font-medium flex items-center gap-1">
                        <TrendingDown size={10} />
                        Intro Period
                      </span>
                      <span className="text-sky-600 font-medium">
                        {plan.intro_trigger_type ===
                          INTRO_TRIGGER_TYPE.DURATION &&
                        plan.intro_duration_years
                          ? `${plan.intro_duration_years} Month${
                              plan.intro_duration_years !== 1 ? "s" : ""
                            }`
                          : plan.intro_trigger_type ===
                                INTRO_TRIGGER_TYPE.DATE && plan.intro_end_date
                            ? `Until ${formatDate(new Date(plan.intro_end_date))}`
                            : ""}
                      </span>
                    </div>
                  )}

                  {/* Promo period */}
                  {dates.isPromoActive && dates.promoEndDate && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <Clock size={10} />
                        Free Promo Access
                      </span>
                      <span className="text-blue-600 font-medium">
                        Until {formatDate(dates.promoEndDate)}
                      </span>
                    </div>
                  )}

                  {/* Base plan */}
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Base Plan Duration</span>
                    <span>{dates.billingCycleMonths} Months</span>
                  </div>

                  {/* Bonus months */}
                  {dates.bonusMonths > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <Gift size={10} />
                        Bonus Months
                      </span>
                      <span className="text-amber-600 font-medium">
                        +{dates.bonusMonths} Months Free
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div
                    className="flex justify-between text-xs font-semibold
                                  text-gray-800 pt-1 border-t border-dashed
                                  border-gray-200"
                  >
                    <span>Total Access</span>
                    <span>{dates.totalMonths} Months</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Features + payment */}
            <div className="space-y-3">
              {/* Features */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  What's included:
                </p>
                <ul className="space-y-1.5">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span
                        className={`flex-shrink-0 ${
                          feature.type === "intro"
                            ? "text-sky-500"
                            : feature.highlight
                              ? "text-amber-500"
                              : "text-emerald-500"
                        }`}
                      >
                        {feature.type === "intro" ? (
                          <TrendingDown size={12} />
                        ) : feature.highlight ? (
                          <Gift size={12} />
                        ) : (
                          <Check size={12} />
                        )}
                      </span>
                      <span
                        className={`text-xs ${
                          feature.highlight || feature.type === "intro"
                            ? "text-gray-800 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Billing summary (paid plans) */}
              {!isEffectivelyFree && (
                <div
                  className={`rounded-lg p-3 border ${
                    introActive
                      ? "bg-sky-50 border-sky-100"
                      : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard
                      size={12}
                      className={introActive ? "text-sky-600" : "text-blue-600"}
                    />
                    <span
                      className={`text-xs font-medium ${
                        introActive ? "text-sky-800" : "text-blue-800"
                      }`}
                    >
                      Billing Summary
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {/* Intro charge line */}
                    {introActive ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {plan.name} (Intro Period)
                          </span>
                          <span className="text-gray-800">
                            {formatPrice(plan.intro_price)}
                          </span>
                        </div>

                        {/* Intro period detail */}
                        <div
                          className="flex justify-between items-center
                                        text-sky-600 text-[10px]"
                        >
                          <span className="flex items-center gap-1">
                            <TrendingDown size={10} />
                            {plan.intro_trigger_type ===
                              INTRO_TRIGGER_TYPE.DURATION &&
                            plan.intro_duration_years
                              ? `First ${plan.intro_duration_years} month${
                                  plan.intro_duration_years !== 1 ? "s" : ""
                                }`
                              : plan.intro_trigger_type ===
                                    INTRO_TRIGGER_TYPE.DATE &&
                                  plan.intro_end_date
                                ? `Until ${formatDate(
                                    new Date(plan.intro_end_date),
                                  )}`
                                : "Intro period"}
                          </span>
                          <span>Special rate</span>
                        </div>

                        {/* Then regular price */}
                        <div
                          className="flex justify-between items-center
                                        text-gray-500 text-[10px]"
                        >
                          <span>Then (regular price)</span>
                          <span>
                            {formatPrice(plan.price)}
                            {BILLING.displayText}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {plan.name} Plan
                          </span>
                          <span className="text-gray-800">
                            {formatPrice(plan.price)}
                          </span>
                        </div>

                        {/* Discount */}
                        {plan.compare_at_price &&
                          plan.compare_at_price > plan.price && (
                            <div
                              className="flex justify-between items-center
                                            text-green-600"
                            >
                              <span>Discount ({discountPercent}%)</span>
                              <span>
                                -
                                {formatPrice(
                                  plan.compare_at_price - plan.price,
                                )}
                              </span>
                            </div>
                          )}

                        {/* Bonus months */}
                        {plan.bonus_months > 0 && (
                          <div
                            className="flex justify-between items-center
                                          text-amber-600"
                          >
                            <span>Bonus: +{plan.bonus_months} months</span>
                            <span>FREE</span>
                          </div>
                        )}
                      </>
                    )}

                    <div
                      className={`border-t my-1.5 ${
                        introActive ? "border-sky-200" : "border-blue-200"
                      }`}
                    />

                    {/* Total due today */}
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 text-sm">
                        Total Due Today
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          introActive ? "text-sky-700" : "text-[#000060]"
                        }`}
                      >
                        {formatPrice(chargeablePrice)}
                      </span>
                    </div>

                    {/* Intro: clarification note */}
                    {introActive && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        You will be charged{" "}
                        <span className="font-semibold text-gray-700">
                          {formatPrice(plan.price)}
                          {BILLING.displayText}
                        </span>{" "}
                        when you renew after the intro period.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Free / promo info */}
              {isEffectivelyFree && (
                <div
                  className="bg-emerald-50 rounded-lg p-3 border
                                border-emerald-100"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">
                      No Payment Required
                    </span>
                  </div>
                  <p className="text-emerald-700 text-xs">
                    {hasPromoWithPrice
                      ? `This plan is free during the promo period. You'll be reminded before ${formatDate(
                          new Date(plan.promo_free_until),
                        )} to renew.`
                      : "This plan is completely free. You can upgrade anytime."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-3 p-2.5 bg-red-50 border border-red-200
                            rounded-lg flex items-start gap-2"
            >
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Terms + actions */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="mb-3">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 w-3.5 h-3.5 text-[#000060] border-gray-300
                             rounded focus:ring-[#000060] disabled:opacity-50"
                />
                <span className="text-xs text-gray-600 group-hover:text-gray-800">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-[#000060] font-medium hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-[#000060] font-medium hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold
                           border-2 border-gray-200 text-gray-600
                           hover:border-gray-300 hover:bg-gray-50 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!termsAccepted || loading}
                className={`flex-[2] py-2.5 rounded-lg text-xs font-semibold
                  text-white transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-1.5
                  ${
                    isEffectivelyFree
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : introActive
                        ? "bg-sky-600 hover:bg-sky-700"
                        : "bg-[#000060] hover:bg-[#000080]"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : isEffectivelyFree ? (
                  <>
                    <Check size={14} />
                    Activate {hasPromoWithPrice ? "Promo" : "Free"} Plan
                  </>
                ) : introActive ? (
                  <>
                    <Shield size={14} />
                    Pay {formatPrice(chargeablePrice)} (Intro Rate)
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    Pay {formatPrice(plan.price)} Securely
                  </>
                )}
              </button>
            </div>

            {/* Security note */}
            {!isEffectivelyFree && (
              <div
                className="mt-3 flex items-center justify-center gap-1.5
                              text-gray-400 text-[10px]"
              >
                <Shield size={12} />
                <span>Secured by Razorpay • 256-bit SSL encryption</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
