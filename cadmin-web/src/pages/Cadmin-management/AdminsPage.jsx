// cadmin-web/src/pages/Cadmin-management/AdminsPage.jsx (do not remove this comment)
// AdminsPage.jsx — complete file with dynamic role options

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  RefreshCw, Search, X, Filter, AlertCircle, UserPlus, Shield, Users,
} from "lucide-react";
import AdminTable from "./comps/AdminTable";
import AddAdminModal from "./comps/AddAdminModal";
import RolesTab from "./comps/RolesTab";
import StyledSelect from "../../components/common/StyledSelect";
import { getAdmins, getRoles } from "../../api/cadminAdmins";
import { useToast } from "../../components/common/Toast";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../config/cadminPermissions";

const STATUS_OPTIONS = [
  { value: "",         label: "All Status" },
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Suspended" },
];

const AdminsPage = () => {
  const toast       = useToast();
  const rowsPerPage = useDynamicRowCount();

  const { hasPermission, isSuperCAdmin } = useCAdminPermission();
  const canCreate      = isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_CREATE);
  const canEdit        = isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_EDIT);
  const canManageRoles = canEdit;

  const [activeTab, setActiveTab] = useState("admins");

  useEffect(() => {
    if (activeTab === "roles" && !canManageRoles) setActiveTab("admins");
  }, [activeTab, canManageRoles]);

  // ── Admin data ─────────────────────────────────────────────────────────────
  const [admins, setAdmins]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Role options for filter dropdown ──────────────────────────────────────
  const [roleOptions, setRoleOptions]       = useState([{ value: "", label: "All Roles" }]);
  const [rolesLoading, setRolesLoading]     = useState(false);

  // Fetch roles once on mount (and whenever the roles tab saves a new role)
// Inside fetchRoleOptions, replace the setRoleOptions block:

const fetchRoleOptions = useCallback(async () => {
  setRolesLoading(true);
  try {
    const res = await getRoles();
    const roles = res.data.data.roles ?? [];

    const activeRoles = roles.filter((r) => !r.is_deleted && r.admin_count > 0);

    setRoleOptions([
      { value: "", label: "All Roles" },
      { value: "super_admin", label: "Super Admin" },
      { value: "no_role", label: "No Role" },
      ...activeRoles.map((r) => ({
        value: r.name,
        label: `${r.name} (${r.admin_count})`,
      })),
    ]);
  } catch {
    setRoleOptions([{ value: "", label: "All Roles" }]);
  } finally {
    setRolesLoading(false);
  }
}, []);

  // Fetch role options on mount
  useEffect(() => {
    fetchRoleOptions();
  }, [fetchRoleOptions]);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ── Filters & sort ─────────────────────────────────────────────────────────
  const [searchText, setSearchText]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter]     = useState("");
  const [showFilters, setShowFilters]   = useState(false);
  const [sortConfig, setSortConfig]     = useState({ sortBy: "created_at", order: "desc" });
  const [currentPage, setCurrentPage]   = useState(1);

  const isInitialMount = useRef(true);

  const activeFiltersCount = useMemo(
    () => [statusFilter, roleFilter].filter(Boolean).length,
    [statusFilter, roleFilter],
  );

  const hasActiveFilters = useMemo(
    () => activeFiltersCount > 0 || searchText.trim().length > 0,
    [activeFiltersCount, searchText],
  );

  // ── Fetch admins ───────────────────────────────────────────────────────────
  const fetchAdmins = useCallback(async () => {
    if (activeTab !== "admins") return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        page:  currentPage,
        limit: rowsPerPage,
        sort:  sortConfig.sortBy,
        order: sortConfig.order,
      };
      if (searchText.trim()) params.search = searchText.trim();
      if (statusFilter)      params.status = statusFilter.toLowerCase();
      if (roleFilter)        params.role   = roleFilter;

      const response = await getAdmins(params);
      const { admins: data, meta } = response.data.data;

      setAdmins(data);
      setTotalItems(meta.total);
      setTotalPages(meta.totalPages);

      if (currentPage > meta.totalPages && meta.totalPages > 0) {
        setCurrentPage(meta.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      const errorMsg = err.response?.data?.message || "Failed to fetch admins";
      setError(errorMsg);
      setAdmins([]);
      setTotalItems(0);
      toast.error("Failed to Load Admins", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, rowsPerPage, searchText, statusFilter, roleFilter, sortConfig, toast]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    fetchAdmins();
  }, [fetchAdmins]);

  const isFirstFilterEffect = useRef(true);
  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchText, statusFilter, roleFilter, sortConfig]);

  const handleSortChange = useCallback((column) => {
    const columnMapping = { name: "name", role: "role", lastLogin: "last_login_at" };
    const backendColumn = columnMapping[column] || column;
    setSortConfig((prev) => ({
      sortBy: backendColumn,
      order:  prev.sortBy === backendColumn && prev.order === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("");
    setRoleFilter("");
  }, []);

  const handleAdminUpdate = useCallback((adminId, updates) => {
    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, ...updates } : a)),
    );
    if (updates.status === "Inactive") {
      toast.success("Admin Suspended", "Admin account has been suspended successfully.");
    } else if (updates.status === "Active") {
      toast.success("Admin Activated", "Admin account has been activated successfully.");
    } else if (Object.keys(updates).length > 0) {
      toast.success("Admin Updated", "Admin information updated successfully.");
    }
  }, [toast]);

  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest Admins...");
    fetchAdmins();
  }, [fetchAdmins]);

  const handleOpenAddModal  = useCallback(() => setIsAddModalOpen(true), []);

  const handleCloseAddModal = useCallback((wasCreated) => {
    setIsAddModalOpen(false);
    if (wasCreated) {
      setCurrentPage(1);
      fetchAdmins();
      // Refresh role options in case a new admin was assigned a role
      fetchRoleOptions();
    }
  }, [fetchAdmins, fetchRoleOptions]);

  const handleCreateAdmin = useCallback((newAdmin) => {
    setAdmins((prev) => [newAdmin, ...prev.slice(0, rowsPerPage - 1)]);
    setTotalItems((prev) => prev + 1);
    toast.success("Admin Created", `${newAdmin.username || "New admin"} has been added successfully.`);
  }, [rowsPerPage, toast]);

  // When switching back from roles tab to admins tab, refresh role options
  // in case the user created/deleted a role
  const handleTabChange = useCallback((tab) => {
    if (activeTab === "roles" && tab === "admins") {
      fetchRoleOptions();
    }
    setActiveTab(tab);
  }, [activeTab, fetchRoleOptions]);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">

          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#05015A] to-[#0a0280]
                            flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/20">
              <Shield size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Platform Access Control
              </h1>
              <p className="text-sm text-gray-500">
                Manage admin users and custom permission roles
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === "admins" && canCreate && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-[#000060] text-white rounded-lg
                           hover:shadow-lg hover:shadow-[#000060]/25 transition-all
                           flex items-center gap-2 flex-shrink-0"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Add Admin</span>
              </button>
            )}

            {activeTab === "admins" && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                           hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                           disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            )}

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => handleTabChange("admins")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                  ${activeTab === "admins"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Users size={16} />
                Admins
              </button>

              {canManageRoles && (
                <button
                  onClick={() => handleTabChange("roles")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                    ${activeTab === "roles"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <Shield size={16} />
                  Roles
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        {activeTab === "admins" && (
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm
                             bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20
                             focus:border-[#000060] transition-all"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                               text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2
                           transition-all shadow-sm relative flex-shrink-0
                           ${showFilters || activeFiltersCount > 0
                             ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200"
                             : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                           }`}
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white
                                   text-xs font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <StyledSelect
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_OPTIONS}
                    placeholder="All Status"
                  />
                  <StyledSelect
                    label="Role"
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={roleOptions}
                    placeholder={rolesLoading ? "Loading roles…" : "All Roles"}
                    disabled={rolesLoading}
                  />
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700
                                 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2"
                    >
                      <X size={16} /> Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "admins" && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg
                          flex items-center justify-between">
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

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "admins" ? (
          <AdminTable
            admins={admins}
            loading={loading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            totalItems={totalItems}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            onAdminUpdate={handleAdminUpdate}
            onRefresh={handleRefresh}
          />
        ) : (
          <RolesTab />
        )}
      </div>

      {canCreate && (
        <AddAdminModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onCreate={handleCreateAdmin}
        />
      )}
    </div>
  );
};

export default AdminsPage;