// pharmacy-web/src/pages/purchase/returns/components/CancelReturnDialog.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/returns/components/CancelReturnDialog.jsx

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle, Ban, DollarSign } from "lucide-react";

const CancelReturnDialog = ({ open, onClose, returnInvoice, onConfirm }) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundAction, setRefundAction] = useState("REVERSE_REFUND");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !returnInvoice) return null;

  const hasCashRefund =
    returnInvoice.adjustment_type === "CASH_REFUND" &&
    returnInvoice.refund_amount > 0;
  const hasCreditNote = returnInvoice.credit_note_number;

  const handleSubmit = async () => {
    if (!cancellationReason.trim()) {
      alert("Please provide a cancellation reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        cancellation_reason: cancellationReason,
        refund_action: hasCashRefund ? refundAction : null,
      });
      setCancellationReason("");
      setRefundAction("REVERSE_REFUND");
    } catch (error) {
      console.error("Cancel failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onClick={onClose}
          />

          {/* Dialog - Fixed height with internal scroll */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header - Fixed */}
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
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content - Scrollable */}
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
                      <li>• Stock will be added back to inventory</li>
                      {hasCreditNote && (
                        <li>• Credit note will be marked as CANCELLED</li>
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
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-mono font-semibold">
                      {returnInvoice.invoice_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return Amount:</span>
                    <span className="font-bold text-red-600">
                      ₹
                      {Math.abs(
                        parseFloat(returnInvoice.net_amount),
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adjustment Type:</span>
                    <span className="font-medium">
                      {returnInvoice.adjustment_type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  {hasCreditNote && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Note:</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        {returnInvoice.credit_note_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Refund Action (only for CASH_REFUND) */}
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
                    {parseFloat(returnInvoice.refund_amount).toLocaleString(
                      "en-IN",
                    )}
                    . Choose action:
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
                          Reverse Refund Payment
                        </p>
                        <p className="text-xs text-gray-600">
                          Record that the refund was reversed/collected back
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
                          Adjust against next purchase from this supplier
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
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Explain why this return is being cancelled..."
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be recorded in the audit log
                </p>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Return
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !cancellationReason.trim()}
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

export default CancelReturnDialog;
