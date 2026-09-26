// cadmin-web/src/pages/Subscription-management/comps/risk/modals/SuspendConfirmModal.jsx (do not remove this comment)
// src/pages/Subscription-management/comps/risk/modals/SuspendConfirmModal.jsx

import { useState } from "react";
import { X, Ban, Loader2, AlertCircle, AlertTriangle } from "lucide-react";

export default function SuspendConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  subscription,
  loading = false,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !subscription) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!reason.trim()) {
      setError("Please provide a reason for suspension");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }

    if (!confirmed) {
      setError("Please confirm you understand the consequences");
      return;
    }

    onConfirm(reason.trim());
  };

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Ban size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Suspend Subscription
              </h3>
              <p className="text-sm text-red-700">{subscription.shop_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* Warning */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">This action will:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    <li>Immediately suspend the subscription</li>
                    <li>Deactivate the shop and all its users</li>
                    <li>Block access to the system</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Shop Info */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Owner:</span>
                <span className="font-medium">{subscription.owner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan:</span>
                <span className="font-medium">{subscription.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-amber-600">
                  {subscription.days_left} days left in grace
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Reason for Suspension <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="e.g., Failed payment after multiple reminders, requested by customer..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setError("");
                }}
                className="mt-0.5 text-red-600 focus:ring-red-500 rounded"
              />
              <span className="text-sm text-gray-700">
                I understand that this will immediately suspend the shop and block all
                user access. This action can be reversed by reactivating the subscription.
              </span>
            </label>

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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <Ban size={16} />
                  Suspend Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}