// pharmacy-web/src/store/usePrescriptionRequestAlertStore.js (do not remove this comment)
// pharmacy-web/src/store/usePrescriptionRequestAlertStore.js
//
// Tracks incoming prescription requests for the pharmacy.
// Now supports per-request muting:
//   - mutedRequestIds: { [recipient_id]: true }
//   - When all unmuted requests are gone → prescription audio stops
//   - Muting never affects order audio

import { create }                from 'zustand';
import { devtools }              from 'zustand/middleware';
import { prescriptionAlertAudio } from '../utils/orderAlertAudio';

const usePrescriptionRequestAlertStore = create(
  devtools(
    (set, get) => ({
      // { [recipient_id]: true } — requests awaiting pharmacy action this session
      pendingRequestIds: {},

      // { [recipient_id]: true } — requests the pharmacist has muted
      mutedRequestIds: {},

      // API-fetched count for refresh recovery (same pattern as order alert store)
      // -1 = not yet fetched
      refreshCount: -1,

      // ── Actions ────────────────────────────────────────────────────────────

      /**
       * Called when prescription_request_new SSE fires.
       * Starts prescription audio if there are unmuted pending requests
       * and audio isn't already playing.
       */
      addPendingRequest: (recipientId) => {
        if (!recipientId) return;

        set((state) => ({
          pendingRequestIds: { ...state.pendingRequestIds, [recipientId]: true },
          // New requests are always unmuted — do NOT add to mutedRequestIds
        }));

        // Recalculate whether we should be playing audio
        get()._syncAudio();
      },

      /**
       * Called when a prescription request is resolved
       * (quote sent → accepted → converted, or declined, or expired).
       * Cleans up both pending and muted registries.
       */
      resolvePendingRequest: (recipientId) => {
        if (!recipientId) return;

        set((state) => {
          const nextPending = { ...state.pendingRequestIds };
          delete nextPending[recipientId];

          const nextMuted = { ...state.mutedRequestIds };
          delete nextMuted[recipientId];

          const newRefreshCount =
            state.refreshCount > 0 ? state.refreshCount - 1 : state.refreshCount;

          return {
            pendingRequestIds: nextPending,
            mutedRequestIds:   nextMuted,
            refreshCount:      newRefreshCount,
          };
        });

        // Recalculate audio
        get()._syncAudio();
      },

      /**
       * Mute a specific request — pharmacist doesn't want to hear
       * the alert for this particular request any more.
       */
      muteRequest: (recipientId) => {
        if (!recipientId) return;

        set((state) => ({
          mutedRequestIds: { ...state.mutedRequestIds, [recipientId]: true },
        }));

        // Recalculate — may need to stop audio if this was the last unmuted
        get()._syncAudio();
      },

      /**
       * Unmute a specific request — restore alert for it.
       */
      unmuteRequest: (recipientId) => {
        if (!recipientId) return;

        set((state) => {
          const next = { ...state.mutedRequestIds };
          delete next[recipientId];
          return { mutedRequestIds: next };
        });

        // Recalculate — may need to start audio
        get()._syncAudio();
      },

      /**
       * Check if a specific request is muted.
       */
      isRequestMuted: (recipientId) => {
        return get().mutedRequestIds[recipientId] === true;
      },

      setRefreshCount: (count) => set({ refreshCount: count }),

      getBannerCount: () => {
        const { pendingRequestIds, refreshCount } = get();
        const sseCount = Object.keys(pendingRequestIds).length;
        return Math.max(sseCount, refreshCount > 0 ? refreshCount : 0);
      },

      isBannerVisible: () => {
        const { pendingRequestIds, refreshCount } = get();
        const sseCount = Object.keys(pendingRequestIds).length;
        return sseCount > 0 || refreshCount > 0;
      },

      // ── Internal: sync audio state ─────────────────────────────────────

      /**
       * Determines whether prescription audio should be playing.
       * Audio plays when there is at least 1 pending request that is NOT muted.
       * Audio stops when all pending requests are muted or there are none.
       */
      _syncAudio: () => {
        const { pendingRequestIds, mutedRequestIds } = get();
        const pendingIds = Object.keys(pendingRequestIds);

        // Count unmuted pending requests
        const unmutedCount = pendingIds.filter(
          (id) => !mutedRequestIds[id],
        ).length;

        if (unmutedCount > 0) {
          prescriptionAlertAudio.start();
        } else {
          prescriptionAlertAudio.stop();
        }
      },
    }),
    { name: 'prescription-request-alert-store' },
  ),
);

export default usePrescriptionRequestAlertStore;