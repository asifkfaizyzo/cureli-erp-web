// cadmin-web/src/pages/marketplace/Orders/MarketplaceOrdersPage.jsx (do not remove this comment)
import { useState, useEffect, useCallback, useRef } from "react";
import { getMarketplaceOrders } from "../../../api/cadminMarketplaceOrders";
import { useToast } from "../../../components/common/Toast";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import useMarketplaceSSE from "./comps/hooks/useMarketplaceSSE";
import OrdersHeader from "./comps/OrdersHeader";
import OrdersFilters from "./comps/OrdersFilters";
import OrdersTable from "./comps/OrdersTable";
import OrderDetailModal from "./comps/OrderDetailModal";

const MarketplaceOrdersPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

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

  const debounceRef = useRef(null);

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
  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
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
      } catch (err) {
        setOrders([]);
        toast.error("Fetch Failed", err.response?.data?.message || "Unable to load orders.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, rowsPerPage, debouncedSearch, statusFilter, toast]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── SSE: Live updates ──
  const handleSSENewOrder = useCallback(() => {
    // New order arrived — refetch to get the full row at the top
    if (page === 1 && !statusFilter) {
      fetchOrders({ silent: true });
    } else {
      // Just bump the total count optimistically
      setTotalCount((prev) => prev + 1);
    }
  }, [page, statusFilter, fetchOrders]);

  const handleSSEStatusChanged = useCallback((payload) => {
    if (!payload?.order_id) return;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.order_id !== payload.order_id) return order;
        return {
          ...order,
          status: payload.new_status ?? order.status,
          ...(payload.total_amount != null && { total_amount: payload.total_amount }),
          ...(payload.item_count != null && { item_count: payload.item_count }),
          ...(payload.payment_status && { payment_status: payload.payment_status }),
          ...(payload.customer_name && { customer_name: payload.customer_name }),
          ...(payload.customer_phone && { customer_phone: payload.customer_phone }),
          ...(payload.shop_name && { shop: { ...order.shop, business_name: payload.shop_name } }),
          ...(payload.branch_name && { branch: { ...order.branch, branch_name: payload.branch_name } }),
          ...(payload.has_rider != null && { has_rider: payload.has_rider }),
          ...(payload.delivery_status != null && { delivery_status: payload.delivery_status }),
        };
      })
    );
  }, []);

  const handleSSEDeliveryChanged = useCallback((payload) => {
    if (!payload?.order_id) return;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.order_id !== payload.order_id) return order;
        return {
          ...order,
          has_rider: !!payload.rider_id,
          delivery_status: payload.status ?? order.delivery_status,
        };
      })
    );
  }, []);

  useMarketplaceSSE({
    onNewOrder: handleSSENewOrder,
    onStatusChanged: handleSSEStatusChanged,
    onDeliveryChanged: handleSSEDeliveryChanged,
  });

  const handleRefresh = () => {
    toast.info("Refreshing", "Fetching latest marketplace orders...", 1500);
    fetchOrders({ silent: true });
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      <OrdersHeader
        totalCount={totalCount}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <OrdersFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <OrdersTable
          orders={orders}
          loading={loading}
          currentPage={page}
          setCurrentPage={setPage}
          totalItems={totalCount}
          rowsPerPage={rowsPerPage}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
        />
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={() => fetchOrders({ silent: true })}
        />
      )}
    </div>
  );
};

export default MarketplaceOrdersPage;