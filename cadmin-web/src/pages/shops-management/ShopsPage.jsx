// cadmin-web/src/pages/shops-management/ShopsPage.jsx (do not remove this comment)
// src/pages/shops-management/ShopsPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HousePlus,
  RefreshCw,
  Search,
  X,
  Filter,
  AlertCircle,
} from "lucide-react";
import ShopsTable from "./comps/ShopsTable";
import StyledSelect from "../../components/common/StyledSelect";
import StyledDateFilter from "../../components/common/StyledDateFilter";
import { getShops } from "../../api/cadminShops";
import { useToast } from "../../components/common/Toast";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../config/cadminPermissions";

// Filter options
const VERIFICATION_OPTIONS = [
  { value: "", label: "All Verification" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const SUBSCRIPTION_OPTIONS = [
  { value: "", label: "All Subscriptions" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "GRACE_PERIOD", label: "Grace Period" },
  { value: "SUSPENDED", label: "Suspended" },
];

const ACTIVE_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const ShopsPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();
  const { hasPermission } = useCAdminPermission();
  const [searchParams, setSearchParams] = useSearchParams();

  // Permission checks
  const canEdit = hasPermission(CADMIN_PERMISSIONS.SHOPS_EDIT);
  const canVerify = hasPermission(CADMIN_PERMISSIONS.SHOPS_VERIFY);
  const canSuspend = hasPermission(CADMIN_PERMISSIONS.SHOPS_SUSPEND);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize from URL param
  const initialSearch = searchParams.get("search") || "";
  const [searchText, setSearchText] = useState(initialSearch);
  
  const [verificationFilter, setVerificationFilter] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Data
  const [shops, setShops] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync URL params to state when URL changes
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl && searchFromUrl !== searchText) {
      setSearchText(searchFromUrl);
      setVerificationFilter("");
      setSubscriptionFilter("");
      setActiveFilter("");
      setDateFilter("");
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [
      verificationFilter,
      subscriptionFilter,
      activeFilter,
      dateFilter,
    ].filter(Boolean).length;
  }, [verificationFilter, subscriptionFilter, activeFilter, dateFilter]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || searchText.trim().length > 0;
  }, [activeFiltersCount, searchText]);

  // Fetch shops
  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        verification_status: verificationFilter || undefined,
        subscription_status: subscriptionFilter || undefined,
        is_active: activeFilter || undefined,
        date_start: dateFilter || undefined,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const response = await getShops(params);
      const payload = response.data?.data || {};

      setShops(payload.data || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch shops:", err);
      const errorMessage =
        err.response?.data?.message || "Unable to load shops. Please try again.";
      setError(errorMessage);
      setShops([]);
      setTotalItems(0);
      toast.error("Failed to Load Shops", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    searchText,
    verificationFilter,
    subscriptionFilter,
    activeFilter,
    dateFilter,
    sortConfig,
    toast,
  ]);

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
    verificationFilter,
    subscriptionFilter,
    activeFilter,
    dateFilter,
    sortConfig,
  ]);

  // Handlers
  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest Shops data...", 2000);
    fetchShops();
  }, [fetchShops, toast]);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setVerificationFilter("");
    setSubscriptionFilter("");
    setActiveFilter("");
    setDateFilter("");
    searchParams.delete("search");
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      searchParams.delete("search");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleShopUpdate = useCallback(
    (shopId, updates) => {
      try {
        setShops((prev) =>
          prev.map((shop) =>
            shop.shop_id === shopId ? { ...shop, ...updates } : shop
          )
        );

        if (updates.is_active !== undefined) {
          toast.success(
            updates.is_active ? "Shop Activated" : "Shop Deactivated",
            `Shop status updated successfully.`
          );
        } else if (updates.verification_status !== undefined) {
          toast.success(
            "Verification Updated",
            `Shop verification status changed to ${updates.verification_status}.`
          );
        } else if (updates.subscription_status !== undefined) {
          toast.success(
            "Subscription Updated",
            `Shop subscription status updated successfully.`
          );
        } else {
          toast.success(
            "Shop Updated",
            "Shop information updated successfully."
          );
        }
      } catch (error) {
        console.error("Failed to update shop:", error);
        toast.error("Update Failed", "Failed to update shop. Please try again.");
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

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <HousePlus size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Shop Management
              </h1>
              <p className="text-sm text-gray-500">
                {totalItems} total shop{totalItems !== 1 ? "s" : ""}
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
                placeholder="Search by shop name, email, or phone..."
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StyledSelect
                  label="Verification Status"
                  value={verificationFilter}
                  onChange={(value) => setVerificationFilter(value)}
                  options={VERIFICATION_OPTIONS}
                  placeholder="All Verification"
                />

                <StyledSelect
                  label="Subscription Status"
                  value={subscriptionFilter}
                  onChange={(value) => setSubscriptionFilter(value)}
                  options={SUBSCRIPTION_OPTIONS}
                  placeholder="All Subscriptions"
                />

                <StyledSelect
                  label="Active Status"
                  value={activeFilter}
                  onChange={(value) => setActiveFilter(value)}
                  options={ACTIVE_OPTIONS}
                  placeholder="All Status"
                />

                <StyledDateFilter
                  label="Date From"
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

      {/* Table */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <ShopsTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          shops={shops}
          loading={loading}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
          onShopUpdate={handleShopUpdate}
          canEdit={canEdit}
          canVerify={canVerify}
          canSuspend={canSuspend}
        />
      </div>
    </div>
  );
};

export default ShopsPage;