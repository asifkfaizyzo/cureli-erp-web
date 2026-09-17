import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import orderAlertAudio from '../utils/orderAlertAudio';

const useOrderAlertStore = create(
  devtools(
    (set, get) => ({
      newOrderCount: 0,
      isAlertActive: false,

      /**
       * Triggered on SSE 'marketplace_new_order' broadcast.
       * Increments order counts, shows banner, and loops the alarm.
       */
      onNewOrderSSE: () => {
        set((state) => ({
          newOrderCount: state.newOrderCount + 1,
          isAlertActive: true,
        }));
        orderAlertAudio.start();
      },

      /**
       * Resets state and stops playback immediately.
       */
      dismissAlert: () => {
        set({
          newOrderCount: 0,
          isAlertActive: false,
        });
        orderAlertAudio.stop();
      },
    }),
    { name: 'cadmin-order-alert-store' }
  )
);

export default useOrderAlertStore;