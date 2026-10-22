Here are both documents. You can save them as `.md` files in your project root or a `/docs` folder.

---

## Document 1: Pickup Fulfillment — Technical Reference

# Pickup Fulfillment — Technical Reference

> Comprehensive documentation of the In-Person Pickup flow across all Cureli platforms.
> Last updated: October 2026

---

## 1. Overview

Pickup allows customers to collect their medicine order directly from the pharmacy
counter instead of having it delivered. This eliminates delivery fees, distance
surcharges, and the need for a delivery partner.

**Key characteristics:**
- No delivery partner / rider involved
- No `Delivery` record created in the database
- Customer receives a 4-digit pickup code (stored as `delivery_otp`)
- Either party can complete the order: pharmacy (via OTP verification) or customer (self-confirm)
- Delivery fee and km surcharge are always ₹0.00
- Packing charge may apply (independently toggled in CAdmin pricing config)

---

## 2. Database Schema

### 2.1 FulfillmentType Enum (`enums.prisma`)

```
enum FulfillmentType {
  INSTANT_DELIVERY
  PICKUP
  SAME_DAY
  NEXT_DAY
}
```

### 2.2 MarketplaceOrder Model (relevant fields)

```prisma
model MarketplaceOrder {
  fulfillment_type  FulfillmentType  @default(INSTANT_DELIVERY)
  packing_charge    Decimal          @default(0)
  delivery_otp      String?          // Used as pickup code for PICKUP orders
  pickup_otp        String?          // Rider pickup PIN (not used for PICKUP)

  @@index([fulfillment_type, status])
}
```

### 2.3 DeliveryPricingConfig Model

One row per fulfillment type. `fulfillment_type` is `@unique`.

```prisma
model DeliveryPricingConfig {
  fulfillment_type        FulfillmentType  @default(INSTANT_DELIVERY) @unique
  service_charge_enabled  Boolean          @default(true)
  delivery_fee_enabled    Boolean          @default(true)
  km_surcharge_enabled    Boolean          @default(true)
  packing_enabled         Boolean          @default(false)

  // Packing charge tiers (same subtotal thresholds as service charge)
  packing_tier_1_max      Decimal?
  packing_tier_1_charge   Decimal?
  packing_tier_2_max      Decimal?
  packing_tier_2_charge   Decimal?
  packing_tier_3_charge   Decimal?

  // ... other existing pricing fields
}
```

**Default PICKUP config (from migration script):**
| Field | Value |
|---|---|
| service_charge_enabled | true |
| delivery_fee_enabled | **false** |
| km_surcharge_enabled | **false** |
| packing_enabled | **true** |

### 2.4 CheckoutSession Model

```prisma
model CheckoutSession {
  fulfillment_type  String   @default("INSTANT_DELIVERY") @db.VarChar(30)
  packing_charge    Decimal  @default(0)
}
```

---

## 3. Order State Machine (Pickup)

```
PLACED ──→ ACCEPTED ──→ READY_FOR_PICKUP ──→ COMPLETED
  │            │               │
  ↓            ↓               ↓
CANCELLED   CANCELLED       CANCELLED
               ↓
            REJECTED (from PLACED only)
```

**Key differences from Instant Delivery:**
- No `Delivery` record is created on ACCEPTED
- `READY_FOR_PICKUP` means "ready for customer to collect" (not "ready for rider")
- COMPLETED is triggered by OTP verification (pharmacy) or self-confirm (customer)
- No rider lifecycle states (PENDING_ASSIGNMENT, EN_ROUTE, etc.)

---

## 4. Backend APIs

### 4.1 New Endpoints

| Method | Path | Actor | Description |
|---|---|---|---|
| POST | `/mobile/orders/:orderId/confirm-pickup` | Customer | Self-confirm pickup. No body. Idempotent. |
| POST | `/marketplace-orders/:orderId/complete-pickup` | Pharmacy ERP | Verify customer's pickup code. Body: `{ otp }`. Idempotent. |

### 4.2 Modified Endpoints

| Endpoint | Change |
|---|---|
| `POST /mobile/checkout/quote` | Accepts `fulfillment_type` in body. Pickup: distance_km=0, delivery_fee=0. |
| `POST /mobile/checkout/session` | Accepts `fulfillment_type`. `delivery_address_id` nullable for pickup. |
| `GET /mobile/orders/:orderId` | Exposes `delivery_otp` when `fulfillment_type=PICKUP` AND `status=READY_FOR_PICKUP`. |
| `GET /marketplace-orders/:orderId` | Adds `customer_pickup_code` field (= `delivery_otp` for pickup at READY_FOR_PICKUP). |
| `GET /cadmin/marketplace-orders` | New optional query param `fulfillment_type` (comma-separated filter). |
| `GET /cadmin/marketplace/pricing-config` | New query `?all=true` returns all 4 configs. `?fulfillment_type=PICKUP` for specific. |
| `PUT /cadmin/marketplace/pricing-config` | Body includes `fulfillment_type` to update specific config row. |
| SSE `ORDER_PLACED` / `ORDER_STATUS_CHANGED` | Payload includes `fulfillment_type`. |

