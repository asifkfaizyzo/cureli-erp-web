// cadmin-web/src/pages/MasterMedicines/comps/ReviewDetailModal.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/ReviewDetailModal.jsx

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  XCircle,
  RefreshCw,
  ArrowRight,
  Store,
  Pill,
  ImageOff,
  Package,
  Tag,
  Building2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Beaker,
  Clock,
  Hash,
  IndianRupee,
  FileText,
  Layers,
} from "lucide-react";
import {
  getMasterMedicineById,
  getImageUrl,
} from "../../../api/cadminMasterMedicines";

const ReviewDetailModal = ({
  isOpen,
  item,
  onClose,
  onAccept,
  onChange,
  onReject,
}) => {
  const [masterDetail, setMasterDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    if (isOpen && item?.suggestedMaster?.id) {
      loadMasterDetails(item.suggestedMaster.id);
      setSelectedImageIdx(0);
      setShowAllVariants(false);
    } else {
      setMasterDetail(null);
    }
  }, [isOpen, item]);

  const loadMasterDetails = async (masterId) => {
    try {
      setLoading(true);
      const res = await getMasterMedicineById(masterId);
      if (res.data?.data) setMasterDetail(res.data.data);
    } catch (error) {
      console.error("Failed to load master details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Find the best matching variant
  const matchingVariant = useMemo(() => {
    if (!masterDetail?.variants?.length) return null;
    return (
      masterDetail.variants.find(
        (v) => v.name?.toLowerCase() === item?.rawName?.toLowerCase(),
      ) || masterDetail.variants[0]
    );
  }, [masterDetail, item]);

  // Get all unique images (from master images table)
  const allImages = useMemo(() => {
    if (!masterDetail?.images?.length) return [];
    return masterDetail.images.map((img) => ({
      ...img,
      resolvedUrl: getImageUrl(img.url),
    }));
  }, [masterDetail]);

  // Primary image for the hero section
  const primaryImage = useMemo(() => {
    const primary = allImages.find((img) => img.type === "PRIMARY");
    return primary || allImages[0] || null;
  }, [allImages]);

  if (!isOpen || !item) return null;

  const shopMed = item.shopMedicine || {};
  const confidence = item.confidenceScore || 0;
  const confidenceBarColor =
    confidence >= 90
      ? "bg-green-500"
      : confidence >= 70
        ? "bg-yellow-500"
        : "bg-red-500";
  const confidenceBadgeClass =
    confidence >= 90
      ? "bg-green-100 text-green-700 border-green-200"
      : confidence >= 70
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : "bg-red-100 text-red-700 border-red-200";

  const visibleVariants = showAllVariants
    ? masterDetail?.variants
    : masterDetail?.variants?.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* ══════════════ COMPACT HEADER ══════════════ */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Pill size={16} className="text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Review Match
                </span>
              </div>

              {/* Compact match flow */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="font-semibold text-gray-900 truncate max-w-[200px]"
                  title={item.rawName}
                >
                  {item.rawName}
                </span>
                <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
                <span
                  className="font-semibold text-indigo-700 truncate max-w-[200px]"
                  title={item.suggestedMaster?.name}
                >
                  {item.suggestedMaster?.name || "—"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${confidenceBadgeClass}`}
                >
                  {confidence}%
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Confidence reason bar */}
          {item.confidenceReason && (
            <div className="flex items-center gap-2 mt-2 ml-12">
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                <div
                  className={`h-full rounded-full ${confidenceBarColor}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 truncate">
                {item.confidenceReason}
              </span>
            </div>
          )}
        </div>

        {/* ══════════════ BODY — FIXED TWO-COLUMN LAYOUT ══════════════ */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="text-indigo-500 animate-spin" />
              <span className="ml-3 text-gray-500">Loading details...</span>
            </div>
          ) : !masterDetail ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <AlertTriangle size={32} className="mb-2" />
              <p>Could not load medicine details</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 min-h-[500px]">
              {/* ────── LEFT COLUMN: Image + Shop Info (2/5) ────── */}
              <div className="col-span-2 border-r border-gray-100 p-5 flex flex-col gap-5">
                {/* Image gallery */}
                <div className="flex flex-col items-center">
                  {/* Main image */}
                  <div className="w-full aspect-square max-w-[280px] rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {allImages.length > 0 ? (
                      <img
                        src={
                          allImages[selectedImageIdx]?.resolvedUrl ||
                          primaryImage?.resolvedUrl
                        }
                        alt={masterDetail.genericName}
                        className="w-full h-full object-contain p-3"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full items-center justify-center flex-col gap-2 ${
                        allImages.length > 0 ? "hidden" : "flex"
                      }`}
                    >
                      <ImageOff size={40} className="text-gray-300" />
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  </div>

                  {/* Thumbnail strip */}
                  {allImages.length > 1 && (
                    <div className="flex items-center gap-1.5 mt-3 px-2 overflow-x-auto py-1 max-w-[280px]">
                      {allImages.slice(0, 8).map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImageIdx(idx)}
                          className={`w-10 h-10 rounded-lg border flex-shrink-0 overflow-hidden transition-all ${
                            selectedImageIdx === idx
                              ? "border-indigo-500 ring-2 ring-indigo-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <img
                            src={img.resolvedUrl}
                            alt=""
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              e.target.style.opacity = "0.3";
                            }}
                          />
                        </button>
                      ))}
                      {allImages.length > 8 && (
                        <span className="text-xs text-gray-400 flex-shrink-0 px-1">
                          +{allImages.length - 8}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/*  ENHANCED: Shop medicine info card with all available fields */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Store size={12} />
                    Shop Medicine Details
                  </h4>
                  <div className="space-y-2">
                    <DetailRow label="Name" value={item.rawName} bold />
                    {shopMed.manufacturer && (
                      <DetailRow
                        label="Manufacturer"
                        value={shopMed.manufacturer}
                      />
                    )}
                    {shopMed.genericName && (
                      <DetailRow
                        label="Generic Name"
                        value={shopMed.genericName}
                      />
                    )}
                    {shopMed.category && (
                      <DetailRow label="Category" value={shopMed.category} />
                    )}
                    {shopMed.subCategory && (
                      <DetailRow
                        label="Sub-Category"
                        value={shopMed.subCategory}
                      />
                    )}
                    {shopMed.schedule && (
                      <DetailRow
                        label="Schedule"
                        value={`Schedule ${shopMed.schedule}`}
                      />
                    )}
                    {shopMed.packSize && (
                      <DetailRow label="Pack Size" value={shopMed.packSize} />
                    )}
                    {shopMed.hsnCode && (
                      <DetailRow
                        label="HSN Code"
                        value={shopMed.hsnCode}
                        mono
                      />
                    )}
                    <div className="border-t border-gray-200 my-2" />
                    <DetailRow label="Shop" value={item.shopName} />
                    {item.branchName && (
                      <DetailRow label="Branch" value={item.branchName} />
                    )}
                    <DetailRow
                      label="Occurrences"
                      value={item.occurrenceCount}
                    />
                    <DetailRow
                      label="First Seen"
                      value={
                        item.firstSeenAt
                          ? new Date(item.firstSeenAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"
                      }
                    />
                  </div>
                </div>

                {/* Image status */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Images: {allImages.length}</span>
                  <span>•</span>
                  <span
                    className={`font-medium ${
                      masterDetail.imageStatus === "VERIFIED"
                        ? "text-green-600"
                        : masterDetail.imageStatus === "RAW"
                          ? "text-amber-600"
                          : "text-red-500"
                    }`}
                  >
                    {masterDetail.imageStatus}
                  </span>
                </div>
              </div>

              {/* ────── RIGHT COLUMN: Master Details (3/5) ────── */}
              <div className="col-span-3 p-5 flex flex-col gap-5">
                {/* Master info header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        {masterDetail.genericName}
                      </h2>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">
                        {masterDetail.masterKey}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                          masterDetail.type === "DRUG"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {masterDetail.type}
                      </span>
                      {masterDetail.prescriptionRequired && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1">
                          <Shield size={10} />
                          Rx
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick info chips */}
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {masterDetail.form && (
                      <InfoChip icon={Package} label={masterDetail.form} />
                    )}
                    {masterDetail.primaryCategory && (
                      <InfoChip
                        icon={Tag}
                        label={masterDetail.primaryCategory}
                      />
                    )}
                    {masterDetail.priceRange && (
                      <InfoChip
                        icon={IndianRupee}
                        label={`₹${masterDetail.priceRange.min} - ₹${masterDetail.priceRange.max}`}
                      />
                    )}
                    <InfoChip
                      icon={Hash}
                      label={`${masterDetail.variantCount} variants`}
                    />
                    {masterDetail.marketers?.length > 0 && (
                      <InfoChip
                        icon={Building2}
                        label={masterDetail.marketers[0]}
                      />
                    )}
                  </div>
                </div>

                {/*  NEW: Field comparison section — shop vs master */}
                {(shopMed.manufacturer || shopMed.category) && (
                  <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Layers size={12} />
                      Field Comparison
                    </h4>
                    <div className="space-y-2">
                      <ComparisonRow
                        label="Name"
                        shopValue={item.rawName}
                        masterValue={masterDetail.genericName}
                      />
                      {shopMed.manufacturer && (
                        <ComparisonRow
                          label="Manufacturer"
                          shopValue={shopMed.manufacturer}
                          masterValue={masterDetail.manufacturers?.[0] || "—"}
                        />
                      )}
                      {shopMed.category && (
                        <ComparisonRow
                          label="Category"
                          shopValue={shopMed.category}
                          masterValue={masterDetail.primaryCategory || "—"}
                        />
                      )}
                      {shopMed.packSize && (
                        <ComparisonRow
                          label="Pack Size"
                          shopValue={shopMed.packSize}
                          masterValue={matchingVariant?.packSize || "—"}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Composition */}
                {Array.isArray(masterDetail.composition) &&
                  masterDetail.composition.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Beaker size={12} />
                        Composition
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {masterDetail.composition.map((comp, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100"
                          >
                            {comp.name || comp}
                            {comp.strength && (
                              <span className="text-purple-500 ml-1 font-normal">
                                ({comp.strength})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Best matching variant highlight */}
                {matchingVariant && (
                  <div
                    className={`rounded-xl p-4 border-2 ${
                      matchingVariant.name?.toLowerCase() ===
                      item.rawName?.toLowerCase()
                        ? "border-green-300 bg-green-50/50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Check size={12} />
                        {matchingVariant.name?.toLowerCase() ===
                        item.rawName?.toLowerCase()
                          ? "Exact Matching Variant"
                          : "Closest Variant"}
                      </h4>
                      {matchingVariant.name?.toLowerCase() ===
                        item.rawName?.toLowerCase() && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">
                          EXACT
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      <DetailRow
                        label="Name"
                        value={matchingVariant.name}
                        bold
                      />
                      <DetailRow
                        label="Brand"
                        value={matchingVariant.brand || "—"}
                      />
                      <DetailRow
                        label="Strength"
                        value={matchingVariant.strength?.display || "—"}
                      />
                      <DetailRow
                        label="Marketer"
                        value={matchingVariant.marketer || "—"}
                      />
                      <DetailRow
                        label="MRP"
                        value={
                          matchingVariant.pricing?.mrp
                            ? `₹${matchingVariant.pricing.mrp}`
                            : "—"
                        }
                      />
                      <DetailRow
                        label="Pack Size"
                        value={matchingVariant.packSize || "—"}
                      />
                      <DetailRow
                        label="SKU"
                        value={matchingVariant.skuId}
                        mono
                      />
                      <DetailRow
                        label="Selling Price"
                        value={
                          matchingVariant.pricing?.sellingPrice
                            ? `₹${matchingVariant.pricing.sellingPrice}`
                            : "—"
                        }
                      />
                    </div>
                  </div>
                )}

                {/* All variants list */}
                {masterDetail.variants?.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        All Variants ({masterDetail.variants.length})
                      </h4>
                      {masterDetail.variants.length > 5 && (
                        <button
                          onClick={() => setShowAllVariants(!showAllVariants)}
                          className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-0.5"
                        >
                          {showAllVariants ? (
                            <>
                              Less <ChevronUp size={12} />
                            </>
                          ) : (
                            <>
                              All <ChevronDown size={12} />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500">
                              Strength
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500">
                              Marketer
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-500">
                              MRP
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500">
                              Pack
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visibleVariants?.map((v) => {
                            const isMatch =
                              v.name?.toLowerCase() ===
                              item.rawName?.toLowerCase();
                            return (
                              <tr
                                key={v.id}
                                className={
                                  isMatch ? "bg-green-50" : "hover:bg-gray-50"
                                }
                              >
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`font-medium ${isMatch ? "text-green-700" : "text-gray-900"}`}
                                    >
                                      {v.name}
                                    </span>
                                    {isMatch && (
                                      <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold">
                                        MATCH
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {v.strength?.display || "—"}
                                </td>
                                <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">
                                  {v.marketer || "—"}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-900">
                                  {v.pricing?.mrp ? `₹${v.pricing.mrp}` : "—"}
                                </td>
                                <td className="px-3 py-2 text-gray-500">
                                  {v.packSize || "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Description */}
                {matchingVariant?.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {matchingVariant.description
                        .replace(/&rsquo;/g, "'")
                        .replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════ FOOTER — ACTIONS ══════════════ */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-3 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Clock size={14} />
            <span>
              Created{" "}
              {masterDetail?.createdAt
                ? new Date(masterDetail.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onReject(item);
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100
                         text-sm font-medium flex items-center gap-2 transition-colors border border-red-200"
            >
              <XCircle size={15} />
              Reject
            </button>
            <button
              onClick={() => {
                onChange(item);
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100
                         text-sm font-medium flex items-center gap-2 transition-colors border border-blue-200"
            >
              <RefreshCw size={15} />
              Change
            </button>
            <button
              onClick={() => {
                onAccept(item);
                onClose();
              }}
              className="px-5 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700
                         text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Check size={15} />
              Accept Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

const DetailRow = ({ label, value, bold = false, mono = false }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
    <span
      className={`text-xs text-right truncate max-w-[180px] ${
        mono
          ? "font-mono text-gray-500"
          : bold
            ? "font-semibold text-gray-900"
            : "text-gray-700"
      }`}
      title={typeof value === "string" ? value : undefined}
    >
      {value || "—"}
    </span>
  </div>
);

const InfoChip = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
    <Icon size={11} className="text-gray-400" />
    {label}
  </span>
);

//  NEW: Side-by-side comparison row
const ComparisonRow = ({ label, shopValue, masterValue }) => {
  const isMatch =
    shopValue &&
    masterValue &&
    shopValue.toLowerCase().trim() === masterValue.toLowerCase().trim();
  const isPartialMatch =
    !isMatch &&
    shopValue &&
    masterValue &&
    masterValue !== "—" &&
    (shopValue.toLowerCase().includes(masterValue.toLowerCase()) ||
      masterValue.toLowerCase().includes(shopValue.toLowerCase()));

  return (
    <div className="grid grid-cols-[80px_1fr_20px_1fr] items-center gap-2 text-xs">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-gray-700 truncate" title={shopValue}>
        {shopValue || "—"}
      </span>
      <span className="text-center">
        {isMatch ? (
          <Check size={12} className="text-green-500 mx-auto" />
        ) : isPartialMatch ? (
          <span className="text-yellow-500 font-bold">~</span>
        ) : (
          <span className="text-gray-300">≠</span>
        )}
      </span>
      <span className="text-indigo-700 truncate" title={masterValue}>
        {masterValue || "—"}
      </span>
    </div>
  );
};

export default ReviewDetailModal;
