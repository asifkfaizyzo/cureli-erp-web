// cadmin-web/src/hooks/useSSENotifications.js (do not remove this comment)

import { useEffect, useRef } from 'react';
import { useCAdminNotificationStore } from '../store/useCAdminNotificationStore';
import useOrderAlertStore from '../store/useOrderAlertStore';

export const useSSENotifications = () => {
  const receiveSSE = useCAdminNotificationStore((s) => s.receiveSSENotification);
  const onNewOrderSSE = useOrderAlertStore((s) => s.onNewOrderSSE);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

    const connect = () => {
      const token = localStorage.getItem('cadmin_access_token');
      if (!token) return;

      const url = `${import.meta.env.VITE_API_URL}/cadmin/notifications/stream?token=${token}`;
      
      // FIXED: Added { withCredentials: true } to forward secure cookies alongside headers
      const es = new EventSource(url, { withCredentials: true });

      es.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        useCAdminNotificationStore.setState({ unreadCount: data.unread_count });
      });

      es.addEventListener('new_notification', (e) => {
        receiveSSE(JSON.parse(e.data));
      });

      // Handle a new order arriving at a shop
      es.addEventListener('marketplace_new_order', (e) => {
        onNewOrderSSE();
        // Notify any active view listening for table updates
        window.dispatchEvent(new CustomEvent('sse-marketplace-new-order'));
      });

      // Handle status modifications (ERP updates, etc.)
      es.addEventListener('marketplace_order_status_changed', (e) => {
        window.dispatchEvent(new CustomEvent('sse-marketplace-order-status-changed'));
      });

      // Handle delivery status updates (rider accepts, arrives, delivers, etc.)
      es.addEventListener('delivery_status_changed', (e) => {
        window.dispatchEvent(new CustomEvent('sse-delivery-status-changed'));
      });

      es.onerror = () => {
        es.close();
        // Retry connection after 5 seconds if connection drops
        reconnectTimeout = setTimeout(connect, 5000);
      };

      eventSourceRef.current = es;
    };

    connect();

    const handleStorage = (e) => {
      if (e.key === 'cadmin_access_token') {
        eventSourceRef.current?.close();
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (e.newValue) connect();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSourceRef.current?.close();
    };
  }, [receiveSSE, onNewOrderSSE]);

  return null;
};