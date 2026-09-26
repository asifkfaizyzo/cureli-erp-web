// pharmacy-web/src/pages/settings/users/comps/UserListTable.jsx (do not remove this comment)
// src/pages/settings/users/comps/UserListTable.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  User,
  MoreVertical,
  Edit2,
  Key,
  UserX,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Building2,
  Phone,
  Mail,
  Loader2,
  Users,
  Ban,
  CheckCircle,
  Clock,
} from "lucide-react";

import { deleteUser, reactivateUser, formatRole } from "../../../../api/users";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import Pagination from "../../../../components/common/Pagination";
import useDynamicRowCount from "../../../../hooks/useDynamicRowCount";

// ============================================
// COLUMN CONFIGURATION
// ============================================
const getColumnWidths = () => ({
  rowNum: '4%',
  user: '22%',
  role: '12%',
  branch: '14%',
  contact: '18%',
  status: '10%',
  lastLogin: '12%',
  actions: '8%',
});

/**
 * ActionMenu Component - Rendered via Portal
 */
const ActionMenu = ({
  user,
  position,
  onClose,
  onEdit,
  onResetPassword,
  onDeactivate,
  onReactivate,
  canEdit,
  canResetPassword,
  canDeactivate,
  canReactivate,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
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

  if (!position) return null;

  const hasAnyAction = canEdit || canResetPassword || canDeactivate || canReactivate;

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
      {canEdit && (
        <button
          onClick={() => { onClose(); onEdit(user); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Edit2 size={12} />
          Edit User
        </button>
      )}

      {canResetPassword && (
        <button
          onClick={() => { onClose(); onResetPassword(user); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Key size={12} />
          Reset Password
        </button>
      )}

      {canReactivate && (
        <>
          {(canEdit || canResetPassword) && <div className="border-t border-gray-100 my-1" />}
          <button
            onClick={() => { onClose(); onReactivate(user); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <UserCheck size={12} />
            Reactivate
          </button>
        </>
      )}

      {canDeactivate && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onClose(); onDeactivate(user); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <UserX size={12} />
            Deactivate
          </button>
        </>
      )}

      {!hasAnyAction && (
        <p className="px-3 py-1.5 text-xs text-gray-400 italic">No actions available</p>
      )}
    </motion.div>,
    document.body
  );
};

/**
 * Role Badge Component - Compact Style
 */
const RoleBadge = ({ role }) => {
  const config = {
    super_admin: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: Shield,
    },
    branch_admin: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: Shield,
    },
    staff: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: User,
    },
  };

  const roleConfig = config[role] || config.staff;
  const Icon = roleConfig.icon;

  return (
    <span className={`
      inline-flex items-center gap-1 px-1.5 py-0.5 
      text-[9px] 2xl:text-[10px] font-medium rounded
      border ${roleConfig.bg} ${roleConfig.text} ${roleConfig.border}
    `}>
      <Icon size={10} className="flex-shrink-0" />
      <span className="truncate">{formatRole(role)}</span>
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
 * User Row Component
 */
const UserRow = ({
  user,
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
        ${isEven ? 'bg-white' : 'bg-slate-50/50'} 
        hover:bg-indigo-50/50 transition-colors duration-150
        ${!user.is_active ? 'opacity-60' : ''}
      `}
      style={{ height: `${rowHeight}px` }}
    >
      {/* Row Number */}
      <td className="px-1 py-0.5 text-center border-r border-slate-100">
        <span className="text-[9px] 2xl:text-[10px] text-slate-400 font-medium">
          {rowNumber}
        </span>
      </td>

      {/* User Info */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
            ${user.is_active ? 'bg-indigo-100' : 'bg-slate-200'}
          `}>
            <span className={`
              font-semibold text-[10px]
              ${user.is_active ? 'text-indigo-600' : 'text-slate-400'}
            `}>
              {user.full_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`
              text-[10px] 2xl:text-[11px] font-medium truncate
              ${user.is_active ? 'text-slate-800' : 'text-slate-500'}
            `}>
              {user.full_name}
            </p>
            <p className="text-[8px] 2xl:text-[9px] text-slate-400 truncate">
              @{user.username}
            </p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        <RoleBadge role={user.role} />
      </td>

      {/* Branch */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        <div className="flex items-center gap-1">
          <Building2 size={10} className="text-slate-400 flex-shrink-0" />
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {user.branch_name || "—"}
          </span>
        </div>
      </td>

      {/* Contact */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Phone size={9} className="text-slate-400 flex-shrink-0" />
            <span className="text-[9px] 2xl:text-[10px] text-slate-600">
              {user.phone_number || "—"}
            </span>
          </div>
          {user.email && (
            <div className="flex items-center gap-1">
              <Mail size={9} className="text-slate-400 flex-shrink-0" />
              <span className="text-[8px] 2xl:text-[9px] text-slate-500 truncate">
                {user.email}
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-1 py-0.5 border-r border-slate-100 text-center">
        <StatusBadge isActive={user.is_active} />
      </td>

      {/* Last Login */}
      <td className="px-1.5 py-0.5 border-r border-slate-100">
        <div className="flex items-center gap-1">
          <Clock size={9} className="text-slate-400 flex-shrink-0" />
          <span className="text-[9px] 2xl:text-[10px] text-slate-500">
            {user.last_login_at
              ? new Date(user.last_login_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                })
              : "Never"
            }
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-1 py-0.5 text-center">
        {isProcessing ? (
          <Loader2 size={12} className="animate-spin text-slate-400 mx-auto" />
        ) : (
          <button
            ref={actionButtonRef}
            onClick={() => onActionClick(user.user_id)}
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
    className={isEven ? 'bg-white' : 'bg-slate-50/50'}
    style={{ height: `${rowHeight}px` }}
  >
    <td className="px-1 py-0.5 border-r border-slate-100">
      <div className="h-3 w-4 bg-slate-200 rounded animate-pulse mx-auto" />
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-slate-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-2.5 w-20 bg-slate-200 rounded animate-pulse mb-1" />
          <div className="h-2 w-14 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-1" />
      <div className="h-2 w-28 bg-slate-200 rounded animate-pulse" />
    </td>
    <td className="px-1 py-0.5 border-r border-slate-100 text-center">
      <div className="h-4 w-14 bg-slate-200 rounded animate-pulse mx-auto" />
    </td>
    <td className="px-1.5 py-0.5 border-r border-slate-100">
      <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
    </td>
    <td className="px-1 py-0.5">
      <div className="h-4 w-4 bg-slate-200 rounded animate-pulse mx-auto" />
    </td>
  </tr>
);

/**
 * UserListTable Component
 */
const UserListTable = ({
  users,
  loading,
  totalItems,
  currentPage,
  setCurrentPage,
  onEdit,
  onResetPassword,
  onRefresh,
  isSuperAdmin,
  isBranchAdmin,
  currentBranchId,
  toast,
}) => {
  const tableContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  const headerRef = useRef(null);
  const actionButtonRefs = useRef({});
  
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [scrollInfo, setScrollInfo] = useState({ canScrollUp: false, canScrollDown: false });
  const [actionMenuState, setActionMenuState] = useState({ userId: null, position: null });
  const [processingUserId, setProcessingUserId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, user: null });

  const visibleRows = useDynamicRowCount();
  const rowHeight = 40;
  const viewportHeight = visibleRows * rowHeight;
  const columnWidths = getColumnWidths();

  const totalPages = Math.ceil(totalItems / visibleRows);

  // ============================================
  // SCROLLBAR & SCROLL HANDLING
  // ============================================
  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;
    const width = container.offsetWidth - container.clientWidth;
    setScrollbarWidth(width);
  }, [users.length, visibleRows]);

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
    container.addEventListener('scroll', updateScrollInfo);
    updateScrollInfo();
    return () => container.removeEventListener('scroll', updateScrollInfo);
  }, [updateScrollInfo]);

  const scrollToTop = useCallback(() => {
    tableBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    tableBodyRef.current?.scrollTo({ top: tableBodyRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  // ============================================
  // PERMISSION CHECKS
  // ============================================
  const canEditUser = (user) => {
    if (isSuperAdmin) return true;
    if (isBranchAdmin) {
      return user.branch_id === currentBranchId && user.role === "staff";
    }
    return false;
  };

  const canResetPassword = (user) => {
    if (!user.is_active) return false;
    if (isSuperAdmin) return true;
    if (isBranchAdmin) {
      return user.branch_id === currentBranchId && user.role === "staff";
    }
    return false;
  };

  const canDeactivateUser = (user) => isSuperAdmin && user.is_active;
  const canReactivateUser = (user) => isSuperAdmin && !user.is_active;

  // ============================================
  // MENU POSITION CALCULATION
  // ============================================
  const calculateMenuPosition = useCallback((userId) => {
    const buttonEl = actionButtonRefs.current[userId];
    if (!buttonEl) return null;

    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 140;
    const padding = 8;

    let top = rect.bottom + padding;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight) top = rect.top - menuHeight - padding;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;

    return { top, left };
  }, []);

  // ============================================
  // ACTION HANDLERS
  // ============================================
  const handleActionClick = (userId) => {
    if (actionMenuState.userId === userId) {
      setActionMenuState({ userId: null, position: null });
    } else {
      const position = calculateMenuPosition(userId);
      setActionMenuState({ userId, position });
    }
  };

  const handleCloseMenu = () => setActionMenuState({ userId: null, position: null });

  const handleDeactivateClick = (user) => {
    setConfirmDialog({ isOpen: true, type: 'deactivate', user });
  };

  const handleReactivateClick = (user) => {
    setConfirmDialog({ isOpen: true, type: 'reactivate', user });
  };

  const handleConfirmAction = async () => {
    const { type, user } = confirmDialog;
    setProcessingUserId(user.user_id);
    setConfirmDialog({ isOpen: false, type: null, user: null });

    try {
      if (type === 'deactivate') {
        await deleteUser(user.user_id);
        toast.success("User Deactivated", `${user.full_name} can no longer log in.`, 4000);
      } else if (type === 'reactivate') {
        await reactivateUser(user.user_id);
        toast.success("User Reactivated", `${user.full_name} can now log in.`, 4000);
      }
      onRefresh();
    } catch (err) {
      console.error(`Failed to ${type} user:`, err);
      const errorMessage = err.response?.data?.message || `Failed to ${type} user.`;
      toast.error(`${type === 'deactivate' ? 'Deactivation' : 'Reactivation'} Failed`, errorMessage, 5000);
    } finally {
      setProcessingUserId(null);
    }
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const hasOverflow = users.length > visibleRows;
  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

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
              <Users size={12} className="text-indigo-500" />
              <span className="text-[8px] text-slate-500 uppercase tracking-wide font-medium">Total:</span>
              <span className="text-[10px] font-bold text-indigo-600">{totalItems}</span>
            </div>
            
            <div className="h-3 w-px bg-slate-300" />
            
            <div className="flex items-center gap-1.5">
              <CheckCircle size={10} className="text-emerald-500" />
              <span className="text-[8px] text-slate-500">Active:</span>
              <span className="text-[10px] font-semibold text-emerald-600">{activeCount}</span>
            </div>
            
            {inactiveCount > 0 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <Ban size={10} className="text-red-400" />
                  <span className="text-[8px] text-slate-500">Inactive:</span>
                  <span className="text-[10px] font-semibold text-red-500">{inactiveCount}</span>
                </div>
              </>
            )}
            
            {totalPages > 1 && (
              <>
                <div className="h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[8px]">
                  <span className="text-slate-500">Page</span>
                  <span className="font-bold text-slate-700">
                    {currentPage}/{totalPages}
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
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: columnWidths.rowNum }} />
                <col style={{ width: columnWidths.user }} />
                <col style={{ width: columnWidths.role }} />
                <col style={{ width: columnWidths.branch }} />
                <col style={{ width: columnWidths.contact }} />
                <col style={{ width: columnWidths.status }} />
                <col style={{ width: columnWidths.lastLogin }} />
                <col style={{ width: columnWidths.actions }} />
              </colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white h-7">
                  <th className="px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">#</th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">User</th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">Role</th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">
                    <div className="flex items-center gap-1">
                      <Building2 size={10} />
                      Branch
                    </div>
                  </th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">Contact</th>
                  <th className="px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center border-r border-slate-600/30">Status</th>
                  <th className="px-1.5 py-1 text-[8px] 2xl:text-[9px] font-bold text-left border-r border-slate-600/30">Last Login</th>
                  <th className="px-1 py-1 text-[8px] 2xl:text-[9px] font-bold text-center">Actions</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable Body */}
          <div 
            ref={tableBodyRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }}
          >
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: columnWidths.rowNum }} />
                <col style={{ width: columnWidths.user }} />
                <col style={{ width: columnWidths.role }} />
                <col style={{ width: columnWidths.branch }} />
                <col style={{ width: columnWidths.contact }} />
                <col style={{ width: columnWidths.status }} />
                <col style={{ width: columnWidths.lastLogin }} />
                <col style={{ width: columnWidths.actions }} />
              </colgroup>
              <tbody>
                {loading ? (
                  Array.from({ length: visibleRows }).map((_, index) => (
                    <SkeletonRow 
                      key={index} 
                      rowHeight={rowHeight} 
                      isEven={index % 2 === 0} 
                    />
                  ))
                ) : (
                  users.map((user, index) => (
                    <UserRow
                      key={user.user_id ?? index}
                      user={user}
                      rowNumber={index + 1}
                      isEven={index % 2 === 0}
                      rowHeight={rowHeight}
                      isProcessing={processingUserId === user.user_id}
                      actionButtonRef={(el) => (actionButtonRefs.current[user.user_id] = el)}
                      onActionClick={handleActionClick}
                    />
                  ))
                )}
              </tbody>
            </table>
            
            {/* Empty State */}
            {!loading && users.length === 0 && (
              <div 
                className="flex flex-col items-center justify-center text-slate-400"
                style={{ height: `${viewportHeight}px` }}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <Users size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">No users found</p>
                <p className="text-xs text-slate-400">Try adjusting your filters or add a new user</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 0 && !loading && users.length > 0 && (
          <div className="shrink-0 border-t border-slate-200">
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={totalItems}
              rowsPerPage={visibleRows}
            />
          </div>
        )}

        {/* Action Menu Portal */}
        <AnimatePresence>
          {actionMenuState.userId && (
            <ActionMenu
              user={users.find((u) => u.user_id === actionMenuState.userId)}
              position={actionMenuState.position}
              onClose={handleCloseMenu}
              onEdit={onEdit}
              onResetPassword={onResetPassword}
              onDeactivate={handleDeactivateClick}
              onReactivate={handleReactivateClick}
              canEdit={canEditUser(users.find((u) => u.user_id === actionMenuState.userId))}
              canResetPassword={canResetPassword(users.find((u) => u.user_id === actionMenuState.userId))}
              canDeactivate={canDeactivateUser(users.find((u) => u.user_id === actionMenuState.userId))}
              canReactivate={canReactivateUser(users.find((u) => u.user_id === actionMenuState.userId))}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, user: null })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.type === 'deactivate' ? 'Deactivate User?' : 'Reactivate User?'}
        message={
          confirmDialog.type === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmDialog.user?.full_name}"? They will no longer be able to log in.`
            : `Are you sure you want to reactivate "${confirmDialog.user?.full_name}"? They will regain access.`
        }
        confirmText={confirmDialog.type === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        cancelText="Cancel"
        type={confirmDialog.type === 'deactivate' ? 'danger' : 'success'}
        loading={processingUserId === confirmDialog.user?.user_id}
      />
    </>
  );
};

export default UserListTable;