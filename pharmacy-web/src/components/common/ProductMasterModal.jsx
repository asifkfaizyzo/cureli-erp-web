// pharmacy-web/src/components/common/ProductMasterModal.jsx (do not remove this comment)
// src/components/common/ProductMasterModal.jsx

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
  Archive,
  Building2,
  Tag,
  Layers,
  CheckCircle,
  Info,
  PenLine,
  RefreshCw,
  FlaskConical,
  ArrowRight,
  Boxes,
  ChevronRight,
} from "lucide-react";
import StyledSelect from "./StyledSelect";

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const SCHEDULE_OPTIONS = [
  { value: "", label: "None" },
  { value: "Schedule H", label: "Schedule H" },
  { value: "Schedule H1", label: "Schedule H1" },
  { value: "Schedule X", label: "Schedule X" },
  { value: "OTC", label: "OTC (Over The Counter)" },
];

const GST_OPTIONS = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

// ══════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ══════════════════════════════════════════════════════════════

const FormField = ({ label, required, error, hint, children, className = "" }) => (
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
  `w-full px-3 py-2 text-sm bg-white border rounded-lg transition-all outline-none text-gray-800 placeholder:text-gray-400 ${
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
    gray: "bg-gray-50 border-gray-200 text-gray-500",
    violet: "bg-violet-50 border-violet-200 text-violet-700 font-bold",
  };
  return (
    <div className={`flex items-center px-3 py-2 border rounded-lg text-sm ${colors[color]}`}>
      {value}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// TAB PANELS
// ══════════════════════════════════════════════════════════════

const BasicInfoPanel = ({ formData, errors, handleInputChange }) => (
  <div className="space-y-4">
    <FormField label="Product Name" required error={errors.name}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => handleInputChange("name", e.target.value)}
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
          onChange={(e) => handleInputChange("manufacturer", e.target.value)}
          error={errors.manufacturer}
          placeholder="Manufacturer name"
        />
      </FormField>

      <FormField label="Generic / Salt Name">
        <InputWithIcon
          icon={FlaskConical}
          type="text"
          value={formData.genericName}
          onChange={(e) => handleInputChange("genericName", e.target.value)}
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
          onChange={(e) => handleInputChange("category", e.target.value)}
          className={inputBase(false)}
          placeholder="e.g., Tablet"
        />
      </FormField>

      <FormField label="Sub Category">
        <input
          type="text"
          value={formData.subCategory}
          onChange={(e) => handleInputChange("subCategory", e.target.value)}
          className={inputBase(false)}
          placeholder="e.g., Analgesic"
        />
      </FormField>

      <FormField label="Pack Size">
        <input
          type="text"
          value={formData.packSize}
          onChange={(e) => handleInputChange("packSize", e.target.value)}
          className={inputBase(false)}
          placeholder="e.g., 10×10, 100ml"
        />
      </FormField>

      <FormField label="Schedule">
        {/* type="button" is set inside StyledSelect internally — no change needed */}
        <StyledSelect
          value={formData.schedule}
          onChange={(val) => handleInputChange("schedule", val)}
          options={SCHEDULE_OPTIONS}
          placeholder="Select schedule"
        />
      </FormField>
    </div>
  </div>
);

const StoragePanel = ({ formData, errors, handleInputChange }) => (
  <div className="space-y-4">
    <FormField
      label="Rack Location"
      hint="Where this product is physically stored"
    >
      <InputWithIcon
        icon={MapPin}
        type="text"
        value={formData.rackNo}
        onChange={(e) => handleInputChange("rackNo", e.target.value.toUpperCase())}
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
          onChange={(e) => handleInputChange("minLevel", e.target.value)}
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
          onChange={(e) => handleInputChange("reorderPoint", e.target.value)}
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
          onChange={(e) => handleInputChange("maxLevel", e.target.value)}
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

    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
      <Info size={13} className="text-amber-500 mt-0.5 shrink-0" />
      <p className="text-[11px] text-amber-700 leading-relaxed">
        These thresholds are optional during product creation. You can configure them after adding inventory batches.
      </p>
    </div>
  </div>
);

const PricingPanel = ({
  formData,
  errors,
  handleInputChange,
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
        onChange={(e) => handleInputChange("hsnCode", e.target.value)}
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
      {/* ← type="button" prevents this from submitting the form */}
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
          <><RefreshCw size={11} /> Auto (GST → Split)</>
        ) : (
          <><PenLine size={11} /> Manual (CGST + SGST)</>
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

    <FormField label="GST Sub Head" hint="Optional sub-classification">
      <input
        type="text"
        value={formData.subHead}
        onChange={(e) => handleInputChange("subHead", e.target.value)}
        className={inputBase(false)}
        placeholder="Optional"
      />
    </FormField>

    <SectionDivider label="Price Control" />

    <div
      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${
        formData.priceControlled
          ? "bg-indigo-50 border-indigo-200"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => handleInputChange("priceControlled", !formData.priceControlled)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          formData.priceControlled ? "bg-indigo-100" : "bg-gray-100"
        }`}>
          <Shield
            size={15}
            className={formData.priceControlled ? "text-indigo-600" : "text-gray-400"}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Price Controlled</p>
          <p className="text-[10px] text-gray-500">Government regulated product (DPCO)</p>
        </div>
      </div>
      <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
        formData.priceControlled ? "bg-indigo-600" : "bg-gray-200"
      }`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
          formData.priceControlled ? "left-[18px]" : "left-0.5"
        }`} />
      </div>
    </div>

    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
      <Layers size={13} className="text-blue-500 mt-0.5 shrink-0" />
      <p className="text-[11px] text-blue-700 leading-relaxed">
        {gstMode === "auto"
          ? "GST is automatically split equally into CGST & SGST for intra-state sales."
          : "CGST and SGST are entered separately. Total GST is calculated automatically."}
      </p>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

