// cadmin-web/src/pages/User-Shop-Verifications/comps/VerificationTable.jsx (do not remove this comment)
// src/pages/User-Shop-Verifications/comps/VerificationTable.jsx
import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, ShieldCheck, Calendar } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableSkeleton from "../../../components/common/TableSkeleton";
import TableEmptyState from "../../../components/common/TableEmptyState";
import {
  TABLE_CONFIG,
  getClickableRowClass,
  getVerificationStatusConfig,
  formatDate,
} from "../../../config/tableConfig";

// ============================================
// COLUMN CONFIGURATION
// ============================================
const COLUMNS = {
  slNo: { key: 'slNo', label: '#', width: 50, sortable: false, align: 'center' },
  shopName: { key: 'business_name', label: 'Shop', width: 200, sortable: true, align: 'left' },
  ownerInfo: { key: 'owner_name', label: 'Owner', width: 180, sortable: true, align: 'left' },
  status: { key: 'verification_status', label: 'Status', width: 130, sortable: true, align: 'left' },
  files: { key: 'files', label: 'Files', width: 100, sortable: false, align: 'center' },
  resubCount: { key: 'resubmission_count', label: 'Resub', width: 70, sortable: true, align: 'center' },
  date: { key: 'created_at', label: 'Submitted', width: 120, sortable: true, align: 'left' },
};

