// cadmin-web/src/pages/Fleet/Riders/RidersPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  RefreshCw,
  Search,
  X,
  Filter,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import RidersTable from "./comps/RidersTable";
import CreateTeamRiderModal from "./comps/CreateTeamRiderModal";
import StyledSelect from "../../../components/common/StyledSelect";
import { getRiders } from "../../../api/cadminRiders";
import { useToast } from "../../../components/common/Toast";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";

// Main table only displays active/verified fleet.
// Pending and rejected applicants belong in RiderVerificationPage.
const STATUS_OPTIONS = [
  { value: "", label: "All Active Fleet" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "BLOCKED", label: "Blocked" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "INDEPENDENT", label: "Independent" },
  { value: "TEAM", label: "Team" },
];

const RidersPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ sortBy: "created_at", order: "desc" });

  const [riders, setRiders] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeFiltersCount = useMemo(
    () => [statusFilter, typeFilter].filter(Boolean).length,
    [statusFilter, typeFilter]
  );

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        status: statusFilter || undefined,
        rider_type: typeFilter || undefined,
      };
      const resp = await getRiders(params);
      const payload = resp.data?.data || {};
      setRiders(payload.riders || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load riders.";
      setError(msg);
      toast.error("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchText, statusFilter, typeFilter, toast]);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);
  useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter, typeFilter]);

  const handleRefresh = () => {
    toast.info("Refreshing", "Loading latest rider data...", 2000);
    fetchRiders();
  };

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setTypeFilter("");
  };

  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">Rider Fleet Management</h1>
              <p className="text-sm text-gray-500">{totalItems} active / verified rider{totalItems !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#05015A] text-white rounded-lg hover:bg-[#0a0280] transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
            >
              <UserPlus size={16} /> Add Team Rider
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
              />
              {searchText && (
                <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm relative flex-shrink-0
                ${showFilters || activeFiltersCount > 0 ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <StyledSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
                <StyledSelect label="Rider Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
              </div>
              {(activeFiltersCount > 0 || searchText) && (
                <div className="mt-3 flex justify-end">
                  <button onClick={handleClearFilters} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                    <X size={16} /> Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertCircle size={18} /><span className="text-sm">{error}</span></div>
            <button onClick={handleRefresh} className="text-red-700 underline text-sm">Retry</button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <RidersTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          riders={riders}
          loading={loading}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
        />
      </div>

      <CreateTeamRiderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default RidersPage;