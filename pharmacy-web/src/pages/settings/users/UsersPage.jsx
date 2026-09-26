// pharmacy-web/src/pages/settings/users/UsersPage.jsx (do not remove this comment)
// src/pages/settings/users/UsersPage.jsx

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, AlertCircle, RefreshCw } from "lucide-react";

import { usePermission } from "../../../hooks/usePermission";
import { useToast } from "../../../components/common/Toast/ToastContainer";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import { fetchUsers, fetchUserLimits } from "../../../api/users";
import { fetchBranchesDropdown } from "../../../api/branches";

// Components
import UserLimitBanner from "./comps/UserLimitBanner";
import UserFilters from "./comps/UserFilters";
import UserListTable from "./comps/UserListTable";
import AddEditUserModal from "./comps/AddEditUserModal";
import ResetPasswordModal from "./comps/ResetPasswordModal";

/**
 * UsersPage
 * Main user management page
 * - SA: sees all users, can manage all
 * - BA: sees only own branch users, can only manage staff
 */
const UsersPage = () => {
  const { isSuperAdmin, isBranchAdmin, branchId } = usePermission();
  const toast = useToast();

  //  Use dynamic row count based on screen height
  const rowsPerPage = useDynamicRowCount();

  // ============================================
  // STATE
  // ============================================

  // Data
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [limits, setLimits] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    branch_id: "",
    role: "",
    status: "active",
  });

  // Sorting -  Match the pattern from CAdmin
  const [sortConfig, setSortConfig] = useState({
    sort_by: "created_at",
    sort_order: "desc",
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  // Fetch branches for filter dropdown (SA only)
  const loadBranches = useCallback(async () => {
    if (!isSuperAdmin) return;

    try {
      const response = await fetchBranchesDropdown();
      if (response.success) {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
      toast.error(
        "Branch Load Failed",
        "Could not load branches for filtering. Please try again.",
        5000,
      );
    }
  }, [isSuperAdmin, toast]);

  // Fetch user limits
  const loadLimits = useCallback(async () => {
    try {
      const response = await fetchUserLimits();
      if (response.success) {
        setLimits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
      toast.warning(
        "Limits Unavailable",
        "Could not load user limits information.",
        4000,
      );
    }
  }, [toast]);

  //  Fetch users - Updated to use rowsPerPage from hook
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort_by: sortConfig.sort_by,
        sort_order: sortConfig.sort_order,
      };

      // Add filters
      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;

      // Branch filter (SA only, BA is auto-filtered by backend)
      if (isSuperAdmin && filters.branch_id) {
        params.branch_id = filters.branch_id;
      }

      const response = await fetchUsers(params);

      if (response.success) {
        setUsers(response.data.users || []);
        setTotalItems(response.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to load users. Please try again.";
      setError(errorMessage);
      toast.error("Load Failed", errorMessage, 5000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, sortConfig, filters, isSuperAdmin, toast]);

  // Initial load
  useEffect(() => {
    loadBranches();
    loadLimits();
  }, [loadBranches, loadLimits]);

  // Load users on filter/page/sort change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  //  Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    toast.info("Refreshing", "Loading latest user data...", 2000);
    loadUsers();
    loadLimits();
  }, [loadUsers, loadLimits, toast]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  //  Sort handler - matches CAdmin pattern
  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sort_by: column,
      sort_order:
        prev.sort_by === column && prev.sort_order === "asc" ? "desc" : "asc",
    }));
  };

  const handleAddUser = () => {
    if (!limits?.can_add) {
      toast.warning(
        "User Limit Reached",
        "You have reached the maximum number of users allowed for your plan.",
        5000,
      );
      return;
    }
    setSelectedUser(null);
    setShowAddEditModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowAddEditModal(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleModalClose = (shouldRefresh = false, result = null) => {
    setShowAddEditModal(false);
    setShowResetPasswordModal(false);
    setSelectedUser(null);

    if (shouldRefresh) {
      handleRefresh();

      if (result) {
        if (result.type === "created") {
          toast.success(
            "User Created",
            `${result.userName} has been successfully added.`,
            4000,
          );
        } else if (result.type === "updated") {
          toast.success(
            "User Updated",
            `${result.userName}'s information updated.`,
            4000,
          );
        } else if (result.type === "password_reset") {
          toast.success(
            "Password Reset",
            `Password reset for ${result.userName}.`,
            4000,
          );
        }
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    //  FIXED: Added min-w-0 and overflow-hidden for proper flex shrinking
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header - flex-shrink-0 to prevent shrinking */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                User Management
              </h1>
              <p className="text-sm text-gray-500">
                {isSuperAdmin
                  ? `${totalItems} total user${totalItems !== 1 ? "s" : ""} across branches`
                  : `${totalItems} staff member${totalItems !== 1 ? "s" : ""} in your branch`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 
                         rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Add User Button */}
            <button
              onClick={handleAddUser}
              disabled={!limits?.can_add}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm
                ${
                  limits?.can_add
                    ? "bg-[#000060] text-white hover:bg-[#000080]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
              title={!limits?.can_add ? "User limit reached" : "Add new user"}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>

        {/* Limit Banner */}
        {limits && <UserLimitBanner limits={limits} />}

        {/* Filters */}
        <UserFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          branches={branches}
          showBranchFilter={isSuperAdmin}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-700 hover:text-red-900 font-medium underline text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/*  Table Container - Takes remaining height with proper overflow */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <UserListTable
          users={users}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onEdit={handleEditUser}
          onResetPassword={handleResetPassword}
          onRefresh={handleRefresh}
          isSuperAdmin={isSuperAdmin}
          isBranchAdmin={isBranchAdmin}
          currentBranchId={branchId}
          toast={toast}
        />
      </div>

      {/* Modals */}
      {showAddEditModal && (
        <AddEditUserModal
          user={selectedUser}
          branches={branches}
          onClose={handleModalClose}
          isSuperAdmin={isSuperAdmin}
          currentBranchId={branchId}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal user={selectedUser} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default UsersPage;
