// cadmin-web/src/pages/MasterMedicines/comps/NoImagesTable.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/NoImagesTable.jsx

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Upload,
  Eye,
  Link2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ImageOff,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import TableSkeleton from "../../../components/common/TableSkeleton";
import StyledSelect from "../../../components/common/StyledSelect";
import { TABLE_CONFIG, getRowBgClass } from "../../../config/tableConfig";

const { styles, heights } = TABLE_CONFIG;

const NoImagesTable = ({
  medicines = [],
  selectedIds = [],
  onSelectionChange,
  onUploadImage,
  onViewLinked,
  onRowClick,
  loading = false,
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    order: "desc",
  });

  const defaultWidths = {
    checkbox: 48,
    index: 52,
    name: 220,
    type: 80,
    manufacturer: 160,
    linked: 90,
    created: 100,
    actions: 100,
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

  const rowsPerPage = 10;

  const filteredData = useMemo(() => {
    let result = [...medicines];

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (med) =>
          med.name?.toLowerCase().includes(search) ||
          med.manufacturer?.toLowerCase().includes(search),
      );
    }

    if (typeFilter) {
      result = result.filter((med) => med.type === typeFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "linkedCount") {
        aVal = a.linkedMedicines?.length || 0;
        bVal = b.linkedMedicines?.length || 0;
      }

      if (sortConfig.key === "createdAt" || sortConfig.key === "updatedAt") {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.order === "asc" ? aVal - bVal : bVal - aVal;
      }

      const as = String(aVal ?? "").toLowerCase();
      const bs = String(bVal ?? "").toLowerCase();
      if (sortConfig.order === "asc") return as < bs ? -1 : as > bs ? 1 : 0;
      return as > bs ? -1 : as < bs ? 1 : 0;
    });

    return result;
  }, [medicines, searchText, typeFilter, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalItems = filteredData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id));
  const someSelected = paginatedData.some((item) =>
    selectedIds.includes(item.id),
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(
        selectedIds.filter(
          (id) => !paginatedData.some((item) => item.id === id),
        ),
      );
    } else {
      onSelectionChange([
        ...new Set([...selectedIds, ...paginatedData.map((item) => item.id)]),
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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
    setCurrentPage(1);
  };

  const SortIcon = ({ sortKey }) => {
    if (!sortKey) return null;
    const isActive = sortConfig.key === sortKey;
    if (isActive) {
      return sortConfig.order === "asc" ? (
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const tableHeader = (
    <thead className="sticky top-0 z-10">
      <tr className={styles.header.row}>
        {/* Checkbox */}
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

        <ResizableTh col="index">#</ResizableTh>
        <ResizableTh col="name" sortKey="name">
          Name
        </ResizableTh>
        <ResizableTh col="type" align="center" sortKey="type">
          Type
        </ResizableTh>
        <ResizableTh col="manufacturer">Manufacturer</ResizableTh>
        <ResizableTh col="linked" align="center" sortKey="linkedCount">
          Linked
        </ResizableTh>
        <ResizableTh col="created" sortKey="createdAt">
          Created
        </ResizableTh>
        <ResizableTh col="actions" align="center">
          Actions
        </ResizableTh>
      </tr>
    </thead>
  );

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Filter Section ── */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-2 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search medicines without images..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
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
              onChange={(v) => {
                setTypeFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Types" },
                { value: "DRUG", label: "Drug" },
                { value: "OTC", label: "OTC" },
              ]}
              placeholder="All Types"
            />
          </div>

          <div className="flex-1" />

          <span className="text-xs text-gray-400">
            {totalItems} item{totalItems !== 1 ? "s" : ""}
          </span>

          {selectedIds.length > 0 && (
            <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
              {selectedIds.length} selected
            </div>
          )}
        </div>

        {/* Priority notice */}
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle size={15} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>High priority:</strong> These medicines have no images and
            are using placeholders. Upload images immediately.
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className={styles.container.wrapper}>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: 900 }}
            >
              {tableHeader}
              <tbody>
                <TableSkeleton rows={rowsPerPage} columns={8} />
              </tbody>
            </table>
          ) : paginatedData.length === 0 ? (
            <TableEmptyState
              icon={ImageOff}
              title="All medicines have images"
              subtitle="Great! No medicines are missing images"
            />
          ) : (
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: 900 }}
            >
              {tableHeader}
              <tbody>
                {paginatedData.map((med, index) => {
                  const linkedCount = med.linkedMedicines?.length || 0;
                  const isSelected = selectedIds.includes(med.id);

                  return (
                    <tr
                      key={med.id}
                      onClick={() => onRowClick?.(med)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50/80"
                          : index % 2 === 0
                            ? "bg-white hover:bg-indigo-50/40"
                            : "bg-gray-50/50 hover:bg-indigo-50/40"
                      }`}
                      style={{ height: `${heights.bodyRow}px` }}
                    >
                      {/* Checkbox — stop propagation */}
                      <td
                        className={styles.cell.base}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => toggleSelect(med.id)}
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

                      {/* Index */}
                      <td
                        className={`${styles.cell.base} ${styles.cell.muted} font-medium`}
                      >
                        {startIndex + index + 1}
                      </td>

                      {/* Name */}
                      <td className={styles.cell.base}>
                        <div className="max-w-[220px]">
                          <p className={`${styles.cell.primary} truncate`}>
                            {med.name}
                          </p>
                          <p
                            className={`text-xs ${styles.cell.muted} truncate`}
                          >
                            {med.composition || "—"}
                          </p>
                        </div>
                      </td>

                      {/* Type */}
                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                      >
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            med.type === "DRUG"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {med.type}
                        </span>
                      </td>

                      {/* Manufacturer */}
                      <td className={styles.cell.base}>
                        <span
                          className={`${styles.cell.secondary} truncate block max-w-[150px]`}
                        >
                          {med.manufacturer || "—"}
                        </span>
                      </td>

                      {/* Linked */}
                      <td className={`${styles.cell.base} ${styles.cell.center}`} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewLinked(med)}
                          disabled={linkedCount === 0}
                          className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto ${
                            linkedCount > 0
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Link2 size={12} />
                          {linkedCount}
                        </button>
                      </td>

                      {/* Created */}
                      <td
                        className={`${styles.cell.base} ${styles.cell.muted} text-xs`}
                      >
                        {formatDate(med.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className={styles.cell.base} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.actions.container}>
                          {linkedCount > 0 && (
                            <button
                              onClick={() => onViewLinked(med)}
                              className={`${styles.actions.button.base} ${styles.actions.button.view}`}
                              title="View Linked"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onUploadImage(med)}
                            className={`${styles.actions.button.base} text-red-600 bg-red-50 hover:bg-red-100`}
                            title="Upload Image (Required)"
                          >
                            <Upload size={14} />
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

        {totalItems > 0 && !loading && (
          <div className={styles.pagination.wrapper}>
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={totalItems}
              rowsPerPage={rowsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NoImagesTable;
