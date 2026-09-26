// cadmin-web/src/pages/Subscription-management/comps/risk/modals/ReactivateConfirmModal.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/modals/ReactivateConfirmModal.jsx

import { useState } from "react";
import { X, CheckCircle, Loader2, AlertCircle } from "lucide-react";

const EXTEND_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
];

export default function ReactivateConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  subscription,
  loading = false,
}) {
  const [extendDays, setExtendDays] = useState(30);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !subscription) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!reason.trim()) {
      setError("Please provide a reason for reactivation");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }

    onConfirm(reason.trim(), extendDays);
  };

  // Calculate new dates
  const today = new Date();
  const newEndDate = new Date(today);
  newEndDate.setDate(newEndDate.getDate() + extendDays);

  const newGraceEnd = new Date(newEndDate);
  newGraceEnd.setDate(newGraceEnd.getDate() + 7);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-emerald-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">
                Reactivate Subscription
              </h3>
              <p className="text-sm text-emerald-700">{subscription.shop_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Info */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              This will reactivate the subscription and restore access for the shop
              and all its users.
            </div>

            {/* Shop Info */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Owner:</span>
                <span className="font-medium">{subscription.owner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-gray-600">
                  {subscription.owner_email || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan:</span>
                <span className="font-medium">{subscription.plan_name}</span>
              </div>
            </div>

            {/* Extension Period */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Subscription Period
              </label>
              <div className="grid grid-cols-5 gap-2">
                {EXTEND_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExtendDays(option.value)}
                    className={`
                      px-2 py-2 rounded-lg text-xs font-medium border transition-all
                      ${
                        extendDays === option.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* New Dates Preview */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">New End Date:</span>
                <span className="font-bold text-emerald-800">
                  {newEndDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Grace Period Until:</span>
                <span className="font-medium text-emerald-700">
                  {newGraceEnd.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Reason for Reactivation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="e.g., Payment received, customer issue resolved..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Reactivate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}