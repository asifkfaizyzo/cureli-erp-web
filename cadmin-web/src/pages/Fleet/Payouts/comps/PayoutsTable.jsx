// cadmin-web/src/pages/Fleet/Payouts/comps/PayoutsTable.jsx (do not remove this comment)
import { useState } from "react";
import { RefreshCw, Eye, AlertTriangle, Plus, Play, CheckCircle, X } from "lucide-react";
import Pagination from "../../../../components/common/Pagination";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import BulkActionModal from "./BulkActionModal";
import { refreshRiderPayout } from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

const STATUS_STYLES = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  null: "bg-gray-50 text-gray-400",
};

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Paid",
  FAILED: "Failed",
  null: "Not Created",
};

const PayoutsTable = ({
  currentPage, setCurrentPage, rowsPerPage,
  riders, loading, totalItems,
  weekInfo, selectedWeek, activeTab,
  onOpenDetail, onRefresh, onCreateTeamPayout,
}) => {
  const toast = useToast();
  const [refreshingIds, setRefreshingIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkModal, setBulkModal] = useState({ open: false, actionType: null });

  const isTeam = activeTab === "TEAM";
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const eligiblePayoutRiders = riders.filter((r) => Boolean(r.payout_id));

  const allEligibleSelected =
    eligiblePayoutRiders.length > 0 &&
    eligiblePayoutRiders.every((r) => selectedIds.has(r.payout_id));

  const toggleSelectAll = () => {
    if (allEligibleSelected) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(eligiblePayoutRiders.map((r) => r.payout_id));
      setSelectedIds(allIds);
    }
  };

  const toggleSelectRow = (payoutId) => {
    if (!payoutId) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(payoutId)) next.delete(payoutId);
      else next.add(payoutId);
      return next;
    });
  };

  const handleRowRefresh = async (riderId) => {
    setRefreshingIds((prev) => new Set(prev).add(riderId));
    try {
      await refreshRiderPayout(riderId, selectedWeek);
      toast.success("Refreshed", "Payout recalculated");
      onRefresh();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to refresh");
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(riderId);
        return next;
      });
    }
  };

  const selectedRiders = riders.filter((r) => r.payout_id && selectedIds.has(r.payout_id));

  // ── FIX 1: Wrap skeleton in proper <table><tbody> to fix DOM nesting ──
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-3 text-center" />
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rider</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">{isTeam ? "Amount" : "Deliveries"}</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Net</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <TableSkeleton rows={rowsPerPage} columns={Array(6).fill({ key: "col", width: "auto" })} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (riders.length === 0) return <TableEmptyState message="No riders found for this week" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden relative">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allEligibleSelected}
                  onChange={toggleSelectAll}
                  disabled={eligiblePayoutRiders.length === 0}
                  className="rounded border-gray-300 text-[#05015A] focus:ring-[#05015A]"
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Rider</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              {isTeam ? (
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
              ) : (
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Deliveries</th>
              )}
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Net</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {riders.map((rider) => {
              const isRefreshing = refreshingIds.has(rider.rider_id);
              const statusKey = rider.status || "null";
              const isCurrentWeek = weekInfo?.is_current_week;
              const hasNoPayout = !rider.payout_id;
              const isSelected = Boolean(rider.payout_id && selectedIds.has(rider.payout_id));

              return (
                <tr key={rider.rider_id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-indigo-50/40" : ""}`}>
                  <td className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={hasNoPayout}
                      onChange={() => toggleSelectRow(rider.payout_id)}
                      className="rounded border-gray-300 text-[#05015A] focus:ring-[#05015A] disabled:opacity-30"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">
                        {rider.full_name || "Unnamed"}
                      </span>
                      <span className="text-xs text-gray-400">{rider.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${isTeam ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {rider.rider_type}
                    </span>
                  </td>
                  {isTeam ? (
                    <td className="px-4 py-3 text-right text-gray-700">
                      {hasNoPayout ? <span className="text-gray-300 text-xs">—</span> : `₹${rider.gross_amount.toLocaleString("en-IN")}`}
                    </td>
                  ) : (
                    <td className="px-4 py-3 text-right text-gray-700">{rider.total_deliveries}</td>
                  )}
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {hasNoPayout ? <span className="text-gray-300">—</span> : `₹${rider.gross_amount.toLocaleString("en-IN")}`}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">
                    {hasNoPayout ? <span className="text-gray-300">—</span> : `₹${rider.net_amount.toLocaleString("en-IN")}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[statusKey]}`}>
                      {isCurrentWeek && statusKey === "DRAFT" ? "In Progress" : STATUS_LABELS[statusKey]}
                    </span>
                    {!rider.bank_details_complete && (
                      <AlertTriangle size={12} className="inline ml-1 text-amber-500" title="Bank details incomplete" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {isTeam && hasNoPayout && (
                        <button
                          onClick={() => onCreateTeamPayout(rider)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Create Payout"
                        >
                          <Plus size={14} className="text-purple-600" />
                        </button>
                      )}

                      {(!isTeam || !hasNoPayout) && (
                        <button
                          onClick={() => handleRowRefresh(rider.rider_id)}
                          disabled={isRefreshing || rider.status === "PROCESSING" || rider.status === "COMPLETED"}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
                          title="Recalculate"
                        >
                          <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : "text-gray-500"} />
                        </button>
                      )}

                      {!hasNoPayout && (
                        <button
                          onClick={() => onOpenDetail(rider.rider_id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} className="text-gray-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl shadow-xl z-20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-medium text-gray-300">
            <strong className="text-white">{selectedIds.size}</strong> selected
          </span>

          <div className="h-4 w-px bg-gray-700" />

          <button
            onClick={() => setBulkModal({ open: true, actionType: "PROCESS" })}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Play size={12} /> Mark Processing
          </button>

          <button
            onClick={() => setBulkModal({ open: true, actionType: "COMPLETE" })}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle size={12} /> Mark as Paid
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
            title="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-gray-200 p-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Bulk Action Modal */}
      {bulkModal.open && (
        <BulkActionModal
          actionType={bulkModal.actionType}
          selectedPayouts={selectedRiders}
          onClose={() => setBulkModal({ open: false, actionType: null })}
          onSuccess={() => {
            setSelectedIds(new Set());
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default PayoutsTable;