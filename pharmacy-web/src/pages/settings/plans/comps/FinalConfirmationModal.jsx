// pharmacy-web/src/pages/settings/plans/comps/FinalConfirmationModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/comps/FinalConfirmationModal.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Users,
  Building2,
  TrendingDown,
  Shield,
  XCircle,
  Lock,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "../../../../config/planConfig";

/**
 * FinalConfirmationModal
 * Step C: Final acknowledgement before executing downgrade
 */
const FinalConfirmationModal = ({
  currentPlan,
  targetPlan,
  complianceData,
  hasImpact,
  onConfirm,
  onBack,
  onClose,
  loading = false,
  error = null,
}) => {
  const [acknowledgements, setAcknowledgements] = useState({
    disabledUsers: false,
    deactivatedBranches: false,
    noAutoRestore: false,
    finalConfirm: false,
  });

  const { usersToDisable = [], branchesToDeactivate = [] } = complianceData;

  // Determine which acknowledgements are required
  const requiredAcks = [];

  if (usersToDisable.length > 0) {
    requiredAcks.push("disabledUsers");
  }
  if (branchesToDeactivate.length > 0) {
    requiredAcks.push("deactivatedBranches");
  }
  if (hasImpact) {
    requiredAcks.push("noAutoRestore");
  }
  requiredAcks.push("finalConfirm");

  const allAcknowledged = requiredAcks.every((key) => acknowledgements[key]);

  const handleAckChange = (key) => {
    setAcknowledgements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    if (!allAcknowledged || loading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Calculate new subscription dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Build acknowledgement items for inline display
  const ackItems = [];
  if (usersToDisable.length > 0) {
    ackItems.push({
      key: "disabledUsers",
      icon: XCircle,
      iconColor: "text-red-500",
      label: `${usersToDisable.length} user${usersToDisable.length > 1 ? "s" : ""} will lose access`,
    });
  }
  if (branchesToDeactivate.length > 0) {
    ackItems.push({
      key: "deactivatedBranches",
      icon: Lock,
      iconColor: "text-orange-500",
      label: `${branchesToDeactivate.length} branch${branchesToDeactivate.length > 1 ? "es" : ""} become read-only`,
    });
  }
  if (hasImpact) {
    ackItems.push({
      key: "noAutoRestore",
      icon: RefreshCw,
      iconColor: "text-blue-500",
      label: "No auto-restore on re-upgrade",
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-10 disabled:opacity-50"
          onClick={handleClose}
          disabled={loading}
        >
          <X size={16} />
        </button>

        <div className="p-5">
          {/* Header - Inline */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Confirm Downgrade
              </h2>
              <p className="text-gray-500 text-sm">
                This action takes effect immediately
              </p>
            </div>
          </div>

          {/* Summary - Full Width, 4 Columns */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-3">
            <div className="grid grid-cols-4 gap-4 text-xs">
              {/* Plan Change */}
              <div>
                <span className="text-gray-500">Plan</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-gray-600">{currentPlan?.name}</span>
                  <TrendingDown size={10} className="text-orange-500" />
                  <span className="font-semibold text-orange-600">
                    {targetPlan.name}
                  </span>
                </div>
              </div>

              {/* Price Change */}
              <div>
                <span className="text-gray-500">Price (next renewal)</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-gray-600">
                    {formatPrice(currentPlan?.price || 0)}
                  </span>
                  <TrendingDown size={10} className="text-emerald-500" />
                  <span className="font-semibold text-emerald-600">
                    {formatPrice(targetPlan.price)}
                  </span>
                </div>
                {/* Note: downgrade is free, applied immediately */}
              </div>

              {/* Start Date */}
              <div>
                <span className="text-gray-500">Start Date</span>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(startDate)}
                </p>
              </div>

              {/* End Date */}
              <div>
                <span className="text-gray-500">Valid Until</span>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(endDate)}
                </p>
              </div>
            </div>

            {/* Impact Stats */}
            {(usersToDisable.length > 0 || branchesToDeactivate.length > 0) && (
              <div className="border-t border-gray-200 mt-3 pt-3 flex gap-3">
                {usersToDisable.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5">
                    <Users size={12} className="text-red-500" />
                    <span className="text-xs text-red-700">
                      <strong>{usersToDisable.length}</strong> user
                      {usersToDisable.length > 1 ? "s" : ""} to disable
                    </span>
                  </div>
                )}
                {branchesToDeactivate.length > 0 && (
                  <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-1.5">
                    <Building2 size={12} className="text-orange-500" />
                    <span className="text-xs text-orange-700">
                      <strong>{branchesToDeactivate.length}</strong> branch
                      {branchesToDeactivate.length > 1 ? "es" : ""} to
                      deactivate
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-3 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <span>
              This action is immediate and cannot be undone. Contact support if
              you need assistance after downgrading.
            </span>
          </div>

          {/* Acknowledgements - Inline Row */}
          {ackItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {ackItems.map((item) => {
                const Icon = item.icon;
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs border ${
                      acknowledgements[item.key]
                        ? "bg-gray-100 border-gray-300"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={acknowledgements[item.key]}
                      onChange={() => handleAckChange(item.key)}
                      disabled={loading}
                      className="w-3.5 h-3.5 text-gray-600 border-gray-300 rounded focus:ring-1 focus:ring-gray-500"
                    />
                    <Icon size={12} className={item.iconColor} />
                    <span className="text-gray-700">{item.label}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Bottom Row - Final Confirm Checkbox + Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
            {/* Final Confirmation Checkbox */}
            <label
              className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                acknowledgements.finalConfirm
                  ? "bg-red-50 border-red-300"
                  : "bg-gray-50 border-gray-200 hover:border-red-300"
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={acknowledgements.finalConfirm}
                onChange={() => handleAckChange("finalConfirm")}
                disabled={loading}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-1 focus:ring-red-500"
              />
              <Shield size={14} className="text-red-500" />
              <span className="text-sm text-red-900 font-medium">
                I confirm this downgrade and understand all implications
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={onBack}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 text-sm"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!allAcknowledged || loading}
                className="px-5 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Confirm Downgrade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FinalConfirmationModal;
