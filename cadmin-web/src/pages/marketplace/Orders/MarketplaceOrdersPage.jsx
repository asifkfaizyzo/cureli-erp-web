// cadmin-web/src/pages/marketplace/Orders/MarketplaceOrdersPage.jsx (do not remove this comment)
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, Package, X, ChevronRight } from "lucide-react";
import { getMarketplaceOrders } from "../../../api/cadminMarketplaceOrders";
import OrderDetailModal from "./comps/OrderDetailModal";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED: {
    label: "Placed",
    dot: "bg-amber-500",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
  },
  ACCEPTED: {
    label: "Accepted",
    dot: "bg-blue-500",
    cls: "bg-blue-50 text-blue-700 border-blue-100",
  },
  READY_FOR_PICKUP: {
    label: "Ready",
    dot: "bg-violet-500",
    cls: "bg-violet-50 text-violet-700 border-violet-100",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-500",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-500",
    cls: "bg-red-50 text-red-700 border-red-100",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  },
};

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PLACED", label: "Placed" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELLED", label: "Cancelled" },
];

const COLS = [
  { key: "order", width: "140px", label: "Order" },
  { key: "customer", width: "180px", label: "Customer" },
  { key: "shop", width: "220px", label: "Shop / Branch" },
  { key: "items", width: "100px", label: "Items" },
  { key: "amount", width: "120px", label: "Amount" },
  { key: "status", width: "120px", label: "Status" },
  { key: "date", width: "120px", label: "Date" },
  { key: "arrow", width: "40px", label: "" },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtAmount = (n) =>
  `₹${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
};

const Toast = ({ toast }) =>
  !toast ? null : (
    <div
      className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl shadow-2xl text-sm font-medium ${
        toast.type === "error"
          ? "bg-red-600 text-white"
          : toast.type === "warning"
          ? "bg-amber-500 text-white"
          : "bg-gray-900 text-white"
      }`}
    >
      {toast.message}
    </div>
  );

// ─────────────────────────────────────────────
// UI BITS
// ─────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const TableColGroup = () => (
  <colgroup>
    {COLS.map((c) => (
      <col key={c.key} style={{ width: c.width }} />
    ))}
  </colgroup>
);

const TableSkeleton = ({ rows = 10 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50">
        {COLS.map((c) => (
          <td key={c.key} className="px-4 py-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const EmptyState = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
      <Package size={28} className="text-gray-300" />
    </div>
    <p className="text-sm font-medium text-gray-600">
      {query ? `No orders found for "${query}"` : "No marketplace orders yet"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {query
        ? "Try a different search term or status filter"
        : "Orders placed by customers will appear here"}
    </p>
  </div>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const MarketplaceOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 20;
  const debounceRef = useRef(null);

  const { toast, show: showToast } = useToast();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await getMarketplaceOrders({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
        });
        const d = res.data?.data;
        setOrders(d?.orders || []);
        setTotalPages(d?.total_pages || 1);
        setTotalCount(d?.total || 0);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch, statusFilter]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── NEW: Listen for SSE Custom Events to trigger dynamic page updates ──
  useEffect(() => {
    let updateTimer = null;

    const handleSseUpdate = () => {
      if (updateTimer) clearTimeout(updateTimer);
      // 1.5-second debounce to prevent spamming back-to-back requests
      updateTimer = setTimeout(() => {
        fetchOrders({ silent: true });
      }, 1500);
    };

    window.addEventListener("sse-marketplace-new-order", handleSseUpdate);
    window.addEventListener("sse-marketplace-order-status-changed", handleSseUpdate);

    return () => {
      if (updateTimer) clearTimeout(updateTimer);
      window.removeEventListener("sse-marketplace-new-order", handleSseUpdate);
      window.removeEventListener("sse-marketplace-order-status-changed", handleSseUpdate);
    };
  }, [fetchOrders]);
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gray-50/80">
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Marketplace Orders
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? "Loading..."
                : `${totalCount.toLocaleString()} total orders`}
            </p>
          </div>

          <button
            onClick={() => fetchOrders({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200/60 p-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 overflow-x-auto flex-shrink-0">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === tab.key
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/30 focus:ring-2 focus:ring-[#05015A]/10 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <TableColGroup />

              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                <tr className="border-b border-gray-100">
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              {loading ? (
                <TableSkeleton rows={10} />
              ) : orders.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={COLS.length}>
                      <EmptyState query={debouncedSearch} />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {orders.map((order) => {
                    const isSelected = selectedOrderId === order.order_id;

                    return (
                      <tr
                        key={order.order_id}
                        onClick={() =>
                          setSelectedOrderId(isSelected ? null : order.order_id)
                        }
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#05015A]/[0.03]"
                            : "hover:bg-gray-50/70"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 truncate">
                          {order.order_number}
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {order.customer_name || "—"}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono truncate">
                            {order.customer_phone || ""}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {order.shop?.business_name || "—"}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {order.branch?.branch_name || ""}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {order.item_count ?? "—"}
                          {order.requires_prescription && (
                            <span className="ml-1.5 inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                              Rx
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                          {order.total_amount != null
                            ? fmtAmount(order.total_amount)
                            : "—"}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">
                          {fmt(order.placed_at)}
                        </td>

                        <td className="px-4 py-3">
                          <ChevronRight
                            size={14}
                            className={`transition-colors ${
                              isSelected ? "text-[#05015A]" : "text-gray-300"
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <p className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of{" "}
                {totalPages} · {totalCount.toLocaleString()} total
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={() => fetchOrders({ silent: true })}
          onToast={showToast}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default MarketplaceOrdersPage;