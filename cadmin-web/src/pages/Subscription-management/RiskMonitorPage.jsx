// cadmin-web/src/pages/Subscription-management/RiskMonitorPage.jsx (do not remove this comment)
// src/pages/Subscription-management/RiskMonitorPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCw,
  BadgeIndianRupee,
  Clock,
  Ban,
  AlertCircle,
  CreditCard,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

// Components
import TimeRangeFilter from "./comps/risk/TimeRangeFilter";
import ExpiringTable from "./comps/risk/ExpiringTable";
import GracePeriodTable from "./comps/risk/GracePeriodTable";
import SuspendedTable from "./comps/risk/SuspendedTable";
import SubscriptionRiskModal from "./comps/risk/SubscriptionRiskModal";

// API
import { getAtRiskSubscriptions } from "../../api/cadminSubscriptions";

// Config
import {
  RISK_TABS,
  TAB_CONFIG,
  DEFAULT_TIME_RANGE,
} from "../../config/modules/subscriptionRiskConfig";

// Hooks & Utils
import { useToast } from "../../components/common/Toast";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";

export default function RiskMonitorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

  // ============================================
  // STATE
  // ============================================

  // Data state
  const [data, setData] = useState({
    expiring: [],
    gracePeriod: [],
    suspended: [],
    counts: { expiring: 0, gracePeriod: 0, suspended: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE);
  const [activeTab, setActiveTab] = useState(RISK_TABS.EXPIRING);
  const [showFilters, setShowFilters] = useState(false);

  // Sort state for each tab
  const [sortConfigs, setSortConfigs] = useState({
    [RISK_TABS.EXPIRING]: { sortBy: "end_date", order: "asc" },
    [RISK_TABS.GRACE_PERIOD]: { sortBy: "grace_period_until", order: "asc" },
    [RISK_TABS.SUSPENDED]: { sortBy: "updated_at", order: "desc" },
  });

  // Pagination state for each tab
  const [currentPages, setCurrentPages] = useState({
    [RISK_TABS.EXPIRING]: 1,
    [RISK_TABS.GRACE_PERIOD]: 1,
    [RISK_TABS.SUSPENDED]: 1,
  });

  // Tab transition state
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [displayedTab, setDisplayedTab] = useState(RISK_TABS.EXPIRING);

  // Modal state
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchData = useCallback(
    async (showSuccessToast = false) => {
      setLoading(true);
      setError(null);

      try {
        const currentSort = sortConfigs[activeTab];

        const response = await getAtRiskSubscriptions({
          range: timeRange,
          sort_by: currentSort.sortBy,
          sort_order: currentSort.order,
        });

        const result = response.data?.data || response.data;

        setData({
          expiring: result.expiring || [],
          gracePeriod: result.gracePeriod || [],
          suspended: result.suspended || [],
          counts: result.counts || {
            expiring: 0,
            gracePeriod: 0,
            suspended: 0,
            total: 0,
          },
        });

        if (showSuccessToast) {
          toast.info("Data Refreshed", "Loading latest Subscribers data....");
        }
      } catch (err) {
        console.error("Failed to fetch at-risk subscriptions:", err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load risk monitor data. Please try again.";

        setError(errorMsg);
        toast.error("Failed to Load Data", errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [timeRange, activeTab, sortConfigs, toast],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pages when time range or sort changes
  useEffect(() => {
    setCurrentPages({
      [RISK_TABS.EXPIRING]: 1,
      [RISK_TABS.GRACE_PERIOD]: 1,
      [RISK_TABS.SUSPENDED]: 1,
    });
  }, [timeRange, sortConfigs]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handleTimeRangeChange = useCallback(
    (newRange) => {
      setTimeRange(newRange);
      toast.info(
        "Filter Updated",
        `Viewing subscriptions expiring within ${newRange} days.`,
      );
    },
    [toast],
  );

  const handleSortChange = useCallback(
    (column) => {
      setSortConfigs((prev) => {
        const currentSort = prev[activeTab];
        const order =
          currentSort.sortBy === column && currentSort.order === "asc"
            ? "desc"
            : "asc";

        return {
          ...prev,
          [activeTab]: { sortBy: column, order },
        };
      });
    },
    [activeTab],
  );

  const handleTabChange = useCallback(
    (tabId) => {
      if (tabId === activeTab || isTabTransitioning) return;

      setIsTabTransitioning(true);

      setTimeout(() => {
        setActiveTab(tabId);
        setDisplayedTab(tabId);
        setTimeout(() => {
          setIsTabTransitioning(false);
        }, 50);
      }, 150);
    },
    [activeTab, isTabTransitioning],
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPages((prev) => ({
        ...prev,
        [activeTab]: page,
      }));
    },
    [activeTab],
  );

  const handleViewDetails = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(
    (shouldRefresh = false) => {
      setModalOpen(false);
      setSelectedSubscription(null);
      if (shouldRefresh) {
        fetchData();
      }
    },
    [fetchData],
  );

  const handleActionComplete = useCallback(
    (actionType, subscriptionId) => {
      const subscription = selectedSubscription;
      const shopName = subscription?.shop_name || "Shop";

      switch (actionType) {
        case "reminder":
          toast.success(
            "Reminder Sent",
            `Payment reminder sent to ${shopName} successfully.`,
          );
          break;
        case "grace_extended":
          toast.success(
            "Grace Period Extended",
            `Grace period extended for ${shopName}.`,
          );
          break;
        case "suspended":
          toast.warning(
            "Subscription Suspended",
            `${shopName}'s subscription has been suspended.`,
          );
          break;
        case "reactivated":
          toast.success(
            "Subscription Reactivated",
            `${shopName}'s subscription has been reactivated.`,
          );
          break;
        default:
          toast.success(
            "Action Completed",
            "Operation completed successfully.",
          );
      }

      fetchData();
    },
    [fetchData, selectedSubscription, toast],
  );

  // ============================================
  // DERIVED DATA
  // ============================================

  const currentTabConfig = useMemo(() => {
    return TAB_CONFIG.find((t) => t.id === displayedTab) || TAB_CONFIG[0];
  }, [displayedTab]);

  const getCurrentTabData = useCallback(
    (tabId) => {
      switch (tabId) {
        case RISK_TABS.EXPIRING:
          return data.expiring;
        case RISK_TABS.GRACE_PERIOD:
          return data.gracePeriod;
        case RISK_TABS.SUSPENDED:
          return data.suspended;
        default:
          return [];
      }
    },
    [data],
  );

  const currentTabData = useMemo(
    () => getCurrentTabData(displayedTab),
    [displayedTab, getCurrentTabData],
  );

  const currentPage = currentPages[activeTab] || 1;
  const totalItems = currentTabData.length;

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return currentTabData.slice(startIndex, startIndex + rowsPerPage);
  }, [currentTabData, currentPage, rowsPerPage]);

  const getModalCategory = () => {
    switch (displayedTab) {
      case RISK_TABS.EXPIRING:
        return "expiring";
      case RISK_TABS.GRACE_PERIOD:
        return "gracePeriod";
      case RISK_TABS.SUSPENDED:
        return "suspended";
      default:
        return "expiring";
    }
  };

  const isTimeFilterDisabled = displayedTab === RISK_TABS.GRACE_PERIOD;

  // ============================================
  // RENDER TABLE BASED ON TAB
  // ============================================

  const renderTable = () => {
    const commonProps = {
      loading,
      currentPage,
      setCurrentPage: handlePageChange,
      rowsPerPage,
      totalItems,
      onViewDetails: handleViewDetails,
      sortConfig: sortConfigs[displayedTab],
      onSortChange: handleSortChange,
    };

    switch (displayedTab) {
      case RISK_TABS.EXPIRING:
        return (
          <ExpiringTable
            data={paginatedData}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={`${currentTabConfig.emptySubtitle} (${timeRange} days)`}
            {...commonProps}
          />
        );

      case RISK_TABS.GRACE_PERIOD:
        return (
          <GracePeriodTable
            data={paginatedData}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={currentTabConfig.emptySubtitle}
            {...commonProps}
          />
        );

      case RISK_TABS.SUSPENDED:
        return (
          <SuspendedTable
            data={paginatedData}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={currentTabConfig.emptySubtitle}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* ========== HEADER ========== */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        {/* Title Row -  FIXED: Now matches UserPage exactly */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <CreditCard size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Subscription Risk Monitor
              </h1>
              <p className="text-sm text-gray-500">
                {data.counts.total} subscription
                {data.counts.total !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>

          {/* Actions -  FIXED: Button sizes now match */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/subscriptions/manage")}
              className="px-4 py-2 bg-[#000060] text-white rounded-lg
                         hover:shadow-lg hover:shadow-[#000060]/25 transition-all flex items-center gap-2"
            >
              <BadgeIndianRupee size={16} />
              <span className="hidden sm:inline">Manage Plans</span>
            </button>

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
        </div>

        {/* ========== COMPACT TABS & FILTERS -  FIXED: Container styling */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Compact Tab Pills */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {/* Expiring Tab */}
              <button
                onClick={() => handleTabChange(RISK_TABS.EXPIRING)}
                disabled={isTabTransitioning}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all
                  ${
                    activeTab === RISK_TABS.EXPIRING
                      ? "bg-white text-[#000060] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }
                  ${isTabTransitioning ? "pointer-events-none" : ""}`}
              >
                <Clock size={14} />
                <span className="hidden sm:inline">Expiring</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-bold
                  ${
                    activeTab === RISK_TABS.EXPIRING
                      ? "bg-[#000060] text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {data.counts.expiring}
                </span>
              </button>

              {/* Grace Period Tab */}
              <button
                onClick={() => handleTabChange(RISK_TABS.GRACE_PERIOD)}
                disabled={isTabTransitioning}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all
                  ${
                    activeTab === RISK_TABS.GRACE_PERIOD
                      ? "bg-white text-[#000060] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }
                  ${isTabTransitioning ? "pointer-events-none" : ""}`}
              >
                <AlertTriangle size={14} />
                <span className="hidden sm:inline">Grace</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-bold
                  ${
                    activeTab === RISK_TABS.GRACE_PERIOD
                      ? "bg-[#000060] text-white"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {data.counts.gracePeriod}
                </span>
              </button>

              {/* Suspended Tab */}
              <button
                onClick={() => handleTabChange(RISK_TABS.SUSPENDED)}
                disabled={isTabTransitioning}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all
                  ${
                    activeTab === RISK_TABS.SUSPENDED
                      ? "bg-white text-[#000060] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }
                  ${isTabTransitioning ? "pointer-events-none" : ""}`}
              >
                <Ban size={14} />
                <span className="hidden sm:inline">Suspended</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-bold
                  ${
                    activeTab === RISK_TABS.SUSPENDED
                      ? "bg-[#000060] text-white"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {data.counts.suspended}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* Time Range Filter Toggle -  FIXED: Sizing to match filter button style */}
            {!isTimeFilterDisabled && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2
                         transition-all shadow-sm relative flex-shrink-0
                         ${
                           showFilters
                             ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200"
                             : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                         }`}
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Time: {timeRange}d</span>
                <span className="sm:hidden">{timeRange}d</span>
                {showFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            )}

            {/* Disabled filter indicator for Grace Period */}
            {isTimeFilterDisabled && (
              <span className="px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm text-gray-400 bg-gray-50 border border-gray-200 flex items-center gap-2">
                <Filter size={18} />
                <span className="hidden sm:inline">Time filter N/A</span>
              </span>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Current view info */}
            <span className="text-sm text-gray-500 hidden md:inline">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Expandable Time Range Filter */}
          {showFilters && !isTimeFilterDisabled && (
            <div className="mt-3 pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <TimeRangeFilter
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  disabled={loading}
                  compact={true}
                />
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========== ERROR STATE -  FIXED: Matches UserPage */}
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

      {/* ========== TABLE CONTAINER WITH SMOOTH TRANSITION ========== */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ease-in-out
            ${
              isTabTransitioning
                ? "opacity-0 translate-y-1"
                : "opacity-100 translate-y-0"
            }`}
        >
          {renderTable()}
        </div>
      </div>

      {/* ========== SUBSCRIPTION RISK MODAL ========== */}
      <SubscriptionRiskModal
        isOpen={modalOpen}
        subscription={selectedSubscription}
        category={getModalCategory()}
        onClose={handleModalClose}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
