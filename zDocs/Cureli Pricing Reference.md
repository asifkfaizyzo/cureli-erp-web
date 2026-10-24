

# Cureli — Pricing, Promotional Slash & GST System — Technical Reference

> **Scope:** Full technical reference for order pricing computation, the promotional "slash" (strikethrough) display engine, the distance-surcharge "slashed km" free-radius visual, and the configurable GST system — covering backend config schema, computation order, data flow (quote → session → order), and frontend display rules (Mobile + CAdmin).
> **Last verified against:** Current repository implementation (post distance-surcharge-slash feature, GST Phases A–E complete).
> **Use this doc when:** Modifying `DeliveryPricingConfig`, `pricing.engine.js`, `slash.engine.js`, GST logic, or any bill-display component on Mobile/CAdmin.

---

## 1. System Overview

Cureli's order pricing is composed of up to **five charge components**, each independently configurable, plus two **display-layer overlays** that never change the actual amount charged — they only change what the customer/admin *sees*:

| Layer | Purpose | Changes actual price? |
|---|---|---|
| **Base Pricing** (`pricing.engine.js`) | Computes real charge for each component | ✅ Yes — this is what's actually charged |
| **Promotional Slash** (`slash.engine.js`) | Admin-configured "was ₹X now ₹Y" marketing display | ❌ No — cosmetic anchor only |
| **Free-Radius Auto-Anchor** (`computeFreeRadiusAnchor()` in `pricing.engine.js`) | Auto-generates a "slashed km" strikethrough when free-delivery-radius discounting applies | ❌ No — cosmetic anchor only |
| **GST** (`computeGST()`) | Platform tax on configured components | ✅ Yes — added on top, post-slash |

All five base charge components:

| Component | Tiers | Basis | Beneficiary |
|---|---|---|---|
| Service Charge | 3 (by subtotal) | Order subtotal | Cureli platform |
| Delivery Fee | 4 (by subtotal) | Order subtotal | Cureli platform |
| KM Surcharge | 2 rate tiers (by subtotal) | Distance beyond free radius | Cureli platform (merged into delivery fee outward-facing) |
| Packing Charge | 3 (by subtotal) | Order subtotal | Cureli platform |
| Tip | Flat | Customer choice | Rider |

---

## 2. `DeliveryPricingConfig` — Full Schema Reference

Single-row config (per fulfillment type, where applicable). All tier/charge fields are `Decimal`, all `_enabled` toggles are `Boolean` (default varies).

### Service Charge
| Field | Meaning |
|---|---|
| `service_charge_enabled` | Master toggle |
| `service_tier_1_max`, `service_tier_1_charge` | Subtotal ≤ max → charge |
| `service_tier_2_max`, `service_tier_2_charge` | Next bracket |
| `service_tier_3_charge` | Fallback (above tier 2 max) |

### Delivery Fee (base, before km surcharge)
| Field | Meaning |
|---|---|
| `delivery_fee_enabled` | Master toggle |
| `delivery_tier_1_max`, `delivery_tier_1_charge` | Subtotal < max → charge |
| `delivery_tier_2_max`, `delivery_tier_2_charge` | Next bracket |
| `delivery_tier_3_max`, `delivery_tier_3_charge` | Next bracket |
| `delivery_tier_4_charge` | Fallback (above tier 3 max) |

> Note: Delivery tiers use **strictly-less-than (`<`)** comparisons; Service/Packing tiers use **less-than-or-equal (`<=`)**. This asymmetry is intentional/existing — preserve it when editing.

### Distance Surcharge ("Distance Surcharge Rate" in admin UI)
| Field | Meaning |
|---|---|
| `km_surcharge_enabled` | Master toggle |
| `free_km_radius` | KM radius within which no km charge applies |
| `free_km_mode` | `"EXCESS_ONLY"` or `"FULL_DISTANCE"` (see §5) |
| `per_km_tier_1_max`, `per_km_tier_1_rate` | Subtotal < max → ₹/km rate |
| `per_km_tier_2_rate` | Fallback rate (subtotal ≥ tier 1 max) |

### Packing Charge
| Field | Meaning |
|---|---|
| `packing_enabled` | Master toggle |
| `packing_tier_1_max`, `packing_tier_1_charge` | Subtotal ≤ max → charge |
| `packing_tier_2_max`, `packing_tier_2_charge` | Next bracket |
| `packing_tier_3_charge` | Fallback |

### GST
| Field | Meaning |
|---|---|
| `gst_enabled` | Master toggle |
| `gst_rate` | Decimal(5,2) — e.g. `18.00` |
| `gst_type` | `"CGST_SGST"` or `"IGST"` — purely a **label/split** for display, does not change total GST amount |
| `gst_on_subtotal` | Tax medicine subtotal (⚠️ admin UI shows warning: "Medicine MRP already includes GST — enabling this will double-tax") |
| `gst_on_delivery` | Tax the **combined** delivery value (`delivery_fee + km_surcharge`) |
| `gst_on_service` | Tax service charge |
| `gst_on_packaging` | Tax packing charge |

### Max Delivery Distance (unrelated to free radius)
| Field | Meaning |
|---|---|
| `max_delivery_km` | Hard cutoff — delivery unavailable beyond this distance |

---

## 3. Base Pricing Computation — `pricing.engine.js` → `computePricing()`

Executed in this exact order for every quote/session:

```
1. isPickup check → if PICKUP, skip delivery/km entirely, packing still applies
2. max_delivery_km guard → if distance exceeds, return delivery_available: false
3. service_charge = tier lookup (service_tier_1/2/3) based on subtotal
4. delivery_fee   = tier lookup (delivery_tier_1/2/3/4) based on subtotal   [if km_surcharge_enabled !== false]
5. distance_rate  = subtotal < per_km_tier_1_max ? per_km_tier_1_rate : per_km_tier_2_rate
                    (ALWAYS computed when km_surcharge_enabled, independent of free_km_mode)
6. extra_km       = free_km_mode === "FULL_DISTANCE"
                       ? (distance_km > free_km_radius ? distance_km : 0)
                       : Math.max(0, distance_km - free_km_radius)
7. km_surcharge         = extra_km × distance_rate
8. full_distance_charge = distance_km × distance_rate     ← NOT extra_km. Always the FULL distance × rate.
                           This is the key value that powers the "slashed km" anchor (§5).
9. packing_charge = tier lookup (packing_tier_1/2/3) based on subtotal
10. tip = customer-provided, 0 for pickup
```

**Outward-facing merge rule (intentional, do not change):** `km_surcharge` is always returned as `0` in the customer-facing API response (`getQuote()` / `createCheckoutSession()`). The actual per-km amount is folded into `delivery_fee` before being sent out, so the customer always sees **one single delivery line**, never two. Internally, `pricing.engine.js` still computes both separately — this matters for anchor math (§5) and for legacy orders that may still have non-zero `km_surcharge` stored.

---

## 4. Promotional Slash Engine — `slash.engine.js` → `applySlash()`

This is an **admin-configured marketing overlay**, entirely separate from the free-radius anchor (§5). It is controlled by a dedicated `SlashConfig` (`is_enabled`, `service_mode`, `service_pct`, `delivery_mode`, `delivery_tiers[]`).

**⚠️ Critical behavior:** `applySlash()` has an early-return guard:
```js
if (!config || !config.is_enabled) return { ...unmodified actuals, anchors: null };
```
This means **when the promo slash toggle is OFF, this entire engine does nothing.** This was the reason the free-radius anchor (§5) was deliberately built as a **separate function outside `slash.engine.js`** — it must show regardless of this toggle.

### Slash Modes
| Mode | Meaning | Formula |
|---|---|---|
| `NONE` | No slash | `actual = value`, `anchor = null` |
| `NEW` | "New lower price" — anchor is inflated | `actual = value`, `anchor = value × (1 + pct/100)` |
| `OLD` | "Old higher price was X, now discounted" | `actual = max(0, value × (1 + pct/100))`, `anchor = value` |

### Delivery Slash — Tiered by subtotal + distance
`slash_tiers[]` is a prioritized list, each tier has `min_subtotal`, `max_distance_km`, `priority`, `pct`. First matching tier (sorted by priority) wins. `0`/`null`/`undefined` on a condition field means "no condition" (always matches that dimension).

Service charge slash is **not tiered** — single `service_mode` + `service_pct` applies globally.

---

## 5. Distance Surcharge "Slashed KM" Free-Radius Anchor

This is the **newest feature** — a second, independent anchor source that visually shows "you saved money because of the free-radius policy," distinct from the promotional slash engine above.

### Core Formula (`computeFreeRadiusAnchor()` in `pricing.engine.js`)

```js
export function computeFreeRadiusAnchor({ delivery_fee, km_surcharge, full_distance_charge }) {
  if (!full_distance_charge || full_distance_charge <= km_surcharge) return null;
  return parseFloat((delivery_fee + full_distance_charge).toFixed(2));
}
```

**Intuition:** "What would the customer have paid if there were no free radius at all (i.e. charged for the full distance from km 0)?" If that hypothetical full-distance charge is *higher* than what's actually being charged, show it struck through.

### Why `full_distance_charge` self-cancels in `FULL_DISTANCE` mode outside the radius
When `free_km_mode = "FULL_DISTANCE"` and the trip exceeds the radius, `extra_km = distance_km` (the *entire* trip is charged, not just the excess) — so `km_surcharge === full_distance_charge` exactly, the `<=` guard fires, and `computeFreeRadiusAnchor()` correctly returns `null`. **No special-case code is needed for this scenario** — it's mathematically self-cancelling by design.

### Verified Test Matrix

| Scenario | Mode | `km_surcharge` | `full_distance_charge` | Anchor Result |
|---|---|---|---|---|
| 5km trip, 3km free radius | `EXCESS_ONLY` | 30 (2km × rate) | 75 (5km × rate) | `delivery_fee + 75` → struck through, showing ₹30 actual |
| 5km trip, 6km free radius (within radius) | either | 0 | 75 | `delivery_fee + 75` anchor, actual = `delivery_fee + 0` → if that's 0, shows **"Free delivery"** badge instead of strikethrough |
| 8km trip, 6km free radius | `FULL_DISTANCE` (outside radius) | 120 (8km × rate, full charged) | 120 | `null` — self-cancels, shown as plain price, no strikethrough |

### Merge Rule — Conflict with Promotional Slash Anchor
Both anchor sources can theoretically fire at once (admin has a promo slash AND the free-radius condition is met). Resolution: **take the higher of the two as the displayed strikethrough value.**

```js
const merged = tierSlashAnchor
  ? Math.max(tierSlashAnchor, freeRadiusAnchor)
  : freeRadiusAnchor;
delivery_charge_anchor = merged > deliveryActual ? merged : null;
```

This exact merge logic exists in **two places** (kept in sync manually — no shared module):
1. Backend: `mobile.checkout.service.js`, in both `getQuote()` and `createCheckoutSession()`, right after `applySlash()` runs.
2. CAdmin: `LivePreview.jsx`'s `computePreview()`, after its own local slash-application block.

> **If you ever change this merge formula, you must update it in both places.**

