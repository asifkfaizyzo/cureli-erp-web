// cadmin-web/src/pages/MasterMedicines/comps/MasterCatalogGrid.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/MasterCatalogGrid.jsx

import { useState, useEffect } from "react";
import {
  Search,
  X,
  Upload,
  ImageOff,
  AlertTriangle,
  Images,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import StyledSelect from "../../../components/common/StyledSelect";
import {
  IMAGE_STATUS,
  getImageStatusInfo,
  getImageUrl,
} from "../../../api/cadminMasterMedicines";

const GRID_PAGE_SIZE = 24;

const MasterCatalogGrid = ({
  medicines = [],
  meta = {},
  onUploadImage,
  loading = false,
  onFiltersChange,
  onRowClick,
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [imageStatusFilter, setImageStatusFilter] = useState("");
  const [sortConfig] = useState({ key: "generic_name", order: "asc" });

  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search: searchText.trim(),
        type: typeFilter,
        imageStatus: imageStatusFilter,
        page: 1,
        limit: GRID_PAGE_SIZE,
        sort: sortConfig.key,
        order: sortConfig.order,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, typeFilter, imageStatusFilter]); // eslint-disable-line

  const handlePageChange = (newPage) => {
    onFiltersChange({
      search: searchText.trim(),
      type: typeFilter,
      imageStatus: imageStatusFilter,
      page: newPage,
      limit: GRID_PAGE_SIZE,
      sort: sortConfig.key,
      order: sortConfig.order,
    });
  };

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Filters ── */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-2 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search master medicines..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full h-9 pl-9 pr-8 border border-gray-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="w-36">
          <StyledSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "", label: "All Types" },
              { value: "DRUG", label: "Drug" },
              { value: "OTC", label: "OTC" },
            ]}
            placeholder="All Types"
          />
        </div>

        <div className="w-44">
          <StyledSelect
            value={imageStatusFilter}
            onChange={setImageStatusFilter}
            options={[
              { value: "", label: "All Images" },
              { value: IMAGE_STATUS.VERIFIED, label: "Verified" },
              { value: IMAGE_STATUS.RAW, label: "Raw" },
              { value: IMAGE_STATUS.NONE, label: "No Image" },
            ]}
            placeholder="All Images"
          />
        </div>

        <div className="flex-1" />
        <span className="text-xs text-gray-400">
          {meta.total ?? 0} medicine{meta.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <GridSkeleton />
          ) : medicines.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <TableEmptyState
                icon={Images}
                title="No medicines found"
                subtitle="Try adjusting your search or filters"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {medicines.map((med) => (
                <MedicineCard
                  key={med.id}
                  med={med}
                  onRowClick={onRowClick}
                  onUploadImage={onUploadImage}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.total > 0 && !loading && (
          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2">
            <Pagination
              currentPage={meta.page || 1}
              setCurrentPage={handlePageChange}
              totalItems={meta.total}
              rowsPerPage={GRID_PAGE_SIZE}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// MEDICINE CARD
// ─────────────────────────────────────────
const MedicineCard = ({ med, onRowClick, onUploadImage }) => {
  const [imgError, setImgError] = useState(false);
  const statusInfo = getImageStatusInfo(med.imageStatus);
  const hasImage = med.primaryImage && !imgError;
  const isRaw = med.imageStatus === IMAGE_STATUS.RAW;
  const isNone = med.imageStatus === IMAGE_STATUS.NONE;
  const needsAttention = isRaw || isNone;

  const rawCount = med.previewVariants?.reduce(
    (acc, v) => acc + (v.images?.length || 0),
    0,
  ) || 0;

  return (
    <div
      onClick={() => onRowClick?.(med)}
      className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden
                 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200
                 flex flex-col"
    >
      {/* ── Image area ── */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden flex-shrink-0">
        {hasImage ? (
          <img
            src={getImageUrl(med.primaryImage)}
            alt={med.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5 ${statusInfo.bgClass}`}>
            <ImageOff size={28} className={`${statusInfo.textClass} opacity-60`} />
            <span className={`text-[10px] font-semibold ${statusInfo.textClass}`}>
              {isNone ? "No Image" : "Raw Only"}
            </span>
          </div>
        )}

        {/* ── Top-left: Type pill ── */}
        <div className="absolute top-1.5 left-1.5">
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-sm ${
            med.type === "DRUG"
              ? "bg-blue-600 text-white"
              : "bg-green-600 text-white"
          }`}>
            {med.type}
          </span>
        </div>

        {/* ── Top-right: attention badge ── */}
        {needsAttention && (
          <div className="absolute top-1.5 right-1.5">
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-sm ${
              isNone
                ? "bg-red-500 text-white"
                : "bg-amber-500 text-white"
            }`}>
              {isNone ? "No Img" : "Raw"}
            </span>
          </div>
        )}

        {/* ── Bottom-left: image count pill (only when has images) ── */}
        {!isNone && rawCount > 0 && (
          <div className="absolute bottom-1.5 left-1.5">
            <span className="px-1.5 py-0.5 bg-black/50 text-white rounded text-[9px] font-medium
                             flex items-center gap-0.5 backdrop-blur-sm">
              <ImageOff size={8} />
              {rawCount}
            </span>
          </div>
        )}

        {/* ── Upload button overlay (appears on hover) ── */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-end justify-end p-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onUploadImage(med); }}
            className={`opacity-0 group-hover:opacity-100 transition-all duration-200
                        p-1.5 rounded-lg shadow-md text-white flex items-center gap-1
                        text-[10px] font-semibold
                        ${needsAttention
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
            title="Manage Images"
          >
            <Upload size={11} />
            Upload
          </button>
        </div>
      </div>

      {/* ── Info area ── */}
      <div className="p-2 flex flex-col gap-0.5 flex-1">
        {/* Medicine name */}
        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[30px]">
          {med.name}
        </p>

        {/* Manufacturer */}
        {med.manufacturer && med.manufacturer !== "N/A" && (
          <p className="text-[10px] text-gray-400 truncate">
            {med.manufacturer}
          </p>
        )}

        {/* Bottom row: variants count + status */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">
            {med.variantCount}v
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${statusInfo.bgClass} ${statusInfo.textClass}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* ── Bottom attention bar ── */}
      {needsAttention && (
        <div className={`h-0.5 w-full flex-shrink-0 ${isNone ? "bg-red-400" : "bg-amber-400"}`} />
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// GRID SKELETON
// ─────────────────────────────────────────
const GridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
    {Array.from({ length: 24 }).map((_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-100" />
        <div className="p-2 space-y-1.5">
          <div className="h-3 bg-gray-100 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          <div className="h-2.5 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export default MasterCatalogGrid;