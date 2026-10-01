// cadmin-web/src/pages/marketplace/Orders/comps/hooks/useMarketplaceSSE.js (do not remove this comment)

import { useEffect, useRef, useCallback } from 'react';

/**
 * Centralized SSE hook for Marketplace Orders.
 *
 * Listens for 5 CustomEvents dispatched by the global useSSENotifications hook:
 *   1. sse-marketplace-new-order          → onNewOrder(payload)
 *   2. sse-marketplace-order-status-changed → onStatusChanged(payload)
 *   3. sse-delivery-status-changed         → onDeliveryChanged(payload)
 *   4. sse-rider-location-update           → onRiderLocation(payload)
 *   5. sse-rider-availability-changed      → onRiderAvailability(payload)
 *
 * All callbacks are optional. Only the ones you pass will be wired up.
 *
 * @param {Object} options
 * @param {Function} [options.onNewOrder]          - Called when a new order is placed
 * @param {Function} [options.onStatusChanged]     - Called when any order status changes
 * @param {Function} [options.onDeliveryChanged]   - Called when delivery status changes
 * @param {Function} [options.onRiderLocation]     - Called on rider GPS tick (active delivery)
 * @param {Function} [options.onRiderAvailability] - Called when rider goes online/offline
 * @param {number}   [options.debounceMs=500]      - Burst protection window in ms
 */
const useMarketplaceSSE = ({
  onNewOrder,
  onStatusChanged,
  onDeliveryChanged,
  onRiderLocation,
  onRiderAvailability,
  onAssignmentStale,
  onRiderStale,
  onPrescriptionRequestNew,
  onPrescriptionRequestResponded,
  debounceMs = 500,
} = {}) => {
  // Store callbacks in refs so we never re-subscribe when callbacks change identity
  const callbacksRef = useRef({
    onNewOrder,
    onStatusChanged,
    onDeliveryChanged,
    onRiderLocation,
    onRiderAvailability,
    onAssignmentStale,
    onRiderStale,
    onPrescriptionRequestNew,
    onPrescriptionRequestResponded,
  });

  // Keep refs in sync without triggering effect re-runs
  useEffect(() => {
    callbacksRef.current = {
      onNewOrder,
      onStatusChanged,
      onDeliveryChanged,
      onRiderLocation,
      onRiderAvailability,
      onAssignmentStale,
      onRiderStale,
      onPrescriptionRequestNew,
      onPrescriptionRequestResponded,
    };
  }, [onNewOrder, onStatusChanged, onDeliveryChanged, onRiderLocation, onRiderAvailability, onAssignmentStale, onRiderStale, onPrescriptionRequestNew, onPrescriptionRequestResponded]);

  // Debounce timers per event type to prevent burst re-renders
  const timersRef = useRef({});

  const debouncedCall = useCallback((eventType, payload) => {
    const cb = callbacksRef.current[eventType];
    if (!cb) return;

    if (timersRef.current[eventType]) {
      clearTimeout(timersRef.current[eventType]);
    }

    timersRef.current[eventType] = setTimeout(() => {
      cb(payload);
      delete timersRef.current[eventType];
    }, debounceMs);
  }, [debounceMs]);

  // Immediate call (no debounce) — used for events that need instant UI response
  const immediateCall = useCallback((eventType, payload) => {
    const cb = callbacksRef.current[eventType];
    if (!cb) return;

    // Cancel any pending debounced call for this event type
    if (timersRef.current[eventType]) {
      clearTimeout(timersRef.current[eventType]);
      delete timersRef.current[eventType];
    }

    cb(payload);
  }, []);

  useEffect(() => {
    // ── Event Handlers ──────────────────────────────────────

    const handleNewOrder = (e) => {
      // New orders should trigger immediately (no debounce)
      // so the table updates right away
      immediateCall('onNewOrder', e.detail);
    };

    const handleStatusChanged = (e) => {
      // Status changes are debounced to handle rapid-fire updates
      // (e.g., PLACED → ACCEPTED → READY in quick succession)
      debouncedCall('onStatusChanged', e.detail);
    };

    const handleDeliveryChanged = (e) => {
      // Delivery changes are debounced similarly
      debouncedCall('onDeliveryChanged', e.detail);
    };

    const handleRiderLocation = (e) => {
      // Location ticks come every 5 seconds per active rider.
      // Debounce to avoid excessive re-renders in the assign modal.
      debouncedCall('onRiderLocation', e.detail);
    };

        const handleRiderAvailability = (e) => {
      // Online/offline toggles are infrequent — immediate is fine
      immediateCall('onRiderAvailability', e.detail);
    };

    const handleAssignmentStale = (e) => {
      // Stale assignment alerts should be immediate — admin needs to act
      immediateCall('onAssignmentStale', e.detail);
    };

    const handleRiderStale = (e) => {
      // Rider went offline during active delivery — immediate alert
      immediateCall('onRiderStale', e.detail);
    };

    // ── Subscribe ───────────────────────────────────────────

    window.addEventListener('sse-marketplace-new-order', handleNewOrder);
    window.addEventListener('sse-marketplace-order-status-changed', handleStatusChanged);
    window.addEventListener('sse-delivery-status-changed', handleDeliveryChanged);
    window.addEventListener('sse-rider-location-update', handleRiderLocation);
    window.addEventListener('sse-delivery-assignment-stale', handleAssignmentStale);
    window.addEventListener('sse-delivery-rider-stale', handleRiderStale);

    // ── Cleanup ─────────────────────────────────────────────

    // ── Prescription Request Handlers ─────────────────────
    const handlePrescriptionRequestNew = (e) => {
      immediateCall('onPrescriptionRequestNew', e.detail);
    };

    const handlePrescriptionRequestResponded = (e) => {
      debouncedCall('onPrescriptionRequestResponded', e.detail);
    };

    // ── Subscribe ─────────────────────────────────────────
    window.addEventListener('sse-prescription-request-new', handlePrescriptionRequestNew);
    window.addEventListener('sse-prescription-request-responded', handlePrescriptionRequestResponded);

    return () => {
      window.removeEventListener('sse-marketplace-new-order', handleNewOrder);
      window.removeEventListener('sse-marketplace-order-status-changed', handleStatusChanged);
      window.removeEventListener('sse-delivery-status-changed', handleDeliveryChanged);
      window.removeEventListener('sse-rider-location-update', handleRiderLocation);
      window.removeEventListener('sse-rider-availability-changed', handleRiderAvailability);
      window.removeEventListener('sse-prescription-request-new', handlePrescriptionRequestNew);
      window.removeEventListener('sse-prescription-request-responded', handlePrescriptionRequestResponded);

      // Clear all pending debounce timers
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, [debouncedCall, immediateCall]);

  // This hook is purely side-effect driven — returns nothing
  return null;
};

export default useMarketplaceSSE;