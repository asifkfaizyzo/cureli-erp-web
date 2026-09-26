// pharmacy-web/src/pages/settings/plans/comps/DowngradeWarningModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/comps/DowngradeWarningModal.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  TrendingDown,
  Users,
  Building2,
  ArrowRight,
  ArrowDown,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { formatPrice, formatLimit } from "../../../../config/planConfig";

/**
 * DowngradeWarningModal
 * Step A: Initial warning before downgrade
 * Shows what will change and requires consent
 */
const DowngradeWarningModal = ({
  currentPlan,
  targetPlan,
  analysis,
  onAccept,
  onClose,
}) => {
  const [consents, setConsents] = useState({
    understand: false,
    backup: false,
  });

  const allConsented = consents.understand && consents.backup;

  const handleConsentChange = (key) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccept = () => {
    if (!allConsented) return;
    onAccept();
  };

  // Calculate changes
  const changes = [];

  if (currentPlan.max_users !== targetPlan.max_users) {
    const currentDisplay =
      currentPlan.max_users === -1 ? "Unlimited" : currentPlan.max_users;
    const targetDisplay =
      targetPlan.max_users === -1 ? "Unlimited" : targetPlan.max_users;
    changes.push({
      type: "users",
      label: "User Limit",
      icon: Users,
      from: currentDisplay,
      to: targetDisplay,
      isDecrease:
        targetPlan.max_users !== -1 &&
        (currentPlan.max_users === -1 ||
          targetPlan.max_users < currentPlan.max_users),
    });
  }

  if (currentPlan.max_branches !== targetPlan.max_branches) {
    const currentDisplay =
      currentPlan.max_branches === -1 ? "Unlimited" : currentPlan.max_branches;
    const targetDisplay =
      targetPlan.max_branches === -1 ? "Unlimited" : targetPlan.max_branches;
    changes.push({
      type: "branches",
      label: "Branch Limit",
      icon: Building2,
      from: currentDisplay,
      to: targetDisplay,
      isDecrease:
        targetPlan.max_branches !== -1 &&
        (currentPlan.max_branches === -1 ||
          targetPlan.max_branches < currentPlan.max_branches),
    });
  }

  if (currentPlan.price !== targetPlan.price) {
    changes.push({
      type: "price",
      label: "Annual Price",
      from: formatPrice(currentPlan.price),
      to: formatPrice(targetPlan.price),
      isDecrease: targetPlan.price < currentPlan.price,
    });
  }

  // Split warning points into two columns
  const warningPoints = [
    "The downgrade takes effect <strong>immediately</strong>",
    "A new 1-year subscription starts from today",
    "Disabled users will <strong>not</strong> be able to log in",
    "Deactivated branches become <strong>read-only</strong>",
    "No data will be deleted, but access will be restricted",
    "Re-upgrading later will <strong>not</strong> auto-enable disabled users/branches",
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-10"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Header - Compact */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Downgrade to {targetPlan.name}?
              </h2>
              <p className="text-gray-500 text-sm">
                Please review the following changes carefully before proceeding
              </p>
            </div>
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Plan Comparison - Compact */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500">Current</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {currentPlan.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatPrice(currentPlan.price)}/yr
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={16} className="text-orange-600" />
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-500">New</p>
                    <p className="font-semibold text-orange-600 text-sm">
                      {targetPlan.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatPrice(targetPlan.price)}/yr
                    </p>
                  </div>
                </div>

                {/* Changes List - Inline */}
                {changes.length > 0 && (
                  <div className="border-t border-gray-200 mt-3 pt-3 space-y-2">
                    {changes.map((change, idx) => {
                      const Icon = change.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon size={14} className="text-gray-500" />
                            )}
                            <span className="text-gray-600">
                              {change.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">{change.from}</span>
                            <ArrowRight size={12} className="text-gray-400" />
                            <span
                              className={`font-medium ${change.isDecrease ? "text-orange-600" : "text-emerald-600"}`}
                            >
                              {change.to}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Impact Warning - Compact */}
              {analysis.hasImpact ? (
                <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={18}
                      className="text-red-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm">
                        Action Required
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        Current usage exceeds new limits:
                      </p>
                      <div className="flex gap-3 mt-1">
                        {analysis.excessUsers > 0 && (
                          <span className="text-xs text-red-700">
                            • Disable <strong>{analysis.excessUsers}</strong>{" "}
                            user{analysis.excessUsers > 1 ? "s" : ""}
                          </span>
                        )}
                        {analysis.excessBranches > 0 && (
                          <span className="text-xs text-red-700">
                            • Deactivate{" "}
                            <strong>{analysis.excessBranches}</strong> branch
                            {analysis.excessBranches > 1 ? "es" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info
                      size={18}
                      className="text-blue-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-semibold text-blue-800 text-sm">
                        No Immediate Action Required
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Your current usage fits within new plan limits.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Warning Points */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2 text-sm">
                <AlertTriangle size={14} />
                Important Information
              </h4>
              <div className="grid grid-cols-1 gap-1.5">
                {warningPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-amber-800"
                  >
                    <span className="w-1 h-1 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: point }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section - Consents and Actions in a row */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            {/* Consent Checkboxes - Inline */}
            <div className="flex-1 flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer group px-3 py-2 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all flex-1">
                <input
                  type="checkbox"
                  checked={consents.understand}
                  onChange={() => handleConsentChange("understand")}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-xs text-gray-700">
                  I understand the downgrade implications
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group px-3 py-2 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all flex-1">
                <input
                  type="checkbox"
                  checked={consents.backup}
                  onChange={() => handleConsentChange("backup")}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-xs text-gray-700">
                  I have backed up important data
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg font-medium border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={!allConsented}
                className="px-6 py-2 rounded-lg font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <TrendingDown size={14} />
                {analysis.hasImpact ? "Continue to Selection" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DowngradeWarningModal;
