// cadmin-web/src/pages/MasterMedicines/comps/MatchMedicineModal.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/MatchMedicineModal.jsx

import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Search,
  Link2,
  CheckCircle2,
  Image,
  ImageOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Hash,
  Package,
  IndianRupee,
  Building2,
  Pill,
  ChevronLeft,
  Shield,
} from "lucide-react";
import {
  getMasterMedicines,
  getMasterMedicineById,
  getImageUrl,
} from "../../../api/cadminMasterMedicines";

const MatchMedicineModal = ({ isOpen, item, source, onClose, onConfirm }) => {
  // Step state: 1 = search masters, 2 = pick variant
  const [step, setStep] = useState(1);

  // Step 1 state
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedMaster, setSelectedMaster] = useState(null);

  // Step 2 state
  const [masterDetail, setMasterDetail] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantSearch, setVariantSearch] = useState("");

  // Shared
  const [isConfirming, setIsConfirming] = useState(false);

  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const variantSearchRef = useRef(null);

  function transformMaster(med) {
    return {
      id: med.id,
      name: med.genericName,
      genericName: med.genericName,
      masterKey: med.masterKey,
      composition: Array.isArray(med.composition)
        ? med.composition
            .map((c) => (typeof c === "string" ? c : c.name))
            .join(" + ")
        : "N/A",
      type: med.type,
      form: med.form,
      primaryCategory: med.primaryCategory,
      prescriptionRequired: med.prescriptionRequired,
      manufacturer: med.previewVariants?.[0]?.manufacturer || null,
      marketer: med.previewVariants?.[0]?.marketer || null,
      packSize: med.previewVariants?.[0]?.packSize || null,
      hasImage: !!med.primaryImage,
      primaryImage: med.primaryImage,
      variantCount: med.variantCount,
      priceRange: med.priceRange,
      imageStatus: med.imageStatus,
      previewVariants: med.previewVariants || [],
    };
  }

  // Reset on open
  useEffect(() => {
    if (isOpen && item) {
      const initialSearch =
        source === "unmapped"
          ? item.sampleNames?.[0] || item.normalizedName || ""
          : item.rawName || "";
      setSearchText(initialSearch);
      setTypeFilter("");
      setSelectedMaster(null);
      setSelectedVariant(null);
      setMasterDetail(null);
      setIsConfirming(false);
      setSearchResults([]);
      setFocusedIndex(-1);
      setStep(1);
      setVariantSearch("");
      setTimeout(() => searchInputRef.current?.select(), 100);
    }
  }, [isOpen, item, source]);

  // Step 1: Search masters
  useEffect(() => {
    if (!isOpen || step !== 1) return;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const params = { limit: 25, sort: "generic_name", order: "asc" };
        if (searchText.trim()) params.search = searchText.trim();
        if (typeFilter) params.type = typeFilter;
        const res = await getMasterMedicines(params);
        const data = res.data?.data;
        if (data) {
          setSearchResults(data.medicines.map(transformMaster));
          setTotalResults(data.meta?.total || 0);
          setHasMore(
            (data.meta?.page || 1) < (data.meta?.totalPages || 1)
          );
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, typeFilter, isOpen, step]);

  // Go to step 2: load full master with all variants
  const goToStep2 = async (master) => {
    setSelectedMaster(master);
    setSelectedVariant(null);
    setLoadingVariants(true);
    setStep(2);
    setVariantSearch("");
    try {
      const res = await getMasterMedicineById(master.id);
      if (res.data?.data) {
        const detail = res.data.data;
        setMasterDetail(detail);

        // Auto-select: exact name match or single variant
        const rawName = (
          source === "unmapped"
            ? item.sampleNames?.[0] || item.normalizedName
            : item.rawName
        )?.toLowerCase();

        if (detail.variants?.length === 1) {
          setSelectedVariant(detail.variants[0]);
        } else if (rawName) {
          const exact = detail.variants?.find(
            (v) => v.name?.toLowerCase() === rawName
          );
          if (exact) setSelectedVariant(exact);
        }
      }
    } catch (err) {
      console.error("Failed to load master details:", err);
    } finally {
      setLoadingVariants(false);
    }
    setTimeout(() => variantSearchRef.current?.focus(), 200);
  };

  const goBackToStep1 = () => {
    setStep(1);
    setSelectedVariant(null);
    setMasterDetail(null);
    setSelectedMaster(null);
  };

  // Filtered variants for step 2
  const filteredVariants = useMemo(() => {
    if (!masterDetail?.variants) return [];
    if (!variantSearch.trim()) return masterDetail.variants;
    const s = variantSearch.toLowerCase();
    return masterDetail.variants.filter(
      (v) =>
        v.name?.toLowerCase().includes(s) ||
        v.brand?.toLowerCase().includes(s) ||
        v.manufacturer?.toLowerCase().includes(s) ||
        v.skuId?.toLowerCase().includes(s)
    );
  }, [masterDetail, variantSearch]);

  // Keyboard
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (step === 2) goBackToStep1();
        else onClose();
        return;
      }
      if (step === 1 && searchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIndex((p) =>
            p < searchResults.length - 1 ? p + 1 : p
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIndex((p) => (p > 0 ? p - 1 : -1));
        } else if (e.key === "Enter" && focusedIndex >= 0) {
          e.preventDefault();
          goToStep2(searchResults[focusedIndex]);
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, step, searchResults, focusedIndex, onClose]);

  // Scroll focused into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-result-item]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  if (!isOpen || !item) return null;

  const handleConfirm = async () => {
    if (!selectedVariant || !selectedMaster) return;
    setIsConfirming(true);
    await new Promise((r) => setTimeout(r, 500));
    onConfirm({
      master: selectedMaster,
      variant: selectedVariant,
      id: selectedMaster.id,
      variantId: selectedVariant.id,
      name: selectedMaster.name,
      variantName: selectedVariant.name,
    });
  };

  const itemName =
    source === "unmapped"
      ? item.sampleNames?.[0] || item.normalizedName
      : item.rawName;
  const itemManufacturer =
    source === "unmapped"
      ? item.manufacturers?.[0]
      : item.shopMedicine?.manufacturer;

  // Helper to get variant image URL
  const getVariantImageUrl = (variant) => {
    if (!variant?.images?.length) return null;
    const img = variant.images[0];
    return getImageUrl(typeof img === "string" ? img : img);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => (step === 2 ? goBackToStep1() : onClose())}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══════════════ HEADER ══════════════ */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  onClick={goBackToStep1}
                  className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Link2 size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">
                  {step === 1
                    ? "Step 1: Select Master Medicine"
                    : "Step 2: Pick Variant"}
                </h2>
                <p className="text-white/70 text-sm">
                  {step === 1
                    ? "Search the catalog to find the right medicine group"
                    : `Choose the exact variant from "${selectedMaster?.name}"`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 1
                      ? "bg-white text-blue-600"
                      : "bg-white/30 text-white"
                  }`}
                >
                  1
                </div>
                <div className="w-5 h-0.5 bg-white/30" />
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 2
                      ? "bg-white text-blue-600"
                      : "bg-white/30 text-white"
                  }`}
                >
                  2
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors ml-2"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Source Info */}
        <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-blue-600 font-medium">
              Matching:
            </span>
            <span className="px-2.5 py-0.5 bg-white rounded-md text-sm font-semibold text-gray-800 shadow-sm">
              {itemName}
            </span>
            {itemManufacturer && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Building2 size={10} />
                {itemManufacturer}
              </span>
            )}
            {source === "unmapped" && (
              <span className="text-xs text-blue-400">
                {item.occurrenceCount}× • {item.shopCount} shops
              </span>
            )}
            {source === "review" && (
              <span className="text-xs text-blue-400">
                Confidence: {item.confidenceScore}%
              </span>
            )}
          </div>
        </div>

        {/* ══════════════ STEP 1: MASTER SEARCH ══════════════ */}
        {step === 1 && (
          <>
            <div className="px-6 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by name, composition, or manufacturer..."
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setFocusedIndex(-1);
                    }}
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm
                               focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {searchText && (
                    <button
                      onClick={() => setSearchText("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {["", "DRUG", "OTC"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        typeFilter === t
                          ? "bg-[#0a0280] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t === "" ? "All" : t}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {isSearching
                  ? "Searching..."
                  : `${totalResults} results • Click a master to see its variants →`}
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto" ref={listRef}>
              {isSearching && searchResults.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <Loader2 size={28} className="animate-spin mr-3" />
                  <p>Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <AlertCircle size={40} className="mb-3" />
                  <p className="text-sm font-medium">No medicines found</p>
                  <p className="text-xs mt-1">Try different search terms</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((med, idx) => {
                    const isFocused = focusedIndex === idx;
                    return (
                      <button
                        key={med.id}
                        data-result-item
                        onClick={() => goToStep2(med)}
                        className={`w-full px-5 py-3.5 text-left transition-all ${
                          isFocused
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : "border-l-4 border-l-transparent hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Image */}
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200 ${
                              med.hasImage ? "bg-white" : "bg-gray-100"
                            }`}
                          >
                            {med.hasImage && med.primaryImage ? (
                              <img
                                src={getImageUrl(med.primaryImage)}
                                alt={med.name}
                                className="w-full h-full object-contain p-0.5"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling.style.display =
                                    "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full items-center justify-center ${
                                med.hasImage && med.primaryImage
                                  ? "hidden"
                                  : "flex"
                              }`}
                            >
                              <ImageOff
                                size={16}
                                className="text-gray-300"
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-semibold truncate text-sm text-gray-900">
                                {med.name}
                              </h4>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                                  med.type === "DRUG"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {med.type}
                              </span>
                              {med.prescriptionRequired && (
                                <span className="px-1 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded flex-shrink-0">
                                  Rx
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                              {med.form && (
                                <span className="flex items-center gap-0.5">
                                  <Package size={9} />
                                  {med.form}
                                </span>
                              )}
                              {med.manufacturer && (
                                <span className="flex items-center gap-0.5">
                                  <Building2 size={9} />
                                  {med.manufacturer}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 font-medium">
                                <Hash size={9} />
                                {med.variantCount} variants
                              </span>
                              {med.priceRange && (
                                <span className="flex items-center gap-0.5">
                                  <IndianRupee size={9} />₹
                                  {med.priceRange.min}-₹{med.priceRange.max}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight
                            size={16}
                            className="text-gray-300 flex-shrink-0 mt-2"
                          />
                        </div>
                      </button>
                    );
                  })}
                  {hasMore && (
                    <div className="px-5 py-3 text-center">
                      <span className="text-xs text-gray-400">
                        Showing {searchResults.length} of {totalResults} —
                        refine search to see more
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════ STEP 2: VARIANT SELECTION ══════════════ */}
        {step === 2 && (
          <>
            {/* Master summary */}
            <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-indigo-600 font-medium">
                  Master:
                </span>
                <span className="px-2.5 py-0.5 bg-white rounded-md text-sm font-semibold text-gray-800 shadow-sm">
                  {selectedMaster?.name}
                </span>
                {selectedMaster?.form && (
                  <span className="text-xs text-indigo-400">
                    {selectedMaster.form}
                  </span>
                )}
                <span className="text-xs text-indigo-400">
                  {selectedMaster?.variantCount} variants
                </span>
                <button
                  onClick={goBackToStep1}
                  className="ml-auto text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
                >
                  <ChevronLeft size={12} />
                  Change
                </button>
              </div>
            </div>

            {/* Variant search */}
            <div className="px-6 py-2.5 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={variantSearchRef}
                  type="text"
                  placeholder="Filter variants by name, brand, SKU..."
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 border border-gray-300 rounded-lg text-sm
                             focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Variants list + preview */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* LEFT: Variant list */}
              <div className="flex-1 overflow-y-auto">
                {loadingVariants ? (
                  <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 size={28} className="animate-spin mr-3" />
                    <p>Loading variants...</p>
                  </div>
                ) : filteredVariants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Package size={40} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">No variants found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredVariants.map((variant) => {
                      const isSelected =
                        selectedVariant?.id === variant.id;
                      const isNameMatch =
                        variant.name?.toLowerCase() ===
                        itemName?.toLowerCase();
                      const vImgUrl = getVariantImageUrl(variant);

                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`w-full px-5 py-3.5 text-left transition-all ${
                            isSelected
                              ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                              : isNameMatch
                                ? "bg-green-50/50 border-l-4 border-l-green-400"
                                : "border-l-4 border-l-transparent hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Variant image */}
                            <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {vImgUrl ? (
                                <img
                                  src={vImgUrl}
                                  alt={variant.name}
                                  className="w-full h-full object-contain p-0.5"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextElementSibling.style.display =
                                      "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full items-center justify-center ${
                                  vImgUrl ? "hidden" : "flex"
                                }`}
                              >
                                <ImageOff
                                  size={16}
                                  className="text-gray-300"
                                />
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span
                                  className={`font-semibold text-sm truncate ${
                                    isSelected
                                      ? "text-indigo-700"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {variant.name}
                                </span>
                                {isNameMatch && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold flex-shrink-0">
                                    NAME MATCH
                                  </span>
                                )}
                                {variant.strength?.display && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium flex-shrink-0">
                                    {variant.strength.display}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                                <span className="font-mono">
                                  {variant.skuId}
                                </span>
                                {variant.brand && (
                                  <span>{variant.brand}</span>
                                )}
                                {variant.manufacturer && (
                                  <span className="flex items-center gap-0.5">
                                    <Building2 size={9} />
                                    {variant.manufacturer}
                                  </span>
                                )}
                                {variant.packSize && (
                                  <span>{variant.packSize}</span>
                                )}
                              </div>
                            </div>

                            {/* Price + check */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {variant.pricing?.mrp && (
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400">
                                    MRP
                                  </p>
                                  <p className="font-bold text-gray-900 text-sm">
                                    ₹{variant.pricing.mrp}
                                  </p>
                                </div>
                              )}
                              {isSelected ? (
                                <CheckCircle2
                                  size={22}
                                  className="text-indigo-500"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT: Selected variant preview with image */}
              <div className="w-[300px] flex-shrink-0 overflow-y-auto bg-gray-50/50 p-4 border-l border-gray-100">
                {selectedVariant ? (
                  <VariantPreview
                    variant={selectedVariant}
                    master={selectedMaster}
                    itemName={itemName}
                    getVariantImageUrl={getVariantImageUrl}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                      <Package size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      Select a variant
                    </p>
                    <p className="text-xs text-gray-400 mt-1 text-center px-4">
                      Choose the exact product this shop medicine corresponds
                      to
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════════════ FOOTER ══════════════ */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {step === 1
                ? `${totalResults} master(s)`
                : `${filteredVariants.length} variant(s)`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={step === 2 ? goBackToStep1 : onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                {step === 2 ? "← Back" : "Cancel"}
              </button>
              {step === 2 && (
                <button
                  onClick={handleConfirm}
                  disabled={!selectedVariant || isConfirming}
                  className="px-6 py-2 bg-[#0a0280] text-white rounded-lg text-sm font-semibold
                             flex items-center gap-2 hover:bg-[#1a10a0] transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} />
                      Link to Variant
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// VARIANT PREVIEW — shows image, details, composition, link preview
// ═══════════════════════════════════════════════════════════════

const VariantPreview = ({ variant, master, itemName, getVariantImageUrl }) => {
  const vImgUrl = getVariantImageUrl(variant);

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
        Selected Variant
      </p>

      {/* Large variant image */}
      <div className="w-full aspect-square max-w-[220px] mx-auto rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
        {vImgUrl ? (
          <img
            src={vImgUrl}
            alt={variant.name}
            className="w-full h-full object-contain p-3"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex-col gap-2 items-center justify-center ${
            vImgUrl ? "hidden" : "flex"
          }`}
        >
          <ImageOff size={32} className="text-gray-300" />
          <span className="text-xs text-gray-400">No image</span>
        </div>
      </div>

      {/* Name + SKU */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 leading-tight">
          {variant.name}
        </h3>
        <p className="text-xs text-gray-500 font-mono mt-0.5">
          SKU: {variant.skuId}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <PreviewRow label="Brand" value={variant.brand || "—"} />
        <PreviewRow
          label="Strength"
          value={variant.strength?.display || "—"}
        />
        <PreviewRow
          label="Manufacturer"
          value={variant.manufacturer || "—"}
        />
        <PreviewRow label="Marketer" value={variant.marketer || "—"} />
        <PreviewRow label="Pack Size" value={variant.packSize || "—"} />
        <PreviewRow
          label="MRP"
          value={
            variant.pricing?.mrp ? `₹${variant.pricing.mrp}` : "—"
          }
        />
        <PreviewRow
          label="Selling"
          value={
            variant.pricing?.sellingPrice
              ? `₹${variant.pricing.sellingPrice}`
              : "—"
          }
        />
      </div>

      {/* Composition */}
      {Array.isArray(variant.composition) &&
        variant.composition.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-gray-400 mb-1">
              Composition
            </p>
            <div className="flex flex-wrap gap-1">
              {variant.composition.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium border border-purple-100"
                >
                  {c.name || c}
                  {c.strength && ` (${c.strength})`}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* Link preview */}
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-[10px] text-blue-500 font-medium mb-2">
          LINK PREVIEW
        </p>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-[11px] font-medium truncate max-w-[90px]">
            {itemName}
          </span>
          <ArrowRight size={12} className="text-blue-400 flex-shrink-0" />
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[11px] font-medium truncate max-w-[90px]">
            {variant.name}
          </span>
        </div>
        <p className="text-[10px] text-blue-400 mt-1.5">
          Under: {master?.name}
        </p>
      </div>
    </div>
  );
};

const PreviewRow = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-[11px] text-gray-400 flex-shrink-0">{label}</span>
    <span className="text-xs text-gray-700 font-medium text-right truncate max-w-[140px]">
      {value || "—"}
    </span>
  </div>
);

export default MatchMedicineModal;