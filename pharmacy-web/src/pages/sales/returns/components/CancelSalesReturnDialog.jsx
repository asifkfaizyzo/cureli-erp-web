// pharmacy-web/src/pages/sales/returns/components/CancelSalesReturnDialog.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/returns/components/CancelSalesReturnDialog.jsx

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle, Ban, DollarSign } from "lucide-react";

const MIN_REASON_LENGTH = 10; //  Match backend schema requirement

const CancelSalesReturnDialog = ({ open, onClose, returnData, onConfirm }) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundAction, setRefundAction] = useState("REVERSE_REFUND");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open || !returnData) return null;

  //  Use normalized field names
  const refundMode = returnData.refund_mode || returnData.adjustment_type;
  const hasCashRefund = refundMode === "CASH" || refundMode === "CASH_REFUND";
  const hasCreditNote = returnData.credit_note_number;
  const refundAmount = returnData.refund_amount || returnData.net_amount;

  const handleSubmit = async () => {
    //  Validate minimum length
    if (cancellationReason.trim().length < MIN_REASON_LENGTH) {
      setError(`Reason must be at least ${MIN_REASON_LENGTH} characters`);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm({
        cancellation_reason: cancellationReason.trim(),
        refund_action: hasCashRefund ? refundAction : null,
      });
      setCancellationReason("");
      setRefundAction("REVERSE_REFUND");
    } catch (error) {
      console.error("Cancel failed:", error);
      setError(error.message || "Failed to cancel return");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCancellationReason("");
    setError("");
    onClose();
  };

  const isReasonValid = cancellationReason.trim().length >= MIN_REASON_LENGTH;
  const charactersRemaining =
    MIN_REASON_LENGTH - cancellationReason.trim().length;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 bg-red-600 text-white rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cancel Approved Return</h3>
                  <p className="text-sm text-white/80">
                    This action will reverse all changes
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Warning */}
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={20}
                    className="text-red-600 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2">
                      Cancellation Effects:
                    </h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>
                        • Stock will be deducted from inventory (reversed)
                      </li>
                      {hasCreditNote && (
                        <li>
                          • Customer credit note will be marked as CANCELLED
                        </li>
                      )}
                      {hasCashRefund && (
                        <li>• Refund amount will need to be handled</li>
                      )}
                      <li>• Return status will change to CANCELLED</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Return Summary */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Return Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return Number:</span>
                    <span className="font-mono font-semibold">
                      {returnData.invoice_number || returnData.return_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return Amount:</span>
                    <span className="font-bold text-red-600">
                      ₹
                      {Math.abs(
                        parseFloat(returnData.net_amount),
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Mode:</span>
                    <span className="font-medium">
                      {refundMode?.replace(/_/g, " ") || "N/A"}
                    </span>
                  </div>
                  {hasCreditNote && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Note:</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        {returnData.credit_note_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Refund Action (only for CASH) */}
              {hasCashRefund && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-amber-600" />
                    <h4 className="text-sm font-semibold text-amber-900">
                      Refund Handling
                    </h4>
                  </div>
                  <p className="text-sm text-amber-800 mb-4">
                    Refund of ₹
                    {parseFloat(refundAmount).toLocaleString("en-IN")} was
                    given. Choose action:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-amber-400 transition-colors">
                      <input
                        type="radio"
                        name="refundAction"
                        value="REVERSE_REFUND"
                        checked={refundAction === "REVERSE_REFUND"}
                        onChange={(e) => setRefundAction(e.target.value)}
                        className="mt-1 accent-amber-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Collect Refund Back
                        </p>
                        <p className="text-xs text-gray-600">
                          Customer returns the refund amount
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-amber-400 transition-colors">
                      <input
                        type="radio"
                        name="refundAction"
                        value="ADJUST_NEXT_BILL"
                        checked={refundAction === "ADJUST_NEXT_BILL"}
                        onChange={(e) => setRefundAction(e.target.value)}
                        className="mt-1 accent-amber-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Adjust in Next Purchase
                        </p>
                        <p className="text-xs text-gray-600">
                          Adjust against customer's next purchase
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Cancellation Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (minimum {MIN_REASON_LENGTH} characters)
                  </span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => {
                    setCancellationReason(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Explain why this return is being cancelled..."
                  rows={3}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 resize-none disabled:bg-gray-50 transition-colors ${
                    error
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : isReasonValid
                        ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                        : "border-gray-300 focus:ring-red-500 focus:border-red-500"
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {error ? (
                    <p className="text-xs text-red-600">{error}</p>
                  ) : charactersRemaining > 0 ? (
                    <p className="text-xs text-amber-600">
                      {charactersRemaining} more character
                      {charactersRemaining !== 1 ? "s" : ""} needed
                    </p>
                  ) : (
                    <p className="text-xs text-green-600">
                      ✓ Minimum length reached
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {cancellationReason.length} / {MIN_REASON_LENGTH}+
                    characters
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Return
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isReasonValid}
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban size={18} />
                    Cancel Return
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default CancelSalesReturnDialog;
