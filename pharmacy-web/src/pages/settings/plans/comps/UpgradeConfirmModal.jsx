// pharmacy-web/src/pages/settings/plans/comps/UpgradeConfirmModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/comps/UpgradeConfirmModal.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Users,
  Building2,
  Loader2,
  AlertCircle,
  Shield,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  formatPrice,
  isIntroPriceActive,
  getChargeablePrice,
  getIntroPhaseDescription,
  BILLING,
  INTRO_TRIGGER_TYPE,
} from "../../../../config/planConfig";

const UpgradeConfirmModal = ({
  plan,
  currentPlan,
  onConfirm,
  onClose,
  loading = false,
  error = null,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!plan) return null;

  // ── Pricing ─────────────────────────────────────────────────────────────
  const introActive = isIntroPriceActive(plan);
  const chargeablePrice = getChargeablePrice(plan);
  const introPhaseDescription = getIntroPhaseDescription(plan);

  // ── Dates ────────────────────────────────────────────────────────────────
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const formatDate = (date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ── What's changing ───────────────────────────────────────────────────────
  const changes = [];
  if (currentPlan) {
    if (plan.max_users !== currentPlan.max_users) {
      changes.push({
        label: "User Limit",
        icon: Users,
        from:
          currentPlan.max_users === -1 ? "Unlimited" : currentPlan.max_users,
        to: plan.max_users === -1 ? "Unlimited" : plan.max_users,
      });
    }
    if (plan.max_branches !== currentPlan.max_branches) {
      changes.push({
        label: "Branch Limit",
        icon: Building2,
        from:
          currentPlan.max_branches === -1
            ? "Unlimited"
            : currentPlan.max_branches,
        to: plan.max_branches === -1 ? "Unlimited" : plan.max_branches,
      });
    }
  }

  const handleConfirm = () => {
    if (!termsAccepted || loading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    setTermsAccepted(false);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                 justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative
                   overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent */}
        <div
          className={`h-1.5 ${
            introActive
              ? "bg-gradient-to-r from-sky-400 to-indigo-500"
              : "bg-gradient-to-r from-emerald-500 to-teal-500"
          }`}
        />

        {/* Close */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100
                     hover:bg-gray-200 transition-all z-10 disabled:opacity-50"
          onClick={handleClose}
          disabled={loading}
        >
          <X size={16} />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-11 h-11 rounded-full flex items-center
                            justify-center flex-shrink-0
                            ${introActive ? "bg-sky-100" : "bg-emerald-100"}`}
            >
              <TrendingUp
                size={22}
                className={introActive ? "text-sky-600" : "text-emerald-600"}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Upgrade to {plan.name}
              </h2>
              <p className="text-gray-500 text-sm">
                {introActive
                  ? "Intro pricing applied for this upgrade"
                  : "Unlock more features and higher limits"}
              </p>
            </div>
          </div>

          {/* What's changing */}
          {changes.length > 0 && (
            <div
              className="bg-emerald-50 rounded-xl p-3 mb-3
                            border border-emerald-100"
            >
              <h3
                className="text-xs font-semibold text-emerald-800 mb-2
                             flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                What's Changing
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {changes.map((change, idx) => {
                  const Icon = change.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm
                                 bg-white rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-emerald-600" />
                        <span className="text-gray-600 text-xs">
                          {change.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">
                          {change.from}
                        </span>
                        <ArrowRight size={10} className="text-emerald-500" />
                        <span className="font-semibold text-emerald-700 text-xs">
                          {change.to}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Intro phase info */}
          {introActive && introPhaseDescription && (
            <div className="bg-sky-50 rounded-xl p-3 mb-3 border border-sky-100">
              <div className="flex items-start gap-2">
                <TrendingDown
                  size={16}
                  className="text-sky-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-sky-800 mb-0.5">
                    Two-Phase Pricing Active
                  </p>
                  <p className="text-xs text-sky-700">
                    {introPhaseDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Plan</span>
                <span className="font-medium text-gray-900 text-xs">
                  {plan.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Billing</span>
                <span className="text-gray-900 text-xs">Annual</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Start Date</span>
                <span className="text-gray-900 text-xs">
                  {formatDate(startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Valid Until</span>
                <span className="text-gray-900 text-xs">
                  {formatDate(endDate)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-2 pt-2 space-y-1.5">
              {/* Intro pricing breakdown */}
              {introActive && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sky-600 flex items-center gap-1">
                      <TrendingDown size={10} />
                      {plan.intro_trigger_type === INTRO_TRIGGER_TYPE.DURATION
                        ? `Intro (first ${plan.intro_duration_years} months)`
                        : "Intro period"}
                    </span>
                    <span className="text-sky-700 font-semibold">
                      {formatPrice(plan.intro_price)}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between text-xs
                                  text-gray-400"
                  >
                    <span>Then (regular)</span>
                    <span>
                      {formatPrice(plan.price)}
                      {BILLING.displayText}
                    </span>
                  </div>
                </>
              )}

              {/* Total due today */}
              <div
                className="flex items-center justify-between pt-1
                              border-t border-gray-200"
              >
                <span className="font-medium text-gray-900 text-sm">
                  {introActive ? "Due Today (Intro Rate)" : "Total"}
                </span>
                <span
                  className={`text-xl font-bold ${
                    introActive ? "text-sky-600" : "text-emerald-600"
                  }`}
                >
                  {formatPrice(chargeablePrice)}
                </span>
              </div>

              {introActive && (
                <p className="text-[10px] text-gray-400 text-right">
                  Renews at {formatPrice(plan.price)}
                  {BILLING.displayText}
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-3 p-2.5 bg-red-50 border border-red-200
                            rounded-lg flex items-start gap-2"
            >
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading}
                className={`w-4 h-4 border-gray-300 rounded flex-shrink-0
                  ${
                    introActive
                      ? "text-sky-600 focus:ring-sky-500"
                      : "text-emerald-600 focus:ring-emerald-500"
                  }`}
              />
              <span className="text-xs text-gray-600 truncate">
                I agree to the{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-[#000060] font-medium hover:underline"
                >
                  Terms
                </Link>{" "}
                & 1-year subscription
              </span>
            </label>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-medium border border-gray-200
                           text-gray-600 hover:bg-gray-50 transition-all
                           disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!termsAccepted || loading}
                className={`px-4 py-2 rounded-lg font-semibold text-white
                  transition-all disabled:opacity-50
                  flex items-center gap-1.5 text-sm
                  ${
                    introActive
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    Pay {formatPrice(chargeablePrice)}
                    {introActive && " (Intro)"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security note */}
          <div
            className="mt-2 flex items-center justify-center gap-1.5
                          text-gray-400 text-xs"
          >
            <Shield size={10} />
            <span>Secured by Razorpay • 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeConfirmModal;
