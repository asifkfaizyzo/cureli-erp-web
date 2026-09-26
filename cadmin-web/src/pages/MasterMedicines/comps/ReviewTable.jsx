// cadmin-web/src/pages/MasterMedicines/comps/ReviewTable.jsx (do not remove this comment)
import { useEffect, useState } from "react";
import {
  X,
  Check,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckSquare,
  Square,
  CheckCircle2,
  Trash2,
  Image,
  ImageOff,
  ArrowRight,
  Building2,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import TableSkeleton from "../../../components/common/TableSkeleton";
import { getConfidenceColorClasses } from "../../../api/cadminMasterMedicines";
import StyledSelect from "../../../components/common/StyledSelect";
import ShopMultiSelect from "./ShopMultiSelect";
import StyledDateFilter from "../../../components/common/StyledDateFilter";
import { TABLE_CONFIG, getRowBgClass } from "../../../config/tableConfig";

const { styles, heights } = TABLE_CONFIG;

const ReviewTable = ({
  data = [],
  meta = {},
  filters = {},
  onFiltersChange,
  selectedIds = [],
  onSelectionChange,
  onAccept,
  onChange,
  onReject,
  onBulkAccept,
  onBulkReject,
  onViewDetail,
  loading = false,
}) => {
  const defaultWidths = {
    checkbox: 48,
    shopMed: 210,
    arrow: 36,
    match: 210,
    confidence: 140,
    source: 140,
    actions: 130,
  };
  const [columnWidths, setColumnWidths] = useState(defaultWidths);
  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (col, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ col, startX: e.clientX, startWidth: columnWidths[col] });
  };

  // Local debounced search filters
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (filters.search || "")) {
        onFiltersChange({ search: localSearch, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleMouseMove = (e) => {
    if (!resizing) return;
    setColumnWidths((p) => ({
      ...p,
      [resizing.col]: Math.max(
        50,
        resizing.startWidth + (e.clientX - resizing.startX),
      ),
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

  // Dynamic sort triggers with logs for troubleshooting
  const handleSort = (key) => {
    const isAsc = filters.sort === key && filters.order === "asc";
    const nextOrder = isAsc ? "desc" : "asc";
    
    console.log(`[ReviewTable] Trigger sort. Key: "${key}", Order: "${nextOrder}"`);
    
    onFiltersChange({
      sort: key,
      order: nextOrder,
      page: 1,
    });
  };

  const SortIcon = ({ sortKey }) => {
    if (!sortKey) return null;
    const isActive = filters.sort === sortKey;

    if (isActive) {
      return filters.order === "asc" ? (
        <ChevronUp
          size={14}
          className={`${styles.header.sortIcon.active} flex-shrink-0`}
        />
      ) : (
        <ChevronDown
          size={14}
          className={`${styles.header.sortIcon.active} flex-shrink-0`}
        />
      );
    }

    return (
      <ChevronsUpDown
        size={14}
        className={`${styles.header.sortIcon.inactive} flex-shrink-0`}
      />
    );
  };

  const ResizableTh = ({ col, children, align = "left", sortKey }) => (
    <th
      style={{
        width: columnWidths[col],
        minWidth: 50,
        height: `${heights.headerRow}px`,
      }}
      className="relative group"
    >
      <div
        className={`flex items-center gap-1 h-full
                    ${styles.header.cell}
                    ${align === "center" ? "justify-center" : "justify-start"}
                    ${sortKey ? "cursor-pointer select-none hover:text-white" : ""}`}
        onClick={() => sortKey && handleSort(sortKey)}
      >
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          {children}
        </span>
        <SortIcon sortKey={sortKey} />
      </div>
      <div
        onMouseDown={(e) => handleMouseDown(col, e)}
        className={styles.header.resizeHandle}
      />
    </th>
  );

  const allSelected =
    data.length > 0 && data.every((item) => selectedIds.includes(item.id));
  const someSelected = data.some((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(
        selectedIds.filter((id) => !data.find((i) => i.id === id)),
      );
    } else {
      onSelectionChange([
        ...new Set([...selectedIds, ...data.map((i) => i.id)]),
      ]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const tableHeader = (
    <thead className="sticky top-0 z-10">
      <tr className={styles.header.row}>
        <th
          style={{
            width: columnWidths.checkbox,
            minWidth: 48,
            height: `${heights.headerRow}px`,
          }}
          className="relative group"
        >
          <div className={`flex items-center h-full ${styles.header.cell}`}>
            <button
              onClick={toggleSelectAll}
              className="text-white/70 hover:text-white transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={17} className="text-white" />
              ) : someSelected ? (
                <CheckSquare size={17} className="text-white/50" />
              ) : (
                <Square size={17} />
              )}
            </button>
          </div>
          <div
            onMouseDown={(e) => handleMouseDown("checkbox", e)}
            className={styles.header.resizeHandle}
          />
        </th>
        <ResizableTh col="shopMed" sortKey="rawName">
          Shop Medicine
        </ResizableTh>
        <th
          style={{ width: 36, minWidth: 36, height: `${heights.headerRow}px` }}
        />
        <ResizableTh col="match" sortKey="suggestedMaster">
          Suggested Match
        </ResizableTh>
        <ResizableTh col="confidence" align="center" sortKey="confidenceScore">
          Confidence
        </ResizableTh>
        <ResizableTh col="source" align="center">
          Source
        </ResizableTh>
        <ResizableTh col="actions" align="center">
          Actions
        </ResizableTh>
      </tr>
    </thead>
  );

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Filters Grid */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-2 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="col-span-1 md:col-span-2 relative">
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              Search Medicine
            </label>
            <input
              type="text"
              placeholder="Search by name, manufacturer..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Confidence Dropdown */}
          <div>
            <StyledSelect
              label="Match Confidence"
              value={filters.confidenceFilter || ""}
              onChange={(v) =>
                onFiltersChange({ confidenceFilter: v, page: 1 })
              }
              options={[
                { value: "", label: "All Confidence" },
                { value: "high", label: "High (90%+)" },
                { value: "medium", label: "Medium (70-89%)" },
                { value: "low", label: "Low (<70%)" },
              ]}
            />
          </div>

          {/* Shop Selector */}
          <div>
            <ShopMultiSelect
              label="Filter by Shop"
              context="review"
              value={filters.selectedShops || []}
              onChange={(selected) =>
                onFiltersChange({
                  selectedShops: selected,
                  shopIds: selected.map((s) => s.id).join(","),
                  page: 1,
                })
              }
            />
          </div>
        </div>

        {/* Second row: Dates & Bulk Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-48">
            <StyledDateFilter
              label="From Date"
              date={filters.dateFrom || ""}
              setDate={(date) => onFiltersChange({ dateFrom: date, page: 1 })}
            />
          </div>
          <div className="w-48">
            <StyledDateFilter
              label="To Date"
              date={filters.dateTo || ""}
              setDate={(date) => onFiltersChange({ dateTo: date, page: 1 })}
            />
          </div>

          <div className="flex-1" />

          <span className="text-xs text-gray-400">
            {meta.total || 0} item{meta.total !== 1 ? "s" : ""}
          </span>

          {selectedIds.length > 0 && (
            <>
              <button
                onClick={onBulkAccept}
                className="h-10 px-4 bg-green-50 text-green-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-100 transition-colors border border-green-200"
              >
                <CheckCircle2 size={14} />
                Accept ({selectedIds.length})
              </button>
              <button
                onClick={onBulkReject}
                className="h-10 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-200"
              >
                <Trash2 size={14} />
                Reject ({selectedIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table grid wrapper */}
      <div className={styles.container.wrapper}>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: 900 }}
            >
              {tableHeader}
              <tbody>
                <TableSkeleton rows={filters.limit || 10} columns={7} />
              </tbody>
            </table>
          ) : data.length === 0 ? (
            <TableEmptyState
              icon={Check}
              title="No items need review"
              subtitle={
                filters.search || filters.shopIds || filters.dateFrom
                  ? "No matches found for active filters"
                  : "All suggested matches have been verified"
              }
            />
          ) : (
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: 900 }}
            >
              {tableHeader}
              <tbody>
                {data.map((item, index) => {
                  const colors = getConfidenceColorClasses(
                    item.confidenceScore,
                  );
                  const shopMed = item.shopMedicine || {};
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewDetail?.(item)}
                      className={`${isSelected ? "bg-indigo-50/80" : getRowBgClass(index)} ${styles.row.clickable}`}
                      style={{ height: `${heights.bodyRow}px` }}
                    >
                      <td
                        className={styles.cell.base}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isSelected ? (
                            <CheckSquare
                              size={17}
                              className="text-indigo-600"
                            />
                          ) : (
                            <Square size={17} />
                          )}
                        </button>
                      </td>
                      <td className={styles.cell.base}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`${styles.cell.primary} truncate max-w-[170px]`}
                            >
                              {item.rawName}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${
                                item.suggestedMaster?.type === "DRUG"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {item.suggestedMaster?.type}
                            </span>
                          </div>
                          {shopMed.manufacturer && (
                            <p
                              className={`text-xs ${styles.cell.muted} mt-0.5 flex items-center gap-1`}
                            >
                              <Building2 size={10} />
                              <span className="truncate max-w-[160px]">
                                {shopMed.manufacturer}
                              </span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={styles.cell.base}>
                        <ArrowRight
                          size={15}
                          className="text-gray-300 mx-auto"
                        />
                      </td>
                      <td className={styles.cell.base}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.suggestedMaster?.hasImage ? "bg-green-100" : "bg-red-50"}`}
                          >
                            {item.suggestedMaster?.hasImage ? (
                              <Image size={13} className="text-green-600" />
                            ) : (
                              <ImageOff size={13} className="text-red-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`${styles.cell.primary} truncate max-w-[160px]`}
                            >
                              {item.suggestedMaster?.name}
                            </p>
                            <p
                              className={`text-xs ${styles.cell.muted} truncate max-w-[160px]`}
                            >
                              {item.suggestedMaster?.manufacturer ||
                                item.suggestedMaster?.form ||
                                item.suggestedMaster?.primaryCategory ||
                                "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}
                          >
                            {item.confidenceScore}%
                          </span>
                          <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.bg} rounded-full`}
                              style={{ width: `${item.confidenceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                      >
                        <p
                          className={`text-sm ${styles.cell.primary} truncate max-w-[120px] mx-auto`}
                        >
                          {item.shopName}
                        </p>
                        {item.branchName && (
                          <p
                            className={`text-xs ${styles.cell.muted} truncate max-w-[120px] mx-auto`}
                          >
                            {item.branchName}
                          </p>
                        )}
                      </td>
                      <td
                        className={styles.cell.base}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={styles.actions.container}>
                          <button
                            onClick={() => onAccept(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.activate}`}
                            title="Accept"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => onChange(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                            title="Change"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => onReject(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.suspend}`}
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
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
              currentPage={filters.page || 1}
              setCurrentPage={(page) => onFiltersChange({ page })}
              totalItems={meta.total}
              rowsPerPage={filters.limit || 10}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewTable;