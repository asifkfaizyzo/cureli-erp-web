// cadmin-web/src/pages/marketplace/Orders/comps/BatchHistorySection.jsx
import { useState, useEffect, useCallback } from "react";
import { History, Loader2 } from "lucide-react";
import { getBatchHistory } from "../../../../api/cadminDelivery";
import BatchHistoryDateNav from "./BatchHistoryDateNav";
import BatchHistoryCard from "./BatchHistoryCard";
import Pagination from "../../../../components/common/Pagination";

function getISTTodayString() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
}

/**
 * Orchestrator for the Batch History sub-tab inside SameDayTab.
 * Owns date + page state, fetches from the backend, renders the date nav,
 * batch cards, and shared Pagination component (same pattern used app-wide).
 *
 * Mounted lazily by the parent (SameDayTab) — only fetches once the admin
 * actually opens the History sub-tab.
 */
const BatchHistorySection = ({ toast, rowsPerPage, onOrderClick, registerRefresh }) => {
  const [date, setDate] = useState(getISTTodayString());
  const [currentPage, setCurrentPage] = useState(1);
  const [batches, setBatches] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const res = await getBatchHistory({
          date,
          page: currentPage,
          limit: rowsPerPage,
        });
        const data = res.data?.data;
        setBatches(data?.batches || []);
        setTotalItems(data?.pagination?.total_items || 0);
      } catch (err) {
        toast.error(
          "Fetch Failed",
          err.response?.data?.message || "Could not load batch history.",
        );
      } finally {
        setLoading(false);
      }
    },
    [date, currentPage, rowsPerPage, toast],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Expose refresh to SameDayTab, which routes the parent's manual
  // refresh button here whenever the History sub-tab is active.
  useEffect(() => {
    registerRefresh?.(() => fetchHistory({ silent: true }));
    return () => registerRefresh?.(null);
  }, [registerRefresh, fetchHistory]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
            <History size={14} className="text-[#05015A]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Batch History</h3>
            <p className="text-[11px] text-gray-500">
              {loading
                ? "Loading..."
                : `${totalItems} completed batch${totalItems !== 1 ? "es" : ""}`}
            </p>
          </div>
        </div>
      </div>

      <BatchHistoryDateNav date={date} onDateChange={handleDateChange} />

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-medium">Loading batch history...</span>
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-10">
          <History size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs text-gray-500 font-medium">
            No completed batches on this date
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Try a different date using the navigator above
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {batches.map((batch) => (
            <BatchHistoryCard
              key={batch.batch_group_id}
              batch={batch}
              onOrderClick={onOrderClick}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
};

export default BatchHistorySection;