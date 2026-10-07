import { useState, useEffect, useCallback } from "react";
import { Landmark, RefreshCw, Search, X, Filter, AlertCircle, Download } from "lucide-react";
import PayoutsHeader from "./comps/PayoutsHeader";
import PayoutsTable from "./comps/PayoutsTable";
import PayoutDetailModal from "./comps/PayoutDetailModal";
import StyledSelect from "../../../components/common/StyledSelect";
import { getPharmacyPayouts, exportPharmacyPayoutsCSV } from "../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../components/common/Toast";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NOT_CALCULATED", label: "Not Calculated" },
  { value: "DRAFT", label: "In Progress / Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

const PharmacyPayoutsPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [shops, setShops] = useState([]);
  const [summary, setSummary] = useState(null);
  const [weekInfo, setWeekInfo] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  });

  const [detailModal, setDetailModal] = useState({ open: false, shopId: null });

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        week_start: selectedWeek,
        page: currentPage,
        limit: rowsPerPage,
        search: searchText || undefined,
        status: statusFilter || undefined,
      };
      const resp = await getPharmacyPayouts(params);
      const data = resp.data?.data || {};
      setShops(data.shops || []);
      setSummary(data.summary || null);
      setWeekInfo({
        week_start: data.week_start,
        week_end: data.week_end,
        is_current_week: data.is_current_week,
        is_week_ended: data.is_week_ended,
      });
      setTotalItems(data.pagination?.total || 0);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load payouts.";
      setError(msg);
      toast.error("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek, currentPage, rowsPerPage, searchText, statusFilter, toast]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);
  useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter, selectedWeek]);

  const handleRefresh = () => {
    toast.info("Refreshing", "Loading latest payout data...", 2000);
    fetchPayouts();
  };

  const handleExport = async () => {
    try {
      const resp = await exportPharmacyPayoutsCSV({
        week_start: selectedWeek,
        status: statusFilter || undefined,
        search: searchText || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `pharmacy-payouts-${selectedWeek}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Exported", "CSV downloaded");
    } catch {
      toast.error("Export Failed", "Could not download CSV");
    }
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      <div className="flex-shrink-0 flex flex-col gap-3">
        {/* Page Title */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Landmark size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">Pharmacy Payouts</h1>
              <p className="text-sm text-gray-500">
                {totalItems} pharmac{totalItems !== 1 ? "ies" : "y"} this week
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 text-sm"
            >
              <Download size={15} /> CSV
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

        {/* Week Selector + Summary */}
        <PayoutsHeader
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          weekInfo={weekInfo}
          summary={summary}
          onRefreshAll={fetchPayouts}
        />

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by shop name or city..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm relative flex-shrink-0
                ${showFilters || statusFilter ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
              {statusFilter && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StyledSelect
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={STATUS_OPTIONS}
                />
              </div>
              {statusFilter && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setStatusFilter("")}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <X size={16} /> Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button onClick={handleRefresh} className="text-red-700 underline text-sm">Retry</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <PayoutsTable
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          shops={shops}
          loading={loading}
          totalItems={totalItems}
          weekInfo={weekInfo}
          selectedWeek={selectedWeek}
          onOpenDetail={(shopId) => setDetailModal({ open: true, shopId })}
          onRefresh={fetchPayouts}
        />
      </div>

      {/* Detail Modal */}
      {detailModal.open && (
        <PayoutDetailModal
          shopId={detailModal.shopId}
          weekStart={selectedWeek}
          onClose={() => setDetailModal({ open: false, shopId: null })}
          onRefresh={fetchPayouts}
        />
      )}
    </div>
  );
};

export default PharmacyPayoutsPage;