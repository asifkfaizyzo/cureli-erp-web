// cadmin-web/src/pages/Users-management/UserPage.jsx (do not remove this comment)
// src/pages/Users-management/UserPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  RefreshCw,
  Search,
  X,
  Filter,
  AlertCircle,
} from "lucide-react";
import UserTable from "./comps/UserTable";
import StyledSelect from "../../components/common/StyledSelect";
import StyledDateFilter from "../../components/common/StyledDateFilter";
import { getCAdminUsers } from "../../api/cadminUsers";
import { useToast } from "../../components/common/Toast";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../config/cadminPermissions";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "branch_admin", label: "Branch Admin" },
  { value: "staff", label: "Staff" },
];

const UserPage = () => {
  const toast = useToast();
  const { hasPermission } = useCAdminPermission();
  const [searchParams, setSearchParams] = useSearchParams();
  const rowsPerPage = useDynamicRowCount();

  // Permission checks
  const canEdit = hasPermission(CADMIN_PERMISSIONS.USERS_EDIT);
  const canBlock = hasPermission(CADMIN_PERMISSIONS.USERS_BLOCK);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize search text from URL params
  const initialSearch = searchParams.get("search") || "";

  // Filters / sort
  const [searchText, setSearchText] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Server data
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [statusFilter, roleFilter, dateFilter].filter(Boolean).length;
  }, [statusFilter, roleFilter, dateFilter]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || searchText.trim().length > 0;
  }, [activeFiltersCount, searchText]);

  // Update search text when URL params change
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchText(searchFromUrl);
      setStatusFilter("");
      setRoleFilter("");
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Fetch function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        last_login: dateFilter || undefined,
        sort: sortConfig.sortBy,
        order: sortConfig.order,
      };

      const resp = await getCAdminUsers(params);

      const root = resp.data;
      const payload = root?.data || {};

     

      setUsers(payload.data || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Unable to fetch user data. Please try again.";
      setError(errorMessage);
      setUsers([]);
      setTotalItems(0);
      toast.error("Failed to Load Users", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    searchText,
    statusFilter,
    roleFilter,
    dateFilter,
    sortConfig,
    toast,
  ]);

  // Fetch on mount and whenever dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, roleFilter, dateFilter, sortConfig]);

  // Handlers
  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest Users data...", 2000);
    fetchUsers();
  }, [fetchUsers, toast]);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("");
    setRoleFilter("");
    setDateFilter("");
    searchParams.delete("search");
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handleUserUpdate = useCallback(
    (userId, updates) => {
      try {
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, ...updates } : user))
        );

        if (updates.is_active === false) {
          toast.success(
            "User Deactivated",
            "User account has been deactivated successfully."
          );
        } else if (updates.is_active === true) {
          toast.success(
            "User Activated",
            "User account has been activated successfully."
          );
        } else {
          toast.success(
            "User Updated",
            "User information updated successfully."
          );
        }
      } catch (error) {
        console.error("Failed to update user:", error);
        toast.error("Update Failed", "Failed to update user. Please try again.");
      }
    },
    [toast]
  );

  const handleSortChange = (column) => {
    setSortConfig((prev) => {
      const order =
        prev.sortBy === column && prev.order === "asc" ? "desc" : "asc";
      return { sortBy: column, order };
    });
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      searchParams.delete("search");
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
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
                {totalItems} total user{totalItems !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                           bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20 
                           focus:border-[#000060] transition-all"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                             text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2
                         transition-all shadow-sm relative flex-shrink-0
                         ${
                           showFilters || activeFiltersCount > 0
                             ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200"
                             : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                         }`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white 
                                 text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <StyledSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={STATUS_OPTIONS}
                  placeholder="All Status"
                />

                <StyledSelect
                  label="Role"
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value)}
                  options={ROLE_OPTIONS}
                  placeholder="All Roles"
                />

                <StyledDateFilter
                  label="Last Login Date"
                  date={dateFilter}
                  setDate={setDateFilter}
                />
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex items-center justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 
                               hover:bg-red-50 rounded-lg transition-all flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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

      {/* Table Container */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        
        <UserTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          users={users}
          loading={loading}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
          onUserUpdate={handleUserUpdate}
          canEdit={canEdit}
          canBlock={canBlock}
        />
      </div>
    </div>
  );
};
export default UserPage;