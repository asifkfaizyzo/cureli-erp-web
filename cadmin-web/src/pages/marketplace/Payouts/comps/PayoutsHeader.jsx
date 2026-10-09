import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Clock, AlertTriangle, IndianRupee, TrendingUp } from "lucide-react";
import { refreshAllPharmacyPayouts, finalizePharmacyPayoutWeek } from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";

const PayoutsHeader = ({ selectedWeek, setSelectedWeek, weekInfo, summary, onRefreshAll }) => {
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const shiftWeek = (direction) => {
    const [y, m, d] = selectedWeek.split("-").map(Number);
    const date = new Date(y, m - 1, d + direction * 7);
    setSelectedWeek(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    );
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refreshAllPharmacyPayouts(selectedWeek);
      toast.success("Refreshed", "All pharmacy payouts recalculated");
      onRefreshAll();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Finalize all DRAFT payouts for the previous week? This will lock the calculations.")) return;
    setFinalizing(true);
    try {
      const resp = await finalizePharmacyPayoutWeek(selectedWeek);
      const data = resp.data?.data;
      toast.success("Finalized", `${data?.finalized || 0} payouts finalized`);
      onRefreshAll();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to finalize");
    } finally {
      setFinalizing(false);
    }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-3">
      {/* Week Navigator */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftWeek(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="text-center min-w-[200px]">
            <p className="text-sm font-bold text-gray-900">
              {weekInfo?.week_start || selectedWeek} → {weekInfo?.week_end || "—"}
            </p>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {weekInfo?.is_current_week && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">CURRENT WEEK</span>
              )}
              {weekInfo?.is_week_ended && !weekInfo?.is_current_week && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">ENDED</span>
              )}
            </div>
          </div>
          <button
            onClick={() => shiftWeek(1)}
            disabled={weekInfo?.is_current_week}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={weekInfo?.is_current_week ? "Cannot go beyond current week" : "Next week"}
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh All
          </button>
          {weekInfo?.is_week_ended && !weekInfo?.is_current_week && (
            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              Finalize Week
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <IndianRupee size={14} />
              <span className="text-xs font-medium">Total Gross</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{fmt(summary.total_gross)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">Commission</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{fmt(summary.total_commission)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <IndianRupee size={14} />
              <span className="text-xs font-medium">Net to Pharmacy</span>
            </div>
            <p className="text-lg font-bold text-green-700">{fmt(summary.total_net)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs font-medium">Cureli Margin</span>
            </div>
            <p className={`text-lg font-bold ${(summary.total_cureli_margin || 0) >= 0 ? "text-indigo-700" : "text-red-700"}`}>
              {fmt(summary.total_cureli_margin)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock size={14} />
              <span className="text-xs font-medium">Status</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-yellow-600 font-semibold">{summary.pending_count} Pend</span>
              <span className="text-blue-600 font-semibold">{summary.processing_count} Proc</span>
              <span className="text-green-600 font-semibold">{summary.completed_count} Paid</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsHeader;