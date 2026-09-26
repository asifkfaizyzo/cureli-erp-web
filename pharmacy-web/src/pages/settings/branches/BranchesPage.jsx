// pharmacy-web/src/pages/settings/branches/BranchesPage.jsx (do not remove this comment)
// src/pages/settings/branches/BranchesPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  Plus,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { usePermission } from "../../../hooks/usePermission";
import { useToast } from "../../../components/common/Toast/ToastContainer";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import { fetchBranches, fetchBranchLimits } from "../../../api/branches";

// Components
import BranchLimitBanner from "./comps/BranchLimitBanner";
import BranchFilters from "./comps/BranchFilters";
import BranchListTable from "./comps/BranchListTable";
import AddEditBranchModal from "./comps/AddEditBranchModal";

/**
 * BranchesPage
 */
const BranchesPage = () => {
  const { isSuperAdmin, isBranchAdmin } = usePermission();
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

  // ============================================
  // STATE
  // ============================================
  const [branches, setBranches] = useState([]);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "active", // "active" | "inactive" | "" (all)
  });

  // Sorting - client-side since branches are typically small dataset
  const [sortConfig, setSortConfig] = useState({
    sort_by: "branch_name",
    sort_order: "asc",
  });

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // ============================================
  // DATA FETCHING
  // ============================================
  const loadLimits = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await fetchBranchLimits();
      if (response.success) {
        setLimits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
      toast.warning("Limits Unavailable", "Could not load branch limits.", 4000);
    }
  }, [isSuperAdmin, toast]);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Always fetch all branches (including inactive) for SA, filtering is done client-side
      const response = await fetchBranches({ include_inactive: isSuperAdmin });
      if (response.success) {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
      const errorMessage = err.response?.data?.message || "Failed to load branches.";
      setError(errorMessage);
      toast.error("Load Failed", errorMessage, 5000);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, toast]);

  useEffect(() => {
    loadLimits();
    loadBranches();
  }, [loadLimits, loadBranches]);

  // ============================================
  // FILTERED & SORTED BRANCHES (Client-side)
  // ============================================
  const filteredAndSortedBranches = useMemo(() => {
    if (!branches.length) return [];

    // Step 1: Filter
    let filtered = [...branches];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((branch) => {
        const searchableFields = [
          branch.branch_name,
          branch.city,
          branch.state,
          branch.address_line_1,
          branch.contact_number,
          branch.pincode,
        ];
        return searchableFields.some(
          (field) => field && field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (filters.status === "active") {
      filtered = filtered.filter((branch) => branch.is_active);
    } else if (filters.status === "inactive") {
      filtered = filtered.filter((branch) => !branch.is_active);
    }
    // If status is "", show all

    // Step 2: Sort
    const sorted = filtered.sort((a, b) => {
      const { sort_by, sort_order } = sortConfig;
      let aVal = a[sort_by];
      let bVal = b[sort_by];

      // Handle special sort keys
      if (sort_by === "is_active") {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      } else if (sort_by === "user_count") {
        aVal = a.user_count || 0;
        bVal = b.user_count || 0;
      } else if (sort_by === "city") {
        aVal = `${a.city || ""} ${a.state || ""}`.toLowerCase();
        bVal = `${b.city || ""} ${b.state || ""}`.toLowerCase();
      } else if (typeof aVal === "string") {
        aVal = (aVal || "").toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sort_order === "asc" ? -1 : 1;
      if (aVal > bVal) return sort_order === "asc" ? 1 : -1;
      return 0;
    });

    // Keep main branch at top always
    const mainBranch = sorted.find((b) => b.is_main);
    const otherBranches = sorted.filter((b) => !b.is_main);
    return mainBranch ? [mainBranch, ...otherBranches] : sorted;
  }, [branches, filters, sortConfig]);

  // Total counts for display
  const totalBranches = branches.length;
  const filteredCount = filteredAndSortedBranches.length;

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = useCallback(() => {
    toast.info("Refreshing", "Loading latest branch data...", 2000);
    loadLimits();
    loadBranches();
  }, [loadLimits, loadBranches, toast]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === "asc" ? "desc" : "asc",
    }));
  };

  const handleAddBranch = () => {
    if (!limits?.can_add) {
      toast.warning(
        "Branch Limit Reached",
        `Maximum of ${limits?.max_allowed || 0} branches. Please upgrade.`,
        5000
      );
      return;
    }
    setSelectedBranch(null);
    setShowAddEditModal(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setShowAddEditModal(true);
  };

  const handleModalClose = (shouldRefresh = false, result = null) => {
    setShowAddEditModal(false);
    setSelectedBranch(null);
    if (shouldRefresh) {
      handleRefresh();
      if (result?.type === "created") {
        toast.success("Branch Created", `${result.branchName} added.`, 4000);
      } else if (result?.type === "updated") {
        toast.success("Branch Updated", `${result.branchName} updated.`, 4000);
      }
    }
  };

  // ============================================
  // RENDER - BA (Read-only)
  // ============================================
  if (isBranchAdmin) {
    return (
      <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
        <div className="flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">Branch Information</h1>
              <p className="text-sm text-gray-500">View your branch details</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : branches.length > 0 ? (
            <BranchInfoCard branch={branches[0]} onEdit={() => handleEditBranch(branches[0])} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No branch information available
            </div>
          )}
        </div>

        {showAddEditModal && selectedBranch && (
          <AddEditBranchModal branch={selectedBranch} onClose={handleModalClose} isSuperAdmin={false} />
        )}
      </div>
    );
  }

  // ============================================
  // RENDER - SA (Full management)
  // ============================================
  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">Branch Management</h1>
              <p className="text-sm text-gray-500">
                {filteredCount === totalBranches
                  ? `${totalBranches} branch${totalBranches !== 1 ? "es" : ""} in your business`
                  : `Showing ${filteredCount} of ${totalBranches} branches`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleAddBranch}
              disabled={!limits?.can_add}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${
                limits?.can_add
                  ? "bg-[#000060] text-white hover:bg-[#000080]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title={!limits?.can_add ? "Branch limit reached" : "Add new branch"}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Branch</span>
            </button>
          </div>
        </div>

        {/* Limit Banner */}
        {limits && <BranchLimitBanner limits={limits} />}

        {/* Filters */}
        <BranchFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button onClick={handleRefresh} className="text-red-700 hover:text-red-900 font-medium underline text-sm">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <BranchListTable
          branches={filteredAndSortedBranches}
          loading={loading}
          rowsPerPage={rowsPerPage}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onEdit={handleEditBranch}
          onRefresh={handleRefresh}
          toast={toast}
        />
      </div>

      {/* Modal */}
      {showAddEditModal && (
        <AddEditBranchModal branch={selectedBranch} onClose={handleModalClose} isSuperAdmin={true} />
      )}
    </div>
  );
};

/**
 * BranchInfoCard - Read-only for BA
 */
const BranchInfoCard = ({ branch, onEdit }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 bg-[#000060]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={28} className="text-[#000060]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{branch.branch_name}</h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                branch.is_main ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {branch.is_main ? "Main Branch" : "Branch"}
            </span>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-[#000060] border border-[#000060] rounded-lg font-medium hover:bg-[#000060]/5 transition-colors flex-shrink-0"
        >
          Edit Details
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
          <p className="text-gray-900 truncate">
            {[branch.address_line_1, branch.address_line_2, branch.city, branch.state, branch.pincode]
              .filter(Boolean)
              .join(", ") || "Not provided"}
          </p>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
          <p className="text-gray-900">{branch.contact_number || "Not provided"}</p>
          {branch.alternate_number && <p className="text-gray-600 text-sm mt-1">Alt: {branch.alternate_number}</p>}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Team Members</h3>
          <p className="text-gray-900">{branch.user_count || 0} user{branch.user_count !== 1 ? "s" : ""}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              branch.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
            }`}
          >
            {branch.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BranchesPage;