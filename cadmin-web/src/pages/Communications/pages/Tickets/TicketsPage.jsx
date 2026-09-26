// cadmin-web/src/pages/Communications/pages/Tickets/TicketsPage.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Tickets/TicketsPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  X,
  Filter,
  RefreshCw,
  Ticket,
  AlertCircle,
} from "lucide-react";
import { getAllTickets, getTicketById } from "../../../../api/cadminTickets";
import TicketsTable from "./components/TicketsTable";
import TicketDetailsModal from "./components/TicketDetailsModal";
import StyledSelect from "../../../../components/common/StyledSelect";
import StyledDateFilter from "../../../../components/common/StyledDateFilter";
import useDebounce from "../../../../hooks/useDebounce";
import useDynamicRowCount from "../../../../hooks/useDynamicRowCount";
import { useToast } from "../../../../components/common/Toast";
import {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
} from "../../../../config/ticketConfigs";
import { useCAdminPermission } from "../../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../../config/cadminPermissions";

const TicketsPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

  // ── Permission gates ─────────────────────────────────────────────────────
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();
  const canViewDetail =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_DETAIL);
  const canViewStats =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_STATS);
  const canViewHistory =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW_HISTORY);
  const canUpdateStatus =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS);

  // Data state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination meta from server
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Sort
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchText, 300);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [
      statusFilter,
      categoryFilter,
      priorityFilter,
      dateFrom,
      dateTo,
    ].filter(Boolean).length;
  }, [statusFilter, categoryFilter, priorityFilter, dateFrom, dateTo]);

  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || debouncedSearch.trim().length > 0;
  }, [activeFiltersCount, debouncedSearch]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await getAllTickets(params);
      const { tickets: data, pagination } = response.data.data;

      setTickets(data);
      setTotalItems(pagination.total);
      setTotalPages(pagination.totalPages);

      if (currentPage > pagination.totalPages && pagination.totalPages > 0) {
        setCurrentPage(pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(err.response?.data?.message || "Failed to fetch tickets");
      toast.error("Load Failed", "Failed to load tickets");
      setTickets([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    debouncedSearch,
    statusFilter,
    categoryFilter,
    priorityFilter,
    dateFrom,
    dateTo,
    sortConfig,
    toast,
  ]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    statusFilter,
    categoryFilter,
    priorityFilter,
    dateFrom,
    dateTo,
    sortConfig,
  ]);

  const handleSortChange = useCallback((column) => {
    const columnMapping = {
      ticket: "ticket_number",
      createdAt: "created_at",
      priority: "reopen_count",
      status: "status",
    };
    const backendColumn = columnMapping[column] || column;
    setSortConfig((prev) => ({
      sortBy: backendColumn,
      order:
        prev.sortBy === backendColumn && prev.order === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("");
    setCategoryFilter("");
    setPriorityFilter("");
    setDateFrom("");
    setDateTo("");
  }, []);

  // Gate row click with canViewDetail
  const handleViewTicket = useCallback(
    async (ticket) => {
      if (!canViewDetail) return;

      setLoadingTicketDetails(true);
      setIsDetailsModalOpen(true);

      try {
        const response = await getTicketById(ticket.ticket_id);
        setSelectedTicket(response.data.data.ticket);
      } catch (err) {
        console.error("Failed to fetch ticket details:", err);
        toast.error("Load Failed", "Failed to load ticket details");
        setSelectedTicket(ticket);
      } finally {
        setLoadingTicketDetails(false);
      }
    },
    [canViewDetail, toast],
  );

  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest ticket data...");
    fetchTickets();
  }, [fetchTickets, toast]);

  const handleCloseModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedTicket(null);
  }, []);

  const handleTicketUpdated = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center flex-shrink-0">
              <Ticket size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Support Tickets
              </h1>
              <p className="text-sm text-gray-500">
                {totalItems} total ticket{totalItems !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Refresh — never gated */}
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
            {/* Search — never gated */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                           bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 
                           focus:border-indigo-500 transition-all"
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

            {/* Filter Toggle — never gated */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <StyledSelect
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={STATUS_OPTIONS}
                  placeholder="All Status"
                />
                <StyledSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value)}
                  options={CATEGORY_OPTIONS}
                  placeholder="All Categories"
                />
                <StyledSelect
                  label="Priority"
                  value={priorityFilter}
                  onChange={(value) => setPriorityFilter(value)}
                  options={PRIORITY_OPTIONS}
                  placeholder="All Priorities"
                />
                <StyledDateFilter
                  label="Date From"
                  date={dateFrom}
                  setDate={setDateFrom}
                />
                <StyledDateFilter
                  label="Date To"
                  date={dateTo}
                  setDate={setDateTo}
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
        <TicketsTable
          tickets={tickets}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onViewTicket={handleViewTicket}
          hasActiveFilters={hasActiveFilters}
          // Pass permission flags so the table can style rows correctly
          canViewDetail={canViewDetail}
        />
      </div>

      {/* Details Modal — only mount if admin has view_detail permission */}
      {canViewDetail && (
        <TicketDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseModal}
          ticket={selectedTicket}
          loading={loadingTicketDetails}
          onRefresh={handleTicketUpdated}
          // Pass permission flags into the modal
          canViewHistory={canViewHistory}
          canUpdateStatus={canUpdateStatus}
        />
      )}
    </div>
  );
};

export default TicketsPage;
