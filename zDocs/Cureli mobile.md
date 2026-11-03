<!-- zDocs/Cureli mobile.md (do not remove this comment) -->
# Cureli Delivery — Rider App
## Architecture Decision Record (ADR)
### Internal Technical Reference Document

---

> **Purpose of this document**
> This document records every architectural decision made during the pre-implementation design session for the Cureli Delivery rider app. It is not a scope document. It is not a code document. It is the definitive record of *why* things are designed the way they are, what was considered, what was rejected, and what constraints the implementation must operate within.

---

## Section 1 — Project Context

### 1.1 What Cureli Is

Cureli is a B2B pharmacy ERP and B2C marketplace platform. It has five components in a monorepo:

| Component | Technology | Purpose |
|---|---|---|
| `backend` | Node.js + Express + Prisma + PostgreSQL + Redis | Single API server for all surfaces |
| `pharmacy-web` | React + Vite + Tailwind | ERP dashboard for pharmacy staff |
| `cadmin-web` | React + Vite + Tailwind | Internal admin panel for Cureli operators |
| `landing-web` | React + Vite + Tailwind | Public marketing site |
| `cureli-mobile` | React Native + Expo Router + TypeScript | Customer-facing mobile app |

### 1.2 What Is Being Added

A sixth component: `cureli-delivery` — a standalone React Native + Expo Router app for delivery riders. It shares the same backend, same database, and same monorepo. It does not share any code with `cureli-mobile`.

The backend gains a new delivery module. The cadmin-web gains a new Delivery section. The pharmacy-web gains additions to the order panel. The customer mobile app gains live tracking additions.

---

## Section 2 — Infrastructure Decisions

### 2.1 Backend Process Model

**Decision:** Single-process, no cluster mode.

**Evidence from production:**
```
pm2 list
│ 0 │ cureli-backend │ fork │ online │
```

**Consequence:** The existing in-memory SSE singleton (`sse.service.js`) is safe for the delivery module. SSE uses a `Map<entityId, Set<Response>>` pattern. A fourth map — `riderClients` — is added to the existing singleton. No Redis pub/sub is needed.

**Future risk recorded:** If the backend is ever moved to cluster mode or multiple instances, the in-memory SSE maps will break. At that point, `sse.service.js` must be replaced with a Redis pub/sub adapter. The interface (`addRiderClient`, `removeRiderClient`, `notifyRider`) is designed so only that one file changes. Nothing in the delivery module calls the SSE service directly except through those interface methods.

---

### 2.2 Geospatial Strategy

**Decision:** Application-level Haversine distance calculation. No PostGIS.

**Rationale:** The existing schema has no PostGIS extension. The existing codebase has no geospatial queries. Introducing PostGIS now adds operational complexity (extension must be enabled on the DB, Prisma raw queries required, migration risk) for a benefit that is not needed at current scale.

**Location update frequency:**
- Rider online, idle (no active delivery): every **10 seconds**
- Rider on active delivery: every **5 seconds**

**Storage for Phase 1:** Latest location written directly to `Rider.current_lat` / `Rider.current_lng` / `Rider.last_location_at` in PostgreSQL.

**Abstraction boundary recorded:** All location writes go through a `LocationService` abstraction. If Redis is introduced for high-frequency location writes later, only that service changes. Nothing in the assignment engine or delivery flow calls Prisma directly for location updates.

**PostGIS migration path recorded:** When rider count per zone exceeds ~200 concurrent online, a full-table Haversine scan becomes measurable latency. At that point, enable PostGIS, add a `geography` column to `Rider`, migrate the location service, and replace the Haversine function with `ST_Distance`. The rest of the system does not change.

---

### 2.3 Redis

**Current usage:** Redis (`ioredis`) is present in `backend/package.json`. It is used for rate limiting (`rate-limit-redis`).

**Delivery module usage in Phase 1:** None. Redis is not used for location, locking, or pub/sub in Phase 1.

**Future usage recorded:** If location update frequency causes PostgreSQL write pressure, live rider locations move to Redis hashes (`HSET rider:{id} lat lng ts`). If the backend moves to multi-process, SSE moves to Redis pub/sub. Both are isolated changes.

---

## Section 3 — Authentication Architecture

### 3.1 Rider Auth Pattern

**Decision:** Mirror `CureliMobileUser` auth pattern exactly, not the ERP `User` pattern.

**Why mobile pattern, not ERP pattern:**
- Riders authenticate with phone + OTP only. No password. No Google OAuth.
- Sessions are device-bound with push tokens stored on the session row.
- The ERP pattern uses password hashes, email verification, Google OAuth, and role-based permissions — none of which apply to riders.

**Token structure:**
```
{
  sub: riderId,
  sessionId: riderSessionId,
  type: "rider"
}
```

**Access token expiry:** 15 minutes (same as mobile)

**Refresh token expiry:** 90 days (same as mobile)

**JWT secret:** `RIDER_JWT_SECRET` — a new environment variable, completely isolated from `MOBILE_JWT_SECRET`, `JWT_SECRET`, and `CADMIN_JWT_SECRET`.

**Middleware:** `rider.auth.js` — mirrors `mobile.auth.js` exactly. Attaches `req.rider` and `req.riderSession`. Never attaches `req.user` or `req.mobileUser`. Cross-contamination between auth contexts is architecturally impossible by design.

**Session validity checks (in order):**
1. JWT signature and expiry
2. Session exists in DB
3. Session belongs to token subject
4. Session not revoked
5. Session not expired
6. `logout_all_issued_at` check — any session created before this timestamp is invalid
7. Account state — `SUSPENDED` or `BLOCKED` returns 403 with reason, `deleted_at` set returns 404

**Auto-logout on suspension:** When CAdmin suspends a rider, the backend revokes all active `RiderSession` rows for that rider. The next API call from the app hits check 4 and returns 401. The app redirects to a suspension screen.

---

### 3.2 OTP Pattern

**Decision:** Mirror `CureliMobileUser` OTP fields exactly.

Fields on `Rider`:
- `login_otp_hash` — bcrypt hash of the OTP, never stored plaintext
- `login_otp_expires` — timestamp
- `login_otp_attempts` — incremented on each wrong attempt
- `otp_cycle_failures` — incremented when a full OTP cycle fails (sent but never verified)
- `otp_locked_until` — set when attempts are exhausted

**OTP provider:** Same SMS provider already used for `CureliMobileUser`. No new provider integration.

---

## Section 4 — Data Architecture Decisions

### 4.1 The Delivery Table and Order Completion

**Decision:** The `Delivery` table owns the foreign key to `MarketplaceOrder` via `order_id` (unique). `MarketplaceOrder` does not gain a new column — it gains a Prisma relation via the FK on the `Delivery` side.

**Order completion ownership (Option A — confirmed):**

When a rider taps "Mark as Delivered":
1. `Delivery.status` → `DELIVERED` 
2. `MarketplaceOrder.status` → `COMPLETED`

Both happen in the same database transaction. Atomicity is guaranteed. The pharmacy does not manually complete delivery orders. For delivery orders, the system completes them.

**Why this is correct:** The pharmacy handed the package to the rider at `PHARMACY_CONFIRMED`. After that point, the pharmacy has no visibility into whether the rider actually reached the customer. The rider's confirmation is the ground truth event.

---

### 4.2 The Pharmacy Handover — Hard Block (Option B — confirmed)

**Decision:** Double-confirmation at pickup is a hard block with no timeout.

**Flow:**
1. Rider taps "I've Arrived at Pharmacy" → `Delivery.status = ARRIVED_AT_PHARMACY`
2. Pharmacy staff taps "Hand Over Package" in ERP → `Delivery.status = PHARMACY_CONFIRMED`
3. Only after step 2 does the rider see the "Package Picked Up" button
4. Rider taps "Package Picked Up" → `Delivery.status = PICKED_UP`

**If pharmacy is unresponsive:** Rider calls pharmacy using the pharmacy's business number (visible on the active delivery screen). CAdmin can manually advance the status from the fleet dashboard.

**Why no timeout:** A timeout auto-advancing `PHARMACY_CONFIRMED` creates a scenario where the rider could mark "Picked Up" without the pharmacy ever handing over the package. This creates disputes about whether the package was actually collected. The hard block is intentional friction that protects both the pharmacy and Cureli.

---

### 4.3 Assignment Race Condition Guard

**Decision:** The assignment engine uses a conditional atomic update to prevent two orders assigning the same rider simultaneously.

**Pattern:** When assigning rider R to delivery D, the Prisma update includes:
```
where: { delivery_id: D, status: 'PENDING_ASSIGNMENT', rider_id: null }
```

If another process assigned rider R between the candidate selection and the update, the `rider_id: null` condition fails. The update affects 0 rows. The engine selects the next candidate. No application-level lock needed. No Redis lock needed. PostgreSQL row-level locking handles this via the `UPDATE ... WHERE` atomicity guarantee.

---

### 4.4 Bank Details Storage

**Decision:** Bank details stored as flat fields on the `Rider` model, not as a JSON blob.

Fields: `bank_account_number`, `bank_ifsc`, `bank_holder_name`, `bank_name`

**Why not JSON:** Payout processing requires querying and validating individual fields. JSON blobs require application-level parsing and cannot be indexed or validated at the DB level. Flat fields are queryable, indexable, and unambiguous.

**Bank details change flow:** When a rider updates bank details, `bank_verified` is set to `false`. CAdmin sees a flag on the rider profile. CAdmin must manually re-verify before payouts resume for that rider. This prevents a compromised rider account from redirecting payouts to a different bank account.

---

### 4.5 Emergency Contact Storage

**Decision:** Emergency contact stored as flat fields, not JSON.

Fields: `emergency_contact_name`, `emergency_contact_phone`

**Why not JSON:** SOS alert SMS reads these fields directly. Flat fields are simpler, safer, and require no parsing in the SOS code path — which is a critical path that must not fail due to malformed JSON.

---

### 4.6 Payout Architecture

**Phase 1 — Manual payout only.**

**Workflow:**
1. Cron runs every Monday, aggregates the previous week's unpaid `RiderEarningLedger` entries per rider
2. A `RiderPayout` row is created per rider with `status: PENDING` and `payment_method: MANUAL`
3. CAdmin views the payout list in the admin panel
4. CAdmin performs the bank transfer externally (NEFT/IMPS via their bank)
5. CAdmin records: UTR/transaction reference, amount, payment date, bank used, optional notes
6. System marks the `RiderPayout` as `COMPLETED` and sets all linked `RiderEarningLedger` entries to `is_paid: true`
7. Rider receives in-app notification: "Your payout of ₹X has been processed"

**RazorpayX migration path (Phase 2+):**
The `RiderPayout` model has `payment_method` as an enum (`MANUAL` | `RAZORPAY_X`) and a `provider_payload` Json field (null for manual). When RazorpayX is integrated:
- A new payout service reads pending payouts
- Calls RazorpayX API, stores response in `provider_payload`
- Updates status through the same `PENDING → PROCESSING → COMPLETED/FAILED` flow
- CAdmin workflow and data model do not change — only the processing step is automated

**This was an explicit design requirement from the client session.**

---

### 4.7 Masked Calling

**Decision:** Deferred to Phase 2. No telephony provider selected.

**Phase 1 behaviour:**
- Rider → Pharmacy: pharmacy `Branch.contact_number` is shown directly. Business number, not personal. Acceptable.
- Rider → Customer: "Call Customer" button exists in the UI. In Phase 1 it is disabled with a "Coming Soon" indicator. No customer phone number is exposed.

**Schema accommodation:** `Delivery` has a `masked_call_enabled` Boolean field, defaulting to `false`. When a provider is onboarded, this is flipped to `true` per-zone or globally, and the call routing layer is added. The delivery flow screen checks this field to decide whether the button is active or disabled. No delivery flow changes are required when Phase 2 is implemented.

**Provider candidates noted for Phase 2:** Exotel, Twilio, Plivo. Client to confirm.

---

## Section 5 — Integration Points with Existing System

### 5.1 Order Assignment Trigger

**Where in the codebase:** `backend/src/modules/marketplace-orders/marketplace.orders.events.js`

**Specifically:** Inside `fireOrderStatusChangedEvents()`, when `new_status === 'READY_FOR_PICKUP'`.

**Why here and not in the service:** `marketplace.orders.service.js` calls `fireOrderStatusChangedEvents()` post-commit. The assignment engine must run after the transaction commits — not inside it. Running it inside the transaction would hold the DB row lock open for the entire cascade duration (potentially 30 seconds × N attempts), which is unacceptable.

**What the hook does:**
1. Reads `order.branch_id` → fetches `BranchMarketplaceSettings.latitude/longitude` for pickup coordinates
2. Reads `order.delivery_address_snapshot.latitude/longitude` for drop coordinates
3. Calculates base distance using Haversine
4. Resolves the zone from the branch's city
5. Creates a `Delivery` row with `status: PENDING_ASSIGNMENT`
6. Calls the assignment engine

---

### 5.2 SSE Extension

**What changes in `sse.service.js`:** A fourth map and three methods are added:

```
riderClients = new Map()   // Map<riderId, Set<Response>>
addRiderClient(riderId, res)
removeRiderClient(riderId, res)
notifyRider(riderId, eventName, data)
```

No existing methods change. No existing clients are affected.

**SSE events the rider app listens for:**
- `ORDER_ASSIGNED` — triggers the full-screen accept/reject overlay
- `PHARMACY_CONFIRMED_HANDOVER` — unlocks the "Package Picked Up" button
- `DELIVERY_STATUS_UPDATE` — general status sync
- `ACCOUNT_SUSPENDED` — forces immediate offline + redirect to suspension screen
- `PAYOUT_PROCESSED` — triggers in-app notification display
- `CADMIN_UNBLOCKED_HANDOVER` — manual CAdmin override of pharmacy confirmation

---

### 5.3 Notification System

**Decision:** Rider push notifications are **not** routed through the existing `notification.service.js`.

**Why:** `notification.service.js` handles ERP users and CAdmins via email, in-app (ERP), and SMS. It has no mobile push channel. Mobile push for customers is handled separately via `CureliMobileSession.push_token`. Rider push follows the same separate pattern.

**Rider push architecture:** Push token stored on `RiderSession.push_token`. A dedicated `riderPushService.js` (mirrors the existing mobile push service) handles Expo push notifications for riders. Rider in-app notifications are stored in `RiderNotification` table (mirrors `CureliMobileNotification` exactly).

---

### 5.4 Existing `DeliveryPricingConfig` Table

**Clarification recorded:** The existing `DeliveryPricingConfig` table in the schema is the **customer-facing delivery charge configuration** — it determines what the customer pays for delivery (tiered by order value and distance).

This is **completely separate** from the **rider earnings configuration** (`DeliveryConfig` — what the rider earns per delivery).

These two concerns must never be merged. Customer delivery fees flow into `MarketplaceOrder` financials. Rider earnings flow into `RiderEarningLedger`. They are calculated independently.

---

## Section 6 — New Component: `cureli-delivery`

### 6.1 Repository Location

```
curely_erp/
├── backend/
├── cureli-mobile/         # existing customer app
├── cureli-delivery/       # NEW rider app
├── cadmin-web/
├── pharmacy-web/
└── landing-web/
```

Monorepo. Same repository. No shared code between `cureli-delivery` and `cureli-mobile` — they are fully independent Expo apps that share only the same backend API.

---

### 6.2 Technology Stack

Mirrors `cureli-mobile` exactly:

| Concern | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo (SDK 54) | Same as `cureli-mobile` — consistent toolchain |
| Navigation | Expo Router v6 | Same as `cureli-mobile` |
| Language | TypeScript | Same as `cureli-mobile` |
| State | Zustand + MMKV persistence | Same as `cureli-mobile` |
| Server state | TanStack React Query v5 | Same as `cureli-mobile` |
| HTTP | Axios | Same as `cureli-mobile` |
| Storage | `react-native-mmkv` | Same as `cureli-mobile` |
| Maps | `react-native-maps` | Same as `cureli-mobile` |
| Push | Expo Notifications | Same as `cureli-mobile` |
| Location | `expo-location` | Required for GPS tracking — not in customer app |
| SSE | `react-native-sse` | Same as `cureli-mobile` |
| Bottom sheets | `@gorhom/bottom-sheet` | Same as `cureli-mobile` |
| Lists | `@shopify/flash-list` | Same as `cureli-mobile` |

---

### 6.3 Theme

The rider app uses a **distinct visual identity** from the customer app. The customer app is light, consumer-oriented. The rider app is dark, utility-focused, designed for glanceability while on a bike.

**Primary colour:** Cureli brand blue (same as the rest of Cureli)
**Background:** Dark (`#0D0D0D`) — reduces eye strain outdoors, saves battery on OLED screens
**Accent for online state:** Green
**Accent for offline state:** Zinc/grey
**Accent for SOS:** Red — always visible, never ambiguous

---

## Section 7 — Decisions Not Yet Made (Parking Lot)

These items were raised during the design session but are explicitly deferred. They are recorded here so they are not forgotten.

| Item | Status | Notes |
|---|---|---|
| Masked calling telephony provider | Client deciding | Exotel / Twilio / Plivo options discussed. Phase 2. |
| RazorpayX automated payouts | Explicitly deferred | Phase 2. Schema is ready for it. |
| PostGIS migration | Deferred until scale requires it | Abstraction boundary in `LocationService` is in place |
| Redis for live location | Deferred until PostgreSQL write pressure observed | `LocationService` abstraction in place |
| Multi-process backend | No current plan | SSE abstraction boundary noted |
| Customer app live tracking screen | Deferred | Customer app additions are Phase 2 |
| Pharmacy ERP handover UI | Deferred | Pharmacy ERP additions are Phase 2 |

---

## Section 8 — Constraints and Non-Negotiables

These are hard constraints that every implementation decision must respect:

1. **No mixing of auth contexts.** `req.rider` is never `req.user` or `req.mobileUser`. Separate middleware, separate JWT secrets, separate session tables.

2. **No plaintext sensitive data.** OTP hashes use bcrypt. Bank account numbers are stored as entered (not hashed) but are never returned in API list responses — only in the specific profile/payout endpoints that require them.

3. **All monetary values as `Decimal` in PostgreSQL.** Never `Float`. This matches the existing schema convention throughout the codebase. Rider earnings, fees, and payout amounts are all `Decimal`.

4. **Coordinate precision matches existing schema.** Latitude: `Decimal @db.Decimal(10, 8)`. Longitude: `Decimal @db.Decimal(11, 8)`. Matches `BranchMarketplaceSettings` and `CureliMobileAddress` exactly.

5. **Soft deletes where applicable.** `Rider` has `deleted_at`. Consistent with `CureliMobileUser` and the existing pattern.

6. **Post-commit event firing.** The assignment engine, notification dispatch, and SSE events always fire after the database transaction commits — never inside it. This is the established pattern in `marketplace.orders.service.js` and must be followed in all delivery services.

7. **Append-only earnings ledger.** `RiderEarningLedger` rows are never updated after creation. Adjustments are new rows with type `MANUAL_ADJUSTMENT`. This provides a complete, auditable financial trail.

8. **Snapshot pattern for financial data.** Earnings snapshots on `Delivery` (`base_fee`, `distance_fee`, `surge_fee`, `bonus_fee`, `total_rider_earning`) are written at delivery completion and never changed. Matches the snapshot pattern used in `MarketplaceOrderItem` throughout the existing schema.

---

*Document version: 1.0 — produced from architecture design session*
*Status: Approved — ready for implementation planning*

---

Now give me the go-ahead and I will produce the **Implementation Plan** — phases, file list, what gets built in what order, dependencies between pieces. Still no code.