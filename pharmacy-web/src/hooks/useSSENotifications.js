// pharmacy-web/src/hooks/useSSENotifications.js (do not remove this comment)
// pharmacy-web/src/hooks/useSSENotifications.js

import { useEffect, useRef }            from 'react';
import { useNotificationStore }         from '../store/useNotificationStore';
import useOrderAlertStore               from '../store/useOrderAlertStore';
import usePrescriptionRequestAlertStore from '../store/usePrescriptionRequestAlertStore';

const RESOLVE_STATUSES = new Set(['ACCEPTED', 'REJECTED', 'CANCELLED']);

export const useSSENotifications = () => {
  const receiveSSE          = useNotificationStore((s) => s.receiveSSENotification);
  const receiveNewOrder     = useNotificationStore((s) => s.receiveNewOrderSSE);
  const receiveStatusChange = useNotificationStore((s) => s.receiveOrderStatusChangeSSE);

  const addPendingOrder     = useOrderAlertStore((s) => s.addPendingOrder);
  const resolvePendingOrder = useOrderAlertStore((s) => s.resolvePendingOrder);

  const addPendingRequest   = usePrescriptionRequestAlertStore((s) => s.addPendingRequest);

  const eventSourceRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`;
      const es  = new EventSource(url);

      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        useNotificationStore.setState({ unreadCount: data.unread_count });
      });

      es.addEventListener('new_notification', (e) => {
        receiveSSE(JSON.parse(e.data));
      });

      es.addEventListener('marketplace_new_order', (e) => {
        const data = JSON.parse(e.data);
        receiveNewOrder(data);
        if (data.order_id) addPendingOrder(data.order_id);
      });

      es.addEventListener('marketplace_order_status_changed', (e) => {
        const data = JSON.parse(e.data);
        receiveStatusChange(data);
        if (data.order_id && RESOLVE_STATUSES.has(data.new_status)) {
          resolvePendingOrder(data.order_id);
        }
      });

      // ── Prescription request arrived at this branch ────────────────────
      es.addEventListener('prescription_request_new', (e) => {
        const data = JSON.parse(e.data);
        if (data.recipient_id) {
          addPendingRequest(data.recipient_id);
        }
      });

      es.onerror = () => es.close();
      eventSourceRef.current = es;
    };

    connect();

    const handleStorage = (e) => {
      if (e.key === 'access_token') {
        eventSourceRef.current?.close();
        if (e.newValue) connect();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      eventSourceRef.current?.close();
    };
  }, [
    receiveSSE,
    receiveNewOrder,
    receiveStatusChange,
    addPendingOrder,
    resolvePendingOrder,
    addPendingRequest,
  ]);

  return null;
};