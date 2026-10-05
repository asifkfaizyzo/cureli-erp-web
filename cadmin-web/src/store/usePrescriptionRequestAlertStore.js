//cadmin-web\src\store\usePrescriptionRequestAlertStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import orderAlertAudio from '../utils/orderAlertAudio';

const usePrescriptionRequestAlertStore = create(
  devtools(
    (set, get) => ({
      newRequestCount: 0,
      isAlertActive: false,

      /**
       * Triggered on SSE 'prescription_request_new' broadcast.
       * Increments count, shows banner, and loops the alarm.
       */
      onNewPrescriptionRequestSSE: () => {
        set((state) => ({
          newRequestCount: state.newRequestCount + 1,
          isAlertActive: true,
        }));
        orderAlertAudio.start();
      },

      /**
       * Resets state and stops playback immediately.
       */
      dismissAlert: () => {
        set({
          newRequestCount: 0,
          isAlertActive: false,
        });
        orderAlertAudio.stop();
      },
    }),
    { name: 'cadmin-prescription-request-alert-store' }
  )
);

export default usePrescriptionRequestAlertStore;