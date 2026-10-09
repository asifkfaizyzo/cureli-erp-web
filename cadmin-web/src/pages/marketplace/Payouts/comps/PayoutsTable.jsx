import { useState } from "react";
import { RefreshCw, Eye, AlertTriangle, Play, CheckCircle, X, HelpCircle } from "lucide-react";
import Pagination from "../../../../components/common/Pagination";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import BulkActionModal from "./BulkActionModal";
import { refreshPharmacyPayout } from "../../../../api/cadminPharmacyPayouts";
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

const BULK_ELIGIBLE = new Set(["DRAFT", "PENDING", "FAILED"]);

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PayoutsTable = ({
  currentPage,
  setCurrentPage,
  rowsPerPage,
  shops,
  loading,
  totalItems,
  weekInfo,
  selectedWeek,
  onOpenDetail,
  onRefresh,
}) => {
  const toast = useToast();
  const [refreshingIds, setRefreshingIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkModal, setBulkModal] = useState({ open: false, actionType: null });

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const eligiblePayouts = shops.filter((s) => s.payout_id && BULK_ELIGIBLE.has(s.status));
  const allEligibleSelected =
    eligiblePayouts.length > 0 &&
    eligiblePayouts.every((s) => selectedIds.has(s.payout_id));

  const toggleSelectAll = () => {
    if (allEligibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligiblePayouts.map((s) => s.payout_id)));
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

  const handleRowRefresh = async (shopId) => {
    setRefreshingIds((prev) => new Set(prev).add(shopId));
    try {
      await refreshPharmacyPayout(shopId, selectedWeek);
      toast.success("Refreshed", "Payout recalculated");
      onRefresh();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to refresh");
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(shopId);
        return next;
      });
    }
  };

  const selectedShops = shops.filter((s) => s.payout_id && selectedIds.has(s.payout_id));

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-3 text-center" />
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Pharmacy</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Orders</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Commission</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Net</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Cureli Margin</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <TableSkeleton rows={rowsPerPage} columns={Array(7).fill({ key: "col", width: "auto" })} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (shops.length === 0) return <TableEmptyState message="No pharmacies found for this week" />;

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
                  disabled={eligiblePayouts.length === 0}
                  className="rounded border-gray-300 text-[#05015A] focus:ring-[#05015A]"
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Pharmacy</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Orders</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Gross</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Commission</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Pharmacy Net</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Cureli Margin</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shops.map((shop) => {
              const isRefreshing = refreshingIds.has(shop.shop_id);
              const statusKey = shop.status || "null";
              const isCurrentWeek = weekInfo?.is_current_week;
              const hasNoPayout = !shop.payout_id;
              const canSelect = Boolean(shop.payout_id && BULK_ELIGIBLE.has(shop.status));
              const isSelected = Boolean(shop.payout_id && selectedIds.has(shop.payout_id));

              return (
                <tr key={shop.shop_id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-indigo-50/40" : ""}`}>
                  <td className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!canSelect}
                      onChange={() => toggleSelectRow(shop.payout_id)}
                      className="rounded border-gray-300 text-[#05015A] focus:ring-[#05015A] disabled:opacity-30"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">
                        {shop.business_name}
                      </span>
                      <span className="text-xs text-gray-400">{shop.city}{shop.state ? `, ${shop.state}` : ""}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{shop.total_orders}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {hasNoPayout ? <span className="text-gray-300">—</span> : fmt(shop.gross_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-amber-700">
                    {hasNoPayout ? <span className="text-gray-300">—</span> : fmt(shop.commission_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">
                    {hasNoPayout ? <span className="text-gray-300">—</span> : fmt(shop.net_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-700">
                    {hasNoPayout ? <span className="text-gray-300">—</span> : fmt(shop.cureli_margin)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[statusKey]}`}>
                      {isCurrentWeek && statusKey === "DRAFT" ? "In Progress" : STATUS_LABELS[statusKey]}
                    </span>
                    {hasNoPayout && (
                      <HelpCircle size={12} className="inline ml-1 text-gray-400" title="No payout calculated yet. Click recalculate to generate." />
                    )}
                    {!hasNoPayout && !shop.bank_details_complete && (
                      <AlertTriangle size={12} className="inline ml-1 text-amber-500" title="Bank details incomplete" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleRowRefresh(shop.shop_id)}
                        disabled={isRefreshing || shop.status === "PROCESSING" || shop.status === "COMPLETED"}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
                        title="Recalculate"
                      >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : "text-gray-500"} />
                      </button>
                      {!hasNoPayout && (
                        <button
                          onClick={() => onOpenDetail(shop.shop_id)}
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
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {bulkModal.open && (
        <BulkActionModal
          actionType={bulkModal.actionType}
          selectedPayouts={selectedShops}
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