### 4.3 Core Service Function

**`completePickupOrder({ order_id, actor_type, actor_id, shop_id, otp })`**

Location: `backend/src/modules/marketplace-orders/marketplace.orders.service.js`

Logic:
1. Validate order exists and is PICKUP type
2. If already COMPLETED → return `{ already_completed: true }` (idempotent)
3. If not READY_FOR_PICKUP → throw error
4. If actor is pharmacy → verify `otp === order.delivery_otp`
5. If actor is customer → no OTP required
6. Delegate to `transitionOrderStatus()` with target COMPLETED

---

## 5. Pricing Engine

Location: `backend/src/modules/mobile/checkout/pricing.engine.js`

**Pickup-specific behavior:**
- `distance_km` is always passed as `0`
- `delivery_fee_enabled = false` → delivery fee = ₹0
- `km_surcharge_enabled = false` → km surcharge = ₹0
- `packing_enabled = true` → packing charge computed from subtotal tiers
- Service charge still applies (uses same tier logic as instant)

**Packing charge tiers (example):**
| Subtotal Range | Charge |
|---|---|
| ₹0 – ₹299 | ₹10 |
| ₹300 – ₹599 | ₹15 |
| ₹600+ | ₹20 |

---

## 6. Cron Jobs

### Stale Pickup Auto-Cancel

Location: `backend/src/cron/stalePickupWorker.js`

- **Schedule:** Every 30 minutes (`*/30 * * * *`)
- **Logic:** Find all orders where `fulfillment_type = PICKUP` AND `status = READY_FOR_PICKUP` AND `ready_at <= now - 24 hours`
- **Action:** Call `transitionOrderStatus()` with `actor_type: "SYSTEM"`, `actor_id: "cron-stale-pickup"`, target `CANCELLED`
- **Registered in:** `backend/src/cron/jobs.js`

---

## 7. Customer App (React Native / Expo)

### 7.1 Cart — Fulfillment Selector

**File:** `src/features/cart/components/FulfillmentTypeSelector.tsx`

Three options displayed vertically:
| Option | Tag | Detail Line |
|---|---|---|
| Instant Delivery | FASTEST | "Delivery fee and distance surcharge apply" |
| In-Person Pickup | NO DELIVERY FEE (green) | "No delivery fee, no distance charge — lowest total" (green) |
| Same Day Delivery | BUDGET / CLOSED | "Delivered to you by end of day" / "Unavailable after 3 PM" |

Same Day locks automatically when `new Date().getHours() >= 15`.

### 7.2 Cart — Pickup Location Card

**File:** `src/features/cart/components/PickupLocationCard.tsx`

Replaces `DeliveryAddressCard` when fulfillment = PICKUP.
Shows pharmacy name, branch address, and info box about pickup code.

### 7.3 Checkout Flow

**File:** `src/features/cart/hooks/useCheckout.ts`

Pickup-specific behavior:
- Skips delivery address validation
- Skips distance calculation
- Forces `tip = 0` and `distance_km = 0`
- Passes `fulfillment_type: "PICKUP"` to backend

### 7.4 Bill Details

**File:** `src/features/cart/components/BillDetailsCard.tsx`

- Delivery fee shows as "FREE" (not hidden)
- Tip selector hidden
- Packing charge row shown when > 0

### 7.5 Active Tracking — Pickup View

**File:** `src/features/orders/components/tracking/PickupActiveView.tsx`

Full-screen map + `@gorhom/bottom-sheet` (snap points 36%/72%/94%).
Composition:
- `PickupStatusHero` — status lines, rotating subtitle, OTP digit boxes, self-confirm button
- `TrackingDelayBanner` — preparation delay warnings
- `TrackingShopCard` — pharmacy info with Call + Navigate buttons
- `TrackingOrderDetails` — items, bill breakdown, support

**Map:** Shows pharmacy marker + customer location marker + dashed polyline.
Uses `toNum()` helper to coerce string coordinates to numbers (prevents Android crash).

### 7.6 Order Detail (Terminal)

**File:** `src/features/orders/screens/OrderDetailScreen.tsx`

- Fulfillment type badge (orange for pickup)
- "Pickup Location" label with Store icon
- Delivery fee row shows "FREE"
- Packing charge row
- Timeline uses `getStatusLabelForFulfillment()` for correct labels

### 7.7 Status Labels (Pickup)

**File:** `src/features/orders/constants/orders.constants.ts`

| Status | Instant Label | Pickup Label |
|---|---|---|
| READY_FOR_PICKUP | Out for Delivery | **Ready for Pickup** |
| COMPLETED | Delivered | **Picked Up** |

### 7.8 Self-Confirm API

**File:** `src/features/marketplace/api/orders.api.ts`

```typescript
confirmPickup(orderId: string) {
  return api.post(`/mobile/orders/${orderId}/confirm-pickup`);
}
```

---

## 8. Pharmacy ERP (React)

### 8.1 Order List

**File:** `pharmacy-web/src/pages/marketplace-orders/components/OrderCard.jsx`

- Fulfillment badge (orange "Pickup" pill with Store icon)
- Rider badge hidden for pickup orders

### 8.2 Order Detail Panel

**File:** `pharmacy-web/src/pages/marketplace-orders/components/OrderDetailPanel.jsx`

**Pickup OTP Verification Flow:**
1. When order is PICKUP + READY_FOR_PICKUP, an orange "Verify Customer Pickup Code" card appears
2. Pharmacy staff asks customer for their 4-digit code
3. Staff types code into numeric input field
4. Clicks "Verify & Complete" → calls `POST /complete-pickup` with `{ otp }`
5. Backend validates OTP match → transitions to COMPLETED
6. On mismatch → inline red error "Invalid pickup code. Please verify with the customer."

**Important:** The customer's pickup code is NOT displayed to the pharmacy.
The pharmacy must receive it verbally from the customer.

**Other pickup adaptations:**
- "Complete" header button hidden (replaced by verify flow)
- Delivery progress tracker hidden
- Address section labeled "Pickup Location"
- Packing charge shown in earnings breakdown

---

## 9. CAdmin (React)

### 9.1 Order List & Filters

**File:** `cadmin-web/src/pages/marketplace/Orders/`

- Fulfillment type dropdown filter (Instant / Pickup / Same Day / Next Day)
- Fulfillment badge column in orders table
- Rider assignment column hidden for pickup
- Delivery status column hidden for pickup

### 9.2 Order Detail Modal

**File:** `cadmin-web/src/pages/marketplace/Orders/comps/OrderDetailModal.jsx`

- Fulfillment badge in header
- Overview tab shows pickup-specific labels

### 9.3 Delivery Tracking Panel

**File:** `cadmin-web/src/pages/marketplace/Orders/comps/panels/DeliveryTrackingPanel.jsx`

**Guard 0 (top of component):**
```javascript
if (order.fulfillment_type === "PICKUP") {
  return <PickupPlaceholder />; // Store icon + "No Delivery Partner" message
}
```

Also guards `fetchRiders()` and the trigger `useEffect` to prevent
"cannot fetch rider" errors on pickup orders.

Shows customer pickup code and delivery OTP for CAdmin override.

### 9.4 Pricing Page

**File:** `cadmin-web/src/pages/marketplace/Pricing/DeliveryPricingPage.jsx`

- Tab bar with 4 fulfillment types (brand color `#05015A`)
- Each tab loads its own `DeliveryPricingConfig` row
- Pickup tab shows info banner about toggling individual charges
- Collapsible sections with inline enable/disable toggles
- Packing charge section always visible (independent toggle)

---

## 10. Notifications

### Push Notifications (Pickup-specific)

| Event | Title | Body |
|---|---|---|
| ORDER_READY_FOR_PICKUP | "Order Ready for Pickup!" | "Your order is ready. Show your pickup code at {pharmacy}." |
| ORDER_COMPLETED (pickup) | "Order Picked Up!" | "Thanks for picking up your order from {pharmacy}." |

### SSE Events

All SSE payloads include `fulfillment_type` field.
Customer app uses this to route to correct tracking view.

---

## 11. Migration & Setup

### Steps to enable pickup on a fresh environment:

```bash
# 1. Run Prisma migration
npx prisma migrate dev --name add-fulfillment-type-and-packing

# 2. Regenerate Prisma client
npx prisma generate

# 3. Seed pricing configs for all 4 fulfillment types
node scripts/migrate-fulfillment-type.mjs
```

### Migration script output:

Creates 4 rows in `DeliveryPricingConfig`:
| fulfillment_type | delivery_fee | km_surcharge | packing |
|---|---|---|---|
| INSTANT_DELIVERY | enabled | enabled | disabled |
| PICKUP | **disabled** | **disabled** | **enabled** |
| SAME_DAY | enabled | enabled | disabled |
| NEXT_DAY | enabled | enabled | disabled |

---

## 12. Key Design Decisions

| Decision | Rationale |
|---|---|
| `delivery_otp` reused as pickup code | Avoids new DB column. Same 4-digit OTP field serves dual purpose based on fulfillment type. |
| Customer can self-confirm without OTP | Customer has no incentive to abuse — they paid upfront and won't receive medicine if they don't actually pick up. |
| Both parties can complete (idempotent) | Race condition safe. If pharmacy verifies OTP at same moment customer self-confirms, second call returns `already_completed: true`. |
| No `Delivery` record for pickup | `NON_DELIVERY_FULFILLMENT_TYPES = ["PICKUP"]` guard in `transitionOrderStatus()` prevents auto-creation on ACCEPTED. |
| 24h stale auto-cancel | Prevents orders from sitting in READY_FOR_PICKUP indefinitely. Cron runs every 30 min. |
| Pickup shows "FREE" not hidden | Transparency. Customer sees the delivery fee row with ₹0 / FREE label so they understand the savings. |
| Pharmacy never sees pickup code | Security. Customer must verbally share the code, proving they are physically present at the counter. |

