// pharmacy-web/src/hooks/useSSENotifications.js (do not remove this comment)
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

  // Store actions in a stable mutable reference to prevent re-triggering connection
  const refs = useRef({
    receiveSSE,
    receiveNewOrder,
    receiveStatusChange,
    addPendingOrder,
    resolvePendingOrder,
    addPendingRequest,
  });

  // Keep references in sync with any component updates
  useEffect(() => {
    refs.current = {
      receiveSSE,
      receiveNewOrder,
      receiveStatusChange,
      addPendingOrder,
      resolvePendingOrder,
      addPendingRequest,
    };
  }, [
    receiveSSE,
    receiveNewOrder,
    receiveStatusChange,
    addPendingOrder,
    resolvePendingOrder,
    addPendingRequest,
  ]);

  const eventSourceRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn("⚠️ [SSE Client] Authentication token missing in storage. Postponing registration.");
        return;
      }

      console.log("🔌 [SSE Client] Initializing real-time stream connection...");
      const url = `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`;
      const es  = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('connected', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`💚 [SSE Client] Connected to event pool. Total Unread notifications: ${data.unread_count}`);
          useNotificationStore.setState({ unreadCount: data.unread_count });
        } catch (err) {
          console.error("❌ [SSE Client] Failed parsing handshake event data:", err);
        }
      });

      es.addEventListener('new_notification', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("🔔 [SSE Event] New notification arrived:", data);
          refs.current.receiveSSE?.(data);
        } catch (err) {
          console.error("❌ [SSE Event] Failed parsing notification data:", err);
        }
      });

      es.addEventListener('marketplace_new_order', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("🛍️ [SSE Event] Incoming marketplace order:", data);
          refs.current.receiveNewOrder?.(data);
          if (data.order_id) refs.current.addPendingOrder?.(data.order_id);
        } catch (err) {
          console.error("❌ [SSE Event] Failed parsing new order payload:", err);
        }
      });

      es.addEventListener('marketplace_order_status_changed', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`📦 [SSE Event] Order ${data.order_number} shifted to state: ${data.new_status}`);
          refs.current.receiveStatusChange?.(data);
          if (data.order_id && RESOLVE_STATUSES.has(data.new_status)) {
            refs.current.resolvePendingOrder?.(data.order_id);
          }
        } catch (err) {
          console.error("❌ [SSE Event] Failed parsing status progression payload:", err);
        }
      });

      es.addEventListener('prescription_request_new', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("📄 [SSE Event] Incoming prescription request quote:", data);
          if (data.recipient_id) {
            refs.current.addPendingRequest?.(data.recipient_id);
          }
        } catch (err) {
          console.error("❌ [SSE Event] Failed parsing prescription request:", err);
        }
      });

      es.onerror = (err) => {
        console.error("🚨 [SSE Client] Connection dropped or blocked. Retrying connection in 5000ms...", err);
        es.close();
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    const handleStorage = (e) => {
      if (e.key === 'access_token') {
        console.log("🔑 [SSE Client] Auth state adjustment detected. Regenerating stream handler...");
        eventSourceRef.current?.close();
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (e.newValue) connect();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      console.log("🔌 [SSE Client] Cleaning up resources. Terminating active stream.");
      window.removeEventListener('storage', handleStorage);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSourceRef.current?.close();
    };
  }, []); // Strictly isolated dependency array

  return null;
};