// pharmacy-web/src/pages/inventory/components/StockAdjustmentModal.jsx (do not remove this comment)
// src/pages/inventory/components/StockAdjustmentModal.jsx

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Save,
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Building2,
  AlertCircle,
  RefreshCw,
  Hash,
  Calendar,
  Loader2,
} from "lucide-react";
import StyledSelect from "../../../components/common/StyledSelect";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const INCREASE_REASONS = [
  { value: "PHYSICAL_COUNT_VARIANCE", label: "Physical Count – Found Extra" },
  { value: "PURCHASE_RECEIVED", label: "Purchase / Stock Received" },
  { value: "RETURN_FROM_CUSTOMER", label: "Customer Return" },
  { value: "TRANSFER_IN", label: "Transfer In (from another branch)" },
  { value: "SYSTEM_CORRECTION", label: "System Correction" },
  { value: "OTHER", label: "Other" },
];

const DECREASE_REASONS = [
  { value: "PHYSICAL_COUNT_VARIANCE", label: "Physical Count – Found Short" },
  { value: "DAMAGED_GOODS", label: "Damaged Goods" },
  { value: "EXPIRED_GOODS", label: "Expired – Removed from Shelf" },
  { value: "THEFT_LOSS", label: "Theft / Loss" },
  { value: "TRANSFER_OUT", label: "Transfer Out (to another branch)" },
  { value: "SOLD_OFFLINE", label: "Sold Offline / Manual Sale" },
  { value: "SYSTEM_CORRECTION", label: "System Correction" },
  { value: "OTHER", label: "Other" },
];

const StockAdjustmentModal = ({ open, item, onClose, onSubmit }) => {
  const [newQuantity, setNewQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [reasonNotes, setReasonNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (item) {
      setNewQuantity(Number(item.current_stock || item.qty || 0));
      setReason("");
      setReasonNotes("");
      setErrors({});
      setSubmitError(null);
    }
  }, [item]);

  if (!open || !item) return null;

  const currentStock = Number(item.current_stock || item.qty || 0);
  const variance = Number(newQuantity) - currentStock;

  const str = (v) => {
    if (v == null) return "";
    if (typeof v === "object")
      return v.branch_name || v.name || v.supplier_name || "";
    return String(v);
  };

  const itemName = str(item.name || item.medicine_name);
  const batchNumber = str(item.batch || item.batch_number);
  const branchName = str(item.branch_name || item.branch);
  const expiryDate = str(item.expiry || item.expiry_date);

  const validate = () => {
    const e = {};
    if (newQuantity === "" || Number(newQuantity) < 0)
      e.newQuantity = "Quantity must be 0 or greater";
    if (!reason) e.reason = "Please select a reason";
    if (reason === "OTHER" && !reasonNotes.trim())
      e.reasonNotes = "Please provide details for 'Other' reason";
    if (variance === 0)
      e.newQuantity = "New quantity must differ from current stock";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await onSubmit({
        newQuantity: Number(newQuantity),
        reason,
        reasonNotes: reasonNotes.trim(),
      });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save adjustment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-poppins">
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          <motion.div
            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header — brand gradient */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#05015A] to-[#0a0280]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <RefreshCw size={20} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white">
                      Stock Adjustment
                    </h2>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Modify inventory quantity
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Item info — prominent, inside header */}
              <div className="mt-3 bg-white/10 border border-white/10 rounded-xl p-3">
                <p className="text-sm font-semibold text-white leading-snug">
                  {itemName || "Unknown Item"}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-indigo-200">
                  {batchNumber && (
                    <span className="flex items-center gap-1">
                      <Hash size={10} />
                      {batchNumber}
                    </span>
                  )}
                  {expiryDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {expiryDate}
                    </span>
                  )}
                  {branchName && (
                    <span className="flex items-center gap-1">
                      <Building2 size={10} />
                      {branchName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Error banner */}
            {submitError && (
              <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <span className="text-xs text-red-700 font-medium flex-1">
                  {submitError}
                </span>
                <button
                  onClick={() => setSubmitError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Current stock */}
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium">
                  Current Stock
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {currentStock}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    units
                  </span>
                </span>
              </div>

              {/* New quantity */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  New Quantity *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewQuantity((p) => {
                        const next = Math.max(0, Number(p) - 1);
                        if ((next - currentStock > 0) !== (Number(p) - currentStock > 0) && Number(p) - currentStock !== 0)
                          setReason("");
                        return next;
                      });
                    }}
                    disabled={loading}
                    className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      const newVar = Number(newVal) - currentStock;
                      const oldVar = Number(newQuantity) - currentStock;
                      if ((newVar > 0) !== (oldVar > 0) && oldVar !== 0 && newVar !== 0)
                        setReason("");
                      setNewQuantity(newVal);
                      setSubmitError(null);
                    }}
                    min="0"
                    disabled={loading}
                    className={`flex-1 px-4 py-2.5 text-center text-lg font-bold border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 ${
                      errors.newQuantity
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewQuantity((p) => {
                        const next = Number(p) + 1;
                        if ((next - currentStock > 0) !== (Number(p) - currentStock > 0) && Number(p) - currentStock !== 0)
                          setReason("");
                        return next;
                      });
                    }}
                    disabled={loading}
                    className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-all disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {errors.newQuantity && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.newQuantity}
                  </p>
                )}
              </div>

              {/* Variance */}
              {variance !== 0 && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    variance > 0
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <AlertTriangle
                    size={16}
                    className={
                      variance > 0 ? "text-green-600" : "text-red-600"
                    }
                  />
                  <span
                    className={`text-sm font-medium ${
                      variance > 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {variance > 0 ? "+" : ""}
                    {variance} units (
                    {variance > 0 ? "Stock Increase" : "Stock Decrease"})
                  </span>
                </div>
              )}

              {/* Reason — dynamic based on variance direction */}
              <StyledSelect
                label={
                  variance > 0
                    ? "Reason for Increase *"
                    : variance < 0
                      ? "Reason for Decrease *"
                      : "Reason *"
                }
                value={reason}
                onChange={(val) => {
                  setReason(val);
                  setSubmitError(null);
                }}
                options={
                  variance > 0
                    ? INCREASE_REASONS
                    : variance < 0
                      ? DECREASE_REASONS
                      : [...INCREASE_REASONS, ...DECREASE_REASONS]
                }
                placeholder={
                  variance === 0
                    ? "Change quantity first"
                    : "Select a reason"
                }
                error={errors.reason}
                disabled={loading || variance === 0}
              />

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Notes{" "}
                  {reason === "OTHER" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => {
                    setReasonNotes(e.target.value);
                    setSubmitError(null);
                  }}
                  rows={3}
                  disabled={loading}
                  placeholder="Additional details about this adjustment..."
                  className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm disabled:opacity-50 ${
                    errors.reasonNotes
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                />
                {errors.reasonNotes && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.reasonNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || variance === 0}
                className="flex items-center gap-2 px-5 py-2 bg-[#05015A] text-white text-sm font-semibold rounded-lg hover:bg-[#0a0280] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Adjustment
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockAdjustmentModal;