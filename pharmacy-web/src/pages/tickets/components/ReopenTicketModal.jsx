// pharmacy-web/src/pages/tickets/components/ReopenTicketModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/tickets/components/ReopenTicketModal.jsx

import { useState, useEffect } from "react";
import { X, RotateCcw, AlertTriangle, Loader2, Info } from "lucide-react";
import {
  REOPEN_LIMIT,
  REOPEN_WARNING_THRESHOLD,
  REOPEN_LIMIT_MESSAGE,
  REOPEN_WARNING_MESSAGE,
  canReopenByCount,
  shouldShowReopenWarning,
  getRemainingReopens,
} from "../../../constant/tickets";

const ReopenTicketModal = ({ isOpen, onClose, ticket, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);

  const reopenCount = ticket?.reopen_count || 0;
  const canReopen = canReopenByCount(reopenCount);
  const showWarning = shouldShowReopenWarning(reopenCount);
  const remainingReopens = getRemainingReopens(reopenCount);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setLoading(false);
      setError("");
      setShowWarningConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  // If reopen limit reached, show blocked state
  if (!canReopen) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex items-center gap-3 p-5 border-b border-gray-200">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Cannot Reopen Ticket
              </h3>
              <p className="text-sm text-gray-500">{ticket?.ticket_number}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle
                size={20}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">
                  Reopen Limit Reached
                </p>
                <p className="text-sm text-red-700">{REOPEN_LIMIT_MESSAGE}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Reopen History:</span> This ticket
                has been reopened{" "}
                <span className="font-semibold text-gray-900">
                  {reopenCount}
                </span>{" "}
                time{reopenCount !== 1 ? "s" : ""}. The maximum allowed is{" "}
                <span className="font-semibold text-gray-900">
                  {REOPEN_LIMIT}
                </span>{" "}
                times.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    if (!reason.trim() || reason.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      //  REMOVED: toast.warning - inline error is enough
      return;
    }

    if (showWarning && !showWarningConfirm) {
      setShowWarningConfirm(true);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason.trim());
      //  REMOVED: toast.success - let parent handle it
      // Modal will be closed by parent after success
    } catch (err) {
      console.error("Failed to reopen ticket:", err);
      const errorMessage = err.message || "Failed to reopen ticket";
      setError(errorMessage);
      //  REMOVED: toast.error - let parent handle it OR show inline error only
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowWarningConfirm(false);
  };

  // Warning confirmation view
  if (showWarningConfirm) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex items-center gap-3 p-5 border-b border-gray-200">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Reopen
              </h3>
              <p className="text-sm text-gray-500">{ticket?.ticket_number}</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <AlertTriangle
                size={20}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Frequent Reopening Warning
                </p>
                <p className="text-sm text-amber-700">
                  {REOPEN_WARNING_MESSAGE}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current reopen count:</span>
                <span className="font-semibold text-gray-900">
                  {reopenCount} / {REOPEN_LIMIT}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Remaining reopens:</span>
                <span
                  className={`font-semibold ${remainingReopens <= 2 ? "text-red-600" : "text-gray-900"}`}
                >
                  {remainingReopens}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-1">
                Your reason:
              </p>
              <p className="text-sm text-blue-900">{reason}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 text-sm font-medium"
            >
              Go Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Reopening...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Confirm Reopen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default reopen form view
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 p-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <RotateCcw size={20} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Reopen Ticket
            </h3>
            <p className="text-sm text-gray-500">{ticket?.ticket_number}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {reopenCount > 0 && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${
                showWarning
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <Info
                size={16}
                className={showWarning ? "text-amber-600" : "text-blue-600"}
              />
              <div className="text-xs">
                <p className={showWarning ? "text-amber-800" : "text-blue-800"}>
                  This ticket has been reopened{" "}
                  <span className="font-semibold">{reopenCount}</span> time
                  {reopenCount !== 1 ? "s" : ""} before.
                  {showWarning && (
                    <span className="block mt-1 text-amber-700">
                      Only{" "}
                      <span className="font-semibold">{remainingReopens}</span>{" "}
                      reopen{remainingReopens !== 1 ? "s" : ""} remaining.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-3">
            Please explain why you need to reopen this ticket:
          </p>

          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            placeholder="e.g., Issue not fully resolved, problem persists..."
            maxLength={500}
            rows={3}
            disabled={loading}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />

          <div className="flex items-center justify-between mt-1">
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : (
              <p className="text-xs text-gray-500">Minimum 10 characters</p>
            )}
            <p className="text-xs text-gray-400">{reason.length}/500</p>
          </div>

          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 10}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Reopening...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Reopen Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReopenTicketModal;
