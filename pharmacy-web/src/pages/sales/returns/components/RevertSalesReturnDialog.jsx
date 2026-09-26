// pharmacy-web/src/pages/sales/returns/components/RevertSalesReturnDialog.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/returns/components/RevertSalesReturnDialog.jsx

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle, RotateCcw, Info } from "lucide-react";

const MIN_REASON_LENGTH = 10; //  Match backend schema requirement

const RevertSalesReturnDialog = ({ open, onClose, returnData, onConfirm }) => {
  const [revertReason, setRevertReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open || !returnData) return null;

  const handleSubmit = async () => {
    //  Validate minimum length
    if (revertReason.trim().length < MIN_REASON_LENGTH) {
      setError(`Reason must be at least ${MIN_REASON_LENGTH} characters`);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm(revertReason.trim());
      setRevertReason("");
    } catch (error) {
      console.error("Revert failed:", error);
      setError(error.message || "Failed to revert return");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRevertReason("");
    setError("");
    onClose();
  };

  const isReasonValid = revertReason.trim().length >= MIN_REASON_LENGTH;
  const charactersRemaining = MIN_REASON_LENGTH - revertReason.trim().length;

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
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-amber-500 text-white rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Revert to Pending</h3>
                  <p className="text-sm text-white/80">
                    Send return back for re-approval
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
            <div className="px-6 py-4 space-y-4">
              {/* Info */}
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-2">
                      Revert Effects:
                    </h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Stock changes will be reversed</li>
                      <li>• Customer credits will be cancelled</li>
                      <li>• Return will require re-approval</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Return Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Return Number:</span>
                  <span className="font-mono font-semibold">
                    {returnData.invoice_number || returnData.return_number}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-[#000060]">
                    ₹
                    {Math.abs(parseFloat(returnData.net_amount)).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Reverting <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (minimum {MIN_REASON_LENGTH} characters)
                  </span>
                </label>
                <textarea
                  value={revertReason}
                  onChange={(e) => {
                    setRevertReason(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Explain why this approved return needs to be reverted..."
                  rows={3}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 resize-none disabled:bg-gray-50 transition-colors ${
                    error
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : isReasonValid
                        ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                        : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"
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
                    {revertReason.length} / {MIN_REASON_LENGTH}+ characters
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isReasonValid}
                className="px-6 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Reverting...
                  </>
                ) : (
                  <>
                    <RotateCcw size={18} />
                    Revert to Pending
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

export default RevertSalesReturnDialog;
