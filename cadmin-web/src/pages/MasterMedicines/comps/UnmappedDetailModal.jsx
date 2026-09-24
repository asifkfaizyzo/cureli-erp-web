// cadmin-web/src/pages/MasterMedicines/comps/UnmappedDetailModal.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/UnmappedDetailModal.jsx

import { useEffect, useState } from "react";
import {
  X,
  Link2,
  Plus,
  Store,
  Calendar,
  Hash,
  FileText,
  Image,
  ImageOff,
  Clock,
  Building2,
  Package,
  Tag,
  Shield,
  Pill,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { getMasterMedicines } from "../../../api/cadminMasterMedicines";

const UnmappedDetailModal = ({ isOpen, item, onClose, onMatch, onCreate }) => {
  const [showAllNames, setShowAllNames] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // ESC key handler
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

  // Auto-search for potential matches
  useEffect(() => {
    if (!isOpen || !item) return;
    setShowAllNames(false);
    setPotentialMatches([]);

    const searchForMatches = async () => {
      try {
        setLoadingMatches(true);
        const searchTerms = [
          item.normalizedName,
          ...(item.sampleNames?.slice(0, 2) || []),
        ];
        const uniqueTerms = [...new Set(searchTerms)].slice(0, 2);

        const allResults = [];
        for (const term of uniqueTerms) {
          try {
            const res = await getMasterMedicines({
              search: term,
              limit: 5,
            });
            if (res.data?.data?.medicines) {
              allResults.push(...res.data.data.medicines);
            }
          } catch {
            /* ignore individual search failures */
          }
        }

        // Deduplicate by id
        const seen = new Set();
        const unique = allResults.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        setPotentialMatches(unique.slice(0, 5));
      } catch (err) {
        console.error("Failed to search potential matches:", err);
      } finally {
        setLoadingMatches(false);
      }
    };

    searchForMatches();
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const hasManufacturers = item.manufacturers?.length > 0;
  const hasGenericNames = item.genericNames?.length > 0;
  const hasCategories = item.categories?.length > 0;
  const hasSchedules = item.schedules?.length > 0;
  const hasPackSizes = item.packSizes?.length > 0;
  const hasHsnCodes = item.hsnCodes?.length > 0;
  const hasSubCategories = item.subCategories?.length > 0;
  const hasAnyDetail =
    hasManufacturers ||
    hasGenericNames ||
    hasCategories ||
    hasSchedules ||
    hasPackSizes ||
    hasHsnCodes;

  const displayNames = showAllNames
    ? item.sampleNames
    : item.sampleNames?.slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">
                  Unmapped Medicine
                </h2>
                <p className="text-white/70 text-sm">
                  Analysis & matching options
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-5 min-h-[400px]">
            {/* ────── LEFT: Details (3/5) ────── */}
            <div className="col-span-3 p-5 space-y-5 border-r border-gray-100">
              {/* Title + Inline Stats */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {item.normalizedName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.type === "DRUG"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Hash size={12} />
                        {item.occurrenceCount} occurrences
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Store size={12} />
                        {item.shopCount} shops
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar size={12} />
                        {formatDate(item.firstSeenAt)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.hasImageSuggestion ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {item.hasImageSuggestion ? (
                      <Image size={22} className="text-green-600" />
                    ) : (
                      <ImageOff size={22} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Medicine Details */}
              {hasAnyDetail && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Pill size={12} />
                    Shop Data
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {hasManufacturers && (
                      <DetailChipGroup
                        icon={Building2}
                        label="Manufacturer"
                        items={item.manufacturers}
                        color="blue"
                      />
                    )}
                    {hasGenericNames && (
                      <DetailChipGroup
                        icon={Pill}
                        label="Generic"
                        items={item.genericNames}
                        color="purple"
                      />
                    )}
                    {hasCategories && (
                      <DetailChipGroup
                        icon={Tag}
                        label="Category"
                        items={[
                          ...item.categories,
                          ...(hasSubCategories ? item.subCategories : []),
                        ]}
                        color="green"
                      />
                    )}
                    {(hasSchedules || hasPackSizes || hasHsnCodes) && (
                      <div className="space-y-1.5">
                        {hasSchedules &&
                          item.schedules.map((s, i) => (
                            <InlineDetail
                              key={i}
                              icon={Shield}
                              label="Schedule"
                              value={s}
                              valueClass="text-red-600 font-medium"
                            />
                          ))}
                        {hasPackSizes && (
                          <InlineDetail
                            icon={Package}
                            label="Pack"
                            value={item.packSizes.join(", ")}
                          />
                        )}
                        {hasHsnCodes && (
                          <InlineDetail
                            icon={Hash}
                            label="HSN"
                            value={item.hsnCodes.join(", ")}
                            mono
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Name Variations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={12} />
                    Name Variations ({item.sampleNames?.length || 0})
                  </h4>
                  {item.sampleNames?.length > 6 && (
                    <button
                      onClick={() => setShowAllNames(!showAllNames)}
                      className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-0.5"
                    >
                      {showAllNames ? (
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
                <div className="flex flex-wrap gap-1.5">
                  {displayNames?.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs
                                 hover:bg-gray-200 transition-colors cursor-default"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Shop Distribution */}
              {item.shops?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Store size={12} />
                    Shop Distribution
                  </h4>
                  <div className="space-y-2">
                    {item.shops?.map((shop) => {
                      const pct = Math.round(
                        (shop.count / item.occurrenceCount) * 100
                      );
                      return (
                        <div
                          key={shop.id}
                          className="flex items-center gap-2"
                        >
                          <span className="w-28 text-xs text-gray-700 font-medium truncate">
                            {shop.name}
                          </span>
                          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#0a0280] to-[#6366f1] rounded-full
                                         flex items-center justify-end pr-2"
                              style={{
                                width: `${Math.max(pct, 12)}%`,
                              }}
                            >
                              <span className="text-[10px] text-white font-medium">
                                {shop.count}
                              </span>
                            </div>
                          </div>
                          <span className="w-8 text-right text-[10px] text-gray-400">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  First: {formatDate(item.firstSeenAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Last: {formatDate(item.lastSeenAt)}
                </span>
              </div>
            </div>

            {/* ────── RIGHT: Potential Matches (2/5) ────── */}
            <div className="col-span-2 p-5 bg-gray-50/50">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Search size={12} />
                Potential Matches
              </h4>

              {loadingMatches ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-xs">Searching catalog...</span>
                </div>
              ) : potentialMatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    No matches found
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    This medicine may need to be created new
                  </p>
                  <button
                    onClick={onCreate}
                    className="px-4 py-2 bg-[#0a0280] text-white rounded-lg text-sm font-medium
                               flex items-center gap-2 hover:bg-[#05015A] transition-colors mx-auto"
                  >
                    <Plus size={14} />
                    Create New
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {potentialMatches.map((med) => (
                    <button
                      key={med.id}
                      onClick={() => {
                        // Quick match: close this modal and trigger match flow with preselection
                        onMatch(med);
                      }}
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 text-left
                                 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            med.primaryImage
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {med.primaryImage ? (
                            <Image
                              size={14}
                              className="text-green-600"
                            />
                          ) : (
                            <ImageOff
                              size={14}
                              className="text-gray-400"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">
                            {med.genericName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                med.type === "DRUG"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {med.type}
                            </span>
                            {med.form && (
                              <span className="text-[10px] text-gray-400">
                                {med.form}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {med.variantCount} variants
                            </span>
                          </div>
                          {med.previewVariants?.[0]?.manufacturer && (
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {med.previewVariants[0].manufacturer}
                            </p>
                          )}
                        </div>
                        <ExternalLink
                          size={12}
                          className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1"
                        />
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={onMatch}
                    className="w-full py-2.5 text-xs text-indigo-600 font-medium hover:text-indigo-700
                               hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Search size={12} />
                    Search full catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400 font-mono truncate max-w-[200px]">
              {item.id}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={onMatch}
                className="px-4 py-2 border border-indigo-200 text-indigo-700 bg-white rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
              >
                <Link2 size={15} />
                Match
              </button>
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-[#0a0280] text-white rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-[#05015A] transition-colors"
              >
                <Plus size={15} />
                Create New
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

const DetailChipGroup = ({ icon: Icon, label, items, color }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    green: "bg-green-50 text-green-700 border-green-100",
  };

  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
        <Icon size={10} />
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colorMap[color]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const InlineDetail = ({
  icon: Icon,
  label,
  value,
  mono = false,
  valueClass = "",
}) => (
  <div className="flex items-center gap-1.5 text-xs">
    <Icon size={10} className="text-gray-400" />
    <span className="text-gray-400">{label}:</span>
    <span
      className={`text-gray-700 ${mono ? "font-mono" : ""} ${valueClass}`}
    >
      {value}
    </span>
  </div>
);

export default UnmappedDetailModal;