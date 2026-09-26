// pharmacy-web/src/pages/settings/branches/comps/BranchListTable.jsx (do not remove this comment)
// src/pages/settings/branches/comps/BranchListTable.jsx

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  MapPin,
  Phone,
  Users,
  Loader2,
  CheckCircle,
  Ban,
  ChevronUp,
  ChevronDown,
  Crown,
  GitBranch,
} from "lucide-react";

import { deleteBranch, reactivateBranch } from "../../../../api/branches";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import Pagination from "../../../../components/common/Pagination";
import useDynamicRowCount from "../../../../hooks/useDynamicRowCount";

// ============================================
// CONSTANTS
// ============================================
const DEFAULT_ROWS_PER_PAGE = 10;
const ROW_HEIGHT = 44;

const getColumnWidths = () => ({
  rowNum: "4%",
  branch: "24%",
  address: "28%",
  contact: "16%",
  users: "10%",
  status: "10%",
  actions: "8%",
});

/**
 * ActionMenu Component - Rendered via Portal
 */
const ActionMenu = ({
  branch,
  position,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!position || !branch) return null;

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1"
      style={{ top: position.top, left: position.left }}
    >
      <button
        onClick={() => {
          onClose();
          onEdit(branch);
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Edit2 size={12} />
        Edit Branch
      </button>

      {!branch.is_active && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onClose();
              onReactivate(branch);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Power size={12} />
            Reactivate
          </button>
        </>
      )}

      {!branch.is_main && branch.is_active && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onClose();
              onDeactivate(branch);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} />
            Deactivate
          </button>
        </>
      )}

      {branch.is_main && branch.is_active && (
        <p className="px-3 py-1.5 text-[10px] text-gray-400 italic">
          Main branch cannot be deactivated
        </p>
      )}
    </motion.div>,
    document.body,
  );
};

/**
 * Branch Type Badge - Compact Style
 */
const BranchTypeBadge = ({ isMain }) => {
  if (isMain) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[8px] 2xl:text-[9px] font-semibold rounded bg-amber-100 text-amber-700 border border-amber-200">
        <Crown size={8} />
        Main
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[8px] 2xl:text-[9px] font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
      <GitBranch size={8} />
      Branch
    </span>
  );
};

/**
 * Status Badge Component - Compact Style
 */
const StatusBadge = ({ isActive }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] 2xl:text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle size={10} />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] 2xl:text-[10px] font-medium rounded bg-red-100 text-red-600 border border-red-200">
      <Ban size={10} />
      Inactive
    </span>
  );
};

/**
 * Format address helper
 */
const formatAddress = (branch) => {
  const parts = [
    branch.address_line_1,
    branch.city,
    branch.state,
    branch.pincode,
  ].filter(Boolean);
  return parts.join(", ") || "No address";
};

/**
 * Branch Row Component
 */
