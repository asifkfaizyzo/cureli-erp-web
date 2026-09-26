// cadmin-web/src/pages/Audit/comps/AuditTable.jsx (do not remove this comment)
// ============================================
// AUDIT TABLE COMPONENT
// ============================================

import { useEffect, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ScrollText,
} from 'lucide-react';

import Pagination from '../../../components/common/Pagination';
import TableSkeleton from '../../../components/common/TableSkeleton';
import TableEmptyState from '../../../components/common/TableEmptyState';
import { TABLE_CONFIG } from '../../../config/tableConfig';

import {
  getActionConfig,
  getActionCategory,
  getEntityTypeConfig,
  getActorTypeConfig,
  getReasonCodeConfig,
  SEVERITY_CONFIG,
} from '../../../config/modules/auditConfig';

// ============================================
// COLUMN CONFIGURATION
// ============================================

const COLUMNS = {
  slNo: { key: 'slNo', label: '#', width: 50, sortable: false },
  timestamp: { key: 'timestamp', label: 'Timestamp', width: 170, sortable: true, sortKey: 'created_at' },
  action: { key: 'action', label: 'Action', width: 200, sortable: true },
  actor: { key: 'actor', label: 'Actor', width: 160, sortable: false },
  entity: { key: 'entity', label: 'Entity', width: 160, sortable: false },
  shop: { key: 'shop', label: 'Context', width: 140, sortable: false },
  reason: { key: 'reason', label: 'Reason', width: 110, sortable: false },
  ip: { key: 'ip', label: 'IP Address', width: 120, sortable: false },
};

// ============================================
// HELPER COMPONENTS (All with proper truncation)
// ============================================

const SingleLineTimestamp = ({ dateString }) => {
  if (!dateString) return <span className="text-gray-400">-</span>;
  const date = new Date(dateString);
  const d = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const t = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  return (
    <span className="font-mono text-sm text-gray-600" title={`${d} | ${t}`}>
      {d} <span className="text-gray-300">|</span> {t}
    </span>
  );
};