const ProductMasterModal = ({
  open,
  onClose,
  onSave,
  initialData = {},
  mode = "create",
}) => {
  const [formData, setFormData] = useState({
    name: "",
    manufacturer: "",
    category: "",
    subCategory: "",
    genericName: "",
    schedule: "",
    rackNo: "",
    minLevel: "",
    maxLevel: "",
    reorderPoint: "",
    priceControlled: false,
    hsnCode: "",
    packSize: "",
    gst: "12",
    cgstPercent: "6",
    sgstPercent: "6",
    subHead: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [gstMode, setGstMode] = useState("auto");

  const tabs = [
    {
      id: "basic",
      label: "Product Info",
      icon: Pill,
      description: "Name, manufacturer & classification",
      errorKeys: ["name", "manufacturer"],
    },
    {
      id: "storage",
      label: "Storage",
      icon: Boxes,
      description: "Rack location & stock thresholds",
      errorKeys: ["maxLevel"],
    },
    {
      id: "pricing",
      label: "Tax & GST",
      icon: Percent,
      description: "HSN code, GST rates & price control",
      errorKeys: ["cgstPercent"],
    },
  ];

  // Seed form when modal opens
  useEffect(() => {
    if (open) {
      const hasManualGst =
        initialData.cgstPercent && initialData.sgstPercent;
      const calculatedGst = hasManualGst
        ? String(
            parseFloat(initialData.cgstPercent) +
              parseFloat(initialData.sgstPercent),
          )
        : "12";

      setFormData({
        name: initialData.name || "",
        manufacturer: initialData.manufacturer || initialData.mfac || "",
        category: initialData.category || "",
        subCategory: initialData.subCategory || "",
        genericName: initialData.genericName || "",
        schedule: initialData.schedule || "",
        rackNo: initialData.rackNo || initialData.rack || "",
        minLevel: initialData.minLevel || "",
        maxLevel: initialData.maxLevel || "",
        reorderPoint: initialData.reorderPoint || "",
        priceControlled: initialData.priceControlled || false,
        hsnCode: initialData.hsnCode || initialData.hsn || "",
        packSize: initialData.packSize || initialData.pack || "",
        gst: initialData.gst || calculatedGst,
        cgstPercent: initialData.cgstPercent || "6",
        sgstPercent: initialData.sgstPercent || "6",
        subHead: initialData.subHead || "",
      });
      setGstMode(hasManualGst ? "manual" : "auto");
      setErrors({});
      setActiveTab("basic");
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, initialData]);

  // ── NO global keydown listener here ──
  // The <form onSubmit> handles Enter natively.
  // Escape is handled by the parent (BatchProductModal closes the inner modal
  // via onClose, which sets showProductModal = false).

  const stats = useMemo(
    () => ({
      isValid:
        !!formData.name.trim() && !!formData.manufacturer.trim(),
    }),
    [formData.name, formData.manufacturer],
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim())
      newErrors.name = "Product name is required";
    if (!formData.manufacturer.trim())
      newErrors.manufacturer = "Manufacturer is required";
    if (
      formData.minLevel &&
      formData.maxLevel &&
      Number(formData.minLevel) >= Number(formData.maxLevel)
    ) {
      newErrors.maxLevel = "Max must be greater than min";
    }
    if (gstMode === "manual") {
      const cgst = parseFloat(formData.cgstPercent) || 0;
      const sgst = parseFloat(formData.sgstPercent) || 0;
      if (cgst + sgst > 28)
        newErrors.cgstPercent = "Total GST cannot exceed 28%";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGSTChange = (value) => {
    const gst = parseFloat(value) || 0;
    const half = (gst / 2).toFixed(2);
    setFormData((prev) => ({
      ...prev,
      gst: value,
      cgstPercent: half,
      sgstPercent: half,
    }));
  };

  const handleTaxChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      const cgst =
        field === "cgstPercent" ? numValue : parseFloat(prev.cgstPercent) || 0;
      const sgst =
        field === "sgstPercent" ? numValue : parseFloat(prev.sgstPercent) || 0;
      newData.gst = String(cgst + sgst);
      return newData;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleGstMode = () => {
    if (gstMode === "auto") {
      setGstMode("manual");
    } else {
      const gst = parseFloat(formData.gst) || 12;
      const half = (gst / 2).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        cgstPercent: half,
        sgstPercent: half,
      }));
      setGstMode("auto");
    }
  };

  // This is called by the <form>'s onSubmit — triggered by Enter OR clicking
  // the submit button. Both paths go through here.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Jump to the tab that has the first error
      if (errors.name || errors.manufacturer) setActiveTab("basic");
      else if (errors.maxLevel) setActiveTab("storage");
      return;
    }

    setIsSubmitting(true);
    try {
      const toNum = (val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      await onSave({
        name: formData.name.trim(),
        manufacturer: formData.manufacturer.trim(),
        genericName: formData.genericName?.trim() || null,
        category: formData.category?.trim() || null,
        subCategory: formData.subCategory?.trim() || null,
        schedule: formData.schedule || null,
        hsnCode: formData.hsnCode?.trim() || null,
        packSize: formData.packSize?.trim() || null,
        gst: toNum(formData.gst) ?? 12,
        cgstPercent: toNum(formData.cgstPercent) ?? 6,
        sgstPercent: toNum(formData.sgstPercent) ?? 6,
        rackNo: formData.rackNo?.trim()?.toUpperCase() || null,
        min_stock_level: toNum(formData.minLevel),
        max_stock_level: toNum(formData.maxLevel),
        reorder_point: toNum(formData.reorderPoint),
        priceControlled: formData.priceControlled || false,
        subHead: formData.subHead?.trim() || null,
      });

      // onSave's parent (handleSaveProduct in BatchProductModal) calls onClose
      // so we don't need to call onClose() here.
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Failed to save product",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-poppins"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "min(680px, calc(100vh - 2rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <div className="shrink-0 bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">
                  {mode === "create" ? "Add New Product" : "Edit Product"}
                </h2>
                <p className="text-white/50 text-[11px] mt-0.5">
                  Medicine Master Entry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stats.isValid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle size={10} /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/20">
                  <AlertTriangle size={10} /> Incomplete
                </span>
              )}
              {/* ← type="button" — critical, prevents form submission */}
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

        {/* ═══════════ BODY ═══════════ */}
        <form onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">

          {/* ── LEFT SIDEBAR TABS ── */}
          <div className="shrink-0 w-48 bg-gray-50 border-r border-gray-100 flex flex-col py-3 gap-0.5 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasError = tab.errorKeys.some((k) => errors[k]);

              return (
                <button
                  key={tab.id}
                  type="button" // ← critical: prevents form submit on tab click
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full text-left px-3 py-3 rounded-xl transition-all group
                    ${isActive
                      ? "bg-white shadow-sm border border-gray-200"
                      : "hover:bg-white/60"
                    }
                  `}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isActive ? "bg-indigo-600" : "bg-gray-200 group-hover:bg-gray-300"
                    }`}>
                      <Icon size={14} className={isActive ? "text-white" : "text-gray-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold leading-tight truncate ${
                          isActive ? "text-gray-900" : "text-gray-600"
                        }`}>
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

            <div className="mt-auto px-2 pb-2 pt-3 border-t border-gray-100 mt-3">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="text-red-400 font-bold">*</span> Required
                fields must be filled before saving.
              </p>
            </div>
          </div>

          {/* ── RIGHT CONTENT PANEL ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "basic" && (
                <BasicInfoPanel
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                />
              )}
              {activeTab === "storage" && (
                <StoragePanel
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                />
              )}
              {activeTab === "pricing" && (
                <PricingPanel
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  gstMode={gstMode}
                  toggleGstMode={toggleGstMode}
                  handleGSTChange={handleGSTChange}
                  handleTaxChange={handleTaxChange}
                />
              )}

              {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{errors.submit}</p>
                </div>
              )}
            </div>

            {/* ── FOOTER ── */}
            <div className="shrink-0 px-5 py-3 bg-gray-50 border-t border-gray-100
              flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  stats.isValid ? "bg-emerald-500" : "bg-amber-400"
                }`} />
                <span className="text-[10px] text-gray-400">
                  {stats.isValid
                    ? "Ready to save"
                    : "Fill name & manufacturer to continue"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* ← type="button" — prevents Enter from hitting Cancel */}
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

                {/*
                  ← type="submit" — this is what Enter triggers.
                  The form's onSubmit fires when Enter is pressed inside
                  any text input within the form, which calls handleSubmit.
                */}
                <button
                  type="submit"
                  disabled={isSubmitting || !stats.isValid}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm
                    font-semibold transition-all ${
                      stats.isValid && !isSubmitting
                        ? "bg-[#05015A] text-white hover:bg-[#0a0280] shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      {mode === "create" ? "Add Product" : "Update Product"}
                      {/* Enter key hint */}
                      <kbd className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono
                        bg-white/20 text-white/70 border border-white/20 leading-none">
                        Enter
                      </kbd>
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

export default ProductMasterModal;