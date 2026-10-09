// pharmacy-web/src/hooks/marketplace/usePayoutsPage.js

import { useState, useEffect, useCallback } from "react";
import {
  getCurrentWeekPayout,
  getPayoutHistory,
  getPayoutDetail,
} from "../../api/marketplacePayouts";
import { useToast } from "../../components/common/Toast";

const PAGE_SIZE = 10;

export function usePayoutsPage() {
  const toast = useToast();

  const [currentWeek, setCurrentWeek] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Detail Modal management
  const [detailModal, setDetailModal] = useState({
    open: false,
    payoutId: null,
    data: null,
    loading: false,
    error: null,
  });

  const loadCurrentWeek = useCallback(async () => {
    try {
      const resp = await getCurrentWeekPayout();
      if (resp.success) {
        setCurrentWeek(resp.data);
      }
    } catch (err) {
      console.error("[usePayoutsPage] loadCurrentWeek error:", err);
    }
  }, []);

  const loadHistory = useCallback(async (pageNum = 1) => {
    setHistoryLoading(true);
    try {
      const resp = await getPayoutHistory({ page: pageNum, limit: PAGE_SIZE });
      if (resp.success) {
        setHistory(resp.data.payouts || []);
        setPagination({
          page: resp.data.pagination.page,
          totalPages: resp.data.pagination.totalPages,
          total: resp.data.pagination.total,
        });
      }
    } catch (err) {
      console.error("[usePayoutsPage] loadHistory error:", err);
      toast.error("Error", "Could not load payout history");
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  const loadDetail = useCallback(async (payoutId) => {
    setDetailModal((prev) => ({ ...prev, open: true, payoutId, data: null, loading: true, error: null }));
    try {
      const resp = await getPayoutDetail(payoutId);
      if (resp.success) {
        setDetailModal((prev) => ({ ...prev, data: resp.data, loading: false }));
      }
    } catch (err) {
      console.error("[usePayoutsPage] loadDetail error:", err);
      toast.error("Error", "Could not load settlement details");
      setDetailModal((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to retrieve settlement information.",
      }));
    }
  }, [toast]);

  const closeDetail = useCallback(() => {
    setDetailModal({
      open: false,
      payoutId: null,
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCurrentWeek(), loadHistory(1)]);
    setLoading(false);
  }, [loadCurrentWeek, loadHistory]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadCurrentWeek(), loadHistory(1)]);
      setLoading(false);
    };
    init();
  }, [loadCurrentWeek, loadHistory]);

  return {
    currentWeek,
    history,
    pagination,
    loading,
    historyLoading,
    detailModal,
    onSelectPayout: loadDetail,
    onCloseDetail: closeDetail,
    onPageChange: loadHistory,
    onRefresh: handleRefresh,
  };
}