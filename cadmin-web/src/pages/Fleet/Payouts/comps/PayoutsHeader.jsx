// cadmin-web/src/pages/Fleet/Payouts/comps/PayoutsHeader.jsx (do not remove this comment)
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  IndianRupee,
  Users,
  Clock,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  finalizeRiderPayoutWeek,
  refreshAllRiderPayouts,
  exportRiderPayoutsCSV,
} from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

function getWeekLabel(weekStartStr) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-IN", opts)} – ${end.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
}

function shiftWeek(weekStartStr, direction) {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + direction * 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getLast12Weeks() {
  const weeks = [];
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + diff,
  );

  for (let i = 0; i < 12; i++) {
    const monday = new Date(thisMonday);
    monday.setDate(monday.getDate() - i * 7);
    const str = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    weeks.push({
      value: str,
      label: getWeekLabel(str) + (i === 0 ? " (Current)" : ""),
    });
  }
  return weeks;
}

const PayoutsHeader = ({
  selectedWeek,
  setSelectedWeek,
  activeTab,
  setActiveTab,
  weekInfo,
  summary,
  onRefreshAll,
}) => {
  const toast = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const weeks = useMemo(getLast12Weeks, []);

  const handleFinalize = async () => {
    if (
      !confirm(
        "Finalize all DRAFT payouts for this week? This will lock the amounts and move them to PENDING.",
      )
    )
      return;
    setActionLoading("finalize");
    try {
      const resp = await finalizeRiderPayoutWeek(selectedWeek);
      const data = resp.data?.data;
      toast.success("Finalized", `${data?.finalized || 0} payouts finalized`);
      onRefreshAll();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to finalize");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshAll = async () => {
    setActionLoading("refreshAll");
    try {
      const resp = await refreshAllRiderPayouts(selectedWeek, activeTab);
      const data = resp.data?.data;
      toast.success("Refreshed", `${data?.refreshed || 0} riders refreshed`);
      onRefreshAll();
    } catch (err) {
      toast.error(
        "Error",
        err.response?.data?.message || "Failed to refresh all",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = async () => {
    setActionLoading("exportCSV");
    try {
      const resp = await exportRiderPayoutsCSV({
        week_start: selectedWeek,
        rider_type: activeTab,
      });

      const blob = new Blob([resp.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `rider_payouts_${selectedWeek}_${activeTab.toLowerCase()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Exported", "Payout CSV file downloaded");
    } catch (err) {
      toast.error(
        "Error",
        err.response?.data?.message || "Failed to export CSV",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const canFinalize = weekInfo?.is_week_ended && !weekInfo?.is_current_week;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Row 1: Week selector + Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWeek(shiftWeek(selectedWeek, -1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold"
            >
              <CalendarDays size={16} className="text-gray-500" />
              {getWeekLabel(selectedWeek)}
              <ChevronDown
                size={14}
                className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  {weeks.map((w) => (
                    <button
                      key={w.value}
                      onClick={() => {
                        setSelectedWeek(w.value);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${w.value === selectedWeek ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"}`}
                    >
                      {w.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setSelectedWeek(shiftWeek(selectedWeek, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {weekInfo?.is_current_week && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              In Progress
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={actionLoading === "exportCSV"}
            className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-1.5"
            title="Download CSV for bank processing"
          >
            {actionLoading === "exportCSV" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Export CSV
          </button>

          <button
            onClick={handleRefreshAll}
            disabled={actionLoading === "refreshAll"}
            className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {actionLoading === "refreshAll" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Clock size={14} />
            )}
            Refresh All
          </button>

          {canFinalize && (
            <button
              onClick={handleFinalize}
              disabled={actionLoading === "finalize"}
              className="px-3 py-2 text-sm font-medium bg-[#05015A] text-white rounded-lg hover:bg-[#0a0280] transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {actionLoading === "finalize" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Finalize Week
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Tabs */}
      <LayoutGroup id="payout-header-tabs">
        <div className="flex items-stretch gap-2 border-b border-gray-100 h-10">
          {["INDEPENDENT", "TEAM"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center px-4 h-full text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? "text-[#05015A]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>
                  {tab === "INDEPENDENT" ? "Independent Riders" : "Team Riders"}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="payout-active-tab-indicator"
                    layout="x" // <-- LOCKS animation to the X-axis, preventing diagonal slide
                    layoutDependency={activeTab}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35,
                    }}
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#05015A] z-10"
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {/* Row 3: Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Users size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Riders</p>
              <p className="text-sm font-bold">{summary.total_riders}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <IndianRupee size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Gross</p>
              <p className="text-sm font-bold">
                ₹{summary.total_gross.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <IndianRupee size={16} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Net</p>
              <p className="text-sm font-bold text-green-700">
                ₹{summary.total_net.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <CheckCircle2 size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-sm font-bold">{summary.completed_count}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsHeader;
