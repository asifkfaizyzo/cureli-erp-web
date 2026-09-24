// cadmin-web/src/pages/Users-management/comps/UserTable.jsx (do not remove this comment)
// src/pages/Users-management/comps/UserTable.jsx
import { useEffect, useState } from "react";
import {
  Pencil,
  ChevronUp,
  ChevronDown,
  Users,
  Ban,
  CheckCircle,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableSkeleton from "../../../components/common/TableSkeleton";
import TableEmptyState from "../../../components/common/TableEmptyState";
import UserDetailsModal from "./UserDetailsModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { toggleCAdminUserAccess } from "../../../api/cadminUsers";
import {
  TABLE_CONFIG,
  getRoleBadgeStyle,
  getClickableRowClass,
} from "../../../config/tableConfig";

// ============================================
// COLUMN CONFIGURATION
// ============================================
const COLUMNS = {
  slNo: { key: 'slNo', label: '#', width: 50, sortable: false, align: 'left' },
  name: { key: 'name', label: 'Full Name', width: 160, sortable: true, align: 'left' },
  username: { key: 'username', label: 'Username', width: 130, sortable: true, align: 'left' },
  email: { key: 'email', label: 'Email', width: 200, sortable: false, align: 'left' },
  role: { key: 'role', label: 'Role', width: 110, sortable: false, align: 'center' },
  status: { key: 'status', label: 'Status', width: 100, sortable: false, align: 'center' },
  lastLogin: { key: 'lastLogin', label: 'Last Login', width: 110, sortable: true, align: 'left' },
  actions: { key: 'actions', label: 'Actions', width: 80, sortable: false, align: 'center' },
};

const UserTable = ({
  currentPage,
  setCurrentPage,
  rowsPerPage,
  users = [],
  loading = false,
  totalItems = 0,
  sortConfig = { sortBy: null, order: null },
  onSortChange,
  onRefresh,
  onUserUpdate,
}) => {
  const { styles, heights } = TABLE_CONFIG;

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  // Suspend/Activate confirmation
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.values(COLUMNS).forEach(col => {
      widths[col.key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);

  // ============================================
  // COLUMN RESIZING HANDLERS
  // ============================================
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
  // ROW CLICK HANDLER (Opens View Modal)
  // ============================================
  const handleRowClick = (user) => {
    setSelectedUser(user);
    setModalMode("view");
    setIsModalOpen(true);
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================
  const handleEditClick = (e, user) => {
    e.stopPropagation(); // Prevent row click
    setSelectedUser(user);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSuspendClick = (e, user) => {
    e.stopPropagation(); // Prevent row click
    setUserToSuspend(user);
    setShowSuspendConfirm(true);
  };

  const handleSuspendConfirm = async () => {
    if (!userToSuspend) return;
    setSuspendLoading(true);
    try {
      const newIsActive = !userToSuspend.is_active;
      await toggleCAdminUserAccess(userToSuspend.id, newIsActive);
      onUserUpdate?.(userToSuspend.id, { is_active: newIsActive });
      setShowSuspendConfirm(false);
      setUserToSuspend(null);
    } catch (err) {
      
      alert(err.response?.data?.message || "Failed to update user status");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleModalClose = (shouldRefresh = false) => {
    setIsModalOpen(false);
    setSelectedUser(null);
    if (shouldRefresh) {
      onRefresh?.();
    }
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const startIndex = (currentPage - 1) * rowsPerPage;
  const hasData = users.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  // ============================================
  // SORTABLE HEADER COMPONENT
  // ============================================
  const SortableHeader = ({ column }) => {
    const config = COLUMNS[column];
    const isActive = sortConfig?.sortBy === column;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th
        style={{ width: columnWidths[column], minWidth: 50 }}
        className="relative group"
      >
        <div
          className={`flex items-center justify-between ${styles.header.cell} ${
            config.sortable ? "cursor-pointer select-none" : ""
          }`}
          onClick={() => config.sortable && onSortChange?.(column)}
        >
          <span>{config.label}</span>
          {config.sortable && (
            <div className="flex flex-col gap-0.5">
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
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // ============================================
  // NON-SORTABLE HEADER COMPONENT
  // ============================================
  const TableHeader = ({ column }) => {
    const config = COLUMNS[column];
    
    if (config.sortable) {
      return <SortableHeader column={column} />;
    }

    return (
      <th
        style={{ width: columnWidths[column], minWidth: 50 }}
        className={`relative group ${config.align === 'center' ? 'text-center' : ''}`}
      >
        <div className={styles.header.cell}>
          {config.label}
        </div>
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // ============================================
  // STATUS BADGE COMPONENT
  // ============================================
  const StatusBadge = ({ isActive }) => {
    if (isActive) {
      return (
        <span className={TABLE_CONFIG.styles.badges.status.active}>
          <CheckCircle size={12} />
          Active
        </span>
      );
    }
    return (
      <span className={TABLE_CONFIG.styles.badges.status.inactive}>
        <Ban size={12} />
        Inactive
      </span>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.container.wrapper}>
      {/* Table - Show when loading OR has data */}
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "800px" }}>
            {/* Table Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <TableHeader column="slNo" />
                <SortableHeader column="name" />
                <SortableHeader column="username" />
                <TableHeader column="email" />
                <TableHeader column="role" />
                <TableHeader column="status" />
                <SortableHeader column="lastLogin" />
                <TableHeader column="actions" />
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                // Skeleton Loading Rows
                <TableSkeleton
                  rows={rowsPerPage}
                  columns={Object.keys(COLUMNS).filter(k => k !== 'slNo' && k !== 'actions')}
                />
              ) : (
                // Actual Data Rows
                users.map((user, index) => (
                  <tr
                    key={user.id ?? index}
                    onClick={() => handleRowClick(user)}
                    className={getClickableRowClass(index, !user.is_active)}
                    style={{ height: `${heights.bodyRow}px` }}
                  >
                    {/* Serial Number */}
                    <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                      {startIndex + index + 1}
                    </td>

                    {/* Full Name + Shop Name */}
<td className={`${styles.cell.base} ${styles.cell.primary}`}>
  <div className="flex items-center gap-2">
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-gray-900 truncate">
          {user.name}
        </span>
        {!user.is_active && (
          <Ban size={12} className="text-red-400 flex-shrink-0" />
        )}
      </div>
      {user.shop_name && (
        <span className="text-xs text-gray-400 truncate">
          Shop Name :{user.shop_name}
        </span>
      )}
    </div>
  </div>
</td>

                    {/* Username */}
                    <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                      @{user.username}
                    </td>

                    {/* Email */}
                    <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <span className={getRoleBadgeStyle(user.role)}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <StatusBadge isActive={user.is_active} />
                    </td>

                    {/* Last Login */}
                    <td className={`${styles.cell.base} ${styles.cell.muted}`}>
                      {user.lastLogin || 'Never'}
                    </td>

                    {/* Actions */}
                    <td className={`${styles.cell.base}`}>
                      <div className={styles.actions.container}>
                        {/* Edit Button */}
                        <button
                          onClick={(e) => handleEditClick(e, user)}
                          className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                          title="Edit User"
                        >
                          <Pencil size={15} />
                        </button>

                        {/* Suspend/Activate Button */}
                        <button
                          onClick={(e) => handleSuspendClick(e, user)}
                          className={`${styles.actions.button.base} ${
                            user.is_active
                              ? styles.actions.button.suspend
                              : styles.actions.button.activate
                          }`}
                          title={user.is_active ? "Suspend User" : "Activate User"}
                        >
                          {user.is_active ? (
                            <Ban size={15} />
                          ) : (
                            <CheckCircle size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State - Show when not loading and no data */}
      {showEmptyState && (
        <TableEmptyState
          icon={Users}
          title="No users found"
          subtitle="Try adjusting your search or filters"
        />
      )}

      {/* Pagination - Show only when has data and not loading */}
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={selectedUser}
        mode={modalMode}
      />

      {/* Suspend/Activate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => {
          setShowSuspendConfirm(false);
          setUserToSuspend(null);
        }}
        onConfirm={handleSuspendConfirm}
        title={userToSuspend?.is_active ? "Suspend User?" : "Activate User?"}
        message={
          userToSuspend?.is_active
            ? `Are you sure you want to suspend "${userToSuspend?.name}"? They will not be able to log in until reactivated.`
            : `Are you sure you want to activate "${userToSuspend?.name}"? They will be able to log in again.`
        }
        confirmText={userToSuspend?.is_active ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={userToSuspend?.is_active ? "warning" : "success"}
        loading={suspendLoading}
      />
    </div>
  );
};

export default UserTable;