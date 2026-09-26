// pharmacy-web/src/components/common/BatchProductModal.jsx (do not remove this comment)
// src/components/common/BatchProductModal.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  X,
  Package,
  SkipForward,
  Plus,
  Check,
  Loader2,
  Building2,
  Hash,
  MapPin,
  Percent,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import ProductMasterModal from "./ProductMasterModal";

const CatalogBadge = ({ catalogMatch }) => {
  if (!catalogMatch) return null;
  const config = {
    AUTO_LINKED: { label: "Catalog Linked", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    PENDING:     { label: "Pending Review", bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"   },
    NO_MATCH:    { label: "Not in Catalog", bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-600",   dot: "bg-slate-400"   },
  };
  const c = config[catalogMatch.status] || config.NO_MATCH;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const DetailField = ({ icon: Icon, label, value, detected = false }) => (
  <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${detected ? "bg-emerald-50" : "bg-gray-100"}`}>
      <Icon size={14} className={detected ? "text-emerald-600" : "text-gray-400"} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
      <p className={`text-xs font-medium truncate mt-0.5 ${value && value !== "Not specified" ? "text-gray-900" : "text-gray-400 italic"}`}>
        {value || "Not specified"}
      </p>
    </div>
    {detected && <Check size={12} className="text-emerald-500 shrink-0" />}
  </div>
);

const BatchProductModal = ({
  open,
  onClose,
  newProducts = [],
  onSaveAll,
  onSkipAll,
  isSaving = false,
}) => {
  const [currentIndex, setCurrentIndex]         = useState(0);
  const [savedProducts, setSavedProducts]       = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({});
  const addButtonRef = useRef(null);

  // ── KEY: always-current refs so callbacks never read stale closure values ──
  const currentIndexRef   = useRef(0);
  const savedProductsRef  = useRef([]);
  const newProductsRef    = useRef(newProducts);

  // Keep refs in sync with state/props on every render
  currentIndexRef.current  = currentIndex;
  savedProductsRef.current = savedProducts;
  newProductsRef.current   = newProducts;

  // ── Reset when modal opens ──
  useEffect(() => {
    if (open && newProducts.length > 0) {
      setCurrentIndex(0);
      setSavedProducts([]);
      setProcessingStatus({});
      setShowProductModal(false);
    }
  }, [open, newProducts]);

  // ── Auto-focus "Add Product Details" button ──
  useEffect(() => {
    if (open && !showProductModal && !isSaving) {
      const t = setTimeout(() => addButtonRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, currentIndex, showProductModal, isSaving]);

  const currentProduct = newProducts[currentIndex];

  const progress = newProducts.length > 0
    ? (Object.keys(processingStatus).length / newProducts.length) * 100
    : 0;

  const savedCount = useMemo(
    () => Object.values(processingStatus).filter((s) => s === "saved").length,
    [processingStatus],
  );
  const skippedCount = useMemo(
    () => Object.values(processingStatus).filter((s) => s === "skipped").length,
    [processingStatus],
  );
  const remainingCount = newProducts.length - Object.keys(processingStatus).length;

  // ─────────────────────────────────────────────────────────────────────────
  // CORE: advance to next product or finish
  // Uses refs so it ALWAYS reads the current index/products, never stale ones
  // ─────────────────────────────────────────────────────────────────────────
  const advance = useCallback((statusToMark, enrichedProduct = null) => {
    const idx      = currentIndexRef.current;
    const products = newProductsRef.current;
    const isLast   = idx >= products.length - 1;

    // 1. Mark this index as processed
    setProcessingStatus((prev) => ({ ...prev, [idx]: statusToMark }));

    // 2. If saving, add enriched product to the list
    if (enrichedProduct) {
      setSavedProducts((prev) => [...prev, enrichedProduct]);
    }

    // 3. Close inner modal
    setShowProductModal(false);

    if (isLast) {
      // 4a. Last product — fire onSaveAll with everything saved so far
      //     We read savedProductsRef because setSavedProducts above
      //     hasn't flushed yet; we manually append enrichedProduct if present.
      const finalList = enrichedProduct
        ? [...savedProductsRef.current, enrichedProduct]
        : savedProductsRef.current;

      onSaveAll(finalList);
      onClose();
    } else {
      // 4b. Move to next — plain increment, no stale closure risk
      setCurrentIndex(idx + 1);
    }
  }, [onSaveAll, onClose]);
  // Note: currentIndexRef / savedProductsRef / newProductsRef are stable refs,
  // so they don't need to be in the dep array.

  // ── Skip single product ──
  const handleSkipProduct = useCallback(() => {
    if (isSaving) return;
    advance("skipped");
  }, [isSaving, advance]);

  // ── Save single product ──
  const handleSaveProduct = useCallback((productFormData) => {
    const enriched = {
      ...productFormData,
      _originalImportName:
        newProductsRef.current[currentIndexRef.current]?.name ||
        productFormData.name,
    };
    advance("saved", enriched);
  }, [advance]);

  // ── Skip all remaining ──
  const handleSkipAll = useCallback(() => {
    onSkipAll();
    onClose();
  }, [onSkipAll, onClose]);

  // ── Keyboard shortcuts (only when inner modal is closed) ──
  useEffect(() => {
    if (!open || showProductModal) return;
    const onKey = (e) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (!isSaving) setShowProductModal(true);
          break;
        case "Tab":
          if (!e.shiftKey) { e.preventDefault(); if (!isSaving) handleSkipProduct(); }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (!isSaving) handleSkipProduct();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, showProductModal, isSaving, handleSkipProduct, onClose]);

  if (!open || !currentProduct) return null;

  // ── Derived display values ──
  const hasHsn          = !!(currentProduct.hsnCode    || currentProduct.hsn);
  const hasRack         = !!(currentProduct.rackNo      || currentProduct.rack);
  const hasPack         = !!(currentProduct.packSize    || currentProduct.pack);
  const hasGst          = !!(currentProduct.gst         || currentProduct.cgstPercent);
  const hasManufacturer = !!(currentProduct.manufacturer || currentProduct.mfac);
  const detectedFieldCount = [hasHsn, hasRack, hasPack, hasGst, hasManufacturer].filter(Boolean).length;

  const gstDisplay = currentProduct.gst
    ? `${currentProduct.gst}%`
    : currentProduct.cgstPercent && currentProduct.sgstPercent
      ? `${parseFloat(currentProduct.cgstPercent) + parseFloat(currentProduct.sgstPercent)}%`
      : null;

  const cgstSgstDisplay = currentProduct.cgstPercent && currentProduct.sgstPercent
    ? `${currentProduct.cgstPercent}% / ${currentProduct.sgstPercent}%`
    : null;

  const getInitialDataForModal = () => ({
    name:         currentProduct.name         || "",
    manufacturer: currentProduct.manufacturer || currentProduct.mfac || "",
    genericName:  currentProduct.genericName  || "",
    category:     currentProduct.category     || "",
    hsnCode:      currentProduct.hsnCode      || currentProduct.hsn  || "",
    packSize:     currentProduct.packSize     || currentProduct.pack  || "",
    rackNo:       currentProduct.rackNo       || currentProduct.rack  || "",
    gst:          currentProduct.gst          || "12",
    cgstPercent:  currentProduct.cgstPercent  || "6",
    sgstPercent:  currentProduct.sgstPercent  || "6",
  });

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div
          className="relative z-10 w-full max-w-4xl mx-4 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ marginTop: "64px", maxHeight: "calc(100vh - 80px)" }}
        >
          {/* ── HEADER ── */}
          <div className="shrink-0 bg-gradient-to-r from-[#05015A] to-[#0a0280] px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                  <Package size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white text-base font-bold leading-tight">
                    Add New Products to Shop
                  </h2>
                  <p className="text-white/60 text-xs mt-0.5">
                    {currentIndex + 1} of {newProducts.length} products to review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all shrink-0 ml-3"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-1.5 flex items-center gap-4 text-[11px]">
              {savedCount  > 0 && (
                <span className="flex items-center gap-1 text-emerald-300">
                  <Check size={11} />{savedCount} added
                </span>
              )}
              {skippedCount > 0 && (
                <span className="flex items-center gap-1 text-white/40">
                  <SkipForward size={11} />{skippedCount} skipped
                </span>
              )}
              {remainingCount > 0 && (
                <span className="text-white/40">{remainingCount} remaining</span>
              )}
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Left: queue */}
            <div className="hidden sm:flex w-44 lg:w-52 shrink-0 bg-gray-50 border-r border-gray-200 flex-col overflow-hidden">
              <div className="p-2.5 overflow-y-auto flex-1">
                <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Queue ({newProducts.length})
                </h3>
                <div className="space-y-0.5">
                  {newProducts.map((product, index) => {
                    const status    = processingStatus[index];
                    const isCurrent = index === currentIndex;
                    const isPast    = index < currentIndex || !!status;
                    const isFuture  = index > currentIndex && !status;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => isPast && setCurrentIndex(index)}
                        disabled={isFuture}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                          isCurrent
                            ? "bg-indigo-50 text-indigo-800 font-medium border border-indigo-200"
                            : status === "saved"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : status === "skipped"
                                ? "bg-gray-100 text-gray-400 line-through"
                                : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {status === "saved" ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check size={9} className="text-emerald-600" />
                          </span>
                        ) : status === "skipped" ? (
                          <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                            <SkipForward size={9} className="text-gray-400" />
                          </span>
                        ) : isCurrent ? (
                          <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-bold text-gray-400">{index + 1}</span>
                          </span>
                        )}
                        <span className="truncate text-[11px]">{product.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: current product */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-5">
              <div className="sm:hidden mb-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <span className="text-xs text-indigo-700 font-medium">
                  Product {currentIndex + 1} of {newProducts.length}
                </span>
                {savedCount > 0 && (
                  <span className="ml-auto text-[10px] text-emerald-600 font-medium">
                    {savedCount} added
                  </span>
                )}
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {currentProduct.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Needs to be added to your shop's medicine list.
                  </p>
                  {currentProduct.catalogMatch && (
                    <div className="mt-2">
                      <CatalogBadge catalogMatch={currentProduct.catalogMatch} />
                    </div>
                  )}
                </div>
              </div>

              {detectedFieldCount > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                  <CheckCircle size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-emerald-700">
                    <span className="font-semibold">{detectedFieldCount} fields detected</span>
                    <span className="text-emerald-600"> — pre-filled in the product form.</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                <DetailField icon={Building2} label="Manufacturer"  value={currentProduct.manufacturer || currentProduct.mfac} detected={hasManufacturer} />
                <DetailField icon={Hash}      label="HSN Code"      value={currentProduct.hsnCode || currentProduct.hsn}        detected={hasHsn} />
                <DetailField icon={MapPin}    label="Rack Location" value={currentProduct.rackNo || currentProduct.rack}        detected={hasRack} />
                <DetailField icon={Package}   label="Pack Size"     value={currentProduct.packSize || currentProduct.pack}      detected={hasPack} />
                <DetailField icon={Percent}   label="GST Rate"      value={gstDisplay || "Default 12%"}                        detected={hasGst} />
                <DetailField icon={Percent}   label="CGST / SGST"   value={cgstSgstDisplay || "6% / 6%"}                       detected={!!currentProduct.cgstPercent} />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  ref={addButtonRef}
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                    bg-[#05015A] text-white font-semibold rounded-xl hover:bg-[#0a0280]
                    transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                >
                  {isSaving ? (
                    <><Loader2 size={16} className="animate-spin" />Saving...</>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Product Details
                      <kbd className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/20 text-white/70 border border-white/20 leading-none">
                        Enter
                      </kbd>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSkipProduct}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-4 py-2.5
                    bg-white text-gray-700 font-medium border border-gray-200 rounded-xl
                    hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  <SkipForward size={16} />
                  Skip
                  <kbd className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-gray-100 text-gray-500 border border-gray-300 leading-none">
                    Tab
                  </kbd>
                </button>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">
                <span className="font-bold text-emerald-600">{savedCount}</span> added
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">
                <span className="font-bold text-gray-600">{skippedCount}</span> skipped
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 border border-gray-300 font-mono text-[9px] text-gray-500 leading-none">Enter</kbd>
                Add details
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 border border-gray-300 font-mono text-[9px] text-gray-500 leading-none">Tab</kbd>
                Skip
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 border border-gray-300 font-mono text-[9px] text-gray-500 leading-none">Esc</kbd>
                Close
              </span>
            </div>
            <button
              type="button"
              onClick={handleSkipAll}
              disabled={isSaving}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors font-medium disabled:opacity-40"
            >
              Skip all ({remainingCount})
            </button>
          </div>
        </div>
      </div>

      {showProductModal && (
        <ProductMasterModal
          open={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSave={handleSaveProduct}
          initialData={getInitialDataForModal()}
          mode="create"
        />
      )}
    </>
  );
};

export default BatchProductModal;