const BranchRow = ({
  branch,
  rowNumber,
  isEven,
  rowHeight,
  isProcessing,
  actionButtonRef,
  onActionClick,
}) => {
  return (
    <tr
      className={`
        ${isEven ? "bg-white" : "bg-slate-50/50"} 
        hover:bg-indigo-50/50 transition-colors duration-150
        ${!branch.is_active ? "opacity-60" : ""}
      `}
      style={{ height: `${rowHeight}px` }}
    >
      {/* Row Number */}
      <td className="px-1 py-0.5 text-center border-r border-slate-100">
        <span className="text-[9px] 2xl:text-[10px] text-slate-400 font-medium">
          {rowNumber}
        </span>
      </td>

      {/* Branch Info */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className={`
            w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
            ${
              !branch.is_active
                ? "bg-slate-200"
                : branch.is_main
                  ? "bg-amber-100"
                  : "bg-indigo-100"
            }
          `}
          >
            <Building2
              size={14}
              className={
                !branch.is_active
                  ? "text-slate-400"
                  : branch.is_main
                    ? "text-amber-600"
                    : "text-indigo-600"
              }
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`
              text-[10px] 2xl:text-[11px] font-medium truncate
              ${branch.is_active ? "text-slate-800" : "text-slate-500"}
            `}
            >
              {branch.branch_name}
            </p>
            <BranchTypeBadge isMain={branch.is_main} />
          </div>
        </div>
      </td>

      {/* Address */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        <div className="flex items-center gap-1 min-w-0">
          <MapPin size={10} className="text-slate-400 flex-shrink-0" />
          <span
            className="text-[9px] 2xl:text-[10px] text-slate-600 truncate"
            title={formatAddress(branch)}
          >
            {formatAddress(branch)}
          </span>
        </div>
      </td>

      {/* Contact */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        {branch.contact_number ? (
          <div className="flex items-center gap-1">
            <Phone size={10} className="text-slate-400 flex-shrink-0" />
            <span className="text-[9px] 2xl:text-[10px] text-slate-600">
              {branch.contact_number}
            </span>
          </div>
        ) : (
          <span className="text-[9px] 2xl:text-[10px] text-slate-400">—</span>
        )}
      </td>

      {/* Users Count */}
      <td className="px-1 py-0.5 border-r border-slate-100 text-center">
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded">
          <Users size={10} className="text-slate-500" />
          <span className="text-[9px] 2xl:text-[10px] font-medium text-slate-600">
            {branch.user_count || 0}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-1 py-0.5 border-r border-slate-100 text-center">
        <StatusBadge isActive={branch.is_active} />
      </td>

      {/* Actions */}
      <td className="px-1 py-0.5 text-center">
        {isProcessing ? (
          <Loader2 size={12} className="animate-spin text-slate-400 mx-auto" />
        ) : (
          <button
            ref={actionButtonRef}
            onClick={() => onActionClick(branch.branch_id)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Actions"
          >
            <MoreVertical size={12} />
          </button>
        )}
      </td>
    </tr>
  );
};

/**
 * Loading Skeleton Row
 */
const SkeletonRow = ({ rowHeight, isEven }) => (
  <tr
    className={isEven ? "bg-white" : "bg-slate-50/50"}
    style={{ height: `${rowHeight}px` }}
  >
    <td className="px-1 py-0.5 border-r border-slate-100">
      <div className="h-3 w-4 bg-slate-200 rounded animate-pulse mx-auto" />
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-slate-200 rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-2.5 w-24 bg-slate-200 rounded animate-pulse mb-1" />
          <div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
    </td>
    <td className="px-1 py-0.5 border-r border-slate-100 text-center">
      <div className="h-4 w-10 bg-slate-200 rounded animate-pulse mx-auto" />
    </td>
    <td className="px-1 py-0.5 border-r border-slate-100 text-center">
      <div className="h-4 w-14 bg-slate-200 rounded animate-pulse mx-auto" />
    </td>
    <td className="px-1 py-0.5">
      <div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto" />
    </td>
  </tr>
);

/**
 * BranchListTable Component
 */
const BranchListTable = ({
  branches = [],
  loading = false,
  onEdit,
  onRefresh,
  toast,
}) => {
  const tableContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  const headerRef = useRef(null);
  const actionButtonRefs = useRef({});

  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [scrollInfo, setScrollInfo] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });
  const [actionMenuState, setActionMenuState] = useState({
    branchId: null,
    position: null,
  });
  const [processingBranchId, setProcessingBranchId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    branch: null,
  });

  //  INTERNAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);

  //  Get dynamic row count with proper fallback
  const dynamicRowCount = useDynamicRowCount();
  const rowsPerPage = useMemo(() => {
    const count = Number(dynamicRowCount);
    return !isNaN(count) && count > 0 ? count : DEFAULT_ROWS_PER_PAGE;
  }, [dynamicRowCount]);

  const viewportHeight = rowsPerPage * ROW_HEIGHT;
  const columnWidths = getColumnWidths();

  //  Safe pagination calculations
  const totalItems = Array.isArray(branches) ? branches.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  //  Ensure currentPage is always valid
  const safeCurrentPage = useMemo(() => {
    const page = Number(currentPage);
    if (isNaN(page) || page < 1) return 1;
    if (page > totalPages) return totalPages;
    return page;
  }, [currentPage, totalPages]);

  //  Reset to valid page if current page exceeds total
  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [safeCurrentPage, currentPage]);

  //  Paginate the branches array
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedBranches = useMemo(() => {
    if (!Array.isArray(branches)) return [];
    return branches.slice(startIndex, startIndex + rowsPerPage);
  }, [branches, startIndex, rowsPerPage]);

  // ============================================
  // SCROLLBAR & SCROLL HANDLING
  // ============================================
  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    const width = container.offsetWidth - container.clientWidth;
    setScrollbarWidth(width);
  }, [paginatedBranches.length, rowsPerPage]);

  const updateScrollInfo = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setScrollInfo({
      canScrollUp: scrollTop > 0,
      canScrollDown: scrollTop + clientHeight < scrollHeight - 5,
    });
  }, []);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateScrollInfo);
    updateScrollInfo();
    return () => container.removeEventListener("scroll", updateScrollInfo);
  }, [updateScrollInfo]);

  const scrollToTop = useCallback(() => {
    tableBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    tableBodyRef.current?.scrollTo({
      top: tableBodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // ============================================
  // MENU POSITION CALCULATION
  // ============================================
  const calculateMenuPosition = useCallback((branchId) => {
    const buttonEl = actionButtonRefs.current[branchId];
    if (!buttonEl) return null;

    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 120;
    const padding = 8;

    let top = rect.bottom + padding;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight)
      top = rect.top - menuHeight - padding;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding)
      left = window.innerWidth - menuWidth - padding;

    return { top, left };
  }, []);

  // ============================================
  // ACTION HANDLERS
  // ============================================
  const handleActionClick = (branchId) => {
    if (actionMenuState.branchId === branchId) {
      setActionMenuState({ branchId: null, position: null });
    } else {
      const position = calculateMenuPosition(branchId);
      setActionMenuState({ branchId, position });
    }
  };

  const handleCloseMenu = () =>
    setActionMenuState({ branchId: null, position: null });

  const handleDeactivateClick = (branch) => {
    if (branch.is_main) {
      toast?.warning?.(
        "Cannot Deactivate",
        "Main branch cannot be deactivated.",
        4000,
      );
      return;
    }
    setConfirmDialog({ isOpen: true, type: "deactivate", branch });
  };

  const handleReactivateClick = (branch) => {
    setConfirmDialog({ isOpen: true, type: "reactivate", branch });
  };

  const handleConfirmAction = async () => {
    const { type, branch } = confirmDialog;
    if (!branch) return;

    setProcessingBranchId(branch.branch_id);
    setConfirmDialog({ isOpen: false, type: null, branch: null });

    try {
      if (type === "deactivate") {
        await deleteBranch(branch.branch_id);
        toast?.success?.(
          "Branch Deactivated",
          `${branch.branch_name} deactivated.`,
          4000,
        );
      } else if (type === "reactivate") {
        await reactivateBranch(branch.branch_id);
        toast?.success?.(
          "Branch Reactivated",
          `${branch.branch_name} reactivated.`,
          4000,
        );
      }
      onRefresh?.();
    } catch (err) {
      console.error(`Failed to ${type} branch:`, err);
      const errorMessage =
        err.response?.data?.message || `Failed to ${type} branch.`;
      toast?.error?.(
        `${type === "deactivate" ? "Deactivation" : "Reactivation"} Failed`,
        errorMessage,
        5000,
      );
    } finally {
      setProcessingBranchId(null);
    }
  };

  //  Safe page change handler
  const handlePageChange = useCallback(
    (page) => {
      const newPage = Number(page);
      if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    },
    [totalPages],
  );

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const hasOverflow = paginatedBranches.length > rowsPerPage;
  const activeCount = branches.filter((b) => b.is_active).length;
  const inactiveCount = branches.filter((b) => !b.is_active).length;
  const mainBranch = branches.find((b) => b.is_main);
  const showPagination = !loading && totalItems > 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <div
        ref={tableContainerRef}
        className="h-full w-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        {/* Header Stats Bar */}
        <div className="shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-indigo-500" />
              <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">
                Total:
              </span>
              <span className="text-[10px] font-bold text-indigo-600">
                {totalItems}
              </span>
            </div>

            <div className="h-3 w-px bg-slate-300" />

            <div className="flex items-center gap-1.5">
              <CheckCircle size={10} className="text-emerald-500" />
              <span className="text-[8px] text-slate-500">Active:</span>
              <span className="text-[10px] font-semibold text-emerald-600">
                {activeCount}
              </span>
            </div>

            {inactiveCount > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <Ban size={10} className="text-red-400" />
                  <span className="text-[8px] text-slate-500">Inactive:</span>
                  <span className="text-[10px] font-semibold text-red-500">
                    {inactiveCount}
                  </span>
                </div>
              </>
            )}

            {mainBranch && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                  <Crown size={9} className="text-amber-600" />
                  <span className="text-[8px] font-medium text-amber-700 truncate max-w-[80px]">
                    {mainBranch.branch_name}
                  </span>
                </div>
              </>
            )}

            {totalPages > 1 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px]">
                  <span className="text-slate-500">Page</span>
                  <span className="font-bold text-slate-700">
                    {safeCurrentPage}/{totalPages}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasOverflow && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={scrollToTop}
                  disabled={!scrollInfo.canScrollUp}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={scrollToBottom}
                  disabled={!scrollInfo.canScrollDown}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <div
            ref={headerRef}
            className="shrink-0 overflow-hidden border-b-2 border-slate-300"
            style={{ paddingRight: `${scrollbarWidth}px` }}
          >
            <table
              className="w-full border-collapse"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: columnWidths.rowNum }} />
                <col style={{ width: columnWidths.branch }} />
                <col style={{ width: columnWidths.address }} />
                <col style={{ width: columnWidths.contact }} />
                <col style={{ width: columnWidths.users }} />
                <col style={{ width: columnWidths.status }} />
                <col style={{ width: columnWidths.actions }} />
              </colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-7">
                  <th className="px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">
                    #
                  </th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">
                    <div className="flex items-center gap-1">
                      <Building2 size={10} />
                      Branch
                    </div>
                  </th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">
                    <div className="flex items-center gap-1">
                      <MapPin size={10} />
                      Address
                    </div>
                  </th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">
                    <div className="flex items-center gap-1">
                      <Phone size={10} />
                      Contact
                    </div>
                  </th>
                  <th className="px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={10} />
                      Users
                    </div>
                  </th>
                  <th className="px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">
                    Status
                  </th>
                  <th className="px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center">
                    Actions
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable Body */}
          <div
            ref={tableBodyRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{
              height: `${viewportHeight}px`,
              maxHeight: `${viewportHeight}px`,
            }}
          >
            <table
              className="w-full border-collapse"
              style={{ tableLayout: "fixed" }}
            >
              <colgroup>
                <col style={{ width: columnWidths.rowNum }} />
                <col style={{ width: columnWidths.branch }} />
                <col style={{ width: columnWidths.address }} />
                <col style={{ width: columnWidths.contact }} />
                <col style={{ width: columnWidths.users }} />
                <col style={{ width: columnWidths.status }} />
                <col style={{ width: columnWidths.actions }} />
              </colgroup>
              <tbody>
                {loading
                  ? Array.from({ length: rowsPerPage }).map((_, index) => (
                      <SkeletonRow
                        key={index}
                        rowHeight={ROW_HEIGHT}
                        isEven={index % 2 === 0}
                      />
                    ))
                  : paginatedBranches.map((branch, index) => (
                      <BranchRow
                        key={branch.branch_id ?? index}
                        branch={branch}
                        rowNumber={startIndex + index + 1}
                        isEven={index % 2 === 0}
                        rowHeight={ROW_HEIGHT}
                        isProcessing={processingBranchId === branch.branch_id}
                        actionButtonRef={(el) =>
                          (actionButtonRefs.current[branch.branch_id] = el)
                        }
                        onActionClick={handleActionClick}
                      />
                    ))}
              </tbody>
            </table>

            {/* Empty State */}
            {!loading && totalItems === 0 && (
              <div
                className="flex flex-col items-center justify-center text-slate-400"
                style={{ height: `${viewportHeight}px` }}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <Building2 size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  No branches found
                </p>
                <p className="text-xs text-slate-400">
                  Create your first branch to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {showPagination && (
          <div className="shrink-0 border-t border-slate-200">
            <Pagination
              currentPage={safeCurrentPage}
              setCurrentPage={handlePageChange}
              totalItems={totalItems}
              rowsPerPage={rowsPerPage}
            />
          </div>
        )}

        {/* Action Menu Portal */}
        <AnimatePresence>
          {actionMenuState.branchId && (
            <ActionMenu
              branch={paginatedBranches.find(
                (b) => b.branch_id === actionMenuState.branchId,
              )}
              position={actionMenuState.position}
              onClose={handleCloseMenu}
              onEdit={onEdit}
              onDeactivate={handleDeactivateClick}
              onReactivate={handleReactivateClick}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, type: null, branch: null })
        }
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === "deactivate"
            ? "Deactivate Branch?"
            : "Reactivate Branch?"
        }
        message={
          confirmDialog.type === "deactivate" ? (
            <>
              Are you sure you want to deactivate{" "}
              <strong>{confirmDialog.branch?.branch_name}</strong>?
              <span className="text-xs block mt-2 text-amber-600 font-medium">
                All users in this branch will be moved to the main branch.
              </span>
            </>
          ) : (
            <>
              Are you sure you want to reactivate{" "}
              <strong>{confirmDialog.branch?.branch_name}</strong>?
            </>
          )
        }
        confirmText={
          confirmDialog.type === "deactivate" ? "Deactivate" : "Reactivate"
        }
        cancelText="Cancel"
        type={confirmDialog.type === "deactivate" ? "danger" : "success"}
        loading={processingBranchId === confirmDialog.branch?.branch_id}
      />
    </>
  );
};

export default BranchListTable;
