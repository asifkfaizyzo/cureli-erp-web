
## Document 2: Same Day Delivery — Future Scope


# Same Day Delivery — Future Scope & Implementation Plan

> Context document for when Same Day (and Next Day) delivery is ready to be built.
> Last updated: October 2026

---

## 1. Current State (Already Built)

The following infrastructure is already in place from the Pickup/Fulfillment Type work:

### Database
- [x] `FulfillmentType` enum includes `SAME_DAY` and `NEXT_DAY`
- [x] `DeliveryPricingConfig` has rows for `SAME_DAY` and `NEXT_DAY` (copied from INSTANT_DELIVERY defaults)
- [x] `MarketplaceOrder.fulfillment_type` accepts all 4 values
- [x] `@@index([fulfillment_type, status])` exists for efficient querying

### Backend
- [x] Pricing engine accepts `fulfillment_type` parameter
- [x] `DeliveryPricingConfig` CRUD supports all 4 types via CAdmin API
- [x] Order list/detail APIs return `fulfillment_type`
- [x] SSE payloads include `fulfillment_type`
- [x] CAdmin order filters support `fulfillment_type` query param

### Customer App
- [x] `FulfillmentTypeSelector` shows Same Day option (3rd card)
- [x] Same Day auto-locks after 3 PM (`new Date().getHours() >= 15`)
- [x] Tag shows "BUDGET" when available, "CLOSED" when locked
- [x] Subtitle: "Delivered to you by end of day"
- [x] `checkoutStore` has `fulfillmentType` state that supports `SAME_DAY`
- [x] Checkout API passes `fulfillment_type` to backend

### CAdmin
- [x] Pricing page has Same Day / Next Day tabs
- [x] Info banner: "Scheduling logic is not yet active — these currently behave like instant delivery"
- [x] Order filters include Same Day / Next Day options

### What SAME_DAY currently does
**Nothing different from INSTANT_DELIVERY.** If a customer selects Same Day today,
the order is placed, a rider is assigned immediately, and it's delivered within
30–45 minutes — exactly like instant. The only difference is the label.

---

## 2. What Needs to Be Built

### 2.1 Scheduling & Time Windows

**Concept:** Same Day orders are NOT dispatched immediately. They are collected
into batches and delivered during scheduled windows.

**Decisions needed:**
- [ ] Define delivery windows (e.g., 2 PM–5 PM, 5 PM–8 PM, 8 PM–10 PM)
- [ ] Define cutoff time per window (e.g., orders before 1 PM → 2–5 PM window)
- [ ] Is the 3 PM hard cutoff sufficient, or do we need multiple cutoffs?
- [ ] How to handle orders placed after the last window cutoff? (Push to Next Day?)
- [ ] Time zone handling (all IST? or per-city?)

**Suggested model:**
```
Order placed 9 AM – 1 PM  →  Window: 2 PM – 5 PM
Order placed 1 PM – 4 PM  →  Window: 5 PM – 8 PM
Order placed 4 PM – 7 PM  →  Window: 8 PM – 10 PM
Order placed after 7 PM   →  Next Day (auto-convert or reject)
```

### 2.2 Order Holding & Batch Dispatch

**Concept:** Instead of creating a `Delivery` record immediately on ACCEPTED,
Same Day orders are held in a "batch queue" and dispatched together.

**New status needed?** Options:
- Option A: Reuse `ACCEPTED` + add `delivery_window` field. Cron dispatches when window opens.
- Option B: New status `SCHEDULED` between ACCEPTED and READY_FOR_PICKUP.
- Option C: Reuse `READY_FOR_PICKUP` to mean "ready for batch dispatch".

**Recommended:** Option A (minimal schema change). Add `delivery_window_start`
and `delivery_window_end` timestamps to `MarketplaceOrder`.

**Batch dispatch logic:**
1. Cron runs every 15 minutes
2. Finds all SAME_DAY orders where `status = ACCEPTED` AND `delivery_window_start <= now`
3. Groups by pharmacy + geographic zone
4. Creates `Delivery` records for the batch
5. Assigns riders to batches (not individual orders)

### 2.3 Rider Assignment — Batch Model

**Current model (Instant):** 1 rider → 1 order. Rider goes pharmacy → customer.

**Same Day model:** 1 rider → N orders. Rider does a multi-stop route.

**Decisions needed:**
- [ ] Max orders per rider per batch? (e.g., 5–8)
- [ ] Route optimization algorithm? (TSP / Google Directions API / OSRM)
- [ ] Does rider pick up all orders from one pharmacy, or multiple?
- [ ] How to handle partial batch failures (one customer unreachable)?
- [ ] Rider earning model for batch deliveries (per-order or per-batch?)

**Suggested approach:**
- Group orders by pharmacy branch
- One rider picks up all orders from one branch
- Route optimization sorts drop-offs by proximity
- Rider app shows multi-stop route (this is a rider app change)

### 2.4 Pricing Model

**Current SAME_DAY config:** Copied from INSTANT_DELIVERY (full fees).

**Planned changes:**
- [ ] Reduced delivery fee (e.g., 50% of instant) — because batch delivery is cheaper
- [ ] No km surcharge (flat rate for same-day zone)
- [ ] Service charge same as instant
- [ ] Packing charge same as instant
- [ ] Possible "early bird" discount for orders placed before 10 AM?

**CAdmin pricing page:** Already supports per-fulfillment-type config.
Just need to set the actual values when ready.

### 2.5 Customer App Changes

**Cart / Checkout:**
- [ ] Show estimated delivery window instead of "30–45 min" ETA
  - e.g., "Delivered between 5 PM – 8 PM today"
- [ ] Dynamic cutoff display: "Order within 45 min for 5 PM delivery"
- [ ] After cutoff: auto-disable Same Day or show "Next available: tomorrow 2 PM"

**Active Tracking:**
- [ ] Different tracking view for Same Day (similar to Instant but with window ETA)
- [ ] Show batch status: "Your order is in a delivery batch with 4 other orders"
- [ ] ETA updates as rider completes earlier stops
- [ ] Reuse `TrackingBottomSheet` + `TrackingMapView` with modified `TrackingStatusHero`

**Order Detail:**
- [ ] Show delivery window in timeline
- [ ] "Scheduled for 5–8 PM delivery" label

**Notifications:**
- [ ] "Your Same Day order has been dispatched!" (when batch leaves pharmacy)
- [ ] "Your delivery is 2 stops away" (when rider is nearby)
- [ ] Standard arrival OTP flow (same as instant)

### 2.6 Pharmacy ERP Changes

- [ ] Order card shows "Same Day" badge (cyan) + delivery window
- [ ] "Mark Ready" button behavior: marks order ready for batch pickup, not immediate dispatch
- [ ] Batch pickup notification: "Rider arriving to pick up 5 Same Day orders"
- [ ] No change to billing/acceptance flow

### 2.7 CAdmin Changes

- [ ] Order list: delivery window column for Same Day orders
- [ ] Batch management view: see which orders are grouped together
- [ ] Manual batch override: split/merge batches, reassign riders
- [ ] Delivery tracking: multi-stop route visualization on map
- [ ] Pricing page: set actual Same Day rates (remove "behaves like instant" banner)

### 2.8 Rider App Changes (Out of Current Scope)

- [ ] Multi-stop route view (ordered list of drop-offs)
- [ ] Batch pickup at pharmacy (scan/confirm multiple orders)
- [ ] Per-stop OTP verification
- [ ] Route navigation (next stop → next stop)
- [ ] Batch earning summary

---

## 3. Database Changes Needed

### New fields on `MarketplaceOrder`:

```prisma
model MarketplaceOrder {
  // ... existing fields

  delivery_window_start  DateTime?   // e.g., 2026-10-27T14:00:00Z
  delivery_window_end    DateTime?   // e.g., 2026-10-27T17:00:00Z
  batch_id               String?     // Groups orders in same delivery batch
}
```

### New model (optional):

```prisma
model DeliveryBatch {
  batch_id        String   @id @default(cuid())
  pharmacy_id     String
  rider_id        String?
  window_start    DateTime
  window_end      DateTime
  order_count     Int
  status          String   @default("PENDING") // PENDING, DISPATCHED, COMPLETED
  created_at      DateTime @default(now())
  dispatched_at   DateTime?
}
```

### Pricing config updates:

Update the SAME_DAY row in `DeliveryPricingConfig`:
```
delivery_fee_enabled    = true   (but lower amount)
km_surcharge_enabled    = false  (flat rate, no distance)
service_charge_enabled  = true
packing_enabled         = true
```

---

## 4. Backend Services Needed

| Service | Location | Purpose |
|---|---|---|
| `assignDeliveryWindow()` | `marketplace.orders.service.js` | Calculate window based on order time |
| `dispatchBatchCron()` | `cron/sameDayBatchWorker.js` | Find ready batches, create Delivery records, assign riders |
| `optimizeRoute()` | `services/routeOptimization.service.js` | Sort drop-off coordinates for multi-stop |
| `getBatchForOrder()` | `marketplace.orders.service.js` | Return batch info for tracking |

### Cron Jobs:

| Schedule | Job | Purpose |
|---|---|---|
| Every 15 min | `sameDayBatchWorker` | Dispatch batches whose window has opened |
| Every 5 min | `sameDayRouteOptimizer` | Re-optimize routes for active batches |
| 11 PM daily | `sameDayUndeliveredWorker` | Auto-cancel or push to Next Day |

---

## 5. Suggested Implementation Phases

### Phase 1: Foundation (Week 1–2)
- [ ] Add `delivery_window_start/end` to schema
- [ ] Implement `assignDeliveryWindow()` in checkout flow
- [ ] Customer sees window estimate in cart and tracking
- [ ] Cutoff logic (3 PM hard cutoff → orders after go to Next Day)

### Phase 2: Batch Dispatch (Week 3–4)
- [ ] Create `DeliveryBatch` model
- [ ] Implement batch grouping cron
- [ ] Create Delivery records from batches
- [ ] Single rider assigned to batch

### Phase 3: Multi-Stop Routing (Week 5–6)
- [ ] Route optimization service
- [ ] Rider app multi-stop view (if rider app is in scope)
- [ ] Sequential OTP verification per stop
- [ ] ETA updates per stop

### Phase 4: Pricing & Polish (Week 7–8)
- [ ] Set actual Same Day pricing in CAdmin
- [ ] Reduced delivery fee logic
- [ ] Customer notifications for batch dispatch
- [ ] CAdmin batch management UI
- [ ] Remove "behaves like instant" banner

### Phase 5: Next Day (Week 9–10)
- [ ] Next Day is Same Day + 1 calendar day offset
- [ ] Cutoff: orders after 7 PM → Next Day window
- [ ] Same batch/route logic, different date
- [ ] Customer sees "Tomorrow 2–5 PM" estimate

---

## 6. Open Questions

| # | Question | Impact |
|---|---|---|
| 1 | Do we support Same Day for all cities or only metro? | Geographic gating logic |
| 2 | Can a customer choose their preferred window? | UI + scheduling complexity |
| 3 | What happens if a batch rider cancels mid-route? | Fallback reassignment logic |
| 4 | Is there a minimum order value for Same Day? | Pricing config addition |
| 5 | Do we offer real-time tracking for batch deliveries? | Rider app GPS streaming |
| 6 | Can Same Day orders include prescriptions? | Verification timing |
| 7 | How do refunds work for batch partial failures? | Order-level vs batch-level |
| 8 | Should Next Day have its own pricing or copy Same Day? | Config decision |

---

## 7. Reference: How Instant Delivery Works Today

For comparison when designing Same Day:

```
Customer places order
  → PLACED
  → Pharmacy accepts → ACCEPTED
  → Delivery record created (PENDING_ASSIGNMENT)
  → CAdmin assigns rider → RIDER_NOTIFIED
  → Rider accepts → ACCEPTED (delivery)
  → Rider arrives at pharmacy → ARRIVED_AT_PHARMACY
  → Pharmacy marks ready → READY_FOR_PICKUP (order)
  → Rider picks up → PICKED_UP (delivery)
  → Rider en route → EN_ROUTE
  → Rider arrives → ARRIVED_AT_CUSTOMER
  → OTP verified → DELIVERED (delivery) + COMPLETED (order)
```

**Same Day will differ at:**
- Delivery record NOT created on ACCEPTED (deferred to batch dispatch)
- Multiple orders share one rider
- ETA is a window, not a countdown
- Route has multiple stops


---

Save these as:
- `docs/pickup-fulfillment-reference.md`
- `docs/same-day-delivery-future-scope.md`

The Same Day doc is designed so you can hand it directly to yourself (or another dev) as the starting context when you begin implementation — it tells you exactly what exists, what's missing, and what order to build things in.