### Persistence — No New Columns
This feature reuses existing columns already present on `CheckoutSession` and `MarketplaceOrder`:
- `delivery_charge_anchor` — now carries either the promo-slash anchor, the free-radius anchor, or their max, depending on which fired.
- `distance_km` — already existed, just needed to be threaded into the outward-facing quote/session response objects (it previously wasn't — this was a confirmed gap fixed during this feature).

**No Prisma migration was needed for this feature.**

---

## 6. GST System

### Computation Order
GST is calculated **post-slash, pre-discount** — i.e. after promotional/free-radius anchors have determined the *actual* charged amounts, but before coupon/loyalty discounts are subtracted from the grand total.

```
1. Compute base pricing (§3)
2. Apply promotional slash (§4) + free-radius anchor merge (§5) → actual charged amounts
3. Compute GST on the ACTUAL (post-slash) amounts of whichever components are toggled on
4. Add GST to grand total
5. Subtract coupon discount
6. Subtract loyalty discount
→ grand_total
```

### `computeGST()` Return Shape
```js
{
  gst_rate: number,
  gst_type: string,              // "CGST_SGST" | "IGST"
  gst_amount: number,
  gst_breakdown: [
    { component: string, base: number, gst: number }
  ]
}
```

### Components & Label Mapping
| `component` value | Display Label | Controlled by |
|---|---|---|
| `medicine_subtotal` | "Subtotal" | `gst_on_subtotal` |
| `service_charge` | "Service" | `gst_on_service` |
| `delivery_charge` | "Delivery" | `gst_on_delivery` — taxes the **combined** `delivery_fee + km_surcharge`, not just one piece |
| `packing_charge` | "Packing" | `gst_on_packaging` |

`gst_type` is purely a **display split label** ("CGST + SGST" vs "IGST") — it does not change the computed `gst_amount`, only how it's labeled/broken down in the UI tooltip.

### Pharmacy-Facing Exclusion
`pharmacy-web`'s `OrderDetailPanel.jsx` **intentionally excludes all GST display** — pharmacies only see their own earnings (subtotal minus commission), not platform tax details.

---

## 7. Data Flow: Quote → Checkout Session → Order

| Stage | Function | What happens |
|---|---|---|
| **Quote** (live, cart screen) | `getQuote()` in `mobile.checkout.service.js` | Computes pricing + slash + free-radius anchor + GST fresh on every debounce. Nothing persisted. Returns `distance_km: isPickup ? 0 : distance_km` and merged `delivery_charge_anchor`. |
| **Checkout Session** (payment initiated) | `createCheckoutSession()` | Re-validates everything server-side (distance ±20% tolerance, stock, prices). Re-runs identical pricing + slash + free-radius anchor + GST logic. Persists full snapshot to `CheckoutSession` row (including `gst_rate`, `gst_type`, `gst_amount`, `gst_breakdown`, `distance_km`, `delivery_charge_anchor`, `service_charge_anchor`). Creates Razorpay order. |
| **Order Creation** (payment confirmed) | `_createOrderFromSession()` | Copies all pricing/anchor/GST/distance fields **as-is** from `CheckoutSession` → `MarketplaceOrder`. No recomputation. **No changes were needed here for the distance-surcharge feature** — it already copied `distance_km` and `delivery_charge_anchor` generically. |

**Why pricing is computed twice (quote + session) instead of trusting the quote:** Prevents price manipulation between quote-time and payment-time (stale prices, stock changes, distance spoofing).

---

## 8. Mobile Display Logic

### Delivery Label Rules (`BillDetailsCard.tsx` + `OrderDetailScreen.tsx`)
```
isPickup                        → "Delivery fee (Pickup)"
distance_km > 0                 → "Delivery (${distance_km} km)"
distance_km === 0 or unknown    → "Delivery fee"          (no distance suffix)
```
- Distance is displayed as an **integer if whole, else 1 decimal place** (e.g. `5 km`, `4.8 km`) — never raw GPS float precision, never pre-rounded to misleading integers.
- The per-km **rate is never shown** on mobile — only the resolved km count.

### Anchor / Strikethrough / FREE Logic (unchanged by this feature — already generic)
```
combinedDelivery = delivery_fee + km_surcharge
isDeliveryFree   = isPickup || (combinedDelivery === 0 && delivery_charge_anchor != null)
→ if isDeliveryFree: show "FREE" + "Free delivery" badge (no extra text)
→ else if delivery_charge_anchor != null: show struck-through anchor + actual price
→ else: show actual price plainly (no strikethrough)
```
This logic required **zero changes** for the distance-surcharge feature — it already worked correctly once the backend started sending smarter `delivery_charge_anchor` values. This is the core reason the architecture was designed to merge everything into that one existing field rather than adding new ones.

### Pickup Orders
Completely unaffected by all of the above — **no delivery row is rendered at all** when `fulfillment_type === "PICKUP"`.

---

## 9. CAdmin Display Logic

### `LivePreview.jsx` (Pricing Config Page — admin-facing marketing preview)
- Full strikethrough/anchor/FREE visual parity with mobile (admins can "see what the customer sees" before publishing a pricing change).
- Editable subtotal + distance inputs with quick-fill preset chips (`PRESET_EXAMPLES`). Default: ₹500 · 3km.
- `(X km)` suffix hidden at `distanceKm === 0`.
- `platformSavings` **includes** free-radius savings, computed **outside** the `slashConfig.is_enabled` guard (so it reflects reality even when the promo slash toggle is off) — this was a deliberate architectural fix made during Phase 5.

### `OverviewTab.jsx` (Order Detail Panel — correctness-check tool, NOT a marketing preview)
**Explicitly does NOT need strikethrough/anchor UI.** This panel exists so admins can verify the order was billed correctly, not to show a pretty customer-facing preview. Requirements here are much simpler:
- Combine `order.delivery_fee + order.km_surcharge` into one value.
- Append `(X km)` suffix when `distance_km > 0` and not pickup.
- Show `"FREE"` text when combined value is `0`.
- No anchor/strikethrough rendering at all.

This distinction (marketing preview vs. correctness-check panel) is important — don't accidentally port LivePreview's visual complexity into OverviewTab in a future change; it was explicitly rejected.

---

## 10. Locked Business Rules (Do Not Re-Litigate Without Explicit User Sign-off)

1. Full-distance-mode-outside-radius self-cancels mathematically — no special-case code.
2. Anchor conflict (promo slash vs free-radius) → always take `Math.max()` of the two.
3. "Free delivery" badge text is **exactly** "Free delivery" — no additional marketing copy.
4. Mobile delivery label **never** shows the per-km rate — only the km count.
5. Distance breakdown must appear on: Mobile `BillDetailsCard` + `OrderDetailScreen`, AND CAdmin `LivePreview` + `OverviewTab`.
6. `OverviewTab.jsx` is correctness-check only — no slash/anchor visuals, ever (unless explicitly re-requested).
7. `platform_savings` includes free-radius savings.
8. `(X km)` suffix shows even when `km_surcharge_enabled = false` (still reflects actual distance travelled).
9. `(X km)` suffix is hidden entirely when `distance_km === 0` → falls back to plain "Delivery fee".
10. `km_surcharge` is hardcoded to `0` in the outward-facing API response of `getQuote()`/`createCheckoutSession()` — the real per-km amount is always pre-merged into `delivery_fee`. This is intentional for legacy-field compatibility and must not be changed without a full audit of every frontend consumer.
11. Pickup orders are **completely unaffected** by any delivery/distance/anchor logic — no delivery row rendered at all, anywhere.
12. `gst_on_subtotal` must always be shown in admin UI with a double-taxation warning, since medicine MRP in India already includes GST.
13. GST is calculated post-slash (on actual charged amounts), pre-discount (before coupon/loyalty are subtracted).
14. Pharmacy-facing `OrderDetailPanel.jsx` never shows GST — pharmacies only see earnings.

---

## 11. Key Code Locations

| Area | File |
|---|---|
| Base pricing computation + free-radius anchor | `backend/src/modules/mobile/checkout/pricing.engine.js` |
| Promotional slash engine | `backend/src/modules/mobile/checkout/slash.engine.js` |
| Quote + checkout session + order creation, anchor merge wiring | `backend/src/modules/mobile/checkout/mobile.checkout.service.js` |
| GST computation | `pricing.engine.js` (`computeGST()`) |
| Invoice HTML (GST line items) | `backend/src/modules/.../invoice.html.js` |
| Customer order detail service (backend) | `backend/src/modules/marketplace-orders/marketplace.orders.service.js` |
| CAdmin order detail service (backend) | `backend/src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.service.js` |
| Prisma schema — pricing config | `backend/prisma/schema/*.prisma` (`DeliveryPricingConfig` model) |
| Prisma schema — session/order anchor + GST + distance fields | `CheckoutSession`, `MarketplaceOrder` models |
| CAdmin pricing config UI | `cadmin-web/src/pages/marketplace/Pricing/DeliveryPricingPage.jsx` |
| CAdmin live preview (marketing-style) | `cadmin-web/src/pages/marketplace/Pricing/comps/delivery/LivePreview.jsx` |
| CAdmin order detail (correctness-check panel) | `cadmin-web/src/pages/marketplace/Orders/comps/tabs/OverviewTab.jsx` |
| Mobile checkout state | `cureli-med-customer/src/store/checkoutStore.ts` |
| Mobile checkout data-fetch hook | `cureli-med-customer/src/features/cart/hooks/useCheckout.ts` |
| Mobile bill display (cart/checkout) | `cureli-med-customer/src/features/cart/components/BillDetailsCard.tsx` |
| Mobile bill display (completed order) | `cureli-med-customer/src/features/orders/screens/OrderDetailScreen.tsx` |
| Mobile order type definitions | `cureli-med-customer/src/types/order.ts` |
| Pharmacy order detail (GST excluded) | `pharmacy-web/.../OrderDetailPanel.jsx` |

---

## 12. Known Constraints / Gotchas for Future Changes

- **No shared pricing module between backend and CAdmin.** `pricing.engine.js` (backend) and `LivePreview.jsx`'s `computePreview()` (CAdmin) are **two independently maintained implementations of the same formulas**. Any formula change (tier logic, free-radius math, slash merge) must be manually ported to both, or they will silently diverge.
- **Hooks ordering rule (Mobile/React):** All `useState` calls must be declared above any early `return null` — multiple past bugs (GST tooltip, hidden bill card) traced back to violating this.
- **`distance_km` can be a float**, not guaranteed to be a clean integer — display formatting must handle both whole-number and decimal cases gracefully.
- **Delivery tier comparisons use `<` while Service/Packing tiers use `<=`.** This inconsistency is pre-existing and intentional — do not "fix" it without explicit confirmation, as it may be relied upon by existing pricing configs.
- Windows/PowerShell dev environment — any suggested search/grep commands for this codebase need `Where-Object { $_.FullName -notmatch "node_modules" }` filtering.