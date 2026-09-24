// cadmin-web/src/pages/Communications/pages/CustomerTickets/CustomerTicketsPage.jsx (do not remove this comment)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  X,
  Filter,
  RefreshCw,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  getAllCustomerTickets,
  getCustomerTicketById,
  getCustomerTicketStats,
} from "../../../../api/cadminCustomerTickets";
import CustomerTicketsTable from "./components/CustomerTicketsTable";
import CustomerTicketDetailModal from "./components/CustomerTicketDetailModal";
import StyledSelect from "../../../../components/common/StyledSelect";
import StyledDateFilter from "../../../../components/common/StyledDateFilter";
import useDebounce from "../../../../hooks/useDebounce";
import useDynamicRowCount from "../../../../hooks/useDynamicRowCount";
import { useToast } from "../../../../components/common/Toast";
import {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
} from "../../../../config/customerTicketConfigs";
import { useCAdminPermission } from "../../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../../config/cadminPermissions";

const CustomerTicketsPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

  const { hasPermission, isSuperCAdmin } = useCAdminPermission();
  const canViewDetail =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW_DETAIL);
  const canUpdateStatus =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_UPDATE_STATUS);
  const canReply =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_REPLY);

  // Data state
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters & Sort
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);

  const debouncedSearch = useDebounce(searchText, 300);

  const activeFiltersCount = useMemo(() => {
    return [statusFilter, categoryFilter, dateFrom, dateTo].filter(Boolean).length;
  }, [statusFilter, categoryFilter, dateFrom, dateTo]);

  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || debouncedSearch.trim().length > 0;
  }, [activeFiltersCount, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getCustomerTicketStats();
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load customer ticket stats:", err);
    }
  }, []);

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
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await getAllCustomerTickets(params);
      const { tickets: data, pagination } = response.data.data;

      setTickets(data);
      setTotalItems(pagination.total);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch customer tickets:", err);
      setError(err.response?.data?.message || "Failed to fetch tickets");
      toast.error("Load Failed", "Failed to load customer tickets");
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
    dateFrom,
    dateTo,
    sortConfig,
    toast,
  ]);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, dateFrom, dateTo, sortConfig]);

  const handleSortChange = useCallback((column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
  }, []);

  const handleViewTicket = useCallback(
    async (ticket) => {
      if (!canViewDetail) return;
      setLoadingTicketDetails(true);
      setIsDetailsModalOpen(true);

      try {
        const response = await getCustomerTicketById(ticket.ticket_id);
        setSelectedTicket(response.data.data.ticket);
      } catch (err) {
        console.error("Failed to fetch full ticket:", err);
        setSelectedTicket(ticket);
      } finally {
        setLoadingTicketDetails(false);
      }
    },
    [canViewDetail]
  );

  const handleTicketUpdated = useCallback(() => {
    fetchTickets();
    fetchStats();
    if (selectedTicket) {
      getCustomerTicketById(selectedTicket.ticket_id)
        .then((res) => setSelectedTicket(res.data.data.ticket))
        .catch(console.error);
    }
  }, [fetchTickets, fetchStats, selectedTicket]);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Top Header & Stats */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center flex-shrink-0 shadow-md">
              <Ticket size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Customer Support Tickets</h1>
              <p className="text-xs text-gray-500">
                Manage post-order queries and issues submitted from the mobile app
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              fetchTickets();
              fetchStats();
            }}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-xs flex items-center gap-2"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span className="text-xs font-semibold">Refresh</span>
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setStatusFilter("OPEN")}
            className={`p-3.5 bg-white border rounded-xl shadow-2xs cursor-pointer transition-all ${
              statusFilter === "OPEN" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Open Tickets</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <span className="text-xl font-extrabold text-amber-600 block mt-1">{stats.open}</span>
          </div>

          <div
            onClick={() => setStatusFilter("IN_PROGRESS")}
            className={`p-3.5 bg-white border rounded-xl shadow-2xs cursor-pointer transition-all ${
              statusFilter === "IN_PROGRESS" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">In Progress</span>
              <Clock size={14} className="text-blue-500" />
            </div>
            <span className="text-xl font-extrabold text-blue-600 block mt-1">{stats.in_progress}</span>
          </div>

          <div
            onClick={() => setStatusFilter("RESOLVED")}
            className={`p-3.5 bg-white border rounded-xl shadow-2xs cursor-pointer transition-all ${
              statusFilter === "RESOLVED" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Resolved</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <span className="text-xl font-extrabold text-emerald-600 block mt-1">{stats.resolved}</span>
          </div>

          <div
            onClick={() => setStatusFilter("CLOSED")}
            className={`p-3.5 bg-white border rounded-xl shadow-2xs cursor-pointer transition-all ${
              statusFilter === "CLOSED" ? "border-slate-500 ring-2 ring-slate-500/20" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Closed</span>
              <Lock size={14} className="text-slate-500" />
            </div>
            <span className="text-xl font-extrabold text-slate-600 block mt-1">{stats.closed}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket #, customer name, phone, order #..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 pl-9 pr-8 border border-gray-300 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 h-10 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                showFilters || activeFiltersCount > 0
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter size={15} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StyledSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                placeholder="All Status"
              />
              <StyledSelect
                label="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={CATEGORY_OPTIONS}
                placeholder="All Categories"
              />
              <StyledDateFilter label="Date From" date={dateFrom} setDate={setDateFrom} />
              <StyledDateFilter label="Date To" date={dateTo} setDate={setDateTo} />
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <X size={13} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <CustomerTicketsTable
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
          canViewDetail={canViewDetail}
        />
      </div>

      {/* Detail Modal */}
      {canViewDetail && (
        <CustomerTicketDetailModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
          loading={loadingTicketDetails}
          onRefresh={handleTicketUpdated}
          canUpdateStatus={canUpdateStatus}
          canReply={canReply}
        />
      )}
    </div>
  );
};

export default CustomerTicketsPage;