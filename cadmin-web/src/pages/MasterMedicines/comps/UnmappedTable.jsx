// cadmin-web/src/pages/MasterMedicines/comps/UnmappedTable.jsx (do not remove this comment)
import { useEffect, useState } from "react";
import {
  Link2,
  Plus,
  Ban,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Trash2,
  ChevronsUpDown,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import TableSkeleton from "../../../components/common/TableSkeleton";
import StyledSelect from "../../../components/common/StyledSelect";
import ShopMultiSelect from "./ShopMultiSelect";
import StyledDateFilter from "../../../components/common/StyledDateFilter";
import { TABLE_CONFIG, getRowBgClass } from "../../../config/tableConfig";

const { styles, heights } = TABLE_CONFIG;

const UnmappedTable = ({
  data = [],
  meta = {},
  filters = {},
  onFiltersChange,
  selectedIds = [],
  onSelectionChange,
  onMatch,
  onCreate,
  onIgnore,
  onViewDetail,
  onBulkIgnore,
  loading = false,
}) => {
  const defaultWidths = {
    checkbox: 48,
    name: 210,
    sampleNames: 200,
    manufacturer: 180,
    type: 80,
    count: 80,
    shops: 80,
    actions: 130,
  };
  const [columnWidths, setColumnWidths] = useState(defaultWidths);
  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (col, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ col, startX: e.clientX, startWidth: columnWidths[col] });
  };

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

  const handleSort = (key) => {
    const isAsc = filters.sort === key && filters.order === "asc";
    onFiltersChange({
      sort: key,
      order: isAsc ? "desc" : "asc",
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
                    ${sortKey ? "cursor-pointer select-none" : ""}`}
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
        <ResizableTh col="name" sortKey="normalizedName">
          Normalized Name
        </ResizableTh>
        <ResizableTh col="sampleNames">Sample Names</ResizableTh>
        <ResizableTh col="manufacturer">Manufacturer</ResizableTh>
        <ResizableTh col="type" align="center">
          Type
        </ResizableTh>
        <ResizableTh col="count" align="center" sortKey="occurrenceCount">
          Count
        </ResizableTh>
        <ResizableTh col="shops" align="center" sortKey="shopCount">
          Shops
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
          {/* Search */}
          <div className="col-span-1 md:col-span-2 relative">
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              Search Medicine
            </label>
            <input
              type="text"
              placeholder="Search name, manufacturer..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Type Filter */}
          <div>
            <StyledSelect
              label="Medicine Type"
              value={filters.type || ""}
              onChange={(v) => onFiltersChange({ type: v, page: 1 })}
              options={[
                { value: "", label: "All Types" },
                { value: "DRUG", label: "Drug" },
                { value: "OTC", label: "OTC" },
              ]}
            />
          </div>

          {/* Shop Multi Select */}
          <div>
            <ShopMultiSelect
              label="Filter by Shop"
              context="unmapped"
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
            <button
              onClick={onBulkIgnore}
              className="h-10 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-200"
            >
              <Trash2 size={14} />
              Ignore ({selectedIds.length})
            </button>
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
                <TableSkeleton rows={filters.limit || 10} columns={8} />
              </tbody>
            </table>
          ) : data.length === 0 ? (
            <TableEmptyState
              icon={Link2}
              title="No unmapped medicines"
              subtitle={
                filters.search || filters.shopIds || filters.dateFrom
                  ? "No matches found for active filters"
                  : "All medicines are currently mapped"
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
                  const isSelected = selectedIds.includes(item.id);
                  const topManufacturer = item.manufacturers?.[0];
                  const extraManufacturers =
                    (item.manufacturers?.length || 0) - 1;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewDetail(item)}
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
                        <span
                          className={`${styles.cell.primary} truncate block max-w-[200px]`}
                        >
                          {item.normalizedName}
                        </span>
                      </td>
                      <td className={styles.cell.base}>
                        <SampleNamesCell names={item.sampleNames} />
                      </td>
                      <td className={styles.cell.base}>
                        {topManufacturer ? (
                          <div>
                            <span
                              className={`${styles.cell.secondary} truncate block max-w-[170px]`}
                            >
                              {topManufacturer}
                            </span>
                            {extraManufacturers > 0 && (
                              <span
                                className={`text-[10px] ${styles.cell.muted}`}
                              >
                                +{extraManufacturers} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`text-xs italic ${styles.cell.muted}`}
                          >
                            Unknown
                          </span>
                        )}
                      </td>
                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                      >
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.type === "DRUG" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td
                        className={`${styles.cell.base} ${styles.cell.center} ${styles.cell.primary}`}
                      >
                        {item.occurrenceCount}
                      </td>
                      <td
                        className={`${styles.cell.base} ${styles.cell.center} ${styles.cell.primary}`}
                      >
                        {item.shopCount}
                      </td>
                      <td
                        className={styles.cell.base}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={styles.actions.container}>
                          <button
                            onClick={() => onMatch(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                            title="Match to Existing"
                          >
                            <Link2 size={14} />
                          </button>
                          <button
                            onClick={() => onCreate(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.activate}`}
                            title="Create New"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => onIgnore(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.suspend}`}
                            title="Ignore"
                          >
                            <Ban size={14} />
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

const SampleNamesCell = ({ names }) => {
  const displayName = names?.[0] ?? "—";
  const remaining = (names?.length ?? 0) - 1;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`${styles.cell.secondary} truncate max-w-[170px] text-sm`}
      >
        {displayName}
      </span>
      {remaining > 0 && (
        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full flex-shrink-0">
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default UnmappedTable;