const SingleLineActionBadge = ({ action }) => {
  const config = getActionConfig(action);
  const category = getActionCategory(action);
  const severity = SEVERITY_CONFIG[config.severity] || SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full 
                 ${severity.bgColor} ${severity.color} max-w-full`}
      title={`${config.label} (${category?.label || 'Uncategorized'})`}
    >
      <Icon size={12} className="flex-shrink-0" />
      <span className="text-xs font-medium truncate">
        {config.label}
      </span>
    </div>
  );
};

const SingleLineActor = ({ log }) => {
  const config = getActorTypeConfig(log.actor_type);
  const Icon = config.icon;

  return (
    <div 
      className="flex items-center gap-2 min-w-0" 
      title={`Role: ${log.actor_role || 'N/A'} | Name: ${log.actor_name}`}
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
        <Icon size={12} className={config.color} />
      </div>
      <span className="text-sm font-medium text-gray-700 truncate">
        {log.actor_name || 'Unknown'}
      </span>
    </div>
  );
};

const SingleLineEntity = ({ log }) => {
  const config = getEntityTypeConfig(log.entity_type);
  const Icon = config.icon;

  return (
    <div 
      className="flex items-center gap-2 min-w-0" 
      title={`Type: ${config.label} | ID: ${log.entity_id} | Name: ${log.entity_name}`}
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
        <Icon size={12} className={config.color} />
      </div>
      <span className="text-sm text-gray-700 truncate">
        {log.entity_name || log.entity_id?.slice(0, 8) || '-'}
      </span>
    </div>
  );
};

const SingleLineReason = ({ reasonCode }) => {
  if (!reasonCode) return <span className="text-gray-300 text-xs">-</span>;
  const config = getReasonCodeConfig(reasonCode);
  return (
    <span 
      className={`text-[11px] font-semibold uppercase tracking-wider truncate block ${config.color}`}
      title={config.label}
    >
      {config.label}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AuditTable = ({
  logs = [],
  loading = false,
  totalItems = 0,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  sortConfig = { sortBy: 'created_at', order: 'desc' },
  onSortChange,
  onRowClick,
}) => {
  const { styles, heights } = TABLE_CONFIG;

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.values(COLUMNS).forEach(col => {
      widths[col.key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);

  // Resize handlers
  const handleMouseDown = (column, e) => {
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
    setColumnWidths(prev => ({ ...prev, [resizing.column]: newWidth }));
  };

  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  // View state
  const hasData = logs.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  // Sortable Header
  const SortableHeader = ({ column }) => {
    const config = COLUMNS[column];
    const sortKey = config.sortKey || column;
    const isActive = sortConfig?.sortBy === sortKey;
    const isAsc = isActive && sortConfig?.order === 'asc';
    const isDesc = isActive && sortConfig?.order === 'desc';

    return (
      <th
        style={{ width: columnWidths[column], minWidth: 50, maxWidth: columnWidths[column] }}
        className="relative group"
      >
        <div
          className={`flex items-center justify-between ${styles.header.cell} ${
            config.sortable ? 'cursor-pointer select-none' : ''
          }`}
          onClick={() => config.sortable && onSortChange?.(sortKey)}
        >
          <span className="truncate">{config.label}</span>
          
          {config.sortable && (
            <div className="flex flex-col gap-0.5 ml-1 flex-shrink-0">
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
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // Plain Header
  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];
    return config.sortable ? (
      <SortableHeader column={column} />
    ) : (
      <th
        style={{ width: columnWidths[column], minWidth: 50, maxWidth: columnWidths[column] }}
        className="relative group"
      >
        <div className={styles.header.cell}>
          <span className="truncate">{config.label}</span>
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // Cell wrapper for proper truncation
  const TruncatedCell = ({ column, children, className = '' }) => (
    <td 
      className={`${styles.cell.base} ${className}`}
      style={{ 
        maxWidth: columnWidths[column], 
        width: columnWidths[column],
        overflow: 'hidden' 
      }}
    >
      <div className="truncate">
        {children}
      </div>
    </td>
  );

  return (
    <div className={styles.container.wrapper}>
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table 
            className="w-full border-collapse text-sm table-fixed" 
            style={{ minWidth: '800px' }}
          >
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <TableHeader column="slNo" />
                <SortableHeader column="timestamp" />
                <SortableHeader column="action" />
                <TableHeader column="actor" />
                <TableHeader column="entity" />
                <TableHeader column="shop" />
                <TableHeader column="reason" />
                <TableHeader column="ip" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton
                  rows={rowsPerPage}
                  columns={Object.keys(COLUMNS).filter(k => k !== 'slNo')}
                />
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={log.audit_id || index}
                    onClick={() => onRowClick?.(log)}
                    className={`${styles.row.base} ${
                      index % 2 === 0 ? styles.row.even : styles.row.odd
                    } ${styles.row.hover} ${styles.row.clickable}`}
                    style={{ height: `${heights.bodyRow}px` }}
                  >
                    {/* Serial Number */}
                    <TruncatedCell column="slNo" className={`${styles.cell.muted} font-medium`}>
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </TruncatedCell>

                    {/* Timestamp */}
                    <TruncatedCell column="timestamp">
                      <SingleLineTimestamp dateString={log.created_at} />
                    </TruncatedCell>

                    {/* Action */}
                    <td 
                      className={styles.cell.base}
                      style={{ maxWidth: columnWidths.action, overflow: 'hidden' }}
                    >
                      <SingleLineActionBadge action={log.action} />
                    </td>

                    {/* Actor */}
                    <td 
                      className={styles.cell.base}
                      style={{ maxWidth: columnWidths.actor, overflow: 'hidden' }}
                    >
                      <SingleLineActor log={log} />
                    </td>

                    {/* Entity */}
                    <td 
                      className={styles.cell.base}
                      style={{ maxWidth: columnWidths.entity, overflow: 'hidden' }}
                    >
                      <SingleLineEntity log={log} />
                    </td>

                    {/* Shop / Context */}
                    <TruncatedCell column="shop" className={styles.cell.secondary}>
                      <span title={log.shop_name}>{log.shop_name || '-'}</span>
                    </TruncatedCell>

                    {/* Reason */}
                    <TruncatedCell column="reason">
                      <SingleLineReason reasonCode={log.reason_code} />
                    </TruncatedCell>

                    {/* IP Address */}
                    <TruncatedCell column="ip" className={`${styles.cell.muted} font-mono text-xs`}>
                      <span title={log.ip_address}>{log.ip_address || '-'}</span>
                    </TruncatedCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEmptyState && (
        <TableEmptyState
          icon={ScrollText}
          title="No audit logs found"
          subtitle="Try adjusting your search or filters"
        />
      )}

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

export default AuditTable;