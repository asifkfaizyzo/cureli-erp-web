// pharmacy-web/src/hooks/marketplace/useDashboard.js (do not remove this comment)
// src/hooks/marketplace/useDashboard.js

import { useState, useEffect, useCallback, useRef } from 'react';
import marketplaceDashboardAPI from '../../api/marketplaceDashboard';
import { useNotificationStore } from '../../store/useNotificationStore';

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA
// Fallback when backend endpoint is not yet live (404) or during development.
// Remove the fallback block in useDashboard once the real endpoint is stable.
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_DATA = {
  overview: {
    marketplace_status:   'LIVE',
    is_live:              true,
    onboarding_completed: true,
    storefront_name:      'Cureli Pharmacy',
    support_phone:        '9876543210',
    logo_url:             null,
    banner_url:           null,
    enabled_branches:     2,
    total_branches:       3,
  },
  kpis: {
    pending_action:    4,
    ready_for_pickup:  2,
    completed_total:   58,
    rejected_total:    5,
    cancelled_total:   3,
    orders_today:      12,
    order_value_today: 4200,
    order_value_total: 25430,
  },
  order_status_counts: {
    PLACED:           4,
    ACCEPTED:         3,
    READY_FOR_PICKUP: 2,
    COMPLETED:        58,
    REJECTED:         5,
    CANCELLED:        3,
  },
  listings: {
    total_linked:          420,
    live:                  350,
    hidden:                40,
    out_of_stock:          30,
    low_stock:             22,
    requires_prescription: 74,
  },
  branches: [
    {
      branch_id:             'branch-1',
      branch_name:           'Main Branch',
      marketplace_enabled:   true,
      has_location:          true,
      pickup_enabled:        true,
      delivery_enabled:      false,
      is_24_hours:           false,
      opening_time:          '09:00',
      closing_time:          '21:00',
      live_listings:         120,
      hidden_listings:       10,
      out_of_stock_listings: 8,
      total_listings:        138,
      pending_orders:        2,
      completed_orders:      20,
      order_value_total:     9000,
    },
    {
      branch_id:             'branch-2',
      branch_name:           'West Side Branch',
      marketplace_enabled:   true,
      has_location:          true,
      pickup_enabled:        true,
      delivery_enabled:      true,
      is_24_hours:           true,
      opening_time:          null,
      closing_time:          null,
      live_listings:         230,
      hidden_listings:       30,
      out_of_stock_listings: 22,
      total_listings:        282,
      pending_orders:        2,
      completed_orders:      38,
      order_value_total:     16430,
    },
    {
      branch_id:             'branch-3',
      branch_name:           'Airport Road',
      marketplace_enabled:   false,
      has_location:          false,
      pickup_enabled:        false,
      delivery_enabled:      false,
      is_24_hours:           false,
      opening_time:          null,
      closing_time:          null,
      live_listings:         0,
      hidden_listings:       0,
      out_of_stock_listings: 0,
      total_listings:        0,
      pending_orders:        0,
      completed_orders:      0,
      order_value_total:     0,
    },
  ],
  recent_orders: [
    {
      order_id:              'ord-1',
      order_number:          'MKT-000042',
      status:                'PLACED',
      customer_name:         'Ravi Kumar',
      total_amount:          340,
      item_count:            3,
      requires_prescription: false,
      placed_at:             new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      branch_name:           'Main Branch',
    },
    {
      order_id:              'ord-2',
      order_number:          'MKT-000041',
      status:                'ACCEPTED',
      customer_name:         'Priya Sharma',
      total_amount:          820,
      item_count:            6,
      requires_prescription: true,
      placed_at:             new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      branch_name:           'West Side Branch',
    },
    {
      order_id:              'ord-3',
      order_number:          'MKT-000040',
      status:                'READY_FOR_PICKUP',
      customer_name:         'Arjun Mehta',
      total_amount:          215,
      item_count:            2,
      requires_prescription: false,
      placed_at:             new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      branch_name:           'Main Branch',
    },
    {
      order_id:              'ord-4',
      order_number:          'MKT-000039',
      status:                'COMPLETED',
      customer_name:         'Sunita Patel',
      total_amount:          560,
      item_count:            4,
      requires_prescription: false,
      placed_at:             new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      branch_name:           'West Side Branch',
    },
    {
      order_id:              'ord-5',
      order_number:          'MKT-000038',
      status:                'REJECTED',
      customer_name:         'Deepak Nair',
      total_amount:          190,
      item_count:            1,
      requires_prescription: true,
      placed_at:             new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      branch_name:           'Main Branch',
    },
  ],
  trend_7d: [
    { date: '2025-06-01', order_count: 8,  order_value: 3200 },
    { date: '2025-06-02', order_count: 11, order_value: 4100 },
    { date: '2025-06-03', order_count: 6,  order_value: 2400 },
    { date: '2025-06-04', order_count: 14, order_value: 5600 },
    { date: '2025-06-05', order_count: 9,  order_value: 3800 },
    { date: '2025-06-06', order_count: 12, order_value: 4200 },
    { date: '2025-06-07', order_count: 7,  order_value: 2900 },
  ],
  alerts: [
    {
      type:    'warning',
      code:    'ORDERS_PENDING',
      message: '4 orders are waiting for your action.',
    },
    {
      type:    'warning',
      code:    'OUT_OF_STOCK',
      message: '30 listed medicines are out of stock.',
    },
    {
      type:    'info',
      code:    'LOW_STOCK',
      message: '22 medicines are running low (≤10 units).',
    },
    {
      type:    'info',
      code:    'BRANCH_DISABLED',
      message: '1 branch is not enabled for marketplace.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// POLL INTERVAL
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 60 seconds

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useDashboard
 *
 * Fetches and maintains marketplace dashboard data.
 *
 * Refresh strategy:
 *   - Full data: polled every 60 seconds + manual refresh trigger
 *   - pending_action / orders_today / PLACED count: also updated immediately
 *     via newOrderCount changes from useNotificationStore (SSE-driven)
 *
 * Fallback:
 *   - If the API returns 404 or any error on first load, dummy data is used.
 *   - Subsequent refreshes silently keep the last known good data on error.
 */
export function useDashboard() {
  const [data, setData]                 = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError]               = useState(null);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [usingDummy, setUsingDummy]     = useState(false);

  // Track whether the component is still mounted to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Fetch function ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async (isManual = false) => {
    if (!mountedRef.current) return;

    // Use isRefreshing for manual/poll refreshes so skeleton does not re-show
    if (isManual) {
      setIsRefreshing(true);
    }

    try {
      const response = await marketplaceDashboardAPI.getDashboard();
      const payload  = response.data?.data;

      if (!mountedRef.current) return;

      setData(payload);
      setError(null);
      setUsingDummy(false);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;

      const status = err?.response?.status;

      if (!data) {
        // First load failure — fall back to dummy so UI is never blank
        console.warn('[useDashboard] API unavailable, using dummy data:', err.message);
        setData(DUMMY_DATA);
        setUsingDummy(true);
        setError(null);
      } else if (status !== 404) {
        // Subsequent failure — keep last known good data, surface error softly
        setError('Dashboard refresh failed. Showing last known data.');
      }
      // 404 on refresh: silently ignore — endpoint may be deploying
    } finally {
      if (!mountedRef.current) return;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [data]);

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsLoading(true);
    fetchData(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 60-second polling ───────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchData]);

  // ── SSE: live KPI update via notification store ─────────────────────────────
  // useSSENotifications returns null so we cannot destructure lastEvent from it.
  // Instead we subscribe to newOrderCount in useNotificationStore which is
  // incremented by the SSE layer whenever a new_order event arrives.
  // We compare against the previous value to calculate how many new orders
  // arrived since the last render and patch local state immediately.

  const newOrderCount    = useNotificationStore((s) => s.newOrderCount);
  const prevOrderCountRef = useRef(0);

  useEffect(() => {
    // Detect when newOrderCount increases — means a new order arrived via SSE
    if (newOrderCount > prevOrderCountRef.current && data) {
      const diff = newOrderCount - prevOrderCountRef.current;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          kpis: {
            ...prev.kpis,
            pending_action: prev.kpis.pending_action + diff,
            orders_today:   prev.kpis.orders_today   + diff,
          },
          order_status_counts: {
            ...prev.order_status_counts,
            PLACED: prev.order_status_counts.PLACED + diff,
          },
          alerts: upsertPendingAlert(
            prev.alerts,
            prev.kpis.pending_action + diff,
          ),
        };
      });
    }

    prevOrderCountRef.current = newOrderCount;
  }, [newOrderCount, data]);

  // ── Manual refresh ──────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // ── Return ──────────────────────────────────────────────────────────────────

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    usingDummy,
    refresh,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * When a new order arrives via SSE, update or insert the ORDERS_PENDING alert
 * so the alerts panel reflects the new count immediately.
 */
function upsertPendingAlert(alerts, newCount) {
  const existing = alerts.find((a) => a.code === 'ORDERS_PENDING');
  const updated  = {
    type:    'warning',
    code:    'ORDERS_PENDING',
    message: `${newCount} order${newCount > 1 ? 's are' : ' is'} waiting for your action.`,
  };

  if (existing) {
    return alerts.map((a) => (a.code === 'ORDERS_PENDING' ? updated : a));
  }

  return [updated, ...alerts];
}