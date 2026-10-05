// cadmin-web/src/pages/marketplace/Orders/MarketplaceOrdersPage.jsx (do not remove this comment)
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getMarketplaceOrders } from "../../../api/cadminMarketplaceOrders";
import { getPrescriptionRequests } from "../../../api/cadminPrescriptionRequests";
import { useToast } from "../../../components/common/Toast";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import useMarketplaceSSE from "./comps/hooks/useMarketplaceSSE";
import OrdersHeader from "./comps/OrdersHeader";
import OrdersFilters from "./comps/OrdersFilters";
import OrdersTable from "./comps/OrdersTable";
import OrderDetailModal from "./comps/OrderDetailModal";
import PrescriptionRequestDetailModal from "./comps/PrescriptionRequestDetailModal";

const MarketplaceOrdersPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── View Mode (orders | prescriptions) ──
  const [viewMode, setViewMode] = useState(() => {
    const v = searchParams.get("view");
    return v === "prescriptions" ? "prescriptions" : "orders";
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const debounceRef = useRef(null);

  // ── Sync viewMode to URL ──
  useEffect(() => {
    const current = searchParams.get("view") || "orders";
    const target = viewMode === "prescriptions" ? "prescriptions" : "orders";
    if (current !== target) {
      setSearchParams({ view: target }, { replace: true });
    }
  }, [viewMode, searchParams, setSearchParams]);

  // ── Reset state on viewMode change ──
  useEffect(() => {
    setOrders([]);
    setPage(1);
    setStatusFilter("");
    setSearch("");
    setDebouncedSearch("");
    setSelectedOrderId(null);
    setSelectedRequestId(null);
  }, [viewMode]);

  // ── Search debounce ──
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

  // ── Core fetch ──
  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        if (viewMode === "orders") {
          const res = await getMarketplaceOrders({
            page,
            limit: rowsPerPage,
            search: debouncedSearch,
            status: statusFilter,
          });
          const d = res.data?.data;
          setOrders(d?.orders || []);
          setTotalPages(d?.total_pages || 1);
          setTotalCount(d?.total || 0);
        } else {
          const res = await getPrescriptionRequests({
            page,
            limit: rowsPerPage,
            search: debouncedSearch,
            status: statusFilter,
          });
          const d = res.data?.data;
          setOrders(d?.requests || []);
          setTotalPages(d?.total_pages || 1);
          setTotalCount(d?.total || 0);
        }
      } catch (err) {
        setOrders([]);
        toast.error(
          "Fetch Failed",
          err.response?.data?.message || "Unable to load data.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, rowsPerPage, debouncedSearch, statusFilter, toast, viewMode],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── SSE: Live updates ──
  const handleSSENewOrder = useCallback(() => {
    if (viewMode !== "orders") return;
    if (page === 1 && !statusFilter) {
      fetchData({ silent: true });
    } else {
      setTotalCount((prev) => prev + 1);
    }
  }, [page, statusFilter, fetchData, viewMode]);

  const handleSSEStatusChanged = useCallback(
    (payload) => {
      if (viewMode !== "orders" || !payload?.order_id) return;
      setOrders((prev) =>
        prev.map((order) => {
          if (order.order_id !== payload.order_id) return order;
          return {
            ...order,
            status: payload.new_status ?? order.status,
            ...(payload.total_amount != null && {
              total_amount: payload.total_amount,
            }),
            ...(payload.item_count != null && {
              item_count: payload.item_count,
            }),
            ...(payload.payment_status && {
              payment_status: payload.payment_status,
            }),
            ...(payload.customer_name && {
              customer_name: payload.customer_name,
            }),
            ...(payload.customer_phone && {
              customer_phone: payload.customer_phone,
            }),
            ...(payload.shop_name && {
              shop: { ...order.shop, business_name: payload.shop_name },
            }),
            ...(payload.branch_name && {
              branch: { ...order.branch, branch_name: payload.branch_name },
            }),
            ...(payload.has_rider != null && { has_rider: payload.has_rider }),
            ...(payload.delivery_status != null && {
              delivery_status: payload.delivery_status,
            }),
          };
        }),
      );
    },
    [viewMode],
  );

  const handleSSEDeliveryChanged = useCallback(
    (payload) => {
      if (viewMode !== "orders" || !payload?.order_id) return;
      setOrders((prev) =>
        prev.map((order) => {
          if (order.order_id !== payload.order_id) return order;
          return {
            ...order,
            has_rider: !!payload.rider_id,
            delivery_status: payload.status ?? order.delivery_status,
          };
        }),
      );
    },
    [viewMode],
  );

  const handleSSEPrescriptionNew = useCallback(() => {
    if (viewMode !== "prescriptions") return;
    if (page === 1 && !statusFilter) {
      fetchData({ silent: true });
    } else {
      setTotalCount((prev) => prev + 1);
    }
  }, [page, statusFilter, fetchData, viewMode]);

  const handleSSEPrescriptionResponded = useCallback(
    (payload) => {
      if (viewMode !== "prescriptions" || !payload?.request_id) return;
      // Refetch to get updated recipient counts
      if (page === 1) {
        fetchData({ silent: true });
      }
    },
    [page, fetchData, viewMode],
  );

  useMarketplaceSSE({
    onNewOrder: handleSSENewOrder,
    onStatusChanged: handleSSEStatusChanged,
    onDeliveryChanged: handleSSEDeliveryChanged,
    onPrescriptionRequestNew: handleSSEPrescriptionNew,
    onPrescriptionRequestResponded: handleSSEPrescriptionResponded,
  });

  const handleRefresh = () => {
    toast.info("Refreshing", "Fetching latest data...", 1500);
    fetchData({ silent: true });
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      <OrdersHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalCount={totalCount}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <OrdersFilters
        viewMode={viewMode}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <OrdersTable
          viewMode={viewMode}
          orders={orders}
          loading={loading}
          currentPage={page}
          setCurrentPage={setPage}
          totalItems={totalCount}
          rowsPerPage={rowsPerPage}
          onSelectOrder={setSelectedOrderId}
          onSelectRequest={setSelectedRequestId}
        />
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={() => fetchData({ silent: true })}
        />
      )}

      {selectedRequestId && (
        <PrescriptionRequestDetailModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  );
};

export default MarketplaceOrdersPage;
