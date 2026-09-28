// cadmin-web/src/hooks/useSSENotifications.js (do not remove this comment)
import { useEffect, useRef } from 'react';
import { useCAdminNotificationStore } from '../store/useCAdminNotificationStore';
import useOrderAlertStore from '../store/useOrderAlertStore';

export const useSSENotifications = () => {
  const receiveSSE = useCAdminNotificationStore((s) => s.receiveSSENotification);
  const onNewOrderSSE = useOrderAlertStore((s) => s.onNewOrderSSE);
  
  const receiveSSERef = useRef(receiveSSE);
  const onNewOrderSSERef = useRef(onNewOrderSSE);

  useEffect(() => {
    receiveSSERef.current = receiveSSE;
    onNewOrderSSERef.current = onNewOrderSSE;
  }, [receiveSSE, onNewOrderSSE]);

  const eventSourceRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

    const connect = () => {
      const token = localStorage.getItem('cadmin_access_token');
      if (!token) {
        console.warn("⚠️ [CAdmin SSE] Missing cadmin_access_token. Postponing registration.");
        return;
      }

      console.log("🔌 [CAdmin SSE] Initializing control center notification stream...");
      const url = `${import.meta.env.VITE_API_URL}/cadmin/notifications/stream?token=${token}`;
      
      const es = new EventSource(url, { withCredentials: true });

      es.addEventListener('connected', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`💚 [CAdmin SSE] Stream established. Unread items count: ${data.unread_count}`);
          useCAdminNotificationStore.setState({ unreadCount: data.unread_count });
        } catch (err) {
          console.error("❌ [CAdmin SSE] Connection parser failure:", err);
        }
      });

      es.addEventListener('new_notification', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("🔔 [CAdmin SSE Event] Dispatching administrative alert:", data);
          receiveSSERef.current?.(data);
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Dispatch parser failure:", err);
        }
      });

      es.addEventListener('marketplace_new_order', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("🛍️ [CAdmin SSE Event] Marketplace Order Placed (Global Dispatch):", data);
          onNewOrderSSERef.current?.();
          window.dispatchEvent(
            new CustomEvent('sse-marketplace-new-order', { detail: data })
          );
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Marketplace payload failure:", err);
        }
      });

      es.addEventListener('marketplace_order_status_changed', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`📦 [CAdmin SSE Event] Order Status Transition for ${data.order_number} to ${data.new_status}`);
          window.dispatchEvent(
            new CustomEvent('sse-marketplace-order-status-changed', { detail: data })
          );
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Status payload failure:", err);
        }
      });

      es.addEventListener('delivery_status_changed', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`🚚 [CAdmin SSE Event] Delivery Progress update for Order ${data.order_id}:`, data.status);
          window.dispatchEvent(
            new CustomEvent('sse-delivery-status-changed', { detail: data })
          );
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Delivery status payload failure:", err);
        }
      });

      es.addEventListener('rider_location_update', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`📍 [CAdmin SSE Event] Rider GPS Ping (${data.rider_id}): [${data.lat}, ${data.lng}]`);
          window.dispatchEvent(
            new CustomEvent('sse-rider-location-update', { detail: data })
          );
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Location payload failure:", err);
        }
      });

      es.addEventListener('rider_availability_changed', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`👤 [CAdmin SSE Event] Rider Online State Adjusted. Rider ID: ${data.rider_id}, Online: ${data.is_online}`);
          window.dispatchEvent(
            new CustomEvent('sse-rider-availability-changed', { detail: data })
          );
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Availability payload failure:", err);
        }
      });

      // ── NEW: Dispatch Stale Assignment Alerts ───────────────────────────
      es.addEventListener('delivery_assignment_stale', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`⚠️ [CAdmin SSE Event] Delivery assignment stale for Order ${data.order_number}`);
          window.dispatchEvent(
            new CustomEvent('sse-delivery-assignment-stale', { detail: data })
          );
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Stale assignment payload failure:", err);
        }
      });

      // ── NEW: Dispatch Stale Rider Alerts (Offline during active delivery) ──
      es.addEventListener('delivery_rider_stale', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log(`🚨 [CAdmin SSE Event] Active delivery rider went offline. Delivery: ${data.delivery_id}`);
          window.dispatchEvent(
            new CustomEvent('sse-delivery-rider-stale', { detail: data })
          );
        } catch (err) {
          console.error("❌ [CAdmin SSE Event] Rider stale payload failure:", err);
        }
      });

      es.onerror = (err) => {
        console.error("🚨 [CAdmin SSE] Stream disconnected. Scheduling auto-reconnect in 5000ms...", err);
        es.close();
        reconnectTimeout = setTimeout(connect, 5000);
      };

      eventSourceRef.current = es;
    };

    connect();

    const handleStorage = (e) => {
      if (e.key === 'cadmin_access_token') {
        console.log("🔑 [CAdmin SSE] Admin auth state changed. Reconnecting stream...");
        eventSourceRef.current?.close();
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (e.newValue) connect();
      }
    };

    window.addEventListener('storage', handleStorage);
    
    return () => {
      console.log("🔌 [CAdmin SSE] Unmounting stream connection.");
      window.removeEventListener('storage', handleStorage);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSourceRef.current?.close();
    };
  }, []);

  return null;
};