# Cureli — Same Day Delivery Lifecycle — October 2026

> **Companion to:** Cureli Instant Delivery Lifecycle doc.
> **Scope:** Detailed technical reference for the Same Day delivery flow — cutoff enforcement, batch assembly, team rider assignment, batch acceptance, per-order fulfillment, and batch-aware events.
> **Last verified against:** Current repository implementation (post Same Day v1 shipping).

---

## 1. Business Model

Same Day is a **batch-dispatched, team-rider fulfillment type** that sits alongside Instant Delivery, Pickup, and (future) Next Day. It is designed to let pharmacies clear a backlog of lower-urgency orders in a single multi-stop route driven by a salaried team rider.

### Key Differences vs Instant Delivery

| Dimension | Instant | Same Day |
|---|---|---|
| Dispatch model | 1 order → 1 rider immediately | N orders → 1 team rider in one batch |
| Rider assignment timing | Immediately on `ACCEPTED` | Manual by CAdmin, N minutes/hours later |
| Rider pool | `INDEPENDENT` or `TEAM` | `TEAM` only |
| Earnings | Per-delivery (pickup + drop + surge + floor) | None — team riders are salaried; all earning fields `null` |
| Customer tracking | Live rider GPS, countdown ETA | No rider location, "Delivered by end of day" |
| Window enforcement | None (immediate) | Hard cutoff hour (`same_day_cutoff_hour` on pricing config) |
| Rider route | Pharmacy → Customer | Pharmacy (shared) → N customers in rider-chosen sequence |
| Rider screen | `ActiveDeliveryScreen` (single-order lock) | `BatchDeliveryScreen` (multi-order lock) |
| CAdmin workspace | Standard order row with "Assign Rider" | Dedicated **Same Day tab** with batch workspace |

### Deliberate Non-Features

- **No concurrent batches.** A team rider can hold at most one active batch.
- **No customer-facing rider location.** Customers see only status + "Delivered by end of day". CAdmin also does not see rider GPS during batch assignment.
- **No post-pickup reassignment.** Orders can only be moved between batches BEFORE pickup (status `< PICKED_UP`).
- **No live ETA.** Same Day explicitly does not use countdowns, map ETAs, or per-stop estimates.
- **No rider rejection UX for individual orders.** When a batch is offered, the rider accepts or declines the **entire batch**.

---

## 2. Cutoff Enforcement

### Configuration

A single integer field `same_day_cutoff_hour` lives on the `DeliveryPricingConfig` row with `fulfillment_type = SAME_DAY`. It stores the hour-of-day (0–23 in server time zone, IST) after which Same Day is unavailable for the current calendar day.

### Enforcement Points

| Layer | File | Behavior |
|---|---|---|
| CAdmin config UI | `cadmin-web/src/pages/marketplace/Pricing/DeliveryPricingPage.jsx` | Dedicated card at top of Same Day panel. CAdmin can change the hour at any time. |
| Pricing service | `backend/src/modules/cadmin/pricing/cadminPricing.service.js` | `same_day_cutoff_hour` is in `NUMERIC_FIELDS` and coerced on write. |
| Customer app | `FulfillmentTypeSelector` | After cutoff hour (local device time), Same Day card locks and shows "CLOSED" tag. Subtitle flips from "Delivered by end of day" to "Available tomorrow". |
| Checkout backend | `mobile.checkout.service.js` (`createCheckoutSession`) | Server-side re-check: if `fulfillment_type === SAME_DAY` and current server hour ≥ cutoff, checkout is rejected with a user-friendly error. |

### What Happens After Cutoff

Orders placed before cutoff with `SAME_DAY` fulfillment flow normally. There is **no automatic conversion** to another fulfillment type after cutoff — the customer must either reselect or try again tomorrow.

---

## 3. Order Status Machine (Same Day)

Same Day orders use the **same `MarketplaceOrderStatus` enum** as Instant. The only difference is that the auto-created `Delivery` record is **not** immediately assignable — it waits for a human CAdmin to batch it.

```
PLACED → ACCEPTED → READY_FOR_PICKUP → COMPLETED
                              (also: REJECTED, CANCELLED terminals)
```

### Key Divergences from Instant at Each Step

| Status | Instant Behavior | Same Day Behavior |
|---|---|---|
| `PLACED` | Standard | Standard |
| `ACCEPTED` | `Delivery` created, visible for rider assignment immediately | `Delivery` created with `batch_group_id = null`, visible in **Same Day → Unassigned Orders** tab only |
| `READY_FOR_PICKUP` | Signals single rider to pick up | Signals the team rider who holds the batch that *this specific order* is now pickup-ready. Other orders in the batch may still be `ACCEPTED`. |
| `COMPLETED` | Via rider OTP, closes delivery | Same — but only closes one order; batch remains active if other orders are not yet delivered. |

---

## 4. Delivery Status Machine (Same Day)

Same uses the same `DeliveryStatus` enum as Instant. The schema addition that makes Same Day work is a nullable `batch_group_id` string on `Delivery`.

### Batch Grouping Rule

- `batch_group_id = null` → delivery is a standalone instant delivery, OR a Same Day delivery not yet batched.
- `batch_group_id = <uuid>` → delivery belongs to a Same Day batch. All deliveries sharing the same UUID were assigned together, hold the same `rider_id`, and share one assignment lifecycle.

### Why `getActiveDelivery()` Filters by `batch_group_id: null`

The rider app has two different active-delivery queries:

| Query | Returns | Consumer |
|---|---|---|
| `getActiveDelivery()` | Single instant delivery (adds `batch_group_id: null` filter) | `ActiveDeliveryScreen` single-order flow |
| `getActiveDeliveries()` | `{ instant, batches: [...] }` | `BatchDeliveryScreen`, hydration gate, SSE resync |

If `getActiveDelivery()` did not filter by `batch_group_id: null`, it would return the first batch delivery and the rider app would wrongly lock into the single-order screen for a multi-order batch.

---

## 5. Complete Same Day Lifecycle

### Phase 1 — Customer Checkout (Pre-Cutoff)

1. Customer opens cart, taps fulfillment selector.
2. `FulfillmentTypeSelector` shows Same Day card:
   - Before cutoff: "BUDGET" tag, subtitle "Delivered to you by end of day".
   - After cutoff: "CLOSED" tag, disabled.
3. Customer selects Same Day → `checkoutStore.fulfillmentType = SAME_DAY`.
4. `DeliverySummaryCard` → `ETAHeader` renders with `isSameDay` prop:
   - Icon: calendar.
   - Text: "Delivered by end of day".
   - No countdown, no map ETA.
5. Pricing engine computes identically to Instant (same tiers, same service/delivery/km/packing structure). Same Day pricing differences are planned but not currently applied — the row exists with its own values and CAdmin can tune it.
6. Payment flow is identical to Instant (Razorpay → `confirmCheckoutPayment` → `_createOrderFromSession`).
7. Order is created with `fulfillment_type = SAME_DAY`. Status `PLACED`.
8. `fireOrderPlacedEvents` fires — SSE goes to ERP + CAdmins. Customer gets order-placed push.
9. `OrderSuccess` subtitle flips to Same Day phrasing when `placedOrderIsSameDay` is true.

### Phase 2 — Pharmacy Processing (Standard)

10. Pharmacy ERP receives order. Same workflow as Instant.
11. Pharmacy accepts → `transitionOrderStatus(ACCEPTED)`:
    - Order → `ACCEPTED`, `accepted_at` set.
    - **`Delivery` is auto-created** with `status = PENDING_ASSIGNMENT`, `batch_group_id = null`, pickup/drop coordinates populated from snapshots.
    - **No immediate rider notification** (this is where Same Day diverges from Instant).
12. SSE fires `delivery_status_changed` to CAdmins → the delivery appears in **CAdmin → Orders → Same Day tab → Unassigned Orders**.

### Phase 3 — CAdmin Batch Assembly

The entire Same Day workspace lives in `cadmin-web/src/pages/marketplace/Orders/comps/SameDayTab.jsx`. It is reached via the Same Day tab (one of the four tabs: Instant / Pickup / Same Day / Prescriptions) in `MarketplaceOrdersPage.jsx`.

13. CAdmin opens the Same Day tab. The page renders:
    - **Unassigned Orders table** — all `SAME_DAY` deliveries with `rider_id = null` AND `batch_group_id = null`.
    - **Active Batches section** — one `ActiveBatchCard` per currently-active batch, with progress bar and per-order breakdown.
14. CAdmin clicks **"Create Batch"** → `CreateBatchModal` opens (2-step flow):
    - **Step 1 — Pick Rider:** fetches `getAvailableTeamRidersForBatch()` which returns all `ACTIVE` `TEAM` riders where `is_online = true` AND the rider has **no existing active batch**.
    - **Step 2 — Pick Orders:** CAdmin selects N unassigned orders. UI constraint: all orders must share a pharmacy branch (frontend enforces this).
15. CAdmin confirms → `batchAssignOrders()`:
    - Generates a fresh `batch_group_id` UUID.
    - **Stale cleanup:** before writing, deletes any orphaned `Delivery` rows for selected orders where status ∈ `{CANCELLED, FAILED, PENDING_ASSIGNMENT with no rider_id}`.
    - Updates each selected `Delivery`:
      - `rider_id = <team rider>`, `batch_group_id = <uuid>`.
      - `status = RIDER_NOTIFIED`.
      - `assigned_at = now`, `assignment_attempts += 1`.
      - All earning fields explicitly `null` (team riders are salaried).
      - Pickup/drop coordinates copied from snapshots.
    - Creates one `DeliveryAssignmentLog` per delivery (action `NOTIFIED`).
    - SSE `batch_assigned` fires once to the rider with full batch payload (order count, pharmacy name, deliveries array).
    - SSE `delivery_status_changed` fires per delivery to CAdmins (so the Same Day tab live-updates).
    - Push notification fires to rider (alarm channel, failsafe for background).

### Phase 4 — Rider Receives Batch

16. Rider app receives `batch_assigned` via SSE (`src/services/sseManager.ts` → `src/hooks/useDeliveryEvents.ts`).
17. `useDeliveryEvents` sets `incomingBatch` in `deliveryStore`.
18. `IncomingOrderOverlay` renders in **batch mode**:
    - Hero: "NEW BATCH".
    - Order count badge.
    - Timer.
    - **No deny button** (team rider policy — if the rider genuinely can't take it, they contact CAdmin out-of-band).
    - **No pickup/earning info row** (both are irrelevant for team riders).
    - **Slide-to-accept** gesture.
19. Rider slides to accept → `acceptBatch()`:
    - For every delivery in the batch:
      - `status = ACCEPTED`.
      - Creates `DeliveryAssignmentLog` (action `ACCEPTED`).
      - SSE `delivery_update` to the customer (status transitioned).
      - SSE `delivery_status_changed` to CAdmins.
    - Rider's active delivery registration happens per-delivery for presence tracking.
20. If rider dismisses the overlay without accepting (timer expires or they close it) → `declineBatch()`:
    - For every delivery in the batch: **DELETE** the delivery row entirely (not reset to `PENDING_ASSIGNMENT`).
    - Why: PENDING_ASSIGNMENT without a rider is semantically orphaned; deleting lets CAdmin re-batch from a clean slate.
    - SSE `delivery_status_changed` fires per order (CAdmin's existing listener handles this; a dedicated `batch_declined` event was removed because CAdmin didn't listen for it).
    - SSE `order_removed_from_batch` fires per order (removes from rider-side state if any ghost reference remains).
    - SSE customer notification per order (so customer app clears "rider assigned" state).

### Phase 5 — Rider App Enters Batch Lock

21. `useDeliveryEvents` resync pulls `getActiveDeliveries()` → populates `activeBatches` in `deliveryStore`.
22. `app/(app)/_layout.tsx` evaluates:
    - `isDeliveryLocked(activeDelivery)` → false (no instant delivery).
    - `isBatchLocked(activeBatches)` → true (at least one batch with undelivered orders).
    - Renders `<BatchDeliveryScreen />` with tabs **unmounted** — same structural guarantee as `ActiveDeliveryScreen` for Instant.
23. The hydration gate (`DeliveryHydrationGate`) handles the cold-start case: on app launch, if the resync returns a batch and no instant delivery, it directly renders `BatchDeliveryScreen` without ever mounting tabs.

### Phase 6 — Rider Fulfills Each Order (Free Sequence)

`BatchDeliveryScreen` shows:
- Header: "Same Day Batch", progress bar `(delivered/total)`.
- Map (currently showing the selected order's leg target).
- Horizontal scroll of order chips at the bottom — each shows order number, status, and status-color dot.
- When an order chip is tapped, an **action panel** appears above it with the status-appropriate button for that order.

The rider freely chooses which order to work on next. There is no enforced sequence. For each order:

24. Rider taps a chip (status `ACCEPTED`) → action panel shows **"Arrived at Pharmacy"**:
    - `updateDeliveryStatus(ARRIVED_AT_PHARMACY)` — currently no geofence check in batch flow (same shared pharmacy means arrival is implicitly batched).
25. Rider taps same chip (now `ARRIVED_AT_PHARMACY`) → **"Enter Pickup PIN"**:
    - `OtpModal` opens, rider enters the 4-digit `pickup_otp` shown on pharmacy ERP for that specific order.
    - `updateDeliveryStatus(PICKED_UP)` with OTP.
    - Validates order status is `READY_FOR_PICKUP`. If not, pharmacy hasn't marked it ready yet — rider sees error.
26. Rider taps chip (now `PICKED_UP`) → **"Start Delivery"**:
    - `updateDeliveryStatus(EN_ROUTE)`.
    - `useBatchAutoEnRoute` hook can also auto-transition on a delay.
27. Rider taps chip (now `EN_ROUTE`) → **"Arrived at Customer"**:
    - `updateDeliveryStatus(ARRIVED_AT_CUSTOMER)`.
    - Customer app now reveals the `delivery_otp`.
28. Rider taps chip (now `ARRIVED_AT_CUSTOMER`) → **"Enter Delivery PIN"**:
    - `OtpModal` opens, rider enters `delivery_otp` shared by customer.
    - `completeDelivery()` with OTP:
      - Delivery → `DELIVERED`, order → `COMPLETED`.
      - `removeOrderFromBatch(delivery_id)` in rider store.
      - Resync pulls fresh batch state.
29. Rider repeats for next chip. The pharmacy pickup phase (steps 24–25) is typically done in a single visit for all orders — the rider arrives at the pharmacy once, enters each order's pickup OTP in sequence, then begins the drop route.

### Phase 7 — Mid-Batch Mutations

Three scenarios where the batch changes mid-flight:

#### 7a. CAdmin Adds an Order to an Active Batch

- CAdmin opens `AddOrdersToBatchModal` from an `ActiveBatchCard`.
- `addOrderToBatch()`:
  - Stale cleanup on the target order's delivery row (same as initial batch).
  - Updates delivery: assigns `rider_id`, `batch_group_id = <existing uuid>`, `status = ACCEPTED` (skip RIDER_NOTIFIED since rider already holds the batch).
  - SSE `order_added_to_batch` fires to rider → rider's `useDeliveryEvents` listener triggers a resync.
  - SSE `delivery_status_changed` fires to CAdmins.
  - Rider sees a simple notification (not a sticky alert — explicit UX decision).

#### 7b. CAdmin Removes an Order From an Active Batch

- Only allowed while that specific order's status is `< PICKED_UP`.
- CAdmin clicks remove on the order row in `ActiveBatchCard`.
- `removeOrderFromBatch()`:
  - Validates status < PICKED_UP.
  - Clears `rider_id` and `batch_group_id`, sets status back to `PENDING_ASSIGNMENT`.
  - Order returns to the Unassigned Orders table.
  - SSE `order_removed_from_batch` to rider → rider store removes the chip.
  - SSE `delivery_status_changed` to CAdmins.

#### 7c. CAdmin Reassigns a Pre-Pickup Order

- Same gate as above: status must be `< PICKED_UP`.
- `reassignBatchOrder()`:
  - Target rider must be `is_online = true`.
  - Delivery is re-pointed: `rider_id = <new>`, pushed into the new rider's batch (or new batch if new rider has none).
  - Push notification to new rider.
  - SSE `delivery_status_changed` to CAdmins.

### Phase 8 — Batch Completion

30. Rider delivers last order → final `completeDelivery()` call.
31. All orders in the batch are now in terminal statuses (`DELIVERED`, `FAILED`, or `CANCELLED`).
32. `BatchDeliveryScreen` detects `allDelivered` via `useMemo`:
    - Shows green "All orders delivered! Batch complete." banner.
    - After 3 seconds, calls `removeBatch(batch_group_id)` → `activeBatches` becomes empty.
33. `isBatchLocked(activeBatches)` → false → `app/(app)/_layout.tsx` re-renders → tabs mount fresh → rider lands on home.
34. (P3 — not yet shipped) A batch-completion notification will fire here.

---

## 6. SSE Events (Same Day Specific)

| Event | Producer | Consumer | Trigger |
|---|---|---|---|
| `batch_assigned` | `batchAssignOrders` | Rider | CAdmin creates batch |
| `order_added_to_batch` | `addOrderToBatch` | Rider | CAdmin injects order into active batch |
| `order_removed_from_batch` | `removeOrderFromBatch`, `declineBatch` | Rider | CAdmin removes order OR rider declines batch |
| `delivery_status_changed` | All Same Day mutations | CAdmins | Per-delivery granularity — reused across all CAdmin flows |
| `delivery_update` | `acceptBatch`, per-order status transitions | Customer mobile | Any status change on a batched order |

### Why Not a `batch_declined` Event

Earlier implementation fired a dedicated `batch_declined` event when the rider dismissed a batch offer. CAdmin's `useMarketplaceSSE` did not listen for it, so the Same Day tab silently went stale. Fix: fire `delivery_status_changed` per order (an event CAdmin already handles) during decline. The decline flow also DELETEs the rows, so the next CAdmin refresh naturally shows the unassigned orders again.

### Rider SSE Listener Registration

All five events (`batch_assigned`, `order_added_to_batch`, `order_removed_from_batch`, `delivery_update`, `order_status_changed`) are registered in `src/services/sseManager.ts`. Omitting any of them causes the event to be silently dropped at the socket layer — not surfaced as an error. This was the root cause of several early bugs during Same Day development.

---

## 7. Rider App Navigation Lock Model

The rider app enforces a **structural** lock (not an overlay) whenever a delivery is in progress. This applies identically to Instant and Same Day:

| State | Mounted Tree |
|---|---|
| No active delivery | `<Stack>` → `(tabs)` → `home` + `IncomingOrderOverlay` |
| Instant delivery active | `<ActiveDeliveryScreen />` only — tabs are not in the tree at all |
| Same Day batch active | `<BatchDeliveryScreen />` only — tabs are not in the tree at all |
| Not yet hydrated | `<DeliveryHydrationGate />` (which may itself render `BatchDeliveryScreen` on cold start) |

### Why Structural, Not Overlay

Any navigation action (tab press, `router.push`, deep link, notification tap) must resolve to a route in the mounted tree. If the tabs are not mounted, there is no route for the navigator to resolve to — the lock cannot be bypassed by any means. When all orders in the batch reach terminal status, `isBatchLocked` flips to false, the layout re-renders, and tabs mount fresh at their default route.

### Hydration Gate Fallback

On cold start, `DeliveryHydrationGate` runs before the layout decides which screen to show. It:
1. Blocks with a spinner until `getActiveDeliveries()` returns.
2. If a batch is present and no instant delivery, renders `BatchDeliveryScreen` directly (handles the case where the app was killed mid-batch).
3. If the sync fails, blocks with a retry UI — **fails closed** so a stale in-progress batch is never missed.

---

## 8. Earnings & Payout

Team riders are **salaried**. All earning fields on batch `Delivery` records are explicitly set to `null`:

- `pickup_fee = null`
- `drop_fee = null`
- `surge_fee = null`
- `floor_topup_fee = null`
- `total_rider_earning = null`
- `tip_amount = null`

No `RiderEarningLedger` entry is created for Same Day deliveries. Pharmacy payout (`PharmacyPayout`) still processes normally — the pharmacy's share of each order is independent of the rider's compensation model.

---

## 9. CAdmin 4-Tab Architecture

Prior to Same Day, `MarketplaceOrdersPage.jsx` was a single table with a fulfillment filter dropdown. The Same Day workspace demanded enough custom UI that the page was restructured:

| Tab | Icon | Content |
|---|---|---|
| Instant | Bike | Standard orders table (no checkbox column — the batch-select column was removed) |
| Pickup | Store | Pickup orders (future workspace) |
| Same Day | Truck | `SameDayTab` — unassigned orders + active batches + batch modals |
| Prescriptions | FileText | Prescription review workspace |

All Same Day-specific logic was pulled out of the shared table and lives inside `SameDayTab`. The fulfillment filter dropdown was removed from `OrdersFilters.jsx` because the tab itself now serves as the filter.

### Same Day Tab Components

| File | Purpose |
|---|---|
| `SameDayTab.jsx` | Container — unassigned orders table + active batches + SSE live refresh |
| `CreateBatchModal.jsx` | 2-step modal: pick rider → pick orders |
| `ActiveBatchCard.jsx` | Expandable card per active batch, progress bar, per-order remove button |
| `AddOrdersToBatchModal.jsx` | Pick unassigned orders to inject into an existing batch |

### Backend API

| Endpoint | Service Function | Purpose |
|---|---|---|
| `GET /cadmin/delivery/active-batches` | `getActiveBatches` | Groups active deliveries by `batch_group_id`, computes progress stats |
| `POST /cadmin/delivery/batch-assign` | `batchAssignOrders` | Create a new batch |
| `POST /cadmin/delivery/add-to-batch` | `addOrderToBatch` | Inject order into existing batch |
| `POST /cadmin/delivery/remove-from-batch` | `removeOrderFromBatch` | Pull order out of batch (pre-pickup only) |
| `POST /cadmin/delivery/reassign-batch-order` | `reassignBatchOrder` | Move pre-pickup order between riders |
| `GET /cadmin/delivery/available-team-riders` | `getAvailableTeamRidersForBatch` | Team riders who are online AND have no active batch |

---

## 10. Customer Tracking (Same Day)

`TrackingStatusHero` branches on `fulfillment_type`:

| Fulfillment | Hero Text | Rotating Subtitle | Icon |
|---|---|---|---|
| Instant | Status-driven ("Rider on the way", countdown) | Live ETA + distance | Bike |
| Pickup | "Ready for pickup" / status | Store info | Storefront |
| Same Day | "Delivered by end of day" + status-specific line | Reassurance messages that rotate (e.g., "Your order is being prepared", "Rider assigned to batch", "Out for delivery") | Calendar |

The rotation logic lives in `useRotatingMessage.ts` with a dedicated Same Day branch per order status. **No live rider marker is shown on the customer map for Same Day orders** — the rider location is not even requested from the backend for these fulfillment types.

---

## 11. Known Gaps & Future Work

| # | Gap | Priority | Notes |
|---|---|---|---|
| 1 | Empty batch creation shows no feedback | P3 | When CAdmin confirms a batch with zero orders selected, UI should show a toast |
| 2 | Batch completion notification | P3 | Rider gets no celebratory push/sound when a full batch is cleared |
| 3 | Multi-pharmacy batches | Future | Current UI enforces single-pharmacy batches. Multi-pharmacy would require significant route-planning UX |
| 4 | Route optimization | Future | Rider freely chooses sequence today. Future: suggest optimal sequence based on drop coordinates (TSP / OSRM) |
| 5 | Window scheduling (early/late) | Future | Current model has one hard cutoff per day. Future: multiple windows (2–5 PM, 5–8 PM) with per-window cutoffs |
| 6 | Next Day fulfillment | Future | Will reuse batch infrastructure, offset by one calendar day. `NEXT_DAY` enum already exists |
| 7 | Reduced Same Day pricing | Config decision | Pricing config supports per-fulfillment-type rates but Same Day currently uses Instant-equivalent values |
| 8 | Independent rider Same Day pool | Deliberate exclusion | Current policy is TEAM-only. Opening to INDEPENDENT would require an earnings model for batch work |

---

## 12. Key Code Locations

| Area | File |
|---|---|
| Rider delivery service (`getActiveDelivery`, `getActiveDeliveries`, `acceptBatch`, `declineBatch`) | `backend/src/modules/rider/delivery/rider.delivery.service.js` |
| CAdmin batch service (`batchAssignOrders`, `addOrderToBatch`, `removeOrderFromBatch`, `reassignBatchOrder`, `getActiveBatches`, `getAvailableTeamRidersForBatch`) | `backend/src/modules/cadmin/delivery/cadmin.delivery.service.js` |
| CAdmin batch routes | `backend/src/modules/cadmin/delivery/cadmin.delivery.routes.js` |
| Pricing config (cutoff hour) | `backend/src/modules/cadmin/pricing/cadminPricing.service.js` |
| Rider navigation lock | `cureli-med-rider/app/(app)/_layout.tsx` |
| Lock evaluation helpers | `cureli-med-rider/src/utils/deliveryStatus.ts` (`isDeliveryLocked`, `isBatchLocked`, `isRiderLocked`) |
| Rider batch store | `cureli-med-rider/src/store/deliveryStore.ts` |
| Rider SSE registration | `cureli-med-rider/src/services/sseManager.ts` |
| Rider SSE handlers / resync | `cureli-med-rider/src/hooks/useDeliveryEvents.ts` |
| Batch screen | `cureli-med-rider/src/components/delivery/BatchDeliveryScreen.tsx` |
| Incoming batch overlay (batch mode) | `cureli-med-rider/src/components/delivery/IncomingOrderOverlay.tsx` |
| Hydration gate | `cureli-med-rider/src/components/delivery/DeliveryHydrationGate.tsx` |
| Auto en-route hook | `cureli-med-rider/src/hooks/useBatchAutoEnRoute.ts` |
| CAdmin orders page (4-tab) | `cadmin-web/src/pages/marketplace/Orders/MarketplaceOrdersPage.jsx` |
| CAdmin Same Day workspace | `cadmin-web/src/pages/marketplace/Orders/comps/SameDayTab.jsx` |
| CAdmin batch modals | `cadmin-web/src/pages/marketplace/Orders/comps/CreateBatchModal.jsx`, `AddOrdersToBatchModal.jsx`, `ActiveBatchCard.jsx` |
| CAdmin pricing cutoff UI | `cadmin-web/src/pages/marketplace/Pricing/DeliveryPricingPage.jsx` |
| Customer cart ETA header | `cureli/src/features/cart/components/DeliverySummaryCard.tsx` |
| Customer tracking hero (Same Day branch) | `cureli/src/features/orders/components/tracking/TrackingStatusHero.tsx`, `hooks/useRotatingMessage.ts` |
| Customer fulfillment selector | `FulfillmentTypeSelector` component |

---
