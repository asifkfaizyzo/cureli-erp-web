// pharmacy-web/src/pages/settings/plans/comps/RenewalConfirmModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/comps/RenewalConfirmModal.jsx

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RefreshCw,
  Calendar,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import {
  formatPrice,
  BILLING,
  isIntroPriceActive,
} from "../../../../config/planConfig";

const RenewalConfirmModal = ({
  plan,
  currentSubscription,
  onConfirm,
  onClose,
  loading = false,
  error = "",
}) => {
  if (!plan || !currentSubscription) return null;

  // Intro note: if the plan has intro active, inform user renewal
  // charges regular price (intro is first-time only)
  const introActive = isIntroPriceActive(plan);

  const endDate = new Date(currentSubscription.end_date);
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)),
  );

  const isExpired = daysRemaining === 0;
  const isInGrace =
    currentSubscription.is_in_grace_period ||
    (isExpired && currentSubscription.status === "active");

  const billingMonths = plan.billing_cycle_months || 12;
  const bonusMonths = plan.bonus_months || 0;
  const totalMonths = billingMonths + bonusMonths;

  const renewalStartDate = isExpired ? today : endDate;
  const newEndDate = new Date(renewalStartDate);
  newEndDate.setMonth(newEndDate.getMonth() + totalMonths);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center
                      p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div
            className="px-6 py-5 border-b border-gray-100 flex items-center
                          justify-between bg-gradient-to-r from-emerald-50 to-green-50"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center
                              justify-center"
              >
                <RefreshCw size={24} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Renew Plan</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Extend your subscription for another year
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors
                         disabled:opacity-50"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Grace period warning */}
            {isInGrace && (
              <div
                className="p-4 bg-red-50 border border-red-200 rounded-xl
                              flex items-start gap-3"
              >
                <AlertCircle
                  size={20}
                  className="text-red-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Grace Period Active
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Your subscription has expired. Renewing now will clear the
                    grace period and extend your plan for another full term.
                  </p>
                </div>
              </div>
            )}

            {/* Expiry warning */}
            {!isInGrace && daysRemaining > 0 && daysRemaining <= 30 && (
              <div
                className={`p-4 border rounded-xl flex items-start gap-3
                ${
                  daysRemaining <= 7
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <AlertCircle
                  size={20}
                  className={`flex-shrink-0 mt-0.5 ${
                    daysRemaining <= 7 ? "text-red-600" : "text-amber-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      daysRemaining <= 7 ? "text-red-900" : "text-amber-900"
                    }`}
                  >
                    Plan Expiring in {daysRemaining} Day
                    {daysRemaining !== 1 ? "s" : ""}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      daysRemaining <= 7 ? "text-red-700" : "text-amber-700"
                    }`}
                  >
                    Renew now to avoid service interruption.
                  </p>
                </div>
              </div>
            )}

            {/* Plenty of time */}
            {!isInGrace && daysRemaining > 30 && (
              <div
                className="p-4 bg-blue-50 border border-blue-200 rounded-xl
                              flex items-start gap-3"
              >
                <Calendar
                  size={20}
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {daysRemaining} Days Remaining
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your current plan is still active. Renewing now will extend
                    your subscription from the current expiry date.
                  </p>
                </div>
              </div>
            )}

            {/* Intro pricing note (renewal always charges regular price) */}
            {introActive && (
              <div
                className="p-3 bg-sky-50 border border-sky-200 rounded-xl
                              flex items-start gap-2"
              >
                <Info size={16} className="text-sky-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-sky-800">
                  <strong>Note:</strong> This plan has intro pricing (
                  {formatPrice(plan.intro_price)}) for new subscribers. Renewal
                  is charged at the regular rate of{" "}
                  <strong>
                    {formatPrice(plan.price)}
                    {BILLING.displayText}
                  </strong>
                  .
                </p>
              </div>
            )}

            {/* Plan details */}
            <div className="space-y-4">
              <div
                className="flex items-center justify-between p-4 bg-gray-50
                              rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 bg-[#000060]/10 rounded-lg flex
                                  items-center justify-center"
                  >
                    <CreditCard size={18} className="text-[#000060]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {plan.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {plan.max_users === -1 ? "Unlimited" : plan.max_users}{" "}
                      users •{" "}
                      {plan.max_branches === -1
                        ? "Unlimited"
                        : plan.max_branches}{" "}
                      branches
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {/* Always show regular price for renewal */}
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </p>
                  <p className="text-xs text-gray-500">{BILLING.displayText}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 bg-gray-200 rounded-full flex items-center
                                  justify-center flex-shrink-0 mt-0.5"
                  >
                    <Check size={14} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {isExpired ? "Expired On" : "Current Period Ends"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {endDate.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      {!isExpired && daysRemaining > 0 && (
                        <span className="ml-1 text-gray-400">
                          ({daysRemaining} day
                          {daysRemaining !== 1 ? "s" : ""} left)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 bg-emerald-100 rounded-full flex items-center
                                  justify-center flex-shrink-0 mt-0.5"
                  >
                    <Calendar size={14} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-700">
                      New Period Extends Until
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {newEndDate.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      {bonusMonths > 0 && (
                        <span className="ml-1 text-amber-600 font-medium">
                          (+{bonusMonths} bonus month
                          {bonusMonths > 1 ? "s" : ""})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex
                          items-center justify-between"
          >
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium
                         disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600
                         text-white rounded-lg font-semibold hover:bg-emerald-700
                         transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Pay {formatPrice(plan.price)} & Renew
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RenewalConfirmModal;
