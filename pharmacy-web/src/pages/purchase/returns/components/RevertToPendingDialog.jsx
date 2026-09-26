// pharmacy-web/src/pages/purchase/returns/components/RevertToPendingDialog.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/returns/components/RevertToPendingDialog.jsx

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle, RotateCcw, Info } from "lucide-react";

const RevertToPendingDialog = ({ open, onClose, returnInvoice, onConfirm }) => {
  const [revertReason, setRevertReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !returnInvoice) return null;

  const handleSubmit = async () => {
    if (!revertReason.trim()) {
      alert("Please provide a reason for reverting");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(revertReason);
      setRevertReason("");
    } catch (error) {
      console.error("Revert failed:", error);
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

          {/* Dialog - Fixed height */}
          <motion.div
            className="relative w-full max-w-lg max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header - Fixed */}
            <div className="shrink-0 px-6 py-4 bg-amber-600 text-white rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    Revert to Pending Approval
                  </h3>
                  <p className="text-sm text-white/80">
                    Move return back to pending state
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

            {/* Content - Scrollable if needed */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Warning */}
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-2">
                      What happens when reverting:
                    </h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>
                        • Stock will be added back to inventory temporarily
                      </li>
                      <li>• Credit note will be marked as CANCELLED</li>
                      <li>• Payment adjustments will be reversed</li>
                      <li>• Return will need re-approval to process again</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Return Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Return Information
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
                    <span className="text-gray-600">Current Status:</span>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      APPROVED
                    </span>
                  </div>
                  {returnInvoice.credit_note_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Note:</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        {returnInvoice.credit_note_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Note */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-900">
                    After reverting, you can re-approve or reject this return.
                    Stock will remain until re-approved.
                  </p>
                </div>
              </div>

              {/* Revert Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Reverting <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  placeholder="Explain why this return needs to be reverted..."
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none disabled:bg-gray-50"
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
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !revertReason.trim()}
                className="px-6 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

export default RevertToPendingDialog;