const VerificationTable = ({
  data = [],
  loading = false,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  sortConfig = { sortBy: null, order: null },
  onSortChange,
  onRowClick,
}) => {
  const { styles, heights } = TABLE_CONFIG;

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.entries(COLUMNS).forEach(([key, col]) => {
      widths[key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);

  // ============================================
  // COLUMN RESIZING HANDLERS
  // ============================================
  const handleMouseDown = (column, e) => {
    if (column === 'slNo') return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = (e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newWidth = Math.max(50, resizing.startWidth + diff);
    setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
  };

  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const startIndex = (currentPage - 1) * rowsPerPage;
  const hasData = data.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  // ============================================
  // SORTABLE HEADER COMPONENT
  // ============================================
  const SortableHeader = ({ columnKey }) => {
    const column = COLUMNS[columnKey];
    const isActive = sortConfig?.sortBy === column.key;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th
        style={{ width: columnWidths[columnKey], minWidth: 50 }}
        className={`relative group ${column.align === 'center' ? 'text-center' : ''}`}
      >
        <div
          className={`flex items-center justify-between ${styles.header.cell} ${
            column.sortable ? "cursor-pointer select-none" : ""
          } ${column.align === 'center' ? 'justify-center' : ''}`}
          onClick={() => column.sortable && onSortChange?.(column.key)}
        >
          <span>{column.label}</span>
          {column.sortable && (
            <div className="flex flex-col gap-0.5 ml-1">
              <ChevronUp
                size={12}
                className={`transition-colors ${
                  isAsc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
              <ChevronDown
                size={12}
                className={`-mt-1 transition-colors ${
                  isDesc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
            </div>
          )}
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(columnKey, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // ============================================
  // NON-SORTABLE HEADER COMPONENT
  // ============================================
  const TableHeader = ({ columnKey }) => {
    const column = COLUMNS[columnKey];
    
    if (column.sortable) {
      return <SortableHeader columnKey={columnKey} />;
    }

    return (
      <th
        style={{ width: columnWidths[columnKey], minWidth: 50 }}
        className={`relative group ${column.align === 'center' ? 'text-center' : ''}`}
      >
        <div className={`${styles.header.cell} ${column.align === 'center' ? 'text-center' : ''}`}>
          {column.label}
        </div>
        {columnKey !== 'slNo' && (
          <div
            onMouseDown={(e) => handleMouseDown(columnKey, e)}
            className={styles.header.resizeHandle}
          />
        )}
      </th>
    );
  };

  // ============================================
  // STATUS BADGE COMPONENT
  // ============================================
  const StatusBadge = ({ status }) => {
    const config = getVerificationStatusConfig(status);
    return (
      <span className={config.wrapper}>
        <span className={config.dot} />
        {config.label}
      </span>
    );
  };

  // ============================================
  // FILES COUNT COMPONENT
  // ============================================
  const FilesCount = ({ approved, total, rejected }) => (
    <div className="inline-flex items-center gap-1">
      <span className="text-emerald-600 font-semibold text-sm">{approved || 0}</span>
      <span className="text-gray-300">/</span>
      <span className="text-gray-600 font-medium text-sm">{total || 0}</span>
      {rejected > 0 && (
        <span className="text-xs text-red-500 font-medium ml-1">
          ({rejected}✗)
        </span>
      )}
    </div>
  );

  // ============================================
  // RESUBMISSION BADGE COMPONENT
  // ============================================
  const ResubmissionBadge = ({ count }) => {
    const { resubmission } = styles.badges;
    
    if (count > 0) {
      return (
        <span className={resubmission.active}>
          {count}
        </span>
      );
    }
    return <span className={resubmission.empty}>—</span>;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.container.wrapper}>
      {/* Table - Show when loading OR has data */}
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "870px" }}>
            {/* Table Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <TableHeader columnKey="slNo" />
                <SortableHeader columnKey="shopName" />
                <SortableHeader columnKey="ownerInfo" />
                <SortableHeader columnKey="status" />
                <TableHeader columnKey="files" />
                <SortableHeader columnKey="resubCount" />
                <SortableHeader columnKey="date" />
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <TableSkeleton
                  rows={rowsPerPage}
                  columns={Object.keys(COLUMNS).filter(k => k !== 'slNo')}
                />
              ) : (
                data.map((shop, index) => (
                  <tr
                    key={shop.shop_id || `v-${index}`}
                    onClick={() => onRowClick?.(shop)}
                    className={getClickableRowClass(index)}
                    style={{ height: `${heights.bodyRow}px` }}
                  >
                    {/* Serial Number */}
                    <td 
                      className={`${styles.cell.base} ${styles.cell.center} ${styles.cell.muted} font-medium`}
                      style={{ width: columnWidths.slNo }}
                    >
                      {startIndex + index + 1}
                    </td>

                    {/* Shop Info - Compact version */}
                    <td 
                      className={styles.cell.base}
                      style={{ width: columnWidths.shopName }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        
                        <div className="min-w-0 flex-1">
                          <p className={`${styles.cell.primary} truncate text-sm`}>
                            {shop.business_name || "Unnamed Shop"}
                          </p>
                          <p className="text-xs text-gray-400 truncate font-mono">
                            #{shop.shop_id?.substring(0, 8) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info - Compact version */}
                    <td 
                      className={styles.cell.base}
                      style={{ width: columnWidths.ownerInfo }}
                    >
                      <div className="min-w-0">
                        <p className={`${styles.cell.primary} truncate text-sm`}>
                          {shop.owner_name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {shop.owner_email || "No email"}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td 
                      className={styles.cell.base}
                      style={{ width: columnWidths.status }}
                    >
                      <StatusBadge status={shop.verification_status} />
                    </td>

                    {/* Files Count */}
                    <td 
                      className={`${styles.cell.base} ${styles.cell.center}`}
                      style={{ width: columnWidths.files }}
                    >
                      <FilesCount
                        approved={shop.files_approved}
                        total={shop.files_total}
                        rejected={shop.files_rejected}
                      />
                    </td>

                    {/* Resubmission Count */}
                    <td 
                      className={`${styles.cell.base} ${styles.cell.center}`}
                      style={{ width: columnWidths.resubCount }}
                    >
                      <ResubmissionBadge count={shop.resubmission_count} />
                    </td>

                    {/* Date */}
                    <td 
                      className={styles.cell.base}
                      style={{ width: columnWidths.date }}
                    >
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar size={13} className="text-gray-400 shrink-0" />
                        <span className="text-sm">
                          {formatDate(shop.created_at)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <TableEmptyState
          icon={ShieldCheck}
          title="No verification records found"
          subtitle="There are no shops matching your current filters. Try adjusting your search criteria."
        />
      )}

      {/* Pagination */}
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}
    </div>
  );
};

export default VerificationTable;