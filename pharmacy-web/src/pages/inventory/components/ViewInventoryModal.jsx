// pharmacy-web/src/pages/inventory/components/ViewInventoryModal.jsx (do not remove this comment)
// src/pages/inventory/components/ViewInventoryModal.jsx

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  Package,
  Calendar,
  Truck,
  Layers,
  AlertCircle,
  Building2,
  Tag,
  DollarSign,
  MapPin,
  Hash,
  FileText,
  TrendingUp,
  Box,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ShoppingCart,
  BarChart3,
  Settings,
  Factory,
  Pencil,
  Plus,
  Minus,
} from "lucide-react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import StyledSelect from "../../../components/common/StyledSelect";

/* ─── animation variants ─── */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
const panelVariants = {
  hidden: { opacity: 0, x: 50, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

/* ─── status config ─── */
const getStatusInfo = (status) => {
  const s = (status || "").toLowerCase();
  const map = {
    "in stock": {
      icon: CheckCircle2,
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700 border border-green-200",
      dot: "bg-green-500",
    },
    "low stock": {
      icon: AlertTriangle,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700 border border-amber-200",
      dot: "bg-amber-500",
    },
    "out of stock": {
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-700 border border-red-200",
      dot: "bg-red-500",
    },
    expired: {
      icon: XCircle,
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-600 border border-slate-200",
      dot: "bg-slate-400",
    },
    "expiring soon": {
      icon: Clock,
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-700 border border-orange-200",
      dot: "bg-orange-500",
    },
  };
  return (
    map[s] || {
      icon: AlertCircle,
      color: "text-gray-600",
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-100 text-gray-600 border border-gray-200",
      dot: "bg-gray-400",
    }
  );
};

/* ─── helpers ─── */
const str = (v) => {
  if (v == null) return "";
  if (typeof v === "object")
    return v.branch_name || v.name || v.supplier_name || "";
  return String(v);
};

const formatExpiryForInput = (dateValue) => {
  if (!dateValue) return "";
  if (typeof dateValue === "string" && /^\d{1,2}\/\d{4}$/.test(dateValue))
    return dateValue;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "";
  }
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

/* ════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                             */
/* ════════════════════════════════════════════════════════════ */
const ViewInventoryModal = ({
  open,
  onClose,
  item,
  mode: externalMode = "view",
  onSave,
  onDelete,
  onAdjust,
  canAdjustStock = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Adjust stock state
  const [adjQty, setAdjQty] = useState(0);
  const [adjReason, setAdjReason] = useState("");
  const [adjNotes, setAdjNotes] = useState("");
  const [adjErrors, setAdjErrors] = useState({});
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjError, setAdjError] = useState(null);

  const initialItem = useMemo(() => {
    if (!item) return null;
    return {
      inventory_id: item.inventory_id || item.id,
      medicine_id: item.medicine_id,
      shop_id: item.shop_id,
      branch_id:
        item.branch_id ||
        (typeof item.branch === "object" ? item.branch?.branch_id : null),
      name: str(item.name || item.medicine_name || item.medicine?.name),
      manufacturer: str(
        item.manufacturer ||
          item.medicine_manufacturer ||
          item.mfac ||
          item.medicine?.manufacturer
      ),
      category: str(
        item.category || item.medicine_category || item.medicine?.category
      ),
      hsn_code: str(
        item.hsn ||
          item.hsn_code ||
          item.medicine_hsn_code ||
          item.medicine?.hsn_code
      ),
      batch_number: str(item.batch || item.batch_number),
      expiry: formatExpiryForInput(item.expiry_date || item.expiry),
      expiry_date: item.expiry_date,
      mrp: item.mrp ?? "",
      selling_rate: item.slr ?? item.selling_rate ?? "",
      purchase_rate: item.purchaseRate ?? item.last_purchase_rate ?? "",
      rack_no: str(
        item.rack ||
          item.rack_no ||
          item.medicine_rack_no ||
          item.medicine?.rack_no
      ),
      min_stock_level:
        item.medicine_min_stock ??
        item.min_stock_level ??
        item.medicine?.min_stock_level ??
        "",
      max_stock_level:
        item.medicine_max_stock ??
        item.max_stock_level ??
        item.medicine?.max_stock_level ??
        "",
      reorder_point:
        item.medicine_reorder_point ??
        item.reorder_point ??
        item.medicine?.reorder_point ??
        "",
      minimum_stock: item.minimum_stock ?? item.minStock ?? "",
      supplier: str(item.supplier_name || item.supplier),
      current_stock: item.qty ?? item.current_stock ?? 0,
      status: item.status || "Unknown",
      branch_name: str(item.branch_name || item.branch),
      updated_at: item.updated_at,
    };
  }, [item]);

  const [editableItem, setEditableItem] = useState(initialItem);

  useEffect(() => {
    if (open && item) {
      setEditableItem(initialItem);
      setIsEditing(externalMode === "edit");
      setShowAdjust(false);
      setSaveError(null);
      setAdjQty(Number(initialItem?.current_stock || 0));
      setAdjReason("");
      setAdjNotes("");
      setAdjErrors({});
      setAdjError(null);
    }
  }, [open, item, initialItem, externalMode]);

  if (!open || !editableItem) return null;

  const statusInfo = getStatusInfo(editableItem.status);
  const StatusIcon = statusInfo.icon;
  const currentStock = Number(editableItem.current_stock || 0);

  const updateField = (field, value) => {
    setEditableItem((p) => ({ ...p, [field]: value }));
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editableItem.name?.trim())
      return setSaveError("Item name is required");
    if (!editableItem.manufacturer?.trim())
      return setSaveError("Manufacturer is required");
    if (!editableItem.batch_number?.trim())
      return setSaveError("Batch number is required");

    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        inventory_id: editableItem.inventory_id,
        medicine_id: editableItem.medicine_id,
        name: editableItem.name?.trim(),
        manufacturer: editableItem.manufacturer?.trim(),
        category: editableItem.category?.trim() || null,
        hsn_code: editableItem.hsn_code?.trim() || null,
        batch_number: editableItem.batch_number?.trim(),
        expiry_date: editableItem.expiry?.trim() || null,
        mrp: editableItem.mrp !== "" ? Number(editableItem.mrp) : null,
        selling_rate:
          editableItem.selling_rate !== ""
            ? Number(editableItem.selling_rate)
            : null,
        last_purchase_rate:
          editableItem.purchase_rate !== ""
            ? Number(editableItem.purchase_rate)
            : null,
        rack_no: editableItem.rack_no?.trim() || null,
        min_stock_level:
          editableItem.min_stock_level !== ""
            ? Number(editableItem.min_stock_level)
            : null,
        max_stock_level:
          editableItem.max_stock_level !== ""
            ? Number(editableItem.max_stock_level)
            : null,
        reorder_point:
          editableItem.reorder_point !== ""
            ? Number(editableItem.reorder_point)
            : null,
        minimum_stock:
          editableItem.minimum_stock !== ""
            ? Number(editableItem.minimum_stock)
            : null,
      };
      await onSave?.(payload);
      onClose();
    } catch (error) {
      setSaveError(error.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── adjust stock ── */
  const adjVariance = Number(adjQty) - currentStock;

  const handleAdjustSubmit = async () => {
    const errs = {};
    if (adjQty === "" || Number(adjQty) < 0)
      errs.qty = "Quantity must be 0 or greater";
    if (!adjReason) errs.reason = "Please select a reason";
    if (adjReason === "OTHER" && !adjNotes.trim())
      errs.notes = "Please provide details";
    if (adjVariance === 0)
      errs.qty = "New quantity must differ from current stock";
    setAdjErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAdjLoading(true);
    setAdjError(null);
    try {
      await onAdjust?.(editableItem, {
        newQuantity: Number(adjQty),
        reason: adjReason,
        reasonNotes: adjNotes.trim(),
      });
      onClose();
    } catch (error) {
      setAdjError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save adjustment"
      );
    } finally {
      setAdjLoading(false);
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
            className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/* ═══════ HEADER ═══════ */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#05015A] to-[#0a0280] shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
                  <Package size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2.5 flex-wrap">
                    <span className="truncate max-w-[340px]">
                      {editableItem.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${statusInfo.badge}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                      />
                      {editableItem.status}
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] text-indigo-200 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Tag size={10} />
                      {editableItem.category || "Uncategorized"}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1">
                      <Hash size={10} />
                      {editableItem.batch_number || "N/A"}
                    </span>
                    {editableItem.branch_name && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1">
                          <Building2 size={10} />
                          {editableItem.branch_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {canAdjustStock && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white/80 text-sm font-medium rounded-lg border border-white/15 hover:bg-white/20 hover:text-white transition-all"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                )}
                {isEditing && onDelete && canAdjustStock && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 rounded-lg text-red-300 hover:text-white hover:bg-red-500/30 transition-all"
                    title="Delete item"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ═══════ ERROR BANNER ═══════ */}
            {saveError && (
              <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-600" />
                <span className="text-xs text-red-700 font-medium">
                  {saveError}
                </span>
              </div>
            )}

            {/* ═══════ BODY ═══════ */}
            <div className="flex flex-1 overflow-hidden">
              {/* ─── LEFT: Product & Pricing ─── */}
              <div className="flex-1 p-6 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-2 mb-1">
                    <SectionHeader icon={FileText} title="Product Information" />
                  </div>
                  <Field
                    label="Item Name"
                    value={editableItem.name}
                    editable={isEditing}
                    onChange={(v) => updateField("name", v)}
                    icon={Package}
                    required
                  />
                  <Field
                    label="Manufacturer"
                    value={editableItem.manufacturer}
                    editable={isEditing}
                    onChange={(v) => updateField("manufacturer", v)}
                    icon={Factory}
                    required
                  />
                  <Field
                    label="Category"
                    value={editableItem.category}
                    editable={isEditing}
                    onChange={(v) => updateField("category", v)}
                    icon={Tag}
                  />
                  <Field
                    label="HSN Code"
                    value={editableItem.hsn_code}
                    editable={isEditing}
                    onChange={(v) => updateField("hsn_code", v)}
                    icon={Hash}
                  />

                  <div className="col-span-2 mt-3 mb-1">
                    <SectionHeader icon={Box} title="Batch Information" />
                  </div>
                  <Field
                    label="Batch Number"
                    value={editableItem.batch_number}
                    editable={isEditing}
                    onChange={(v) => updateField("batch_number", v)}
                    icon={Box}
                    required
                  />
                  <Field
                    label="Expiry Date"
                    value={editableItem.expiry}
                    editable={isEditing}
                    onChange={(v) => updateField("expiry", v)}
                    icon={Calendar}
                    placeholder="MM/YYYY"
                  />

                  <div className="col-span-2 mt-3 mb-1">
                    <SectionHeader
                      icon={DollarSign}
                      title="Pricing & Supplier"
                    />
                  </div>
                  <Field
                    label="Supplier"
                    value={editableItem.supplier}
                    editable={false}
                    icon={Truck}
                    hint="From purchase invoice"
                  />
                  <Field
                    label="Rack Location"
                    value={editableItem.rack_no}
                    editable={isEditing}
                    onChange={(v) => updateField("rack_no", v)}
                    icon={MapPin}
                    placeholder="e.g., A1"
                  />
                  <Field
                    label="MRP"
                    value={editableItem.mrp}
                    editable={isEditing}
                    onChange={(v) => updateField("mrp", v)}
                    icon={DollarSign}
                    type="number"
                    prefix="₹"
                  />
                  <Field
                    label="Purchase Rate"
                    value={editableItem.purchase_rate}
                    editable={isEditing}
                    onChange={(v) => updateField("purchase_rate", v)}
                    icon={ShoppingCart}
                    type="number"
                    prefix="₹"
                  />
                  <Field
                    label="Selling Rate"
                    value={editableItem.selling_rate}
                    editable={isEditing}
                    onChange={(v) => updateField("selling_rate", v)}
                    icon={TrendingUp}
                    type="number"
                    prefix="₹"
                  />
                </div>
              </div>

              {/* ─── RIGHT: Stock & Thresholds & Adjust ─── */}
              <div className="w-[380px] p-6 bg-white overflow-y-auto">
                {/* Stock Status Card */}
                <div className="mb-5">
                  <SectionHeader icon={Layers} title="Current Stock" />
                  <div
                    className={`mt-3 p-4 rounded-xl border ${statusInfo.border} ${statusInfo.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-lg bg-white border ${statusInfo.border}`}
                        >
                          <StatusIcon size={20} className={statusInfo.color} />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                            Status
                          </p>
                          <p
                            className={`text-sm font-bold ${statusInfo.color}`}
                          >
                            {editableItem.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                          In Stock
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {currentStock}
                        </p>
                        <p className="text-[10px] text-gray-400">units</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Thresholds */}
                <div className="mb-5">
                  <SectionHeader icon={Settings} title="Alert Thresholds" />
                  <p className="text-[10px] text-gray-400 mt-1.5 mb-3">
                    Configure when stock alerts trigger for this medicine across
                    all batches.
                  </p>
                  <div className="space-y-3">
                    <Field
                      label="Low Stock Alert — warn below this qty"
                      value={editableItem.min_stock_level}
                      editable={isEditing}
                      onChange={(v) => updateField("min_stock_level", v)}
                      type="number"
                      icon={AlertTriangle}
                    />
                    <Field
                      label="Reorder Point — trigger reorder below"
                      value={editableItem.reorder_point}
                      editable={isEditing}
                      onChange={(v) => updateField("reorder_point", v)}
                      type="number"
                      icon={RefreshCw}
                    />
                    <Field
                      label="Maximum Capacity"
                      value={editableItem.max_stock_level}
                      editable={isEditing}
                      onChange={(v) => updateField("max_stock_level", v)}
                      type="number"
                      icon={BarChart3}
                    />
                  </div>
                </div>

                {/* ─── Stock Adjustment Section ─── */}
                {isEditing && canAdjustStock && onAdjust && (
                  <div className="mb-4">
                    <SectionHeader
                      icon={RefreshCw}
                      title="Stock Adjustment"
                    />

                    {!showAdjust ? (
                      <button
                        onClick={() => {
                          setShowAdjust(true);
                          setAdjQty(currentStock);
                          setAdjReason("");
                          setAdjNotes("");
                          setAdjErrors({});
                          setAdjError(null);
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                      >
                        <Plus size={15} />
                        Adjust Stock Quantity
                      </button>
                    ) : (
                      <div className="mt-3 border border-indigo-200 rounded-xl bg-indigo-50/30 overflow-hidden">
                        {/* Adjust header bar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#05015A] to-[#0a0280]">
                          <div className="flex items-center gap-2">
                            <RefreshCw
                              size={13}
                              className="text-white/80"
                            />
                            <span className="text-xs font-semibold text-white">
                              Adjust Quantity
                            </span>
                          </div>
                          <button
                            onClick={() => setShowAdjust(false)}
                            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        <div className="p-3 space-y-3">
                          {/* Item reminder */}
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {editableItem.name}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Batch: {editableItem.batch_number || "—"} ·
                              Current: {currentStock} units
                            </p>
                          </div>

                          {/* Error */}
                          {adjError && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                              <AlertCircle
                                size={12}
                                className="text-red-600 shrink-0"
                              />
                              <span className="text-[11px] text-red-700">
                                {adjError}
                              </span>
                            </div>
                          )}

                          {/* Qty controls */}
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              New Quantity *
                            </label>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjQty((p) => {
                                    const next = Math.max(0, Number(p) - 1);
                                    // Clear reason if direction changed
                                    const newVariance = next - currentStock;
                                    const oldVariance = Number(p) - currentStock;
                                    if (
                                      (newVariance > 0) !== (oldVariance > 0) &&
                                      oldVariance !== 0
                                    )
                                      setAdjReason("");
                                    return next;
                                  });
                                }}
                                disabled={adjLoading}
                                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                value={adjQty}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  const newVariance = Number(newVal) - currentStock;
                                  const oldVariance = Number(adjQty) - currentStock;
                                  // Clear reason if direction flipped
                                  if (
                                    (newVariance > 0) !== (oldVariance > 0) &&
                                    oldVariance !== 0 &&
                                    newVariance !== 0
                                  )
                                    setAdjReason("");
                                  setAdjQty(newVal);
                                  setAdjError(null);
                                }}
                                min="0"
                                disabled={adjLoading}
                                className={`flex-1 px-2 py-1.5 text-center text-base font-bold border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 ${
                                  adjErrors.qty
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-200"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjQty((p) => {
                                    const next = Number(p) + 1;
                                    const newVariance = next - currentStock;
                                    const oldVariance = Number(p) - currentStock;
                                    if (
                                      (newVariance > 0) !== (oldVariance > 0) &&
                                      oldVariance !== 0
                                    )
                                      setAdjReason("");
                                    return next;
                                  });
                                }}
                                disabled={adjLoading}
                                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-all disabled:opacity-50"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            {adjErrors.qty && (
                              <p className="mt-1 text-[11px] text-red-500">
                                {adjErrors.qty}
                              </p>
                            )}
                          </div>

                          {/* Variance */}
                          {adjVariance !== 0 && (
                            <div
                              className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs ${
                                adjVariance > 0
                                  ? "bg-green-50 border-green-200"
                                  : "bg-red-50 border-red-200"
                              }`}
                            >
                              <AlertTriangle
                                size={12}
                                className={
                                  adjVariance > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              />
                              <span
                                className={`font-medium ${
                                  adjVariance > 0
                                    ? "text-green-700"
                                    : "text-red-700"
                                }`}
                              >
                                {adjVariance > 0 ? "+" : ""}
                                {adjVariance} units (
                                {adjVariance > 0 ? "Increase" : "Decrease"})
                              </span>
                            </div>
                          )}

                          {/* Reason — dynamic based on variance direction */}
                          <StyledSelect
                            label={
                              adjVariance > 0
                                ? "Reason for Increase *"
                                : adjVariance < 0
                                  ? "Reason for Decrease *"
                                  : "Reason *"
                            }
                            value={adjReason}
                            onChange={(v) => {
                              setAdjReason(v);
                              setAdjError(null);
                            }}
                            options={
                              adjVariance > 0
                                ? INCREASE_REASONS
                                : adjVariance < 0
                                  ? DECREASE_REASONS
                                  : [...INCREASE_REASONS, ...DECREASE_REASONS]
                            }
                            placeholder={
                              adjVariance === 0
                                ? "Change quantity first"
                                : "Select a reason"
                            }
                            error={adjErrors.reason}
                            disabled={adjLoading || adjVariance === 0}
                          />

                          {/* Notes */}
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Notes{" "}
                              {adjReason === "OTHER" && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <textarea
                              value={adjNotes}
                              onChange={(e) => {
                                setAdjNotes(e.target.value);
                                setAdjError(null);
                              }}
                              rows={2}
                              disabled={adjLoading}
                              placeholder="Additional details..."
                              className={`w-full px-2.5 py-1.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-xs disabled:opacity-50 ${
                                adjErrors.notes
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-200"
                              }`}
                            />
                            {adjErrors.notes && (
                              <p className="mt-1 text-[11px] text-red-500">
                                {adjErrors.notes}
                              </p>
                            )}
                          </div>

                          {/* Submit */}
                          <button
                            onClick={handleAdjustSubmit}
                            disabled={adjLoading || adjVariance === 0}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#05015A] text-white text-sm font-semibold rounded-lg hover:bg-[#0a0280] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {adjLoading ? (
                              <>
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
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
                      </div>
                    )}
                  </div>
                )}

                {/* View mode hint */}
                {!isEditing && canAdjustStock && onAdjust && (
                  <div className="pt-3">
                    <p className="text-[10px] text-gray-400 italic flex items-center gap-1 justify-center">
                      <Pencil size={10} />
                      Click "Edit" to adjust stock or modify thresholds
                    </p>
                  </div>
                )}

                {/* Branch warning */}
                {!canAdjustStock && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle
                      size={14}
                      className="text-amber-600 shrink-0"
                    />
                    <span className="text-[11px] text-amber-700">
                      Select a branch to edit this item
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ═══════ FOOTER ═══════ */}
            <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-200 shrink-0">
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <Clock size={11} />
                <span>
                  Updated:{" "}
                  {editableItem.updated_at
                    ? new Date(editableItem.updated_at).toLocaleDateString()
                    : "Today"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setShowAdjust(false);
                      setEditableItem(initialItem);
                      setSaveError(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
                {!isEditing && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    Close
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          <ConfirmDialog
            isOpen={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => {
              onDelete?.(editableItem);
              setConfirmDelete(false);
              onClose();
            }}
            title="Delete Inventory Item"
            message={`Are you sure you want to delete "${editableItem.name}" (Batch: ${editableItem.batch_number})? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        </div>
      )}
    </AnimatePresence>
  );
};

/* ─── Section Header ─── */
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
    <Icon size={14} className="text-indigo-600" />
    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
      {title}
    </h3>
  </div>
);

/* ─── Field ─── */
const Field = ({
  label,
  value,
  editable,
  onChange,
  icon: Icon,
  required,
  type = "text",
  prefix,
  placeholder,
  compact,
  hint,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {Icon && <Icon size={10} />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {editable ? (
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full ${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"}
            ${prefix ? "pl-6" : ""}
            bg-white border border-gray-200 rounded-lg
            font-medium text-gray-700
            hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            placeholder:text-gray-400 transition-all
          `}
        />
      </div>
    ) : (
      <div
        className={`${compact ? "px-2.5 py-1.5" : "px-3 py-2"} bg-gray-50 border border-gray-200 rounded-lg`}
      >
        <span
          className={`${compact ? "text-xs" : "text-sm"} font-semibold text-gray-800`}
        >
          {prefix}
          {typeof value === "object"
            ? value?.branch_name || value?.name || value?.supplier_name || "—"
            : value || "—"}
        </span>
        {hint && (
          <span className="ml-1 text-[9px] text-gray-400">({hint})</span>
        )}
      </div>
    )}
  </div>
);

export default ViewInventoryModal;