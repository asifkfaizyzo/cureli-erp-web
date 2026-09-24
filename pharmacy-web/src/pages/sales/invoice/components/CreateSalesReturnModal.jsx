// pharmacy-web/src/pages/sales/invoice/components/CreateSalesReturnModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/CreateSalesReturnModal.jsx
// Modal for creating sales returns

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  User,
  FileText,
  IndianRupee,
  Minus,
  Plus,
  Info,
} from "lucide-react";

import { useToast } from "../../../../components/common/Toast";
import salesAPI from "../../../../api/sales";
import {
  formatCurrency,
  formatDate,
  ANIMATION_VARIANTS,
} from "./salesInvoiceModalHelpers";

// Return reason options
// Return reason options -  Match backend schema exactly
const RETURN_REASONS = [
  {
    value: "EXPIRED_PRODUCT",
    label: "Expired Product",
    description: "Product has expired or near expiry",
  },
  {
    value: "DAMAGED_PRODUCT",
    label: "Damaged Product",
    description: "Product was damaged or defective",
  },
  {
    value: "WRONG_PRODUCT",
    label: "Wrong Product",
    description: "Wrong item was dispensed",
  },
  {
    value: "CUSTOMER_REQUEST",
    label: "Customer Request",
    description: "Customer requested return",
  },
  {
    value: "QUALITY_ISSUE",
    label: "Quality Issue",
    description: "Product quality not acceptable",
  },
  {
    value: "PRICE_DISPUTE",
    label: "Price Dispute",
    description: "Customer disputes the price",
  },
  { value: "OTHER", label: "Other", description: "Other reasons" },
];

const CreateSalesReturnModal = ({
  open,
  onClose,
  invoice,
  onSuccess,
  isSuperAdmin = false,
}) => {
  const toast = useToast();

  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState("");
  const [refundMode, setRefundMode] = useState("CREDIT"); //  ADD THIS
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [returnableItems, setReturnableItems] = useState([]);

  // Fetch returnable items when modal opens
  useEffect(() => {
    const fetchReturnableItems = async () => {
      if (!open || !invoice?.invoice_id) return;

      setIsLoadingItems(true);
      try {
        const response = await salesAPI.getReturnableItems(invoice.invoice_id);
        if (response.success && response.data) {
          setReturnableItems(response.data.items || []);
          // Initialize return items with 0 quantities
          setReturnItems(
            (response.data.items || []).map((item) => ({
              item_id: item.item_id,
              medicine_id: item.medicine_id,
              batch_id: item.batch_id,
              batch_number: item.batch_number,
              product_name: item.medicine?.name || item.product_name,
              max_qty: item.returnable_quantity || item.quantity,
              return_qty: 0,

              //  Use selling_rate from backend
              unit_price: item.selling_rate || item.unit_price || 0,
              mrp: item.mrp,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch returnable items:", error);
        toast.error("Failed to load returnable items");
        // Fallback to invoice line items
        setReturnableItems(invoice.lineItems || []);
        setReturnItems(
          (invoice.lineItems || []).map((item) => ({
            item_id: item.item_id,
            medicine_id: item.medicine_id,
            batch_id: item.batch_id,
            batch_number: item.batch_number,
            product_name: item.medicine?.name || item.product_name,
            max_qty: item.quantity,
            return_qty: 0,
            unit_price: item.selling_rate || item.unit_price,
            mrp: item.mrp,
          })),
        );
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchReturnableItems();
  }, [open, invoice?.invoice_id]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setReturnItems([]);
      setReturnReason("");
      setRemarks("");
      setReturnableItems([]);
    }
  }, [open]);

  const handleQuantityChange = useCallback((index, delta) => {
    setReturnItems((prev) => {
      const newItems = [...prev];
      const item = newItems[index];
      const newQty = Math.max(
        0,
        Math.min(item.max_qty, item.return_qty + delta),
      );
      newItems[index] = { ...item, return_qty: newQty };
      return newItems;
    });
  }, []);

  const handleQuantityInput = useCallback((index, value) => {
    const qty = parseInt(value) || 0;
    setReturnItems((prev) => {
      const newItems = [...prev];
      const item = newItems[index];
      const newQty = Math.max(0, Math.min(item.max_qty, qty));
      newItems[index] = { ...item, return_qty: newQty };
      return newItems;
    });
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    const selectedItems = returnItems.filter((item) => item.return_qty > 0);
    const totalQty = selectedItems.reduce(
      (sum, item) => sum + item.return_qty,
      0,
    );
    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + item.return_qty * item.unit_price,
      0,
    );

    return {
      itemCount: selectedItems.length,
      totalQty,
      totalAmount,
    };
  }, [returnItems]);

  const handleSubmit = async () => {
    if (!returnReason) {
      toast.warning("Missing Information", "Please select a return reason");
      return;
    }

    const itemsToReturn = returnItems.filter((item) => item.return_qty > 0);
    if (itemsToReturn.length === 0) {
      toast.warning(
        "No Items Selected",
        "Please select at least one item to return",
      );
      return;
    }

    //  Validate refund mode for walk-in customers
    if (
      !invoice.customer_id &&
      (refundMode === "CREDIT" || refundMode === "ADJUST_NEXT")
    ) {
      toast.warning(
        "Invalid Refund Mode",
        "Walk-in customers can only receive CASH refunds. Please select Cash Refund.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        parent_invoice_id: invoice.invoice_id,
        return_reason: returnReason,
        refund_mode: refundMode, //  Use state variable
        remarks: remarks || null,
        return_notes: null,
        refund_notes: null,
        lineItems: itemsToReturn.map((item) => ({
          item_id: item.item_id,
          quantity: item.return_qty,
        })),
      };

      const response = await salesAPI.createReturn(payload);

      if (response.success) {
        toast.success(
          "Return Created",
          `Return ${response.data?.invoice_number || ""} created successfully`,
        );
        onSuccess?.();
      }
    } catch (error) {
      console.error("Create return error:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        "Failed to Create Return",
        error.response?.data?.message || error.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

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
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Create Sales Return
                    </h2>
                    <p className="text-xs text-white/70">
                      Invoice: {invoice?.invoice_number} • Customer:{" "}
                      {invoice?.customer?.name ||
                        invoice?.customer_name ||
                        "Walk-in"}
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
              {/* Left - Items Selection */}
              <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
                <div className="shrink-0 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Select Items to Return
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click +/- or enter quantity for each item
                  </p>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {isLoadingItems ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2
                          size={32}
                          className="text-red-500 animate-spin"
                        />
                        <p className="text-sm text-gray-600">
                          Loading items...
                        </p>
                      </div>
                    </div>
                  ) : returnItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <Package
                          size={48}
                          className="mx-auto mb-3 opacity-30"
                        />
                        <p>No returnable items found</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {returnItems.map((item, index) => (
                        <div
                          key={item.item_id || index}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            item.return_qty > 0
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {item.product_name}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="font-mono">
                                  Batch: {item.batch_number || "-"}
                                </span>
                                <span>•</span>
                                <span>
                                  Available: <strong>{item.max_qty}</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Rate: {formatCurrency(item.unit_price)}
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(index, -1)}
                                disabled={item.return_qty <= 0}
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                              >
                                <Minus size={16} />
                              </button>

                              <input
                                type="number"
                                value={item.return_qty}
                                onChange={(e) =>
                                  handleQuantityInput(index, e.target.value)
                                }
                                className="w-16 h-8 text-center font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                                min="0"
                                max={item.max_qty}
                              />

                              <button
                                onClick={() => handleQuantityChange(index, 1)}
                                disabled={item.return_qty >= item.max_qty}
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          {item.return_qty > 0 && (
                            <div className="mt-3 pt-3 border-t border-red-200 flex items-center justify-between">
                              <span className="text-xs text-red-600">
                                Return Amount:
                              </span>
                              <span className="font-bold text-red-700">
                                {formatCurrency(
                                  item.return_qty * item.unit_price,
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right - Summary & Reason */}
              <div className="w-80 shrink-0 flex flex-col bg-gray-50">
                {/* Return Reason */}
                <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Return Reason *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="">Select reason...</option>
                    {RETURN_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                  {returnReason && (
                    <p className="mt-1 text-xs text-gray-500">
                      {
                        RETURN_REASONS.find((r) => r.value === returnReason)
                          ?.description
                      }
                    </p>
                  )}
                </div>

                {/*  ADD: Refund Mode Selection */}
                <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Refund Mode *
                  </label>
                  <select
                    value={refundMode}
                    onChange={(e) => setRefundMode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="CASH">Cash Refund</option>
                    <option value="CREDIT">Adjust Outstanding Balance</option>
                    <option value="ADJUST_NEXT">
                      Credit Note (Use in Next Purchase)
                    </option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {refundMode === "CASH" &&
                      "Customer will receive cash refund immediately"}
                    {refundMode === "CREDIT" &&
                      "Amount will be deducted from customer's outstanding balance"}
                    {refundMode === "ADJUST_NEXT" &&
                      "Customer will receive a credit note for future purchases"}
                  </p>
                </div>

                {/* Remarks */}
                <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any additional notes..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <div className="flex-1 p-4 overflow-auto">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Return Summary
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Items Selected</span>
                      <span className="font-bold text-gray-900">
                        {totals.itemCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Quantity</span>
                      <span className="font-bold text-gray-900">
                        {totals.totalQty}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          Credit Amount
                        </span>
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(totals.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info
                        size={14}
                        className="text-blue-600 shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-blue-700">
                        A credit note will be generated for this return. Stock
                        will be restored upon approval.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting || totals.itemCount === 0 || !returnReason
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          Create Return
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default CreateSalesReturnModal;
