// pharmacy-web/src/pages/sales/invoice/components/ViewSalesReturnModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/ViewSalesReturnModal.jsx
// Modal for viewing sales return details

import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  User,
  FileText,
  Calendar,
  AlertTriangle,
  Shield,
  RotateCcw,
  Ban,
} from "lucide-react";

import { useToast } from "../../../../components/common/Toast";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import salesAPI from "../../../../api/sales";
import {
  formatCurrency,
  formatDate,
  ANIMATION_VARIANTS,
} from "./salesInvoiceModalHelpers";

// Status configuration
const RETURN_STATUS_CONFIG = {
  PENDING: {
    label: "Pending Approval",
    icon: Clock,
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Ban,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
};

const ViewSalesReturnModal = ({
  open,
  onClose,
  returnInvoice,
  onApprove,
  onReject,
  onCancel,
  onRevert,
  isSuperAdmin = false,
}) => {
  const toast = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  if (!open || !returnInvoice) return null;

  const status =
    returnInvoice.return_approval_status || returnInvoice.status || "PENDING";
  const statusConfig =
    RETURN_STATUS_CONFIG[status] || RETURN_STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const canApprove = isPending && isSuperAdmin;
  const canReject = isPending && isSuperAdmin;
  const canCancel = isApproved && isSuperAdmin;
  const canRevert = isApproved && isSuperAdmin;

  const totalQty =
    returnInvoice.lineItems?.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    ) || 0;

  const handleApprove = useCallback(async () => {
    setConfirmDialog({
      isOpen: true,
      type: "success",
      title: "Approve Return",
      message: (
        <div className="space-y-3">
          <p>
            You are about to <strong>approve</strong> this return.
          </p>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-sm text-green-800 font-medium">This will:</p>
            <ul className="text-xs text-green-700 mt-1 list-disc list-inside">
              <li>Restore stock to inventory</li>
              <li>Generate a customer credit note</li>
              <li>Update invoice return status</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: "Approve Return",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsProcessing(true);
        try {
          await salesAPI.approveReturn(returnInvoice.invoice_id);
          toast.success(
            "Return Approved",
            "Stock has been restored and credit note generated.",
          );
          onApprove?.();
        } catch (error) {
          toast.error(
            "Approval Failed",
            error.response?.data?.message || error.message,
          );
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }, [returnInvoice, toast, onApprove]);

  const handleReject = useCallback(async () => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Reject Return",
      message: (
        <div className="space-y-3">
          <p>
            You are about to <strong>reject</strong> this return.
          </p>
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-sm text-red-800 font-medium">This will:</p>
            <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
              <li>Mark the return as rejected</li>
              <li>No stock changes will be made</li>
              <li>Customer will be notified</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: "Reject Return",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsProcessing(true);
        try {
          await salesAPI.rejectReturn(
            returnInvoice.invoice_id,
            "Rejected by admin",
          );
          toast.success("Return Rejected", "The return has been rejected.");
          onReject?.();
        } catch (error) {
          toast.error(
            "Rejection Failed",
            error.response?.data?.message || error.message,
          );
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }, [returnInvoice, toast, onReject]);

  const handleCancel = useCallback(async () => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Cancel Approved Return",
      message: (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <Shield className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Super Admin Action</p>
              <p className="text-sm text-red-700 mt-1">
                You are cancelling an approved return. This will reverse all
                changes.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded border border-amber-200">
            <p className="text-sm text-amber-800 font-medium">This will:</p>
            <ul className="text-xs text-amber-700 mt-1 list-disc list-inside">
              <li>Deduct restored stock from inventory</li>
              <li>Void the customer credit note</li>
              <li>Mark the return as cancelled</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: "Cancel Return",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsProcessing(true);
        try {
          await salesAPI.cancelApprovedReturn(returnInvoice.invoice_id, {
            cancellation_reason: "Cancelled by Super Admin",
          });
          toast.success(
            "Return Cancelled",
            "The approved return has been cancelled.",
          );
          onCancel?.();
        } catch (error) {
          toast.error(
            "Cancellation Failed",
            error.response?.data?.message || error.message,
          );
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }, [returnInvoice, toast, onCancel]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={ANIMATION_VARIANTS.backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            variants={ANIMATION_VARIANTS.panel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-red-500 animate-spin" />
                  <p className="text-sm text-gray-600">Processing...</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-700 to-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        {returnInvoice.invoice_number}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/70">
                      Return for Invoice:{" "}
                      {returnInvoice.parentInvoice?.invoice_number || "-"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left - Return Info */}
              <div className="w-72 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
                {/* Customer Info */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-3">
                    <User size={12} />
                    Customer
                  </div>
                  <p className="font-semibold text-gray-900">
                    {returnInvoice.customer?.name ||
                      returnInvoice.parentInvoice?.customer?.name ||
                      "Walk-in Customer"}
                  </p>
                </div>

                {/* Return Details */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        Return Date
                      </span>
                      <span className="font-medium">
                        {formatDate(
                          returnInvoice.invoice_date ||
                            returnInvoice.created_at,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <FileText size={12} />
                        Reason
                      </span>
                      <span className="font-medium text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {returnInvoice.return_reason?.replace(/_/g, " ") || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="flex-1 p-4 overflow-auto">
                  <div className="space-y-3">
                    // Continuing ViewSalesReturnModal.jsx
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total Items</span>
                      <span className="font-bold">
                        {returnInvoice.lineItems?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total Quantity</span>
                      <span className="font-bold">{totalQty}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          Credit Amount
                        </span>
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(returnInvoice.net_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  {returnInvoice.remarks && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-100 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Remarks
                      </p>
                      <p className="text-sm text-gray-700">
                        {returnInvoice.remarks}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {status === "REJECTED" && returnInvoice.rejection_reason && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-xs text-red-500 uppercase tracking-wider mb-1">
                        Rejection Reason
                      </p>
                      <p className="text-sm text-red-700">
                        {returnInvoice.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {(canApprove || canReject || canCancel || canRevert) && (
                  <div className="shrink-0 p-4 border-t border-gray-200 bg-white space-y-2">
                    {canApprove && (
                      <button
                        onClick={handleApprove}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                      >
                        <CheckCircle2 size={16} />
                        Approve Return
                      </button>
                    )}
                    {canReject && (
                      <button
                        onClick={handleReject}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                      >
                        <XCircle size={16} />
                        Reject Return
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors"
                      >
                        <Ban size={16} />
                        Cancel Approved Return
                      </button>
                    )}
                    {canRevert && (
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            type: "warning",
                            title: "Revert to Pending",
                            message:
                              "This will revert the return to pending status for re-review.",
                            confirmText: "Revert",
                            onConfirm: async () => {
                              setConfirmDialog((prev) => ({
                                ...prev,
                                isOpen: false,
                              }));
                              setIsProcessing(true);
                              try {
                                await salesAPI.revertReturnToPending(
                                  returnInvoice.invoice_id,
                                  {
                                    revert_reason: "Reverted for re-review",
                                  },
                                );
                                toast.success(
                                  "Return Reverted",
                                  "The return is now pending approval.",
                                );
                                onRevert?.();
                              } catch (error) {
                                toast.error(
                                  "Revert Failed",
                                  error.response?.data?.message ||
                                    error.message,
                                );
                              } finally {
                                setIsProcessing(false);
                              }
                            },
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                      >
                        <RotateCcw size={16} />
                        Revert to Pending
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right - Line Items */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="shrink-0 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Returned Items
                  </h3>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-center">Batch</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {returnInvoice.lineItems &&
                      returnInvoice.lineItems.length > 0 ? (
                        returnInvoice.lineItems.map((item, index) => (
                          <tr
                            key={item.item_id || index}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {String(index + 1).padStart(2, "0")}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 text-sm">
                                {item.medicine?.name ||
                                  item.product_name ||
                                  "Unknown"}
                              </p>
                              {item.medicine?.manufacturer && (
                                <p className="text-xs text-gray-500">
                                  {item.medicine.manufacturer}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {item.batch_number || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                              {formatCurrency(
                                item.return_rate ||
                                  item.selling_rate ||
                                  item.unit_price,
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {formatCurrency(item.line_total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-gray-500"
                          >
                            <Package
                              size={32}
                              className="mx-auto mb-2 opacity-30"
                            />
                            <p>No items found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {returnInvoice.lineItems &&
                      returnInvoice.lineItems.length > 0 && (
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-3 text-right text-sm text-gray-500"
                            >
                              Total
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              {totalQty}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-right text-lg font-bold text-red-600">
                              {formatCurrency(returnInvoice.net_amount)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                  </table>
                </div>
              </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
              isOpen={confirmDialog.isOpen}
              onClose={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
              onConfirm={confirmDialog.onConfirm}
              title={confirmDialog.title}
              message={confirmDialog.message}
              confirmText={confirmDialog.confirmText}
              cancelText="Cancel"
              type={confirmDialog.type}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ViewSalesReturnModal;
