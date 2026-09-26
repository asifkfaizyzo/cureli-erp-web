// cadmin-web/src/pages/Communications/pages/Enquiries/EnquiriesPage.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Enquiries/EnquiriesPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, Filter, RefreshCw, Mail, AlertCircle } from "lucide-react";
import {
  getEnquiries,
  getEnquiryStats,
  deleteEnquiry,
} from "../../../../api/cadminEnquiries";
import { useToast } from "../../../../components/common/Toast";
import EnquiriesTable from "./components/EnquiriesTable";
import EnquiryDetailsModal from "./components/EnquiryDetailsModal";
import EnquiryReplyModal from "./components/EnquiryReplyModal";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import StyledSelect from "../../../../components/common/StyledSelect";
import useDebounce from "../../../../hooks/useDebounce";
import useDynamicRowCount from "../../../../hooks/useDynamicRowCount";
import { useCAdminPermission } from "../../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../../config/cadminPermissions";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REPLIED", label: "Replied" },
  { value: "CLOSED", label: "Closed" },
];

const EnquiriesPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

  // ── Permission gates ─────────────────────────────────────────────────────
  const { hasPermission } = useCAdminPermission();
  const canViewStats = hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW_STATS);
  const canViewDetail = hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW_DETAIL);
  const canReply = hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_REPLY);
  const canUpdateStatus = hasPermission(
    CADMIN_PERMISSIONS.ENQUIRIES_UPDATE_STATUS,
  );
  const canDelete = hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_DELETE);

  // Data state
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination meta from server
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchText, 300);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [statusFilter].filter(Boolean).length;
  }, [statusFilter]);

  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || debouncedSearch.trim().length > 0;
  }, [activeFiltersCount, debouncedSearch]);

  // Fetch enquiries
  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await getEnquiries(params);

      let enquiriesData = [];
      let paginationData = null;

      if (response?.data?.data?.enquiries) {
        enquiriesData = response.data.data.enquiries;
        paginationData = response.data.data.pagination;
      } else if (response?.data?.enquiries) {
        enquiriesData = response.data.enquiries;
        paginationData = response.data.pagination;
      } else if (response?.enquiries) {
        enquiriesData = response.enquiries;
        paginationData = response.pagination;
      }

      setEnquiries(enquiriesData);
      setTotalItems(paginationData?.total || enquiriesData.length);

      const totalPages = Math.ceil(
        (paginationData?.total || enquiriesData.length) / rowsPerPage,
      );
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
      setError("Failed to load enquiries. Please try again.");
      toast.error("Load Failed", "Failed to load enquiries");
      setEnquiries([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, rowsPerPage, debouncedSearch, statusFilter, toast]);

  // Fetch stats — only if admin has permission
  const fetchStats = useCallback(async () => {
    if (!canViewStats) return;

    try {
      const response = await getEnquiryStats();

      let statsData = null;

      if (response?.data?.data?.stats) {
        statsData = response.data.data.stats;
      } else if (response?.data?.stats) {
        statsData = response.data.stats;
      } else if (response?.stats) {
        statsData = response.stats;
      } else if (
        response?.data?.data &&
        typeof response.data.data === "object"
      ) {
        statsData = response.data.data;
      } else if (response?.data && typeof response.data === "object") {
        statsData = response.data;
      }

      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [canViewStats]);

  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest enquiries...");
    fetchEnquiries();
    fetchStats();
  }, [toast, fetchEnquiries, fetchStats]);

  const handleClearFilters = useCallback(() => {
    setSearchText("");
    setStatusFilter("");
  }, []);

  // Only open details modal if admin has the permission
  const handleView = useCallback(
    (enquiry) => {
      if (!canViewDetail) return;
      setSelectedEnquiry(enquiry);
      setIsDetailsModalOpen(true);
    },
    [canViewDetail],
  );

  // Only open reply modal if admin has the permission
  const handleReply = useCallback(
    (enquiry) => {
      if (!canReply) return;
      setSelectedEnquiry(enquiry);
      setIsReplyModalOpen(true);
    },
    [canReply],
  );

  const handleReplyFromDetails = useCallback(
    (enquiry) => {
      if (!canReply) return;
      setSelectedEnquiry(enquiry);
      setIsReplyModalOpen(true);
    },
    [canReply],
  );

  // Only open delete dialog if admin has the permission
  const handleDeleteClick = useCallback(
    (enquiry) => {
      if (!canDelete) return;
      setSelectedEnquiry(enquiry);
      setIsDeleteDialogOpen(true);
    },
    [canDelete],
  );

  const handleDeleteConfirm = async () => {
    if (!selectedEnquiry || !canDelete) return;

    setIsDeleting(true);
    try {
      await deleteEnquiry(selectedEnquiry.enquiry_id);
      toast.success(
        "Deleted",
        `Enquiry ${selectedEnquiry.enquiry_number} has been deleted.`,
      );
      setIsDeleteDialogOpen(false);
      setSelectedEnquiry(null);
      fetchEnquiries();
      fetchStats();
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
      toast.error(
        "Delete Failed",
        "Could not delete the enquiry. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySuccess = useCallback(() => {
    setIsReplyModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedEnquiry(null);
    fetchEnquiries();
    fetchStats();
  }, [fetchEnquiries, fetchStats]);

  const handleStatusChange = useCallback(() => {
    fetchEnquiries();
    fetchStats();
  }, [fetchEnquiries, fetchStats]);

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedEnquiry(null);
  }, []);

  const handleCloseReplyModal = useCallback(() => {
    setIsReplyModalOpen(false);
    if (!isDetailsModalOpen) {
      setSelectedEnquiry(null);
    }
  }, [isDetailsModalOpen]);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedEnquiry(null);
  }, []);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden font-poppins">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Customer Enquiries
              </h1>
              <p className="text-sm text-gray-500">
                {totalItems} total enquir{totalItems !== 1 ? "ies" : "y"}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
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
                placeholder="Search by name, email, or enquiry number..."
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

            {/* Filter Toggle */}
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
        <EnquiriesTable
          enquiries={enquiries}
          loading={isLoading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          totalItems={totalItems}
          // Pass permission flags so the table can show/hide action buttons
          canViewDetail={canViewDetail}
          canReply={canReply}
          canDelete={canDelete}
          onViewEnquiry={handleView}
          onReplyEnquiry={handleReply}
          onDeleteEnquiry={handleDeleteClick}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Modals — only mount if admin has the matching permission */}
      {canViewDetail && (
        <EnquiryDetailsModal
          enquiry={selectedEnquiry}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          // Only show reply button inside detail modal if admin can reply
          onReply={canReply ? handleReplyFromDetails : undefined}
          // Only allow status change if admin has that permission
          onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
        />
      )}

      {canReply && (
        <EnquiryReplyModal
          enquiry={selectedEnquiry}
          isOpen={isReplyModalOpen}
          onClose={handleCloseReplyModal}
          onSuccess={handleReplySuccess}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleDeleteConfirm}
          title="Delete Enquiry"
          message={`Are you sure you want to delete enquiry "${selectedEnquiry?.enquiry_number}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default EnquiriesPage;
