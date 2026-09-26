// cadmin-web/src/pages/Subscription-management/comps/risk/modals/ExtendGraceModal.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/modals/ExtendGraceModal.jsx

import { useState } from "react";
import { X, Clock, Loader2, AlertCircle } from "lucide-react";

const EXTENSION_OPTIONS = [
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

export default function ExtendGraceModal({
  isOpen,
  onClose,
  onConfirm,
  subscription,
  loading = false,
}) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !subscription) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!reason.trim()) {
      setError("Please provide a reason for the extension");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }

    onConfirm(days, reason.trim());
  };

  // Calculate new grace end date
  const currentGraceEnd = new Date(
    subscription.grace_period_until || subscription.end_date
  );
  const newGraceEnd = new Date(currentGraceEnd);
  newGraceEnd.setDate(newGraceEnd.getDate() + days);

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Extend Grace Period
              </h3>
              <p className="text-sm text-gray-500">{subscription.shop_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Current Status */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Current Grace End:</span>
                <span className="font-medium">
                  {currentGraceEnd.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Days Remaining:</span>
                <span className="font-medium text-amber-600">
                  {subscription.days_left} days
                </span>
              </div>
            </div>

            {/* Extension Days */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Extend By
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EXTENSION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDays(option.value)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium border transition-all
                      ${
                        days === option.value
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* New Grace End */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">New Grace End:</span>
                <span className="font-bold text-amber-800">
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
                Reason for Extension <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="e.g., Customer requested extension due to payment processing delay..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              />
              <p className="text-xs text-gray-400">
                {reason.length}/10 characters minimum
              </p>
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <Clock size={16} />
                  Extend Grace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}