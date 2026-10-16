// cadmin-web/src/pages/marketplace/Orders/comps/SameDayTab.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Truck, Plus, Loader2, RefreshCw, Package, History as HistoryIcon, Radio } from "lucide-react";
import { getMarketplaceOrders } from "../../../../api/cadminMarketplaceOrders";
import { getActiveBatches } from "../../../../api/cadminDelivery";
import OrderDetailModal from "./OrderDetailModal";
import CreateBatchModal from "./CreateBatchModal";
import ActiveBatchCard from "./ActiveBatchCard";
import AddOrdersToBatchModal from "./AddOrdersToBatchModal";
import BatchHistorySection from "./BatchHistorySection";
import useMarketplaceSSE from "./hooks/useMarketplaceSSE";

const SameDayTab = ({ toast, rowsPerPage, registerRefresh }) => {
  const [unassigned, setUnassigned] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [addToBatchTarget, setAddToBatchTarget] = useState(null);

  // ── Live / History sub-tab ──────────────────────────────
  const [viewMode, setViewMode] = useState("live"); // "live" | "history"
  const [historyOpened, setHistoryOpened] = useState(false); // lazy-mount guard
  const historyRefreshRef = useRef(null);

  useEffect(() => {
    if (viewMode === "history" && !historyOpened) {
      setHistoryOpened(true);
    }
  }, [viewMode, historyOpened]);

  const fetchUnassigned = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoadingUnassigned(true);
      try {
        const res = await getMarketplaceOrders({
          page: 1,
          limit: 100,
          fulfillment_type: "SAME_DAY",
          status: "ACCEPTED",
        });
        const list = (res.data?.data?.orders || []).filter((o) => !o.has_rider);
        setUnassigned(list);
      } catch (err) {
        toast.error(
          "Fetch Failed",
          err.response?.data?.message || "Could not load unassigned orders.",
        );
      } finally {
        setLoadingUnassigned(false);
      }
    },
    [toast],
  );

  const fetchBatches = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoadingBatches(true);
      try {
        const res = await getActiveBatches();
        setBatches(res.data?.data || []);
      } catch (err) {
        toast.error(
          "Fetch Failed",
          err.response?.data?.message || "Could not load active batches.",
        );
      } finally {
        setLoadingBatches(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchUnassigned();
    fetchBatches();
  }, [fetchUnassigned, fetchBatches]);

  const refreshAll = useCallback(() => {
    fetchUnassigned({ silent: true });
    fetchBatches({ silent: true });
  }, [fetchUnassigned, fetchBatches]);

  // Expose refresh to parent for header button — routes to whichever
  // sub-tab (Live or History) is currently active.
  useEffect(() => {
    registerRefresh?.(() => {
      if (viewMode === "history") {
        historyRefreshRef.current?.();
      } else {
        refreshAll();
      }
    });
    return () => registerRefresh?.(null);
  }, [registerRefresh, refreshAll, viewMode]);

  const handleSSEOrderOrDelivery = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  useMarketplaceSSE({
    onNewOrder: handleSSEOrderOrDelivery,
    onStatusChanged: handleSSEOrderOrDelivery,
    onDeliveryChanged: handleSSEOrderOrDelivery,
    debounceMs: 800,
  });

  return (
    <div className="flex-1 min-h-0 overflow-auto px-1 pb-4">
      {/* ── Live / History Toggle ── */}
      <div className="flex items-center gap-1.5 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setViewMode("live")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            viewMode === "live"
              ? "bg-white text-[#05015A] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Radio size={12} />
          Live
        </button>
        <button
          onClick={() => setViewMode("history")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            viewMode === "history"
              ? "bg-white text-[#05015A] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <HistoryIcon size={12} />
          History
        </button>
      </div>

      {viewMode === "live" && (
      <>
      {/* ── Section 1: Unassigned Orders ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
              <Package size={14} className="text-[#05015A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Unassigned Same Day Orders
              </h3>
              <p className="text-[11px] text-gray-500">
                {loadingUnassigned
                  ? "Loading..."
                  : `${unassigned.length} order${unassigned.length !== 1 ? "s" : ""} ready for batching`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#05015A] transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setShowCreateBatch(true)}
              disabled={unassigned.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-[#05015A] hover:bg-[#05015A]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Plus size={13} />
              Create Batch
            </button>
          </div>
        </div>

        {loadingUnassigned ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-medium">Loading orders...</span>
          </div>
        ) : unassigned.length === 0 ? (
          <div className="text-center py-10">
            <Package size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500 font-medium">
              No unassigned Same Day orders
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              New Same Day orders accepted by pharmacies will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-2.5 text-left">#</th>
                  <th className="px-3 py-2.5 text-left">Order ID</th>
                  <th className="px-3 py-2.5 text-left">Customer</th>
                  <th className="px-3 py-2.5 text-left">Shop / Branch</th>
                  <th className="px-3 py-2.5 text-center">Items</th>
                  <th className="px-3 py-2.5 text-left">Amount</th>
                  <th className="px-3 py-2.5 text-left">Placed</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((o, i) => (
                  <tr
                    key={o.order_id}
                    onClick={() => setSelectedOrderId(o.order_id)}
                    className="border-b border-gray-50 hover:bg-[#05015A]/5 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-2.5 text-[11px] text-gray-400 font-medium">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-800 font-semibold">
                      {o.order_number}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {o.customer_name || "—"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {o.customer_phone || ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-900 truncate">
                          {o.shop?.business_name || "—"}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate">
                          {o.branch?.branch_name || ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-xs font-medium text-gray-800">
                        {o.item_count ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-900">
                      {o.total_amount != null
                        ? `₹${Number(o.total_amount).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-500">
                      {o.placed_at
                        ? new Date(o.placed_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 2: Active Batches ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
              <Truck size={14} className="text-[#05015A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Active Batches
              </h3>
              <p className="text-[11px] text-gray-500">
                {loadingBatches
                  ? "Loading..."
                  : `${batches.length} batch${batches.length !== 1 ? "es" : ""} in progress`}
              </p>
            </div>
          </div>
        </div>

        {loadingBatches ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-medium">Loading batches...</span>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-10">
            <Truck size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500 font-medium">
              No active batches
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Create a batch above to assign orders to a team rider
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {batches.map((batch) => (
              <ActiveBatchCard
                key={batch.batch_group_id}
                batch={batch}
                onAddOrders={() => setAddToBatchTarget(batch)}
                onChanged={refreshAll}
                onOrderClick={(orderId) => setSelectedOrderId(orderId)}
                toast={toast}
              />
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* ── Batch History (lazy-mounted on first open, kept alive after) ── */}
      {historyOpened && (
        <div style={{ display: viewMode === "history" ? "block" : "none" }}>
          <BatchHistorySection
            toast={toast}
            rowsPerPage={rowsPerPage}
            onOrderClick={(orderId) => setSelectedOrderId(orderId)}
            registerRefresh={(fn) => {
              historyRefreshRef.current = fn;
            }}
          />
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateBatch && (
        <CreateBatchModal
          unassignedOrders={unassigned}
          onClose={() => setShowCreateBatch(false)}
          onCreated={() => {
            setShowCreateBatch(false);
            refreshAll();
          }}
          toast={toast}
        />
      )}
      {addToBatchTarget && (
        <AddOrdersToBatchModal
          batch={addToBatchTarget}
          unassignedOrders={unassigned}
          onClose={() => setAddToBatchTarget(null)}
          onAdded={() => {
            setAddToBatchTarget(null);
            refreshAll();
          }}
          toast={toast}
        />
      )}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={refreshAll}
        />
      )}
    </div>
  );
};

export default SameDayTab;
