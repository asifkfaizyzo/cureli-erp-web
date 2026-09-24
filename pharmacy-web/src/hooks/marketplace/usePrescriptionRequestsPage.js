// pharmacy-web/src/hooks/marketplace/usePrescriptionRequestsPage.js (do not remove this comment)
// pharmacy-web/src/hooks/marketplace/usePrescriptionRequestsPage.js

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getErpRequests,
  getErpRequestDetail,
  getPrescriptionFileUrl,
  submitQuote,
  declineRequest,
} from '../../api/prescriptionRequests';
import usePrescriptionRequestAlertStore from '../../store/usePrescriptionRequestAlertStore';

// Tab definitions for prescription requests
export const REQUEST_TABS = [
  {
    id:         'SENT',
    label:      'New Requests',
    emptyLabel: 'No new requests',
    emptyDesc:  'New prescription requests will appear here',
  },
  {
    id:         'QUOTE_SENT',
    label:      'Quoted',
    emptyLabel: 'No quoted requests',
    emptyDesc:  'Requests you have sent quotes for will appear here',
  },
  {
    id:         'ACCEPTED',
    label:      'Accepted',
    emptyLabel: 'No accepted quotes',
    emptyDesc:  'Requests where your quote was accepted will appear here',
  },
  {
    id:         'all',
    label:      'All',
    emptyLabel: 'No requests',
    emptyDesc:  'All prescription requests will appear here',
  },
];

export function usePrescriptionRequestsPage() {
  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState('SENT');

  // ── List state ────────────────────────────────────────────────────────────
  const [recipients, setRecipients]     = useState([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState(null);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  // ── Detail state ──────────────────────────────────────────────────────────
  const [selectedId, setSelectedId]     = useState(null);
  const [detail, setDetail]             = useState(null);
  const [isDetailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]   = useState(null);

  // ── Action state ──────────────────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState(null);

  // ── Decline modal ─────────────────────────────────────────────────────────
  const [declineModal, setDeclineModal] = useState({ open: false, recipientId: null });

  // ── Alert store ───────────────────────────────────────────────────────────
  const resolvePendingRequest = usePrescriptionRequestAlertStore(
    (s) => s.resolvePendingRequest,
  );
  const muteRequest = usePrescriptionRequestAlertStore(
    (s) => s.muteRequest,
  );
  const unmuteRequest = usePrescriptionRequestAlertStore(
    (s) => s.unmuteRequest,
  );
  const mutedRequestIds = usePrescriptionRequestAlertStore(
    (s) => s.mutedRequestIds,
  );
  const pendingRequestIds = usePrescriptionRequestAlertStore(
    (s) => s.pendingRequestIds,
  );

  // ── SSE refresh trigger ───────────────────────────────────────────────────
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshTrigger((n) => n + 1), []);

  const refreshRef = useRef(triggerRefresh);
  refreshRef.current = triggerRefresh;

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchList = useCallback(async (tab, pageNum) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page:  pageNum,
        limit: 20,
        ...(tab !== 'all' ? { status: tab } : {}),
      };

      const res = await getErpRequests(params);

      if (res.success) {
        setRecipients(res.data.recipients);
        setTotal(res.data.meta.total);
        setTotalPages(res.data.meta.total_pages);
      } else {
        setError('Failed to load prescription requests');
      }
    } catch {
      setError('Failed to load prescription requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on tab change, page change, or SSE refresh
  useEffect(() => {
    fetchList(activeTab, page);
  }, [activeTab, page, refreshTrigger, fetchList]);

  // ── Fetch detail ──────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (recipientId) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const res = await getErpRequestDetail(recipientId);
      if (res.success) {
        setDetail(res.data);
      } else {
        setDetailError('Failed to load request detail');
      }
    } catch {
      setDetailError('Failed to load request detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Fetch detail when selection changes
  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const onTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedId(null);
    setDetail(null);
  }, []);

  const onSelectRequest = useCallback((recipientId) => {
    setSelectedId(recipientId);
    setActionError(null);
  }, []);

  const onCloseDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
  }, []);

  const onPageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const onRefresh = useCallback(() => {
    fetchList(activeTab, page);
  }, [activeTab, page, fetchList]);

  // ── Get prescription file signed URL ──────────────────────────────────────
  const onGetFileUrl = useCallback(async (recipientId, fileId) => {
    try {
      const res = await getPrescriptionFileUrl(recipientId, fileId);
      return res.success ? res.data.url : null;
    } catch {
      return null;
    }
  }, []);

  // ── Submit quote ──────────────────────────────────────────────────────────
  const onSubmitQuote = useCallback(async (recipientId, items) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await submitQuote(recipientId, { items });

      if (res.success) {
        await fetchDetail(recipientId);
        fetchList(activeTab, page);
        resolvePendingRequest(recipientId);
        return true;
      } else {
        setActionError(res.message ?? 'Failed to submit quote');
        return false;
      }
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Failed to submit quote');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [activeTab, page, fetchDetail, fetchList, resolvePendingRequest]);

  // ── Mute / unmute handlers ────────────────────────────────────────────────
  const onMuteRequest = useCallback((recipientId) => {
    muteRequest(recipientId);
  }, [muteRequest]);

  const onUnmuteRequest = useCallback((recipientId) => {
    unmuteRequest(recipientId);
  }, [unmuteRequest]);

  // ── Open / close decline modal ────────────────────────────────────────────
  const onOpenDecline = useCallback((recipientId) => {
    setDeclineModal({ open: true, recipientId });
  }, []);

  const onCloseDecline = useCallback(() => {
    setDeclineModal({ open: false, recipientId: null });
  }, []);

  // ── Submit decline ────────────────────────────────────────────────────────
  const onDeclineSubmit = useCallback(async (reason) => {
    const { recipientId } = declineModal;
    if (!recipientId) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const res = await declineRequest(recipientId, { reason });

      if (res.success) {
        setDeclineModal({ open: false, recipientId: null });
        setSelectedId(null);
        setDetail(null);
        fetchList(activeTab, page);
        resolvePendingRequest(recipientId);
      } else {
        setActionError(res.message ?? 'Failed to decline request');
      }
    } catch (err) {
      setActionError(err?.response?.data?.message ?? 'Failed to decline request');
    } finally {
      setActionLoading(false);
    }
  }, [declineModal, activeTab, page, fetchList, resolvePendingRequest]);

  return {
    // Tab
    activeTab,
    onTabChange,

    // List
    recipients,
    isLoading,
    error,
    page,
    totalPages,
    total,
    onPageChange,
    onRefresh,
    triggerRefresh,

    // Detail
    selectedId,
    detail,
    isDetailLoading,
    detailError,
    onSelectRequest,
    onCloseDetail,

    // Actions
    actionLoading,
    actionError,
    onGetFileUrl,
    onSubmitQuote,

    // Mute
    mutedRequestIds,
    pendingRequestIds,
    onMuteRequest,
    onUnmuteRequest,

    // Decline modal
    declineModal,
    onOpenDecline,
    onCloseDecline,
    onDeclineSubmit,
  };
}