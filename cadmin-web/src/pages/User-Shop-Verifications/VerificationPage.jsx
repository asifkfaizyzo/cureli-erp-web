// cadmin-web/src/pages/User-Shop-Verifications/VerificationPage.jsx (do not remove this comment)
// src/pages/User-Shop-Verifications/VerificationPage.jsx
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  Filter,
  AlertCircle,
} from "lucide-react";
import VerificationTable from "./comps/VerificationTable";
import VerificationModal from "./comps/VerificationModal";
import StyledSelect from "../../components/common/StyledSelect";
import StyledDateFilter from "../../components/common/StyledDateFilter";
import { listShopsForVerification } from "../../api/cadminDocs";
import { useToast } from "../../components/common/Toast";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";

//  FIXED: Match backend status values
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "pending_review", label: "Pending Review" },
  { value: "verified", label: "Verified" }, //  Backend uses "verified"
  { value: "partially_rejected", label: "Partially Rejected" },
  { value: "rejected", label: "Rejected" },
];

const RESUBMISSION_OPTIONS = [
  { value: "", label: "All Resubmissions" },
  { value: "1", label: "1+ Resubmissions" },
  { value: "2", label: "2+ Resubmissions" },
  { value: "3", label: "3+ Resubmissions" },
];

const VerificationPage = () => {
  const toast = useToast();

  // Use dynamic row count from global config (height-based)
  const rowsPerPage = useDynamicRowCount();

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [resubmissionCount, setResubmissionCount] = useState("");
  const [date, setDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Server data
  const [shops, setShops] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [status, resubmissionCount, date].filter(Boolean).length;
  }, [status, resubmissionCount, date]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || search.trim().length > 0;
  }, [activeFiltersCount, search]);

  // Fetch shops
  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      if (search.trim()) {
        params.search = search.trim();
      }
      if (status) {
        params.status = status; //  Now sends correct backend values
      }
      if (resubmissionCount && Number(resubmissionCount) > 0) {
        params.resubmissionCountMin = Number(resubmissionCount);
      }
      if (date) {
        params.dateStart = date;
      }

      const resp = await listShopsForVerification(params);
      const payload = resp.data?.data || {};

      setShops(payload.data || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Unable to load verification data. Please try again.";
      setError(errorMessage);
      setShops([]);
      setTotalItems(0);
      toast.error("Failed to Load Data", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    search,
    status,
    resubmissionCount,
    date,
    sortConfig,
    toast,
  ]);

  // Fetch on dependencies change
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, resubmissionCount, date, sortConfig]);

  // Handlers
  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest verification data...", 2000);
    fetchShops();
  }, [fetchShops]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatus("");
    setResubmissionCount("");
    setDate("");
  }, []);

  const handleRowClick = (shop) => {
    if (!shop || !shop.shop_id) {
      console.error("Invalid shop data:", shop);
      toast.error("Error", "Unable to open shop details. Invalid shop data.");
      return;
    }

    setSelectedShop(shop);
    setIsModalOpen(true);
  };

  const handleSortChange = (column) => {
    setSortConfig((prev) => {
      const order =
        prev.sortBy === column && prev.order === "asc" ? "desc" : "asc";
      return { sortBy: column, order };
    });
  };

  const handleModalClose = (shouldRefresh = false) => {
    setIsModalOpen(false);
    setSelectedShop(null);
    if (shouldRefresh) {
      toast.info("Data Refreshed", "Loading latest verification data...", 2000);
      fetchShops();
    }
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Shop Verification
              </h1>
              <p className="text-sm text-gray-500">
                {totalItems} shop{totalItems !== 1 ? "s" : ""} pending
                verification
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
                placeholder="Search by shop name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                           bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20 
                           focus:border-[#000060] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
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
                  value={status}
                  onChange={(value) => setStatus(value)}
                  options={STATUS_OPTIONS}
                  placeholder="All Status"
                />

                <StyledSelect
                  label="Resubmission Count"
                  value={resubmissionCount}
                  onChange={(value) => setResubmissionCount(value)}
                  options={RESUBMISSION_OPTIONS}
                  placeholder="All Resubmissions"
                />

                <StyledDateFilter
                  label="Date From"
                  date={date}
                  setDate={setDate}
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

      {/* Table Container - Takes remaining height */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <VerificationTable
          data={shops}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Modal */}
      {isModalOpen && selectedShop && (
        <VerificationModal shop={selectedShop} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default VerificationPage;
