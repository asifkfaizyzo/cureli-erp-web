// pharmacy-web/src/store/useOrderAlertStore.js (do not remove this comment)
// pharmacy-web/src/store/useOrderAlertStore.js
// Order alerts are fully independent from prescription alerts now.
// Each has its own audio instance.

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import orderAlertAudio from '../utils/orderAlertAudio';

const useOrderAlertStore = create(
  devtools(
    (set, get) => ({
      // { [order_id]: true } — orders awaiting pharmacy action this session
      pendingOrderIds: {},

      // Count fetched from API on mount (refresh recovery for banner only).
      // -1 = not yet fetched, 0 = none, N = count
      refreshCount: -1,

      // ── Actions ──────────────────────────────────────────────────────────

      /**
       * Called when marketplace_new_order SSE fires.
       * If this is the first pending order, starts the audio loop.
       */
      addPendingOrder: (orderId) => {
        if (!orderId) return;

        const prevCount = Object.keys(get().pendingOrderIds).length;

        set((state) => ({
          pendingOrderIds: { ...state.pendingOrderIds, [orderId]: true },
        }));

        // Start audio only when transitioning from 0 → 1
        if (prevCount === 0) {
          orderAlertAudio.start();
        }
      },

      /**
       * Called when marketplace_order_status_changed SSE fires with
       * new_status of ACCEPTED, REJECTED, or CANCELLED.
       */
      resolvePendingOrder: (orderId) => {
        if (!orderId) return;

        set((state) => {
          const next = { ...state.pendingOrderIds };
          delete next[orderId];

          const newRefreshCount = state.refreshCount > 0
            ? state.refreshCount - 1
            : state.refreshCount;

          return {
            pendingOrderIds: next,
            refreshCount: newRefreshCount,
          };
        });

        // Stop audio when no more SSE-tracked orders are pending
        const remaining = Object.keys(get().pendingOrderIds).length;
        if (remaining === 0) {
          orderAlertAudio.stop();
        }
      },

      /**
       * Called by NewOrderBanner on mount to store the API-fetched count.
       */
      setRefreshCount: (count) => {
        set({ refreshCount: count });
      },

      // ── Derived helpers ───────────────────────────────────────────────────

      getBannerCount: () => {
        const { pendingOrderIds, refreshCount } = get();
        const sseCount = Object.keys(pendingOrderIds).length;
        return Math.max(sseCount, refreshCount > 0 ? refreshCount : 0);
      },

      isBannerVisible: () => {
        const { pendingOrderIds, refreshCount } = get();
        const sseCount = Object.keys(pendingOrderIds).length;
        return sseCount > 0 || refreshCount > 0;
      },
    }),
    { name: 'order-alert-store' },
  ),
);

export default useOrderAlertStore;