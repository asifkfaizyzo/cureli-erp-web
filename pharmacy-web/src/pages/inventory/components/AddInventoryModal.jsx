// pharmacy-web/src/pages/inventory/components/AddInventoryModal.jsx (do not remove this comment)
// src/pages/inventory/components/AddInventoryModal.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  Package,
  Pill,
  MapPin,
  Loader2,
  AlertTriangle,
  Hash,
  Percent,
  Shield,
  Building2,
  Layers,
  CheckCircle,
  Info,
  PenLine,
  RefreshCw,
  FlaskConical,
  ArrowRight,
  Boxes,
  ClipboardList,
  Calendar,
  BadgeDollarSign,
} from "lucide-react";
import StyledSelect from "../../../components/common/StyledSelect";
import StyledDateFilter from "../../../components/common/StyledDateFilter";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULE_OPTIONS = [
  { value: "",            label: "None" },
  { value: "Schedule H",  label: "Schedule H" },
  { value: "Schedule H1", label: "Schedule H1" },
  { value: "Schedule X",  label: "Schedule X" },
  { value: "OTC",         label: "OTC (Over The Counter)" },
];

const GST_OPTIONS = [
  { value: "0",  label: "0%"  },
  { value: "5",  label: "5%"  },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components (scoped to this file)
// ─────────────────────────────────────────────────────────────────────────────

const FormField = ({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-[10px] text-gray-400">{hint}</p>}
    {error && (
      <p className="flex items-center gap-1 text-[11px] text-red-500">
        <AlertTriangle size={10} className="shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const inputBase = (hasError) =>
  `w-full px-3 py-2 text-sm bg-white border rounded-lg transition-all outline-none
   text-gray-800 placeholder:text-gray-400
   ${
     hasError
       ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500/15 focus:border-red-400"
       : "border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400"
   }`;

const InputWithIcon = ({ icon: Icon, error, className = "", ...props }) => (
  <div className="relative">
    <Icon
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
    />
    <input {...props} className={`${inputBase(error)} pl-9 ${className}`} />
  </div>
);

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-2 py-1">
    <span className="h-px flex-1 bg-gray-100" />
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
      {label}
    </span>
    <span className="h-px flex-1 bg-gray-100" />
  </div>
);

const ReadonlyPill = ({ value, color = "gray" }) => {
  const colors = {
    gray:   "bg-gray-50 border-gray-200 text-gray-500",
    violet: "bg-violet-50 border-violet-200 text-violet-700 font-bold",
  };
  return (
    <div
      className={`flex items-center px-3 py-2 border rounded-lg text-sm ${colors[color]}`}
    >
      {value}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab panels
// ─────────────────────────────────────────────────────────────────────────────

const MedicineInfoPanel = ({ formData, errors, onChange }) => (
  <div className="space-y-4">
    <FormField label="Medicine Name" required error={errors.name}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => onChange("name", e.target.value)}
        className={inputBase(errors.name)}
        placeholder="e.g., Paracetamol 500mg Tablet"
        autoFocus
      />
    </FormField>

    <div className="grid grid-cols-2 gap-3">
      <FormField label="Manufacturer" required error={errors.manufacturer}>
        <InputWithIcon
          icon={Building2}
          type="text"
          value={formData.manufacturer}
          onChange={(e) => onChange("manufacturer", e.target.value)}
          error={errors.manufacturer}
          placeholder="Manufacturer name"
        />
      </FormField>

      <FormField label="Generic / Salt Name">
        <InputWithIcon
          icon={FlaskConical}
          type="text"
          value={formData.genericName}
          onChange={(e) => onChange("genericName", e.target.value)}
          placeholder="Generic name"
        />
      </FormField>
    </div>

    <SectionDivider label="Classification" />

    <div className="grid grid-cols-2 gap-3">
      <FormField label="Category">
        <input
          type="text"
          value={formData.category}
          onChange={(e) => onChange("category", e.target.value)}
          className={inputBase(false)}
          placeholder="e.g., Tablet"
        />
      </FormField>

      <FormField label="Sub Category">
        <input
          type="text"
          value={formData.subCategory}
          onChange={(e) => onChange("subCategory", e.target.value)}
          className={inputBase(false)}
          placeholder="e.g., Analgesic"
        />
      </FormField>

      <FormField label="Pack Size">
        <input
          type="text"
          value={formData.packSize}
          onChange={(e) => onChange("packSize", e.target.value)}
          className={inputBase(false)}
          placeholder="e.g., 10×10, 100ml"
        />
      </FormField>

      <FormField label="Schedule">
        <StyledSelect
          value={formData.schedule}
          onChange={(val) => onChange("schedule", val)}
          options={SCHEDULE_OPTIONS}
          placeholder="Select schedule"
        />
      </FormField>
    </div>

    {/* Info banner */}
    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
      <Info size={13} className="text-amber-500 mt-0.5 shrink-0" />
      <p className="text-[11px] text-amber-700 leading-relaxed">
        This medicine will be added to your inventory only. It will not appear
        on the marketplace until it is reviewed and linked to the master catalog
        by Cureli.
      </p>
    </div>
  </div>
);

const StoragePanel = ({ formData, errors, onChange }) => (
  <div className="space-y-4">
    <FormField
      label="Rack Location"
      hint="Where this product is physically stored"
    >
      <InputWithIcon
        icon={MapPin}
        type="text"
        value={formData.rackNo}
        onChange={(e) => onChange("rackNo", e.target.value.toUpperCase())}
        placeholder="e.g., A1, B2, C3"
        className="uppercase"
      />
    </FormField>

    <SectionDivider label="Stock Thresholds" />

    <div className="grid grid-cols-3 gap-3">
      <FormField label="Min Stock Level">
        <input
          type="number"
          inputMode="numeric"
          value={formData.minLevel}
          onChange={(e) => onChange("minLevel", e.target.value)}
          className={inputBase(false)}
          placeholder="0"
          min="0"
        />
      </FormField>

      <FormField label="Reorder Point">
        <input
          type="number"
          inputMode="numeric"
          value={formData.reorderPoint}
          onChange={(e) => onChange("reorderPoint", e.target.value)}
          className={inputBase(false)}
          placeholder="0"
          min="0"
        />
      </FormField>

      <FormField label="Max Stock Level" error={errors.maxLevel}>
        <input
          type="number"
          inputMode="numeric"
          value={formData.maxLevel}
          onChange={(e) => onChange("maxLevel", e.target.value)}
          className={inputBase(errors.maxLevel)}
          placeholder="0"
          min="0"
        />
      </FormField>
    </div>

    {(formData.minLevel || formData.maxLevel || formData.reorderPoint) && (
      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-[10px] text-gray-500">
        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
        <span>Low ≤ {formData.minLevel || "—"}</span>
        <ArrowRight size={9} className="text-gray-300" />
        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        <span>Reorder ≤ {formData.reorderPoint || "—"}</span>
        <ArrowRight size={9} className="text-gray-300" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <span>Max = {formData.maxLevel || "—"}</span>
      </div>
    )}
  </div>
);

const TaxPanel = ({
  formData,
  errors,
  onChange,
  gstMode,
  toggleGstMode,
  handleGSTChange,
  handleTaxChange,
}) => (
  <div className="space-y-4">
    <FormField label="HSN Code" hint="Harmonised System of Nomenclature code">
      <InputWithIcon
        icon={Hash}
        type="text"
        value={formData.hsnCode}
        onChange={(e) => onChange("hsnCode", e.target.value)}
        placeholder="e.g., 30049099"
      />
    </FormField>

    <SectionDivider label="GST Configuration" />

    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
      <div>
        <p className="text-xs font-semibold text-gray-700">Tax Entry Mode</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {gstMode === "auto"
            ? "Total GST splits equally into CGST & SGST"
            : "Enter CGST and SGST individually"}
        </p>
      </div>
      <button
        type="button"
        onClick={toggleGstMode}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
          gstMode === "auto"
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        {gstMode === "auto" ? (
          <>
            <RefreshCw size={11} /> Auto
          </>
        ) : (
          <>
            <PenLine size={11} /> Manual
          </>
        )}
      </button>
    </div>

    {gstMode === "auto" ? (
      <div className="grid grid-cols-3 gap-3">
        <FormField label="GST Rate">
          <StyledSelect
            value={formData.gst}
            onChange={handleGSTChange}
            options={GST_OPTIONS}
            placeholder="Select"
          />
        </FormField>
        <FormField label="CGST % (Auto)">
          <ReadonlyPill value={`${formData.cgstPercent}%`} />
        </FormField>
        <FormField label="SGST % (Auto)">
          <ReadonlyPill value={`${formData.sgstPercent}%`} />
        </FormField>
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-3">
        <FormField label="CGST %" error={errors.cgstPercent}>
          <input
            type="number"
            inputMode="decimal"
            value={formData.cgstPercent}
            onChange={(e) => handleTaxChange("cgstPercent", e.target.value)}
            className={inputBase(errors.cgstPercent)}
            placeholder="0"
            min="0"
            max="14"
            step="0.5"
          />
        </FormField>
        <FormField label="SGST %">
          <input
            type="number"
            inputMode="decimal"
            value={formData.sgstPercent}
            onChange={(e) => handleTaxChange("sgstPercent", e.target.value)}
            className={inputBase(false)}
            placeholder="0"
            min="0"
            max="14"
            step="0.5"
          />
        </FormField>
        <FormField label="Total GST">
          <ReadonlyPill value={`${formData.gst}%`} color="violet" />
        </FormField>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// StockEntryPanel — uses StyledDateFilter for expiry date
// ─────────────────────────────────────────────────────────────────────────────

const StockEntryPanel = ({ formData, errors, onChange }) => (
  <div className="space-y-4">
    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
      <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
      <p className="text-[11px] text-blue-700 leading-relaxed">
        This is the opening stock entry for this batch. The quantity entered
        here will be recorded as the starting inventory.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {/* Batch Number */}
      <FormField label="Batch Number" required error={errors.batchNumber}>
        <input
          type="text"
          value={formData.batchNumber}
          onChange={(e) =>
            onChange("batchNumber", e.target.value.toUpperCase())
          }
          className={`${inputBase(errors.batchNumber)} uppercase`}
          placeholder="e.g., BT2024001"
        />
      </FormField>

      {/* ── Expiry Date — StyledDateFilter ── */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          Expiry Date
          <span className="text-red-500">*</span>
        </label>

        {/*
          StyledDateFilter expects:
            date      → ISO date string "YYYY-MM-DD" or ""
            setDate   → setter for that string
            label     → we pass undefined so it doesn't render a second label
        */}
        <StyledDateFilter
          date={formData.expiryDate}
          setDate={(val) => onChange("expiryDate", val)}
        />

        {errors.expiryDate && (
          <p className="flex items-center gap-1 text-[11px] text-red-500">
            <AlertTriangle size={10} className="shrink-0" />
            {errors.expiryDate}
          </p>
        )}
      </div>
    </div>

    <SectionDivider label="Quantity & Pricing" />

    <div className="grid grid-cols-2 gap-3">
      <FormField label="Opening Quantity" required error={errors.quantity}>
        <input
          type="number"
          inputMode="numeric"
          value={formData.quantity}
          onChange={(e) => onChange("quantity", e.target.value)}
          className={inputBase(errors.quantity)}
          placeholder="0"
          min="0"
        />
      </FormField>

      <FormField label="MRP (₹)" required error={errors.mrp}>
        <InputWithIcon
          icon={BadgeDollarSign}
          type="number"
          inputMode="decimal"
          value={formData.mrp}
          onChange={(e) => onChange("mrp", e.target.value)}
          error={errors.mrp}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </FormField>

      <FormField label="Selling Rate (₹)" hint="Leave blank to use MRP">
        <InputWithIcon
          icon={BadgeDollarSign}
          type="number"
          inputMode="decimal"
          value={formData.sellingRate}
          onChange={(e) => onChange("sellingRate", e.target.value)}
          placeholder="Optional"
          min="0"
          step="0.01"
        />
      </FormField>

      <FormField label="Purchase Rate (₹)" hint="Cost price per unit">
        <InputWithIcon
          icon={BadgeDollarSign}
          type="number"
          inputMode="decimal"
          value={formData.purchaseRate}
          onChange={(e) => onChange("purchaseRate", e.target.value)}
          placeholder="Optional"
          min="0"
          step="0.01"
        />
      </FormField>
    </div>

    <FormField
      label="Batch Min Stock"
      hint="Override medicine-level minimum for this batch only"
    >
      <input
        type="number"
        inputMode="numeric"
        value={formData.batchMinStock}
        onChange={(e) => onChange("batchMinStock", e.target.value)}
        className={inputBase(false)}
        placeholder="Optional"
        min="0"
      />
    </FormField>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  // Medicine
  name:         "",
  manufacturer: "",
  genericName:  "",
  category:     "",
  subCategory:  "",
  packSize:     "",
  schedule:     "",
  rackNo:       "",
  minLevel:     "",
  maxLevel:     "",
  reorderPoint: "",
  hsnCode:      "",
  gst:          "12",
  cgstPercent:  "6",
  sgstPercent:  "6",
  // Stock
  batchNumber:   "",
  expiryDate:    "",   // "YYYY-MM-DD" string — set by StyledDateFilter
  quantity:      "",
  mrp:           "",
  sellingRate:   "",
  purchaseRate:  "",
  batchMinStock: "",
};

const AddInventoryModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [errors, setErrors]             = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab]       = useState("medicine");
  const [gstMode, setGstMode]           = useState("auto");

  const tabs = [
    {
      id:          "medicine",
      label:       "Medicine Info",
      icon:        Pill,
      description: "Name, manufacturer & classification",
      errorKeys:   ["name", "manufacturer"],
    },
    {
      id:          "storage",
      label:       "Storage",
      icon:        Boxes,
      description: "Rack location & stock thresholds",
      errorKeys:   ["maxLevel"],
    },
    {
      id:          "tax",
      label:       "Tax & GST",
      icon:        Percent,
      description: "HSN code & GST rates",
      errorKeys:   ["cgstPercent"],
    },
    {
      id:          "stock",
      label:       "Stock Entry",
      icon:        ClipboardList,
      description: "Batch, quantity, expiry & pricing",
      errorKeys:   ["batchNumber", "expiryDate", "quantity", "mrp"],
    },
  ];

  // Reset on open
  useEffect(() => {
    if (open) {
      setFormData(EMPTY_FORM);
      setErrors({});
      setActiveTab("medicine");
      setGstMode("auto");
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const isFormValid = useMemo(
    () =>
      !!formData.name.trim() &&
      !!formData.manufacturer.trim() &&
      !!formData.batchNumber.trim() &&
      !!formData.expiryDate &&
      formData.quantity !== "" &&
      formData.mrp !== "",
    [formData],
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleGSTChange = (value) => {
    const gst  = parseFloat(value) || 0;
    const half = (gst / 2).toFixed(2);
    setFormData((prev) => ({
      ...prev,
      gst:         value,
      cgstPercent: half,
      sgstPercent: half,
    }));
  };

  const handleTaxChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      const cgst    = field === "cgstPercent" ? numValue : parseFloat(prev.cgstPercent) || 0;
      const sgst    = field === "sgstPercent" ? numValue : parseFloat(prev.sgstPercent) || 0;
      newData.gst   = String(cgst + sgst);
      return newData;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleGstMode = () => {
    if (gstMode === "auto") {
      setGstMode("manual");
    } else {
      const gst  = parseFloat(formData.gst) || 12;
      const half = (gst / 2).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        cgstPercent: half,
        sgstPercent: half,
      }));
      setGstMode("auto");
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim())         e.name         = "Medicine name is required";
    if (!formData.manufacturer.trim()) e.manufacturer = "Manufacturer is required";
    if (!formData.batchNumber.trim())  e.batchNumber  = "Batch number is required";
    if (!formData.expiryDate)          e.expiryDate   = "Expiry date is required";
    if (formData.quantity === "" || formData.quantity === null) {
      e.quantity = "Quantity is required";
    } else if (Number(formData.quantity) < 0) {
      e.quantity = "Quantity cannot be negative";
    }
    if (formData.mrp === "" || formData.mrp === null) {
      e.mrp = "MRP is required";
    } else if (Number(formData.mrp) < 0) {
      e.mrp = "MRP cannot be negative";
    }
    if (
      formData.minLevel &&
      formData.maxLevel &&
      Number(formData.minLevel) >= Number(formData.maxLevel)
    ) {
      e.maxLevel = "Max must be greater than min";
    }
    if (gstMode === "manual") {
      const total =
        (parseFloat(formData.cgstPercent) || 0) +
        (parseFloat(formData.sgstPercent) || 0);
      if (total > 28) e.cgstPercent = "Total GST cannot exceed 28%";
    }

    setErrors(e);
    return e;
  };

  // Jump to the first tab that has errors
  const jumpToFirstErrorTab = (errorKeys) => {
    for (const tab of tabs) {
      if (tab.errorKeys.some((k) => errorKeys[k])) {
        setActiveTab(tab.id);
        return;
      }
    }
  };

  const toNum = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      jumpToFirstErrorTab(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        // Medicine fields
        name:            formData.name.trim(),
        manufacturer:    formData.manufacturer.trim(),
        generic_name:    formData.genericName?.trim()        || null,
        category:        formData.category?.trim()           || null,
        sub_category:    formData.subCategory?.trim()        || null,
        schedule:        formData.schedule                   || null,
        hsn_code:        formData.hsnCode?.trim()            || null,
        pack_size:       formData.packSize?.trim()           || null,
        gst_percentage:  toNum(formData.gst)                 ?? 12,
        cgst_percentage: toNum(formData.cgstPercent)         ?? 6,
        sgst_percentage: toNum(formData.sgstPercent)         ?? 6,
        rack_no:         formData.rackNo?.trim()?.toUpperCase() || null,
        min_stock_level: toNum(formData.minLevel),
        max_stock_level: toNum(formData.maxLevel),
        reorder_point:   toNum(formData.reorderPoint),
        // Stock / batch fields
        batch_number:  formData.batchNumber.trim().toUpperCase(),
        expiry_date:   formData.expiryDate,   // "YYYY-MM-DD" from StyledDateFilter
        quantity:      toNum(formData.quantity) ?? 0,
        mrp:           toNum(formData.mrp)      ?? 0,
        selling_rate:  toNum(formData.sellingRate),
        purchase_rate: toNum(formData.purchaseRate),
        minimum_stock: toNum(formData.batchMinStock),
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit:
          err?.response?.data?.message ||
          err.message ||
          "Failed to add medicine",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-poppins"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "min(700px, calc(100vh - 2rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">
                  Add Medicine to Inventory
                </h2>
                <p className="text-white/50 text-[11px] mt-0.5">
                  Creates medicine record and opening stock entry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isFormValid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle size={10} /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/20">
                  <AlertTriangle size={10} /> Incomplete
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
          {/* Left sidebar tabs */}
          <div className="shrink-0 w-48 bg-gray-50 border-r border-gray-100 flex flex-col py-3 gap-0.5 px-2">
            {tabs.map((tab) => {
              const Icon     = tab.icon;
              const isActive = activeTab === tab.id;
              const hasError = tab.errorKeys.some((k) => errors[k]);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all group
                    ${
                      isActive
                        ? "bg-white shadow-sm border border-gray-200"
                        : "hover:bg-white/60"
                    }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors
                      ${isActive ? "bg-indigo-600" : "bg-gray-200 group-hover:bg-gray-300"}`}
                    >
                      <Icon
                        size={14}
                        className={isActive ? "text-white" : "text-gray-500"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-semibold leading-tight truncate
                          ${isActive ? "text-gray-900" : "text-gray-600"}`}
                        >
                          {tab.label}
                        </p>
                        {hasError && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 ml-1" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-2">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="mt-auto px-2 pb-2 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="text-red-400 font-bold">*</span> Required
                fields must be filled before saving.
              </p>
            </div>
          </div>

          {/* Right content panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/*
              overflow-visible on the scroller so StyledDateFilter's portal
              is not clipped — the portal renders into document.body anyway,
              but keeping overflow-visible here avoids stacking-context issues.
            */}
            <div className="flex-1 overflow-y-auto overflow-x-visible p-5">
              {activeTab === "medicine" && (
                <MedicineInfoPanel
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />
              )}
              {activeTab === "storage" && (
                <StoragePanel
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />
              )}
              {activeTab === "tax" && (
                <TaxPanel
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                  gstMode={gstMode}
                  toggleGstMode={toggleGstMode}
                  handleGSTChange={handleGSTChange}
                  handleTaxChange={handleTaxChange}
                />
              )}
              {activeTab === "stock" && (
                <StockEntryPanel
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />
              )}

              {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{errors.submit}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isFormValid ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
                <span className="text-[10px] text-gray-400">
                  {isFormValid
                    ? "Ready to add to inventory"
                    : "Fill all required fields to continue"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border
                    border-gray-200 rounded-lg hover:bg-gray-50 transition-colors
                    disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
                    transition-all ${
                      isFormValid && !isSubmitting
                        ? "bg-[#05015A] text-white hover:bg-[#0a0280] shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Add to Inventory
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryModal;