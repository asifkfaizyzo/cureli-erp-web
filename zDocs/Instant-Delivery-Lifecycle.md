# Cureli — Instant Delivery Lifecycle - 14-oct-2026

> **Companion to:** Cureli System Overview (Sections 1–10)
> **Scope:** Detailed technical reference for the instant delivery order flow, status machines, pricing, OTP security, and background workers.
> **Last verified against:** Current repository implementation.

## 1. Fulfillment Types (Current and Planned)

Cureli currently operates a single fulfillment method: **Instant Delivery**. The `MarketplaceOrder` model does not yet carry a per-order fulfillment type field. All existing orders are instant delivery.

Planned fulfillment types (not yet implemented):

- **Pickup:** Customer collects the order from the pharmacy. No rider, no delivery charges.
- **Same-Day Delivery:** Scheduled delivery within the same day.
- **Next-Day Delivery:** Scheduled delivery on the following day.

These will be distinguished by a `fulfillment_type` enum on `MarketplaceOrder`. Until implemented, all logic described below applies to the single instant delivery flow.

## 2. Order Status Machine

Defined in `backend/src/modules/marketplace-orders/marketplace.orders.service.js`.

```
enum MarketplaceOrderStatus {
  PLACED
  ACCEPTED
  READY_FOR_PICKUP
  COMPLETED
  REJECTED
  CANCELLED
}
```

### Permitted Transitions

| From | Allowed Targets | Who Can Trigger |
|------|----------------|-----------------|
| `PLACED` | `ACCEPTED`, `REJECTED`, `CANCELLED` | Pharmacy (accept/reject), Customer (cancel) |
| `ACCEPTED` | `READY_FOR_PICKUP` | Pharmacy |
| `READY_FOR_PICKUP` | `COMPLETED` | Rider (via OTP), Pharmacy (ERP), CAdmin (override) |
| `COMPLETED` | *(terminal)* | — |
| `REJECTED` | *(terminal)* | — |
| `CANCELLED` | *(terminal)* | — |

### Transition Implementation

All transitions flow through `transitionOrderStatus()` except rider-triggered completion, which uses its own transaction in `completeDeliveryWithOtp()`.

`transitionOrderStatus()` performs atomically:
1. Validates the transition against `VALID_TRANSITIONS` map.
2. Updates order status + timestamp (`accepted_at`, `ready_at`, `completed_at`, etc.).
3. Writes `MarketplaceOrderStatusHistory` row.
4. On `ACCEPTED`: auto-creates `Delivery` record (status `PENDING_ASSIGNMENT`).
5. On `CANCELLED`: cancels associated `Delivery` if it exists.
6. On terminal status: sets prescription expiry timestamps.

Post-commit:
7. Notifies assigned rider via SSE + Push (for `READY_FOR_PICKUP`, `CANCELLED`, `REJECTED`).
8. Fires `fireOrderStatusChangedEvents()` → SSE to ERP, CAdmins, customer mobile.

## 3. Delivery Status Machine

Defined in `backend/prisma/schema/enums.prisma`.

```
enum DeliveryStatus {
  PENDING_ASSIGNMENT
  RIDER_NOTIFIED
  ACCEPTED
  ARRIVED_AT_PHARMACY
  PICKED_UP
  EN_ROUTE
  ARRIVED_AT_CUSTOMER
  DELIVERED
  FAILED
  CANCELLED
}
```

### Permitted Transitions (Rider Workflow)

| From | Allowed Targets | Trigger |
|------|----------------|---------|
| `PENDING_ASSIGNMENT` | `RIDER_NOTIFIED` | CAdmin assigns rider |
| `RIDER_NOTIFIED` | `ACCEPTED`, `PENDING_ASSIGNMENT` | Rider accepts / declines / timeout auto-decline |
| `ACCEPTED` | `ARRIVED_AT_PHARMACY` | Rider geofence check (200m) |
| `ARRIVED_AT_PHARMACY` | `PICKED_UP` | Rider verifies `pickup_otp` + order must be `READY_FOR_PICKUP` |
| `PICKED_UP` | `EN_ROUTE` | Rider manual |
| `EN_ROUTE` | `ARRIVED_AT_CUSTOMER` | Rider geofence check (200m) |
| `ARRIVED_AT_CUSTOMER` | `DELIVERED` | Rider verifies `delivery_otp` |
| `EN_ROUTE` | `DELIVERED` | Rider verifies `delivery_otp` (shortcut) |
| Any active | `CANCELLED` | Order cancelled |
| Any active | `FAILED` | CAdmin override |

### Delivery Record Creation

The `Delivery` record is **auto-created** inside `transitionOrderStatus()` when an order transitions to `ACCEPTED`. It is initialized with:
- `status = PENDING_ASSIGNMENT`
- `pickup_lat/lng` from `BranchMarketplaceSettings`
- `drop_lat/lng` from `delivery_address_snapshot`

No rider is assigned at creation time. The CAdmin assigns a rider separately.

## 4. Complete Instant Delivery Lifecycle

### Phase 1 — Customer Shopping & Checkout

1. Customer browses marketplace, selects a pharmacy, adds medicines to cart.
   - **Rule:** Cart is associated with one pharmacy at a time.
2. Cart screen displays: delivery address → patient selector → delivery summary → prescription upload (if required) → coupon → loyalty points → bill details → checkout bar.
3. `useCheckout` hook calls `getQuote()` with `distance_km`, `tip`, `coupon_code`, `loyalty_points_to_redeem`.
4. `pricing.engine.js` computes:
   - **Service charge:** 3 tiers based on subtotal.
   - **Delivery fee:** 4 tiers based on subtotal.
   - **KM surcharge:** Per-km rate beyond free radius, tiered by subtotal.
   - **Tip:** Customer-chosen amount.
5. `slash.engine.js` applies visual slash display (cosmetic anchors showing "was ₹X, now ₹Y").
6. Customer taps "Place Order" → `createCheckoutSession()`:
   - Validates customer status, delivery address, branch marketplace settings.
   - Validates each cart item (visibility, stock, price).
   - Server-side distance validation (±20% tolerance vs client-reported).
   - Creates Razorpay order for the computed `grand_total`.
   - Persists `CheckoutSession` with full cart snapshot, pricing, patient info.
7. Razorpay SDK opens on customer device → customer completes payment.
8. `confirmCheckoutPayment()` verifies Razorpay signature → `_createOrderFromSession()`:
   - Creates `MarketplaceOrder` (status `PLACED`, payment `PAID`).
   - Creates `MarketplaceOrderItem` rows (immutable price/name snapshots).
   - Creates `MarketplaceOrderPrescription` rows (if uploaded).
   - Creates initial `MarketplaceOrderStatusHistory` (PLACED).
   - Generates distinct `pickup_otp` and `delivery_otp` (4-digit, guaranteed different).
   - Snapshots commission rate for payout audit.
   - Marks `CheckoutSession` as `paid`.
   - Fires `fireOrderPlacedEvents()`:
     - SSE `marketplace_new_order` to all active ERP users of the shop.
     - SSE `marketplace_new_order` to all connected CAdmins.
     - Push notification to customer (order placed confirmation).

### Phase 2 — Pharmacy Processing

9. Pharmacy ERP receives order via SSE (`marketplace_new_order`) with audio alert, or via polling.
10. Pharmacy clicks **"Bill & Accept"**:
    - Calls `acceptOrder()` → `transitionOrderStatus(ACCEPTED)`.
    - Sets `accepted_at` timestamp.
    - **Auto-creates `Delivery` record** (status `PENDING_ASSIGNMENT`).
    - SSE + Push to CAdmins and customer.
11. Alternatively, pharmacy clicks **"Reject"**:
    - Requires rejection reason (`OUT_OF_STOCK`, `PRESCRIPTION_INVALID`, `STORE_CLOSED`, `OTHER`).
    - `transitionOrderStatus(REJECTED)` → terminal state.
    - Prescriptions expire in 10 days.

### Phase 3 — Rider Assignment (CAdmin Manual)

12. CAdmin sees order in marketplace orders panel with delivery status `PENDING_ASSIGNMENT`.
13. CAdmin opens rider assignment → `getAvailableRidersForOrder()`:
    - Fetches all `ACTIVE` riders (not deleted).
    - Sorts by online status first, then Haversine distance to pharmacy.
    - Gets real driving distances for top 25 riders via distance API.
    - Simulates earnings for `INDEPENDENT` riders (pickup_fee + drop_fee + surge + floor).
14. CAdmin selects rider → `assignRiderToOrder()`:
    - Calculates Leg 1 (rider → pharmacy) + Leg 2 (pharmacy → customer) driving distances.
    - Calculates rider earnings via `calculateDeliveryEarnings()`.
    - Updates `Delivery`: sets `rider_id`, status `RIDER_NOTIFIED`, writes earnings + distances.
    - Creates `DeliveryAssignmentLog` (action `NOTIFIED`).
    - Registers active delivery for SSE location broadcasting.
    - SSE `delivery_assigned` to rider (foreground instant).
    - Push `incomingDelivery` to rider (background failsafe with alarm audio).
    - SSE `delivery_status_changed` to all CAdmins.

### Phase 4 — Rider Fulfillment

15. **Rider accepts** → `acceptDelivery()`:
    - Delivery status → `ACCEPTED`.
    - Registers active delivery for presence tracking.
    - SSE to customer (`delivery_update`).
    - SSE to CAdmins.
    - *(Or rider declines → resets to `PENDING_ASSIGNMENT`, CAdmin reassigns.)*

16. **Pharmacy marks ready** → `markReady()` → `transitionOrderStatus(READY_FOR_PICKUP)`:
    - Sets `ready_at` timestamp.
    - SSE `order_ready_for_pickup` to assigned rider.
    - Push `orderReadyForPickup` to rider.

17. **Rider arrives at pharmacy** → `updateDeliveryStatus(ARRIVED_AT_PHARMACY)`:
    - Geofence check: rider GPS must be within 200m of pharmacy coordinates.
    - Sets `arrived_at_pharmacy_at`.

18. **Rider picks up** → `updateDeliveryStatus(PICKED_UP)`:
    - Validates `pickup_otp` (rider enters the 4-digit code shown on pharmacy ERP).
    - Validates order status is `READY_FOR_PICKUP`.
    - Sets `picked_up_at`.

19. **Rider en route** → `updateDeliveryStatus(EN_ROUTE)`:
    - No geofence check. Manual transition.

20. **Rider arrives at customer** → `updateDeliveryStatus(ARRIVED_AT_CUSTOMER)`:
    - Geofence check: rider GPS within 200m of delivery address coordinates.
    - Sets `arrived_at_customer_at`.
    - Customer can now see `delivery_otp` in their app (previously hidden).

21. **Rider completes** → `completeDeliveryWithOtp()`:
    - Validates `delivery_otp` (customer shares 4-digit code with rider).
    - **Own transaction** (bypasses `transitionOrderStatus`):
      - Delivery → `DELIVERED`, sets `delivered_at`.
      - Order → `COMPLETED`, sets `completed_at`.
      - Writes `MarketplaceOrderStatusHistory` (`changed_by_type = "rider"`).
    - Unregisters active delivery.
    - Fires `fireOrderStatusChangedEvents(COMPLETED)`.
    - SSE to customer, CAdmins.
    - Awards loyalty points (`earnLoyaltyPoints`).

### Phase 5 — Post-Completion

22. Prescriptions expire based on terminal status:
    - `COMPLETED` / `REJECTED`: 10 days.
    - `CANCELLED`: 1 day.
23. Cron purges expired prescription files from S3 (soft-delete → hard-delete).
24. Pharmacy billing: `getMarketplaceBillingData()` available for `PLACED`/`ACCEPTED` orders. Generates sales invoice in ERP.
25. Rider earnings: recorded in `RiderEarningLedger`, included in weekly `RiderPayout`.
26. Pharmacy earnings: `subtotal - commission`, settled via `PharmacyPayout`.

## 5. Pricing Model

### Configuration

Single-row `DeliveryPricingConfig` table (to be restructured per fulfillment type).

### Charge Components

| Charge | Tiers | Basis | Goes To |
|--------|-------|-------|---------|
| Service Charge | 3 tiers (by subtotal) | Order subtotal | Cureli platform |
| Delivery Fee | 4 tiers (by subtotal) | Order subtotal | Cureli platform |
| KM Surcharge | 2 tiers (by subtotal) | Distance beyond free radius | Cureli platform |
| Tip | Flat | Customer choice | Rider |

### Planned Additions

- **Packing Charge:** 3 tiers (same structure as service charge), per fulfillment type.
- **Per-charge toggles:** Each charge component independently enableable/disableable per fulfillment type.
- **Per-fulfillment-type pricing:** Separate `DeliveryPricingConfig` row per `fulfillment_type`.

## 6. OTP Security Model

Two distinct 4-digit OTPs are generated at order creation (`generateDistinctOtps()`):

| OTP | Purpose | Who Sees It | Who Enters It | When |
|-----|---------|-------------|---------------|------|
| `pickup_otp` | Verify rider at pharmacy | Pharmacy ERP | Rider app | Rider picks up (step 18) |
| `delivery_otp` | Verify rider at customer | Customer app (only after `ARRIVED_AT_CUSTOMER`) | Rider app | Rider completes (step 21) |

OTPs are stored as plain text on `MarketplaceOrder`. The `delivery_otp` is only exposed to the customer app when `delivery.status === "ARRIVED_AT_CUSTOMER"`.

## 7. Background Workers (Cron)

| Worker | Interval | Target | Action |
|--------|----------|--------|--------|
| `riderAssignmentTimeoutWorker` | 30s | `RIDER_NOTIFIED` > 120s | Auto-declines → resets to `PENDING_ASSIGNMENT` |
| `staleAssignmentWorker` | 2min | `RIDER_NOTIFIED` > 5min | Alerts CAdmin (no auto-action) |
| `staleRiderWorker` | 5min | Riders with stale GPS > 5min | Offlines rider, resets `RIDER_NOTIFIED` deliveries, flags `ACCEPTED+` for review |

All three workers query the `Delivery` table only. Orders without a `Delivery` record are unaffected.

## 8. Event and Notification Flow

### SSE Events

| Event | Target | Trigger |
|-------|--------|---------|
| `marketplace_new_order` | ERP users, CAdmins | Order placed |
| `marketplace_order_status_changed` | ERP users, CAdmins, customer mobile | Any order status change |
| `delivery_assigned` | Rider | CAdmin assigns rider |
| `delivery_status_changed` | CAdmins, customer mobile | Any delivery status change |
| `order_ready_for_pickup` | Rider | Pharmacy marks ready |
| `delivery_cancelled` | Rider | Order cancelled/rejected/reassigned |
| `delivery_update` | Customer mobile | Rider delivery milestones |

### Push Notifications

| Push | Target | Trigger |
|------|--------|---------|
| Order placed confirmation | Customer | Order created |
| Order status changed | Customer | ACCEPTED, REJECTED, READY_FOR_PICKUP, COMPLETED, CANCELLED |
| Incoming delivery (alarm) | Rider | CAdmin assigns |
| Order ready for pickup | Rider | Pharmacy marks ready |
| Delivery cancelled | Rider | Order cancelled/rejected/reassigned |

## 9. Key Code Locations

| Area | File |
|------|------|
| Order state machine | `backend/src/modules/marketplace-orders/marketplace.orders.service.js` |
| Order events (SSE + Push) | `backend/src/modules/marketplace-orders/marketplace.orders.events.js` |
| Checkout + order creation | `backend/src/modules/mobile/checkout/mobile.checkout.service.js` |
| Pricing engine | `backend/src/modules/mobile/checkout/pricing.engine.js` |
| Rider delivery workflow | `backend/src/modules/rider/delivery/rider.delivery.service.js` |
| CAdmin rider assignment | `backend/src/modules/cadmin/delivery/cadmin.delivery.service.js` |
| CAdmin order override | `backend/src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.service.js` |
| Schema (orders) | `backend/prisma/schema/marketplace-orders.prisma` |
| Schema (delivery) | `backend/prisma/schema/delivery.prisma` |
| Schema (enums) | `backend/prisma/schema/enums.prisma` |
| Schema (marketplace) | `backend/prisma/schema/marketplace.prisma` |

---
