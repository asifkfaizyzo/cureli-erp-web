// cadmin-web/src/pages/MasterMedicines/comps/MasterMedicineDetailModal.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/MasterMedicineDetailModal.jsx

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Pill,
  Building2,
  Package,
  Link2,
  Upload,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImageOff,
  Eye,
  Calendar,
  Hash,
  Store,
  Shield,
  Beaker,
  Tag,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Unlink,
  Clock,
} from "lucide-react";
import {
  getImageStatusInfo,
  getImageUrl,
} from "../../../api/cadminMasterMedicines";

const MasterMedicineDetailModal = ({
  isOpen,
  medicine,
  linkedData = [],
  onClose,
  onUploadImage,
  onViewVariantLinked,
  onEdit,
  onDelete,
  zIndex = 50,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedVariant, setExpandedVariant] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setExpandedVariant(null);
      setSelectedImageIdx(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const allImages = useMemo(() => {
    if (!medicine?.images?.length) return [];
    return medicine.images.map((img) => ({
      ...img,
      resolvedUrl: getImageUrl(img.url),
    }));
  }, [medicine]);

  if (!isOpen || !medicine) return null;

  const statusInfo = getImageStatusInfo(medicine.imageStatus);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "variants", label: "Variants", count: medicine.variantCount || 0 },
    { id: "linked", label: "Linked", count: linkedData.length },
    { id: "images", label: "Images", count: allImages.length },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}          
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* ── Modal container: fixed height instead of auto-sizing ── */}
      <div
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "min(92vh, 900px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══════════════ HEADER ══════════════ */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] flex-shrink-0 border-b border-gray-200 px-6 pt-5 pb-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            {/* Left: medicine identity */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {/* Image preview in header */}
              <div className="w-14 h-14 rounded-xl border border-gray-200 bg-indigo-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[0].resolvedUrl}
                    alt={medicine.genericName}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full items-center justify-center ${allImages.length > 0 ? "hidden" : "flex"}`}
                >
                  <Pill size={24} className="text-gray-300" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white truncate">
                    {medicine.genericName}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 ${
                      medicine.type === "DRUG"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {medicine.type}
                  </span>
                  {medicine.prescriptionRequired && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                      <Shield size={10} /> Rx
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 ${statusInfo.bgClass} ${statusInfo.textClass}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm font-mono text-gray-300">
                    {medicine.masterKey}
                  </span>
                  {medicine.form && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Package size={12} /> {medicine.form}
                    </span>
                  )}
                  {medicine.primaryCategory && (
                    <span className="flex items-center gap-1 text-sm text-gray-300">
                      <Tag size={12} /> {medicine.primaryCategory}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onUploadImage(medicine)}
                className="h-9 px-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Upload size={14} /> Images
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-6 mb-3 flex-wrap">
            <QuickStat
              icon={Package}
              label={`${medicine.variantCount || 0} Variants`}
            />
            <QuickStat icon={Link2} label={`${linkedData.length} Linked`} />
            <QuickStat icon={ImageIcon} label={`${allImages.length} Images`} />
            {medicine.priceRange && (
              <QuickStat
                icon={IndianRupee}
                label={`₹${medicine.priceRange.min} – ₹${medicine.priceRange.max}`}
              />
            )}
            <QuickStat
              icon={Calendar}
              label={`Updated ${new Date(medicine.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
            />
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 mt-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-700"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                      activeTab === tab.id
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-white/15 text-white/80"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════ CONTENT — fills remaining space, scrolls internally ══════════════ */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === "overview" && (
            <OverviewTab
              medicine={medicine}
              allImages={allImages}
              selectedImageIdx={selectedImageIdx}
              setSelectedImageIdx={setSelectedImageIdx}
            />
          )}
          {activeTab === "variants" && (
            <VariantsTab
              variants={medicine.variants || []}
              expandedVariant={expandedVariant}
              setExpandedVariant={setExpandedVariant}
              onViewVariantLinked={onViewVariantLinked}
            />
          )}
          {activeTab === "linked" && <LinkedTab linkedData={linkedData} />}
          {activeTab === "images" && (
            <ImagesTab
              images={allImages}
              onUploadImage={() => onUploadImage(medicine)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

const OverviewTab = ({
  medicine,
  allImages,
  selectedImageIdx,
  setSelectedImageIdx,
}) => {
  return (
    <div className="grid grid-cols-5 h-full">
      {/* Left column: image gallery */}
      <div className="col-span-2 border-r border-gray-100 p-6 flex flex-col gap-5">
        {/* Main image */}
        <div className="w-full aspect-square rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[selectedImageIdx]?.resolvedUrl}
                alt={medicine.genericName}
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
              <div className="w-full h-full hidden items-center justify-center flex-col gap-2">
                <ImageOff size={36} className="text-gray-300" />
                <span className="text-xs text-gray-400">Image unavailable</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <ImageOff size={48} />
              <span className="text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {allImages.slice(0, 10).map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedImageIdx(idx)}
                className={`w-12 h-12 rounded-lg border flex-shrink-0 overflow-hidden transition-all ${
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
            {allImages.length > 10 && (
              <span className="text-xs text-gray-400 flex-shrink-0">
                +{allImages.length - 10} more
              </span>
            )}
          </div>
        )}

        {/* Primary image badge */}
        {allImages[selectedImageIdx] && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {allImages[selectedImageIdx].type === "PRIMARY" && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                PRIMARY
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded font-medium ${
                allImages[selectedImageIdx].source === "UPLOADED"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {allImages[selectedImageIdx].source}
            </span>
            {allImages[selectedImageIdx].uploadedBy && (
              <span>by {allImages[selectedImageIdx].uploadedBy}</span>
            )}
          </div>
        )}

        {/* Composition */}
        {Array.isArray(medicine.composition) &&
          medicine.composition.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Beaker size={12} /> Composition
              </h4>
              <div className="flex flex-col gap-1.5">
                {medicine.composition.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-baseline justify-between gap-2 py-1 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {comp.name || comp}
                    </span>
                    {comp.strength && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {comp.strength}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Right column: details */}
      <div className="col-span-3 p-6 flex flex-col gap-5">
        {/* Details grid */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Basic Information
          </h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <DetailField
              label="Generic Name"
              value={medicine.genericName}
              bold
            />
            <DetailField label="Master Key" value={medicine.masterKey} mono />
            <DetailField label="Type" value={medicine.type} />
            <DetailField label="Form" value={medicine.form} />
            <DetailField label="Category" value={medicine.primaryCategory} />
            <DetailField
              label="Rx Required"
              value={medicine.prescriptionRequired ? "Yes" : "No"}
            />
            <DetailField
              label="Price Range"
              value={
                medicine.priceRange
                  ? `₹${medicine.priceRange.min} – ₹${medicine.priceRange.max}`
                  : null
              }
            />
            <DetailField label="Variants" value={medicine.variantCount} />
            <DetailField
              label="Created"
              value={new Date(medicine.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
            <DetailField
              label="Updated"
              value={new Date(medicine.updatedAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
          </div>
        </div>

        {/* Strengths */}
        {medicine.strengths?.length > 0 && (
          <TagGroup
            label="Available Strengths"
            icon={Hash}
            items={medicine.strengths}
            color="purple"
          />
        )}

        {/* Brands */}
        {medicine.brands?.length > 0 && (
          <TagGroup
            label="Brands"
            icon={Tag}
            items={medicine.brands}
            color="blue"
          />
        )}

        {/* Marketers */}
        {medicine.marketers?.length > 0 && (
          <TagGroup
            label="Marketers"
            icon={Building2}
            items={medicine.marketers}
            color="orange"
          />
        )}

        {/* Manufacturers */}
        {medicine.manufacturers?.length > 0 && (
          <TagGroup
            label="Manufacturers"
            icon={Building2}
            items={medicine.manufacturers}
            color="gray"
          />
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// VARIANTS TAB
// ═══════════════════════════════════════════════════════════════

const VariantsTab = ({
  variants,
  expandedVariant,
  setExpandedVariant,
  onViewVariantLinked,
}) => {
  if (!variants?.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={Package}
          title="No Variants"
          subtitle="This medicine has no variants yet"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-2">
      {variants.map((variant) => {
        const isExpanded = expandedVariant === variant.id;

        return (
          <div
            key={variant.id}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Collapsed row */}
            <button
              onClick={() => setExpandedVariant(isExpanded ? null : variant.id)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {variant.images?.[0] ? (
                  <img
                    src={getImageUrl(variant.images[0])}
                    alt={variant.name}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full items-center justify-center ${variant.images?.[0] ? "hidden" : "flex"}`}
                >
                  <ImageOff size={14} className="text-gray-300" />
                </div>
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">
                    {variant.name}
                  </span>
                  {variant.strength?.display && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex-shrink-0">
                      {variant.strength.display}
                    </span>
                  )}
                  {variant.brand && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {variant.brand}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="font-mono">{variant.skuId}</span>
                  {variant.marketer && <span>{variant.marketer}</span>}
                  {variant.packSize && <span>{variant.packSize}</span>}
                </div>
              </div>

              {/* Price */}
              {variant.pricing?.mrp && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">MRP</p>
                  <p className="font-bold text-gray-900">
                    ₹{variant.pricing.mrp}
                  </p>
                </div>
              )}

              <div className="flex-shrink-0 text-gray-400">
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </button>

            {/* Expanded */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/60">
                <div className="grid grid-cols-5 divide-x divide-gray-100">
                  {/* Left: image + pricing */}
                  <div className="col-span-2 p-4 flex flex-col gap-4">
                    {variant.images?.[0] && (
                      <div className="w-full aspect-square max-w-[200px] mx-auto rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(variant.images[0])}
                          alt={variant.name}
                          className="w-full h-full object-contain p-3"
                          onError={(e) => {
                            e.target.style.opacity = "0.3";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: details */}
                  <div className="col-span-3 p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <DetailField
                        label="SKU ID"
                        value={variant.skuId}
                        mono
                        small
                      />
                      <DetailField label="Brand" value={variant.brand} small />
                      <DetailField
                        label="Manufacturer"
                        value={variant.manufacturer}
                        small
                      />
                      <DetailField
                        label="Marketer"
                        value={variant.marketer}
                        small
                      />
                      <DetailField
                        label="Strength"
                        value={variant.strength?.display}
                        small
                      />
                      <DetailField
                        label="Pack Size"
                        value={variant.packSize}
                        small
                      />
                    </div>

                    {/* Composition */}
                    {Array.isArray(variant.composition) &&
                      variant.composition.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Composition
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {variant.composition.map((comp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                              >
                                {comp.name || comp}
                                {comp.strength ? ` (${comp.strength})` : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Description */}
                    {variant.description && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                          Description
                        </h5>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                          {variant.description
                            .replace(/&rsquo;/g, "'")
                            .replace(/<[^>]*>/g, "")}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-auto">
                      <button
                        onClick={() => onViewVariantLinked(variant)}
                        className="h-8 px-3 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                      >
                        <Link2 size={12} /> View Linked
                      </button>
                      <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={11} />
                        {new Date(variant.updatedAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LINKED TAB
// ═══════════════════════════════════════════════════════════════

const LinkedTab = ({ linkedData }) => {
  if (!linkedData?.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={Link2}
          title="No Linked Medicines"
          subtitle="No shop medicines linked to variants of this master"
        />
      </div>
    );
  }

  const byVariant = linkedData.reduce((acc, med) => {
    const variantKey = med.linkedVariantId || "unknown";
    if (!acc[variantKey]) {
      acc[variantKey] = {
        variantName: med.linkedVariantName || "Unknown Variant",
        variantSku: med.linkedVariantSku || null,
        items: [],
      };
    }
    acc[variantKey].items.push(med);
    return acc;
  }, {});

  const totalShops = new Set(linkedData.map((l) => l.shopId).filter(Boolean))
    .size;

  return (
    <div className="p-6 space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <div className="text-center px-4 border-r border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">
            {linkedData.length}
          </p>
          <p className="text-xs text-indigo-500">Total Linked</p>
        </div>
        <div className="text-center px-4 border-r border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">
            {Object.keys(byVariant).length}
          </p>
          <p className="text-xs text-indigo-500">Variants</p>
        </div>
        <div className="text-center px-4 border-r border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">{totalShops}</p>
          <p className="text-xs text-indigo-500">Shops</p>
        </div>
        <div className="text-center px-4">
          <p className="text-2xl font-bold text-indigo-700">
            {linkedData.filter((l) => l.linkedBy === "System").length}
          </p>
          <p className="text-xs text-indigo-500">Auto-linked</p>
        </div>
      </div>

      {/* Grouped by variant */}
      {Object.entries(byVariant).map(
        ([variantId, { variantName, variantSku, items }]) => (
          <div
            key={variantId}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Variant header */}
            <div className="px-4 py-2.5 bg-indigo-50/50 border-b border-gray-200 flex items-center gap-2">
              <Package size={14} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                {variantName}
              </span>
              {variantSku && (
                <span className="text-xs font-mono text-gray-400">
                  SKU: {variantSku}
                </span>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {items.length} linked
              </span>
            </div>

            {/* Linked items */}
            <div className="divide-y divide-gray-100">
              {items.map((linked) => (
                <div
                  key={linked.id}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {linked.originalName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Store size={10} />
                        {linked.shopName}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          linked.linkedBy === "System"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {linked.linkedBy}
                      </span>
                      {linked.confidence && (
                        <span className="text-xs text-gray-400">
                          {Math.round(linked.confidence)}%
                        </span>
                      )}
                      {linked.linkedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(linked.linkedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {linked.manufacturer && (
                    <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[120px]">
                      {linked.manufacturer}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// IMAGES TAB
// ═══════════════════════════════════════════════════════════════

const ImagesTab = ({ images, onUploadImage }) => {
  const [selected, setSelected] = useState(0);
  const primaryImages = images.filter((img) => img.type === "PRIMARY");
  const galleryImages = images.filter((img) => img.type === "GALLERY");

  if (!images.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={ImageIcon}
          title="No Images"
          subtitle="Upload the first image for this medicine"
          action={
            <button
              onClick={onUploadImage}
              className="mt-4 h-9 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Upload size={14} /> Upload Image
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{images.length}</span>{" "}
            total ·{" "}
            <span className="font-semibold text-green-600">
              {primaryImages.length}
            </span>{" "}
            primary ·{" "}
            <span className="font-semibold text-gray-600">
              {galleryImages.length}
            </span>{" "}
            gallery
          </span>
        </div>
        <button
          onClick={onUploadImage}
          className="h-9 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Upload size={14} /> Manage Images
        </button>
      </div>

      {/* Two-column: large preview + grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Preview pane */}
        <div className="col-span-1 flex flex-col gap-3">
          <div className="aspect-square rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
            <img
              src={images[selected]?.resolvedUrl}
              alt=""
              className="w-full h-full object-contain p-4"
              onError={(e) => {
                e.target.style.opacity = "0.3";
              }}
            />
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
            <DetailField label="Type" value={images[selected]?.type} small />
            <DetailField
              label="Source"
              value={images[selected]?.source}
              small
            />
            <DetailField
              label="SKU"
              value={images[selected]?.skuId}
              small
              mono
            />
            {images[selected]?.uploadedBy && (
              <DetailField
                label="Uploaded by"
                value={images[selected].uploadedBy}
                small
              />
            )}
          </div>
          <button
            onClick={() => window.open(images[selected]?.resolvedUrl, "_blank")}
            className="h-8 w-full border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1.5"
          >
            <ExternalLink size={12} /> Open full size
          </button>
        </div>

        {/* Grid */}
        <div className="col-span-2">
          {primaryImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Primary
              </p>
              <div className="grid grid-cols-4 gap-2">
                {primaryImages.map((img) => {
                  const idx = images.indexOf(img);
                  return (
                    <ImageThumb
                      key={img.id}
                      img={img}
                      isSelected={selected === idx}
                      onClick={() => setSelected(idx)}
                    />
                  );
                })}
              </div>
            </div>
          )}
          {galleryImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Gallery
              </p>
              <div className="grid grid-cols-4 gap-2">
                {galleryImages.map((img) => {
                  const idx = images.indexOf(img);
                  return (
                    <ImageThumb
                      key={img.id}
                      img={img}
                      isSelected={selected === idx}
                      onClick={() => setSelected(idx)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

const ImageThumb = ({ img, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`aspect-square rounded-lg border overflow-hidden bg-gray-50 transition-all ${
      isSelected
        ? "border-indigo-500 ring-2 ring-indigo-200"
        : "border-gray-200 hover:border-gray-300"
    }`}
  >
    <img
      src={img.resolvedUrl}
      alt=""
      className="w-full h-full object-contain p-1"
      onError={(e) => {
        e.target.style.opacity = "0.3";
      }}
    />
  </button>
);

const QuickStat = ({ icon: Icon, label }) => (
  <span className="flex items-center gap-1.5 text-sm text-gray-300">
    <Icon size={13} className="text-gray-200" />
    {label}
  </span>
);

const DetailField = ({
  label,
  value,
  bold = false,
  mono = false,
  small = false,
}) => (
  <div>
    <p
      className={`${small ? "text-[11px]" : "text-xs"} text-gray-400 font-medium mb-0.5`}
    >
      {label}
    </p>
    <p
      className={`${small ? "text-xs" : "text-sm"} ${bold ? "font-semibold text-gray-900" : "text-gray-700"} ${mono ? "font-mono" : ""}`}
    >
      {value || "—"}
    </p>
  </div>
);

const TagGroup = ({ label, icon: Icon, items, color }) => {
  const colors = {
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Icon size={12} /> {label} ({items.length})
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`px-2 py-1 rounded-lg text-xs font-medium border ${colors[color]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
    <Icon size={40} className="mb-3 opacity-40" />
    <p className="text-base font-medium text-gray-600">{title}</p>
    <p className="text-sm mt-1">{subtitle}</p>
    {action}
  </div>
);

export default MasterMedicineDetailModal;