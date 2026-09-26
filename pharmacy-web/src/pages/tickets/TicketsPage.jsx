// pharmacy-web/src/pages/tickets/TicketsPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/tickets/TicketsPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, X, Filter, Calendar, RefreshCw } from "lucide-react";
import { getTickets, reopenTicket } from "../../api/tickets";
import TicketListTable from "./components/TicketListTable";
import CreateTicketModal from "./components/CreateTicketModal";
import ViewTicketModal from "./components/ViewTicketModal";
import CancelTicketModal from "./components/CancelTicketModal";
import StyledSelect from "../../components/common/StyledSelect";
import { useToast } from "../../components/common/Toast";
import useDynamicRowCount from "../../hooks/useDynamicRowCount";
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  SLA_RESPONSE_HINT,
} from "../../constant/tickets";

const TicketsPage = () => {
  const toast = useToast();

  // Use dynamic row count hook
  const rowsPerPage = useDynamicRowCount();

  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Search & Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting
  const [sortConfig, setSortConfig] = useState({
    sortBy: "created_at",
    order: "desc",
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Status options for filter
  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "" },
      ...Object.entries(TICKET_STATUSES).map(([key, label]) => ({
        label,
        value: key,
      })),
    ],
    [],
  );

  // Category options for filter
  const categoryOptions = useMemo(
    () => [
      { label: "All Categories", value: "" },
      ...Object.entries(TICKET_CATEGORIES).map(([key, label]) => ({
        label,
        value: key,
      })),
    ],
    [],
  );

  // Count active filters
  const activeFiltersCount = useMemo(
    () =>
      [statusFilter, categoryFilter, dateFrom, dateTo].filter(Boolean).length,
    [statusFilter, categoryFilter, dateFrom, dateTo],
  );

  // Check if any filters are active (including search)
  const hasActiveFilters = useMemo(() => {
    return !!(
      searchText ||
      statusFilter ||
      categoryFilter ||
      dateFrom ||
      dateTo
    );
  }, [searchText, statusFilter, categoryFilter, dateFrom, dateTo]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: sortConfig.sortBy,
        sort_order: sortConfig.order,
      };

      const resp = await getTickets(params);
      const data = resp.data?.data;

      setTickets(data?.tickets || []);
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      toast.error(
        "Failed to Load",
        "Could not fetch tickets. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    searchText,
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    sortConfig,
    toast,
  ]);

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset to page 1 when rowsPerPage changes (screen resize)
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Handlers
  const handleSortChange = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleCancelTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsCancelModalOpen(true);
  };

  const handleReopenTicket = async (ticket, reason) => {
    try {
      await reopenTicket(ticket.ticket_id, reason);
      toast.success(
        "Ticket Reopened",
        `Ticket ${ticket.ticket_number} has been reopened successfully.`,
      );
      setIsViewModalOpen(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error("Failed to reopen ticket:", error);
      toast.error(
        "Reopen Failed",
        error.response?.data?.message ||
          "Failed to reopen ticket. Please try again.",
      );
    }
  };
  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest ticket data...");
    fetchTickets();
  }, [fetchTickets, toast]);

  const handleTicketCreated = () => {
    setIsCreateModalOpen(false);
    toast.success("Ticket Created Successfully", SLA_RESPONSE_HINT, 6000);
    fetchTickets();
  };

  const handleTicketCancelled = () => {
    setIsCancelModalOpen(false);
    setSelectedTicket(null);
    toast.success(
      "Ticket Cancelled",
      "Your ticket has been cancelled successfully.",
    );
    fetchTickets();
  };

  const handleCreateFromEmpty = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-medium 
                     flex items-center gap-2 hover:bg-[#06027a] transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 flex-shrink-0">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by ticket number or subject..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 
                         focus:border-indigo-500 transition-all"
            />
            {searchText && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                           text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 h-11 bg-[#000060] text-white rounded-lg text-sm font-medium
                       hover:bg-indigo-900 transition-all shadow-sm"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 h-11 rounded-lg text-sm font-medium flex items-center gap-2
                       transition-all shadow-sm relative
                       ${
                         showFilters || activeFiltersCount > 0
                           ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200"
                           : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                       }`}
          >
            <Filter size={18} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white 
                               text-xs font-bold rounded-full flex items-center justify-center"
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </form>

        {/* Filter Options */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-end gap-3 flex-wrap">
              <StyledSelect
                label="Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={statusOptions}
                placeholder="All Status"
              />

              <StyledSelect
                label="Category"
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
                placeholder="All Categories"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  max={dateTo || undefined}
                  className={`h-10 px-3 border rounded-lg text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all
                             ${dateFrom ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" : "bg-white border-gray-200 text-gray-700"}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  min={dateFrom || undefined}
                  className={`h-10 px-3 border rounded-lg text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all
                             ${dateTo ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" : "bg-white border-gray-200 text-gray-700"}`}
                />
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="h-10 px-4 text-sm text-red-600 hover:text-red-700 
                             hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 ml-auto"
                >
                  <X size={16} />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <TicketListTable
          tickets={tickets}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onViewTicket={handleViewTicket}
          onCancelTicket={handleCancelTicket}
          onCreateTicket={handleCreateFromEmpty}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTicketCreated}
      />

      <ViewTicketModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onCancelClick={handleCancelTicket}
        onReopenClick={handleReopenTicket}
      />

      <CancelTicketModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onSuccess={handleTicketCancelled}
      />
    </div>
  );
};

export default TicketsPage;
