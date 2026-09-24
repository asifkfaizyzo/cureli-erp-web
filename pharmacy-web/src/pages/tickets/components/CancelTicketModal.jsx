// pharmacy-web/src/pages/tickets/components/CancelTicketModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/tickets/components/CancelTicketModal.jsx

import { useState, useEffect } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { cancelTicket } from "../../../api/tickets";

const CancelTicketModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reason || reason.trim().length < 10) {
      setError("Please provide a reason (at least 10 characters)");
      //  REMOVED: toast.warning - inline error is enough
      return;
    }

    setLoading(true);
    try {
      await cancelTicket(ticket.ticket_id, reason.trim());
      onSuccess(); //  Parent will show toast
    } catch (err) {
      console.error("Failed to cancel ticket:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to cancel ticket";
      setError(errorMessage);
      //  REMOVED: toast.error - inline error is shown instead
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Cancel Ticket</h2>
            <p className="text-sm text-gray-500">{ticket.ticket_number}</p>
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
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <AlertTriangle
              size={16}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-800">
              This action cannot be undone. The ticket will be marked as
              cancelled.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              rows={3}
              maxLength={500}
              placeholder="Explain why you're cancelling this ticket..."
              disabled={loading}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
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
          </div>

          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 text-sm font-medium"
            >
              Keep Ticket
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 10}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <X size={16} />
                  <span>Cancel Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelTicketModal;
