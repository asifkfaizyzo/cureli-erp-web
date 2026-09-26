// cadmin-web/src/pages/MasterMedicines/comps/MasterCatalogTable.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/MasterCatalogTable.jsx
// Only the filter section changes — add viewMode prop and toggle buttons

import { useState, useEffect } from "react";
import {
  Search,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ImageOff,
  Pill,
  AlertTriangle,
  LayoutGrid,    // ← ADD
  List,          // ← ADD
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import TableSkeleton from "../../../components/common/TableSkeleton";
import StyledSelect from "../../../components/common/StyledSelect";
import {
  IMAGE_STATUS,
  getImageStatusInfo,
  getImageUrl,
} from "../../../api/cadminMasterMedicines";
import { TABLE_CONFIG, getRowBgClass } from "../../../config/tableConfig";

const { styles, heights } = TABLE_CONFIG;

const AttentionBadge = ({ reason }) => (
  <div className="relative group/alert inline-flex items-center">
    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 cursor-help" />
    <div className="absolute left-5 top-1/2 -translate-y-1/2 z-50
                    hidden group-hover/alert:block
                    bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5
                    whitespace-nowrap shadow-xl pointer-events-none">
      {reason}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
    </div>
  </div>
);

const getAttentionReason = (med) => {
  if (med.imageStatus === IMAGE_STATUS.NONE) return "No image — upload required";
  if (med.imageStatus === IMAGE_STATUS.RAW) return "Raw scraped image — upload a verified image";
  return "Needs attention";
};

const MasterCatalogTable = ({
  medicines = [],
  meta = {},
  onViewLinked,
  onUploadImage,
  loading = false,
  onFiltersChange,
  onRowClick,
  viewMode = "table",         // ← ADD PROP
  onViewModeChange,           // ← ADD PROP
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [imageStatusFilter, setImageStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "generic_name",
    order: "asc",
  });

  const defaultWidths = {
    index: 52,
    image: 72,
    name: 200,
    type: 80,
    composition: 180,
    manufacturer: 160,
    variants: 80,
    status: 90,
    updated: 110,
    actions: 72,
  };
  const [columnWidths, setColumnWidths] = useState(defaultWidths);
  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (col, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ col, startX: e.clientX, startWidth: columnWidths[col] });
  };
  const handleMouseMove = (e) => {
    if (!resizing) return;
    setColumnWidths((p) => ({
      ...p,
      [resizing.col]: Math.max(50, resizing.startWidth + (e.clientX - resizing.startX)),
    }));
  };
  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search: searchText.trim(),
        type: typeFilter,
        imageStatus: imageStatusFilter,
        page: 1,
        limit: meta.limit || 20,
        sort: sortConfig.key,
        order: sortConfig.order,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, typeFilter, imageStatusFilter, sortConfig]); // eslint-disable-line

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const handlePageChange = (newPage) => {
    onFiltersChange({
      search: searchText.trim(),
      type: typeFilter,
      imageStatus: imageStatusFilter,
      page: newPage,
      limit: meta.limit || 20,
      sort: sortConfig.key,
      order: sortConfig.order,
    });
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const SortIcon = ({ sortKey }) => {
    if (!sortKey) return null;
    const isActive = sortConfig.key === sortKey;
    if (isActive) {
      return sortConfig.order === "asc" ? (
        <ChevronUp size={14} className={`${styles.header.sortIcon.active} flex-shrink-0`} />
      ) : (
        <ChevronDown size={14} className={`${styles.header.sortIcon.active} flex-shrink-0`} />
      );
    }
    return (
      <ChevronsUpDown size={14} className={`${styles.header.sortIcon.inactive} flex-shrink-0`} />
    );
  };

  const ResizableTh = ({ col, children, align = "left", sortKey }) => (
    <th
      style={{ width: columnWidths[col], minWidth: 50, height: `${heights.headerRow}px` }}
      className="relative group"
    >
      <div
        className={`flex items-center gap-1 h-full
                    ${styles.header.cell}
                    ${align === "center" ? "justify-center" : "justify-start"}
                    ${sortKey ? "cursor-pointer select-none" : ""}`}
        onClick={() => sortKey && handleSort(sortKey)}
      >
        <span className="text-sm font-semibold text-white whitespace-nowrap">{children}</span>
        <SortIcon sortKey={sortKey} />
      </div>
      <div onMouseDown={(e) => handleMouseDown(col, e)} className={styles.header.resizeHandle} />
    </th>
  );

  const tableHeader = (
    <thead className="sticky top-0 z-10">
      <tr className={styles.header.row}>
        <ResizableTh col="index">#</ResizableTh>
        <ResizableTh col="image" align="center">Image</ResizableTh>
        <ResizableTh col="name" sortKey="generic_name">Name</ResizableTh>
        <ResizableTh col="type" align="center" sortKey="type">Type</ResizableTh>
        <ResizableTh col="composition">Composition</ResizableTh>
        <ResizableTh col="manufacturer" sortKey="manufacturer">Manufacturer</ResizableTh>
        <ResizableTh col="variants" align="center" sortKey="variant_count">Variants</ResizableTh>
        <ResizableTh col="status" align="center">Status</ResizableTh>
        <ResizableTh col="updated" sortKey="updated_at">Updated</ResizableTh>
        <ResizableTh col="actions" align="center">Actions</ResizableTh>
      </tr>
    </thead>
  );

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Filter Section ── */}
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

        {/* ── View mode toggle ── */}
        <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => onViewModeChange?.("table")}
            title="Table view"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "table"
                ? "bg-white shadow-sm text-indigo-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => onViewModeChange?.("grid")}
            title="Grid view"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "grid"
                ? "bg-white shadow-sm text-indigo-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className={styles.container.wrapper}>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <table className="w-full border-collapse text-sm" style={{ minWidth: 1000 }}>
              {tableHeader}
              <tbody>
                <TableSkeleton rows={meta.limit || 20} columns={10} />
              </tbody>
            </table>
          ) : medicines.length === 0 ? (
            <TableEmptyState
              icon={Pill}
              title="No master medicines found"
              subtitle="Try adjusting your search or filters"
            />
          ) : (
            <table className="w-full border-collapse text-sm" style={{ minWidth: 1000 }}>
              {tableHeader}
              <tbody>
                {medicines.map((med, index) => {
                  const statusInfo = getImageStatusInfo(med.imageStatus);
                  const needsAttention =
                    med.imageStatus === IMAGE_STATUS.RAW ||
                    med.imageStatus === IMAGE_STATUS.NONE;
                  const globalIndex =
                    ((meta.page || 1) - 1) * (meta.limit || 20) + index + 1;

                  return (
                    <tr
                      key={med.id}
                      onClick={() => onRowClick?.(med)}
                      className={`${getRowBgClass(index)} ${styles.row.clickable}`}
                      style={{ height: `${heights.bodyRow}px` }}
                    >
                      <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                        <div className="flex items-center gap-1.5">
                          <span>{globalIndex}</span>
                          {needsAttention && <AttentionBadge reason={getAttentionReason(med)} />}
                        </div>
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        {med.primaryImage ? (
                          <div className="w-9 h-9 mx-auto rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <img
                              src={getImageUrl(med.primaryImage)}
                              alt={med.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling)
                                  e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div
                              className={`w-9 h-9 rounded-lg items-center justify-center ${statusInfo.bgClass}`}
                              style={{ display: "none" }}
                            >
                              <ImageOff size={15} className={statusInfo.textClass} />
                            </div>
                          </div>
                        ) : (
                          <div className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center ${statusInfo.bgClass}`}>
                            <ImageOff size={15} className={statusInfo.textClass} />
                          </div>
                        )}
                      </td>

                      <td className={styles.cell.base}>
                        <p className={`${styles.cell.primary} truncate max-w-[190px]`}>{med.name}</p>
                        {med.packSize && med.packSize !== "N/A" && (
                          <p className={`${styles.cell.muted} truncate max-w-[190px] text-xs`}>{med.packSize}</p>
                        )}
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          med.type === "DRUG" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          {med.type}
                        </span>
                      </td>

                      <td className={styles.cell.base}>
                        <span className={`${styles.cell.secondary} truncate block max-w-[170px]`}>
                          {med.composition || "—"}
                        </span>
                      </td>

                      <td className={styles.cell.base}>
                        <span className={`${styles.cell.secondary} truncate block max-w-[150px]`}>
                          {med.manufacturer || "—"}
                        </span>
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
                          {med.variantCount}
                        </span>
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className={`${styles.cell.base} ${styles.cell.muted} text-xs`}>
                        {formatDate(med.updatedAt)}
                      </td>

                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onUploadImage(med)}
                          className={`${styles.actions.button.base} ${
                            needsAttention
                              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                              : styles.actions.button.edit
                          }`}
                          title={med.imageStatus === IMAGE_STATUS.NONE ? "Upload Image" : "Change Image"}
                        >
                          <Upload size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {meta.total > 0 && !loading && (
          <div className={styles.pagination.wrapper}>
            <Pagination
              currentPage={meta.page || 1}
              setCurrentPage={handlePageChange}
              totalItems={meta.total}
              rowsPerPage={meta.limit || 20}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterCatalogTable;