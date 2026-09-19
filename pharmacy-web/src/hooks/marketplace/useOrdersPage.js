// pharmacy-web/src/hooks/marketplace/useOrdersPage.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore, selectBranchContext } from '../../store/useAuthStore';
import { switchBranch } from '../../api/branches';
import * as ordersAPI from '../../api/marketplaceOrders';

export const ORDER_TABS = [
  {
    id:         'all',
    label:      'All Orders',
    statuses:   'PLACED,ACCEPTED,READY_FOR_PICKUP,COMPLETED,REJECTED,CANCELLED',
    emptyLabel: 'No orders found',
    emptyDesc:  'All customer orders will appear here.',
  },
  {
    id:         'new',
    label:      'New Orders',
    statuses:   'PLACED',
    emptyLabel: 'No new orders',
    emptyDesc:  'New customer orders will appear here.',
  },
  {
    id:         'active',
    label:      'Active',
    statuses:   'ACCEPTED,READY_FOR_PICKUP',
    emptyLabel: 'No active orders',
    emptyDesc:  'Accepted orders will appear here.',
  },
  {
    id:         'completed',
    label:      'Completed',
    statuses:   'COMPLETED',
    emptyLabel: 'No completed orders',
    emptyDesc:  'Completed orders will appear here.',
  },
  {
    id:         'rejected',
    label:      'Rejected / Cancelled',
    statuses:   'REJECTED,CANCELLED',
    emptyLabel: 'No rejected orders',
    emptyDesc:  'Rejected and cancelled orders will appear here.',
  },
];

const PAGE_SIZE = 20;

export function useOrdersPage() {
  const navigate = useNavigate();
  const clearNewOrderCount = useNotificationStore((s) => s.clearNewOrderCount);
  const clearLastOrderUpdate = useNotificationStore((s) => s.clearLastOrderUpdate);
  const newOrderCount = useNotificationStore((s) => s.newOrderCount);
  const lastOrderUpdate = useNotificationStore((s) => s.lastOrderUpdate);

  const branchContext = useAuthStore(selectBranchContext);
  const setBranch = useAuthStore((s) => s.setBranch);

  // Set 'all' as the default active tab
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [rejectModal, setRejectModal] = useState({ open: false, orderId: null });

  const prevOrderCount = useRef(newOrderCount);

  useEffect(() => {
    clearNewOrderCount();
  }, [clearNewOrderCount]);

  const fetchOrders = useCallback(async (tabId = activeTab, pageNum = 1) => {
    const tab = ORDER_TABS.find((t) => t.id === tabId);
    if (!tab) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await ordersAPI.getOrders({
        status: tab.statuses,
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (res.success) {
        setOrders(res.data.orders);
        setPage(res.data.meta.page);
        setTotalPages(res.data.meta.total_pages);
        setTotal(res.data.meta.total);
      }
    } catch (err) {
      setError('Failed to load orders');
      console.error('[OrdersPage] fetchOrders error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders(activeTab, 1);
  }, [activeTab]);

  useEffect(() => {
    if (newOrderCount > prevOrderCount.current) {
      if (activeTab === 'new') fetchOrders('new', 1);
      if (activeTab === 'all') fetchOrders('all', 1);
      prevOrderCount.current = newOrderCount;
    }
  }, [newOrderCount, activeTab, fetchOrders]);

  useEffect(() => {
    if (!lastOrderUpdate) return;

    fetchOrders(activeTab, page);

    if (selectedOrderId && selectedOrderId === lastOrderUpdate.order_id) {
      handleSelectOrder(lastOrderUpdate.order_id);
    }

    clearLastOrderUpdate();
  }, [lastOrderUpdate, activeTab, page, selectedOrderId]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSelectedOrderId(null);
    setOrderDetail(null);
    setPage(1);
  }, []);

  const handleSelectOrder = useCallback(async (orderId) => {
    setSelectedOrderId(orderId);
    setOrderDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);

    try {
      const res = await ordersAPI.getOrderDetail(orderId);
      if (res.success) setOrderDetail(res.data);
    } catch (err) {
      setDetailError('Failed to load order details');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrderId(null);
    setOrderDetail(null);
    setDetailError(null);
  }, []);

  // ── Navigate to billing page — auto-switch branch if needed ──
  const handleAccept = useCallback(async (orderId) => {
    const orderBranchId = orderDetail?.branch_id;

    if (orderBranchId && branchContext.branch_id !== orderBranchId) {
      try {
        setActionLoading(true);
        const res = await switchBranch(orderBranchId);
        if (res.success) {
          setBranch(orderBranchId, res.data.branch_name);
        }
      } catch (err) {
        console.error('[OrdersPage] Auto-switch branch failed:', err);
        setActionError('Failed to switch to the order branch. Please select it manually.');
        setActionLoading(false);
        return;
      } finally {
        setActionLoading(false);
      }
    }

    navigate(`/erp/sales-billing?marketplace_order=${orderId}`);
  }, [navigate, orderDetail, branchContext.branch_id, setBranch]);

  const handleOpenReject = useCallback((orderId) => {
    setRejectModal({ open: true, orderId });
  }, []);

  const handleCloseReject = useCallback(() => {
    setRejectModal({ open: false, orderId: null });
    setActionError(null);
  }, []);

  const handleRejectSubmit = useCallback(async (reason, reasonOther) => {
    const { orderId } = rejectModal;
    if (!orderId) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await ordersAPI.rejectOrder(orderId, {
        rejection_reason: reason,
        rejection_reason_other: reasonOther || undefined,
      });
      if (res.success) {
        handleCloseReject();
        await fetchOrders(activeTab, page);
        if (selectedOrderId === orderId) handleCloseDetail();
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  }, [rejectModal, activeTab, page, selectedOrderId, fetchOrders, handleCloseDetail, handleCloseReject]);

  const handleMarkReady = useCallback(async (orderId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await ordersAPI.markReady(orderId);
      if (res.success) {
        await fetchOrders(activeTab, page);
        if (selectedOrderId === orderId) await handleSelectOrder(orderId);
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to update order');
    } finally {
      setActionLoading(false);
    }
  }, [activeTab, page, selectedOrderId, fetchOrders, handleSelectOrder]);

  const handleComplete = useCallback(async (orderId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await ordersAPI.completeOrder(orderId);
      if (res.success) {
        await fetchOrders(activeTab, page);
        if (selectedOrderId === orderId) handleCloseDetail();
      }
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Failed to complete order');
    } finally {
      setActionLoading(false);
    }
  }, [activeTab, page, selectedOrderId, fetchOrders, handleCloseDetail]);

  const handleGetPrescriptionUrl = useCallback(async (orderId, prescriptionId) => {
    try {
      const res = await ordersAPI.getPrescriptionUrl(orderId, prescriptionId);
      return res.data?.url || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const handleRefresh = useCallback(() => fetchOrders(activeTab, page), [activeTab, page, fetchOrders]);

  const handlePageChange = useCallback((newPage) => fetchOrders(activeTab, newPage), [activeTab, fetchOrders]);

  return {
    activeTab,
    onTabChange: handleTabChange,

    orders,
    isLoading,
    error,
    page,
    totalPages,
    total,
    PAGE_SIZE,
    onPageChange: handlePageChange,
    onRefresh: handleRefresh,

    selectedOrderId,
    orderDetail,
    isDetailLoading,
    detailError,
    onSelectOrder: handleSelectOrder,
    onCloseDetail: handleCloseDetail,

    actionLoading,
    actionError,
    onAccept: handleAccept,
    onMarkReady: handleMarkReady,
    onComplete: handleComplete,
    onGetPrescriptionUrl: handleGetPrescriptionUrl,

    rejectModal,
    onOpenReject: handleOpenReject,
    onCloseReject: handleCloseReject,
    onRejectSubmit: handleRejectSubmit,
  };
}