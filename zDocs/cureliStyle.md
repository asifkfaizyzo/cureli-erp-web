<!-- zDocs/cureliStyle.md (do not remove this comment) -->
Here's the comprehensive color and design system guide for Cureli:

```md
# 🎨 Cureli Admin — Design System & Color Guide

> **Version:** 2.0 | **Stack:** React + Tailwind CSS  
> **Base Gradient:** `from-[#05015A] to-[#0a0280]` | **Tailwind Match:** Indigo scale

---

## 📋 TABLE OF CONTENTS

1. [Brand Color Palette](#1-brand-color-palette)
2. [Semantic Colors](#2-semantic-colors)
3. [Neutral / Slate Scale](#3-neutral--slate-scale)
4. [Extended Semantic Colors](#4-extended-semantic-colors)
5. [Typography](#5-typography)
6. [Backgrounds & Surfaces](#6-backgrounds--surfaces)
7. [Borders & Focus States](#7-borders--focus-states)
8. [Buttons](#8-buttons)
9. [Badges & Status Pills](#9-badges--status-pills)
10. [Alerts & Toasts](#10-alerts--toasts)
11. [Input States](#11-input-states)
12. [Table Design System](#12-table-design-system)
13. [StyledSelect Component](#13-styledselect-component)
14. [StyledDateFilter Component](#14-styleddatefilter-component)
15. [Pagination System](#15-pagination-system)
16. [Dynamic Row Count](#16-dynamic-row-count)
17. [Dark Background (Banner/Header)](#17-dark-background-bannerheader)
18. [Complete Component Recipes](#18-complete-component-recipes)
19. [Quick Reference Cheat Sheet](#19-quick-reference-cheat-sheet)

---

## 1. BRAND COLOR PALETTE

### The Core Gradient
```

from-[#05015A] → to-[#0a0280]

````
Use this on: page headers, table headers, active pagination buttons,
selected calendar days, primary nav.

### Full Brand Scale

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| Primary Dark | `#05015A` | `bg-[#05015A]` | Header gradient start, deepest brand |
| Primary Base | `#0a0280` | `bg-[#0a0280]` | Header gradient end, dark CTA |
| Primary Mid | `#1a10a0` | — | Hover on dark background |
| Primary Light | `#3b2fd4` | — | Lighter accent |
| Indigo 700 | `#4338ca` | `bg-indigo-700` | Dark button hover |
| Indigo 600 | `#4f46e5` | `bg-indigo-600` | Primary buttons, links |
| Indigo 500 | `#6366f1` | `bg-indigo-500` | Closest Tailwind brand match |
| Indigo 400 | `#818cf8` | `text-indigo-400` | Muted brand text |
| Indigo 300 | `#a5b4fc` | `text-indigo-300` | Icons on dark bg |
| Indigo 200 | `#c7d2fe` | `border-indigo-200` | Brand borders |
| Indigo 100 | `#e0e7ff` | `bg-indigo-100` | Badge bg, hover tint |
| Indigo 50 | `#eef2ff` | `bg-indigo-50` | Lightest wash, input active |

### Quick Brand Classes
```js
// Gradient
"bg-gradient-to-r from-[#05015A] to-[#0a0280]"

// Solid equivalents
"bg-[#05015A]"          // darkest
"bg-indigo-900"         // Tailwind approximation
"bg-indigo-600"         // standard primary button

// Text
"text-indigo-700"       // brand links, active labels
"text-indigo-500"       // secondary brand text
"text-indigo-400"       // subtle/muted brand

// Tints
"bg-indigo-50"          // active input, selected row bg
"bg-indigo-100"         // badge background
````

---

## 2. SEMANTIC COLORS

### Success / Green

> **When to use:** In Stock, saved, approved, active, connected, received, valid expiry

| Role                | Tailwind Class     | Hex       |
| ------------------- | ------------------ | --------- |
| Text / Badge Text   | `text-green-700`   | `#15803d` |
| Solid Button / Icon | `bg-green-600`     | `#16a34a` |
| Status Dot          | `bg-green-500`     | `#22c55e` |
| Badge Border        | `border-green-200` | `#bbf7d0` |
| Badge Background    | `bg-green-100`     | `#dcfce7` |
| Light Wash / Toast  | `bg-green-50`      | `#f0fdf4` |

```jsx
//  Success badge — copy-paste ready
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                 bg-green-100 text-green-700 border border-green-200">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
  In Stock
</span>

//  Success alert
<div className="p-4 rounded-xl bg-green-50 border border-green-200">
  <p className="text-sm font-semibold text-green-700">Saved successfully!</p>
  <p className="text-xs text-green-600 mt-1">Changes have been applied.</p>
</div>

//  Success input state
<input className="border-green-500 bg-green-50 text-green-700
                  ring-2 ring-green-500/10 focus:outline-none" />
```

---

### 🔴 Danger / Red

> **When to use:** Out of Stock, expired, error, failed, delete, destructive, blocked

| Role                | Tailwind Class   | Hex       |
| ------------------- | ---------------- | --------- |
| Text / Badge Text   | `text-red-700`   | `#b91c1c` |
| Solid Button / Icon | `bg-red-600`     | `#dc2626` |
| Status Dot          | `bg-red-500`     | `#ef4444` |
| Badge Border        | `border-red-200` | `#fecaca` |
| Badge Background    | `bg-red-100`     | `#fee2e2` |
| Light Wash / Toast  | `bg-red-50`      | `#fef2f2` |

```jsx
// 🔴 Danger badge
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                 bg-red-100 text-red-700 border border-red-200">
  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
  Out of Stock
</span>

// 🔴 Delete button
<button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold
                   hover:bg-red-700 transition-colors">
  Delete
</button>

// 🔴 Soft delete button
<button className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm
                   hover:bg-red-100 transition-colors">
  Remove
</button>

// 🔴 Error alert
<div className="p-4 rounded-xl bg-red-50 border border-red-200">
  <p className="text-sm font-semibold text-red-700">Action failed</p>
  <p className="text-xs text-red-600 mt-1">Please try again.</p>
</div>
```

---

### ⚠️ Warning / Amber

> **When to use:** Low stock, expiring soon, pending, caution, needs review

| Role               | Tailwind Class     | Hex       |
| ------------------ | ------------------ | --------- |
| Text / Badge Text  | `text-amber-700`   | `#b45309` |
| Solid Icon         | `bg-amber-600`     | `#d97706` |
| Status Dot         | `bg-amber-500`     | `#f59e0b` |
| Badge Border       | `border-amber-200` | `#fde68a` |
| Badge Background   | `bg-amber-100`     | `#fef3c7` |
| Light Wash / Toast | `bg-amber-50`      | `#fffbeb` |

```jsx
// ⚠️ Warning badge
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                 bg-amber-100 text-amber-700 border border-amber-200">
  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
  Low Stock
</span>

// ⚠️ Warning alert
<div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
  <p className="text-sm font-semibold text-amber-700">⚠ Low Stock Alert</p>
  <p className="text-xs text-amber-600 mt-1">12 items below minimum level.</p>
</div>
```

---

### 🔵 Info / Blue

> **When to use:** Processing, informational notes, help tips, system messages

| Role              | Tailwind Class    | Hex       |
| ----------------- | ----------------- | --------- |
| Text / Badge Text | `text-blue-700`   | `#1d4ed8` |
| Solid Button      | `bg-blue-600`     | `#2563eb` |
| Status Dot        | `bg-blue-500`     | `#3b82f6` |
| Badge Border      | `border-blue-200` | `#bfdbfe` |
| Badge Background  | `bg-blue-100`     | `#dbeafe` |
| Light Wash        | `bg-blue-50`      | `#eff6ff` |

```jsx
// 🔵 Info badge
<span
  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                 bg-blue-100 text-blue-700 border border-blue-200"
>
  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
  Processing
</span>
```

---

## 3. NEUTRAL / SLATE SCALE

> **Prefer `slate` over `gray`** for UI chrome. Use `gray` only where you see it in existing components.

| Token     | Tailwind           | Hex       | Use                            |
| --------- | ------------------ | --------- | ------------------------------ |
| Slate 900 | `text-slate-900`   | `#0f172a` | Page titles, headings          |
| Slate 800 | `text-slate-800`   | `#1e293b` | Strong body, modal titles      |
| Slate 700 | `text-slate-700`   | `#334155` | Body text, inputs, table cells |
| Slate 600 | `text-slate-600`   | `#475569` | Secondary labels               |
| Slate 500 | `text-slate-500`   | `#64748b` | Descriptions, helpers          |
| Slate 400 | `text-slate-400`   | `#94a3b8` | Placeholders, timestamps       |
| Slate 300 | `text-slate-300`   | `#cbd5e1` | Disabled text                  |
| Slate 200 | `border-slate-200` | `#e2e8f0` | Default borders, dividers      |
| Slate 100 | `bg-slate-100`     | `#f1f5f9` | Table header bg, tag bg        |
| Slate 50  | `bg-slate-50`      | `#f8fafc` | Page bg, alt row bg            |

---

## 4. EXTENDED SEMANTIC COLORS

Use these for additional status types where green/red/amber/blue are already taken.

| Color       | Solid            | Bg               | Text               | Border               | Use Cases                                 |
| ----------- | ---------------- | ---------------- | ------------------ | -------------------- | ----------------------------------------- |
| **Violet**  | `bg-violet-600`  | `bg-violet-100`  | `text-violet-700`  | `border-violet-200`  | Transfers, unique categories, super admin |
| **Teal**    | `bg-teal-600`    | `bg-teal-100`    | `text-teal-700`    | `border-teal-200`    | Stock-in, received, secondary success     |
| **Orange**  | `bg-orange-600`  | `bg-orange-100`  | `text-orange-700`  | `border-orange-200`  | Urgent, overdue, expiring soon (alt)      |
| **Rose**    | `bg-rose-600`    | `bg-rose-100`    | `text-rose-700`    | `border-rose-200`    | Critical, blocked, severe errors          |
| **Cyan**    | `bg-cyan-600`    | `bg-cyan-100`    | `text-cyan-700`    | `border-cyan-200`    | Draft, readonly, info-alt                 |
| **Emerald** | `bg-emerald-600` | `bg-emerald-100` | `text-emerald-700` | `border-emerald-200` | Active users, online status               |
| **Purple**  | `bg-purple-600`  | `bg-purple-100`  | `text-purple-700`  | `border-purple-200`  | Super admin role badges                   |

---

## 5. TYPOGRAPHY

### On Light Backgrounds (Cards / Pages)

```jsx
// Headings
<h1 className="text-xl font-bold text-slate-900">Page Title</h1>
<h2 className="text-lg font-semibold text-slate-800">Section Title</h2>
<h3 className="text-base font-semibold text-slate-800">Card Title</h3>

// Body
<p className="text-sm text-slate-700">Body text</p>
<p className="text-sm text-slate-500">Secondary / description</p>
<p className="text-xs text-slate-400">Muted — timestamps, hints</p>
<p className="text-xs text-slate-300">Disabled</p>

// Brand
<a className="text-indigo-700 hover:text-indigo-800 font-medium">Link text →</a>
<span className="text-indigo-500">Secondary brand accent</span>

// Semantic
<span className="text-green-700 font-medium">✓ Success message</span>
<span className="text-red-700 font-medium">✕ Error message</span>
<span className="text-amber-700 font-medium">⚠ Warning message</span>
<span className="text-blue-700 font-medium">ℹ Info message</span>
```

### On Dark Backgrounds (Headers / Banners)

```jsx
<h1 className="text-white font-bold">Primary title</h1>
<p className="text-white/80">Secondary body</p>
<p className="text-white/60">Subtitle / description</p>
<p className="text-white/40">Disabled / hint</p>
<span className="text-indigo-300">Accent icon / label</span>
```

### Column Headers in Tables

```jsx
// Table header cells — always on dark gradient
<th className="p-3 font-semibold text-sm text-white text-left">
  Column Name
</th>

// Section labels / filter labels
<label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
  Filter Label
</label>
```

---

## 6. BACKGROUNDS & SURFACES

```jsx
// Page background
<div className="bg-slate-50 min-h-screen">          // standard page bg
<div className="bg-gray-50 min-h-screen">           // alternative (matches existing)

// Cards
<div className="bg-white rounded-xl border border-slate-200 shadow-sm">

// Card with brand accent strip
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="h-1 bg-gradient-to-r from-[#05015A] to-[#0a0280]" />
  <div className="p-5">...</div>
</div>

// Table alternate rows
even: "bg-gray-50"
odd:  "bg-white"
hover: "hover:bg-indigo-50"

// Selected row
"bg-indigo-50/80"

// Hover row (subtle)
"hover:bg-indigo-50/40"

// Input backgrounds
default:  "bg-white"       or "bg-slate-50"
active:   "bg-indigo-50"
error:    "bg-red-50"
success:  "bg-green-50"
disabled: "bg-slate-100"
```

---

## 7. BORDERS & FOCUS STATES

```jsx
// Default borders
"border border-slate-200"; // cards, inputs default
"border border-gray-200"; // matches existing table config
"border border-gray-100"; // subtle row dividers

// Brand borders
"border border-indigo-200"; // active inputs, brand-tinted
"border border-indigo-500"; // strong focus

// Focus ring (inputs, selects, buttons)
"focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

// Semantic borders
"border border-green-200"; // success input
"border border-red-200"; // error input
"border border-amber-200"; // warning input
"border border-blue-200"; // info input

// Dividers
"border-t border-gray-100"; // section dividers inside cards
"border-t border-white/10"; // dividers on dark bg
```

---

## 8. BUTTONS

### On Light Backgrounds

```jsx
// PRIMARY — main CTA on white/light bg
<button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg
                   hover:bg-indigo-700 active:bg-indigo-800
                   disabled:bg-indigo-300 disabled:cursor-not-allowed
                   transition-colors shadow-sm">
  Save Changes
</button>

// PRIMARY DARK — feels like the header (used in add buttons, primary CTAs)
<button className="px-4 py-2 bg-[#05015A] text-white text-sm font-semibold rounded-lg
                   hover:bg-[#0a0280] transition-colors shadow-sm">
  Add Medicine
</button>

// SECONDARY — outline style
<button className="px-4 py-2 border border-indigo-200 text-indigo-700 bg-white text-sm rounded-lg
                   hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
  Cancel
</button>

// GHOST — minimal
<button className="px-4 py-2 text-indigo-600 text-sm rounded-lg
                   hover:bg-indigo-50 transition-colors">
  View Details
</button>

// SOFT / TINTED — subtle CTA
<button className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg
                   hover:bg-indigo-100 transition-colors">
  Filter
</button>

// DANGER — destructive action
<button className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg
                   hover:bg-red-700 transition-colors">
  Delete
</button>

// DANGER SOFT — less aggressive
<button className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 text-sm rounded-lg
                   hover:bg-red-100 transition-colors">
  Remove
</button>

// SUCCESS
<button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg
                   hover:bg-green-700 transition-colors">
  Approve
</button>
```

### On Dark Backgrounds (Banner / Header)

```jsx
// SOLID WHITE — primary CTA on dark bg
<button className="px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-lg
                   hover:bg-indigo-50 transition-colors">
  Primary Action
</button>

// GLASS — secondary on dark bg
<button className="px-4 py-2 bg-white/10 text-white/80 text-sm font-medium rounded-lg
                   border border-white/15 hover:bg-white/20 hover:text-white
                   transition-colors">
  Secondary
</button>

// OUTLINE — tertiary on dark bg
<button className="px-4 py-2 border border-white/20 text-white/70 text-sm rounded-lg
                   hover:bg-white/10 hover:text-white transition-colors">
  View More
</button>
```

### Icon / Action Buttons (Table Rows)

```jsx
// From TABLE_CONFIG.styles.actions.button
<button className="p-1.5 rounded-lg transition-all text-gray-500
                   hover:text-[#05015A] hover:bg-indigo-50">   {/* view */}
<button className="p-1.5 rounded-lg transition-all text-gray-500
                   hover:text-amber-600 hover:bg-amber-50">    {/* edit */}
<button className="p-1.5 rounded-lg transition-all text-gray-500
                   hover:text-orange-600 hover:bg-orange-50">  {/* suspend */}
<button className="p-1.5 rounded-lg transition-all text-gray-500
                   hover:text-emerald-600 hover:bg-emerald-50">{/* activate */}
<button className="p-1.5 rounded-lg transition-all text-gray-500
                   hover:text-red-600 hover:bg-red-50">        {/* delete */}
```

---

## 9. BADGES & STATUS PILLS

### Anatomy of Every Badge

```jsx
// Full recipe — dot + label
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                 text-xs font-medium border
                 bg-{color}-100 text-{color}-700 border-{color}-200">
  <span className="w-1.5 h-1.5 rounded-full bg-{color}-500" />
  Label
</span>

// No dot (simpler)
<span className="inline-flex items-center justify-center
                 px-2.5 py-1 rounded-full text-xs font-medium
                 bg-{color}-100 text-{color}-700 min-w-[70px]">
  Label
</span>
```

### Complete Status Badge Map

```jsx
// ─── STOCK STATUS ───────────────────────────────────────────────────────────
// In Stock
"bg-green-100  text-green-700  border-green-200   dot:bg-green-500";
// Low Stock
"bg-amber-100  text-amber-700  border-amber-200   dot:bg-amber-500";
// Out of Stock
"bg-red-100    text-red-700    border-red-200     dot:bg-red-500";
// Discontinued
"bg-slate-100  text-slate-600  border-slate-200   dot:bg-slate-400";

// ─── EXPIRY STATUS ──────────────────────────────────────────────────────────
// Valid
"bg-green-100  text-green-700  border-green-200   dot:bg-green-500";
// Expiring Soon (< 90 days)
"bg-amber-100  text-amber-700  border-amber-200   dot:bg-amber-500";
// Expiring Very Soon (< 30 days)
"bg-orange-100 text-orange-700 border-orange-200  dot:bg-orange-500";
// Expired
"bg-red-100    text-red-700    border-red-200     dot:bg-red-500";
// Critical Expired (remove immediately)
"bg-rose-100   text-rose-700   border-rose-200    dot:bg-rose-500";

// ─── USER / ACCOUNT STATUS ──────────────────────────────────────────────────
// Active (from TABLE_CONFIG)
"bg-emerald-100 text-emerald-700";
// Inactive
"bg-red-100     text-red-700";
// Suspended
"bg-orange-100  text-orange-700";
// Pending
"bg-yellow-100  text-yellow-700";

// ─── VERIFICATION STATUS (from TABLE_CONFIG) ─────────────────────────────────
// Verified
"bg-emerald-50 text-emerald-700 border-emerald-200  dot:bg-emerald-500";
// Pending Review
"bg-amber-50   text-amber-700   border-amber-200    dot:bg-amber-500";
// Partially Rejected
"bg-orange-50  text-orange-700  border-orange-200   dot:bg-orange-500";
// Rejected
"bg-red-50     text-red-700     border-red-200      dot:bg-red-500";
// Unknown / Default
"bg-gray-50    text-gray-700    border-gray-200     dot:bg-gray-500";

// ─── ORDER / TRANSACTION STATUS ─────────────────────────────────────────────
// Processing
"bg-blue-100   text-blue-700   border-blue-200    dot:bg-blue-500";
// Transferred
"bg-violet-100 text-violet-700 border-violet-200  dot:bg-violet-500";
// Received / Completed
"bg-teal-100   text-teal-700   border-teal-200    dot:bg-teal-500";
// Urgent
"bg-orange-100 text-orange-700 border-orange-200  dot:bg-orange-500";
// Draft
"bg-cyan-100   text-cyan-700   border-cyan-200    dot:bg-cyan-500";
// Approved
"bg-indigo-100 text-indigo-700 border-indigo-200  dot:bg-indigo-500";

// ─── ROLE BADGES (from TABLE_CONFIG) ────────────────────────────────────────
// Base:       "inline-block px-3 py-1 rounded-full text-xs font-medium
//              whitespace-nowrap text-center min-w-[90px]"
// Super Admin: + "bg-purple-100 text-purple-700 border border-purple-200"
// Admin:       + "bg-blue-100   text-blue-700   border border-blue-200"
// Branch Admin:+ "bg-blue-100   text-blue-700   border border-blue-200"
// Manager:     + "bg-indigo-100 text-indigo-700 border border-indigo-200"
// Staff:       + "bg-slate-100  text-slate-700  border border-slate-200"
// Default:     + "bg-gray-100   text-gray-700   border border-gray-200"

// ─── COUNT / NUMBER BADGES ──────────────────────────────────────────────────
// On dark bg (tab count)
"bg-white/15 text-white/80 px-1.5 py-0.5 rounded-full text-[11px] font-bold";
// On light bg (filter count)
"bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold";
// Warning count
"bg-amber-100 text-amber-700 w-6 h-6 rounded-full text-xs font-bold";
```

### Helper Functions (from tableConfig.js)

```js
import { getRoleBadgeStyle, getStatusBadgeStyle, getVerificationStatusConfig }
  from '@/config/tableConfig';

// Usage
<span className={getRoleBadgeStyle('admin')}>Admin</span>
<span className={getStatusBadgeStyle('active')}>Active</span>

const config = getVerificationStatusConfig('verified');
<span className={config.wrapper}>
  <span className={config.dot} />
  {config.label}
</span>
```

---

## 10. ALERTS & TOASTS

### Alert Banner (inline)

```jsx
// Recipe: bg-{color}-50 border border-{color}-200
<div
  className="flex items-start gap-3 p-4 rounded-xl
                bg-green-50 border border-green-200"
>
  {" "}
  {/* swap color */}
  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
    <CheckCircle size={16} className="text-green-600" />
  </div>
  <div>
    <p className="text-sm font-semibold text-green-700">Success Title</p>
    <p className="text-xs text-green-600 mt-0.5">Description text here.</p>
  </div>
</div>
```

| Type     | bg             | border              | icon bg         | icon              | text              |
| -------- | -------------- | ------------------- | --------------- | ----------------- | ----------------- |
| Success  | `bg-green-50`  | `border-green-200`  | `bg-green-100`  | `text-green-600`  | `text-green-700`  |
| Error    | `bg-red-50`    | `border-red-200`    | `bg-red-100`    | `text-red-600`    | `text-red-700`    |
| Warning  | `bg-amber-50`  | `border-amber-200`  | `bg-amber-100`  | `text-amber-600`  | `text-amber-700`  |
| Info     | `bg-blue-50`   | `border-blue-200`   | `bg-blue-100`   | `text-blue-600`   | `text-blue-700`   |
| Critical | `bg-rose-50`   | `border-rose-200`   | `bg-rose-100`   | `text-rose-600`   | `text-rose-700`   |
| Brand    | `bg-indigo-50` | `border-indigo-200` | `bg-indigo-100` | `text-indigo-600` | `text-indigo-700` |

### Toast Notification

```jsx
// Left-bordered toast (used in Cureli)
<div
  className="flex items-center gap-3 p-4 rounded-xl bg-white shadow-lg
                border-l-4 border-green-500"
>
  {" "}
  {/* swap border color */}
  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
    <Check size={14} className="text-green-600" />
  </div>
  <span className="text-sm font-semibold text-green-700">
    Saved successfully!
  </span>
</div>

// Border colors for toast types:
// Success:  border-green-500
// Error:    border-red-500
// Warning:  border-amber-500
// Info:     border-blue-500
```

---

## 11. INPUT STATES

All inputs follow this pattern — swap the color token per state:

```jsx
// DEFAULT
<input className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm
                  bg-white text-gray-700 placeholder:text-gray-400
                  hover:bg-gray-50 hover:border-gray-300
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                  transition-all duration-200" />

// ACTIVE / HAS VALUE (used in StyledSelect, search inputs)
<input className="bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" />

// ERROR
<input className="bg-red-50 border-red-500 text-red-700
                  ring-2 ring-red-500/10" />
// Error message:
<p className="text-xs text-red-500 mt-1">{error}</p>

// SUCCESS
<input className="bg-green-50 border-green-500 text-green-700
                  ring-2 ring-green-500/10" />

// WARNING
<input className="bg-amber-50 border-amber-500 text-amber-700
                  ring-2 ring-amber-500/10" />

// DISABLED
<input className="bg-slate-100 border-slate-200 text-slate-400
                  cursor-not-allowed opacity-50" disabled />
```

---

## 12. TABLE DESIGN SYSTEM

> **Source:** `src/config/tableConfig.js`  
> **Import:** `import TABLE_CONFIG from '@/config/tableConfig'`

### Dimensions

| Property          | Value  | Notes                              |
| ----------------- | ------ | ---------------------------------- |
| Header row height | `48px` | `h-[48px]`                         |
| Body row height   | `56px` | `h-[56px]` — fits avatar + 2 lines |
| Pagination bar    | `48px` | `h-[48px]`                         |

### Table Container Structure

```jsx
// Always use this wrapper
<div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">

  {/* Header */}
  <table>
    <thead>
      <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
        <th className="p-3 font-semibold text-sm">Column</th>
      </tr>
    </thead>

    {/* Body rows */}
    <tbody>
      <tr className="border-b border-gray-100 transition-all duration-150
                     bg-gray-50 hover:bg-indigo-50 cursor-pointer h-[56px]">
                   {/* even rows: bg-gray-50 | odd rows: bg-white */}
        <td className="px-3 py-2 font-medium text-gray-900">Primary cell</td>
        <td className="px-3 py-2 text-gray-600">Secondary cell</td>
        <td className="px-3 py-2 text-gray-500 text-sm">Muted cell</td>
      </tr>
    </tbody>
  </table>

  {/* Pagination — always at bottom */}
  <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50">
    <Pagination ... />
  </div>
</div>
```

### Row Background Helpers

```js
import { getRowBgClass, getClickableRowClass } from '@/config/tableConfig';

// Static rows
<tr className={getRowBgClass(index)}>

// Clickable rows (adds cursor-pointer)
<tr className={getClickableRowClass(index)}>

// Disabled rows
<tr className={getRowBgClass(index, true)}>     // adds opacity-60
```

### Sort Icon Colors

```jsx
// Active sort column
<SortIcon className="text-yellow-300" />

// Inactive sort column
<SortIcon className="text-white/50" />
```

### Skeleton Loading

```jsx
<tr className="animate-pulse">
  <td className="px-3 py-4">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
  </td>
</tr>
```

### Empty State

```jsx
<div className="flex-1 flex flex-col items-center justify-center py-12">
  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <Package size={28} className="text-gray-300" />
  </div>
  <p className="text-lg font-medium text-gray-500 mb-1">No results found</p>
  <p className="text-sm text-gray-400">Try adjusting your filters</p>
</div>
```

---

## 13. STYLEDSELECT COMPONENT

> **Source:** `src/components/common/StyledSelect.jsx`  
> **Uses:** React Portal for dropdown — always renders above overflow:hidden parents

### Props

| Prop          | Type     | Required | Default       | Description               |
| ------------- | -------- | -------- | ------------- | ------------------------- |
| `value`       | string   |          | —             | Selected value            |
| `onChange`    | function |          | —             | `(value: string) => void` |
| `options`     | array    |          | —             | `[{ value, label }]`      |
| `label`       | string   |          | —             | Label above the select    |
| `placeholder` | string   |          | `"Select..."` | Placeholder text          |
| `error`       | string   |          | —             | Error message below       |
| `disabled`    | boolean  |          | `false`       | Disables interaction      |

### Usage

```jsx
import StyledSelect from "@/components/common/StyledSelect";

<StyledSelect
  label="Stock Status"
  value={filters.status}
  onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
  options={[
    { value: "", label: "All Status" },
    { value: "In Stock", label: "In Stock" },
    { value: "Low Stock", label: "Low Stock" },
    { value: "Expired", label: "Expired" },
  ]}
  placeholder="Select status..."
  error={errors.status}
/>;
```

### Visual States

```
Default:  bg-white border-gray-200 text-gray-700
          → hover: bg-gray-50

Active:   bg-indigo-50 border-indigo-200 text-indigo-700 font-medium

Error:    border-red-500 bg-red-50

Disabled: opacity-50 cursor-not-allowed

Open:     focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500

Selected option in list:  bg-indigo-50 text-indigo-700 + Check icon (text-indigo-600)
Hovered option in list:   bg-gray-50 text-gray-700
```

### Portal Behavior

- Dropdown renders into `document.body` via `createPortal`
- Automatically opens **upward** if insufficient space below
- Closes on: outside click, scroll (outside dropdown), Escape key
- Max height: `240px` with scroll

### Build Option Arrays

```js
// Standard pattern with "All" option first
const statusOptions = [
  { value: "", label: "All Status" },
  { value: "In Stock", label: "In Stock" },
  { value: "Low Stock", label: "Low Stock" },
  { value: "Out of Stock", label: "Out of Stock" },
  { value: "Expired", label: "Expired" },
  { value: "Expiring Soon", label: "Expiring Soon" },
];

// From API data
const supplierOptions = [
  { value: "", label: `All Suppliers (${suppliers.length})` },
  ...suppliers.map((s) => ({ value: s, label: s })),
];
```

---

## 14. STYLEDDATEFILTER COMPONENT

> **Source:** `src/components/common/StyledDateFilter.jsx`  
> **Uses:** React Portal, custom calendar, auto-position above/below

### Props

| Prop      | Type     | Required | Description                            |
| --------- | -------- | -------- | -------------------------------------- |
| `label`   | string   |          | Label above the trigger button         |
| `date`    | string   |          | ISO date string `"YYYY-MM-DD"` or `""` |
| `setDate` | function |          | `(dateString: string) => void`         |

### Usage

```jsx
import StyledDateFilter from '@/components/common/StyledDateFilter';

// Controlled — store in parent state
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate]     = useState("");

<StyledDateFilter
  label="From Date"
  date={fromDate}
  setDate={setFromDate}
/>

<StyledDateFilter
  label="To Date"
  date={toDate}
  setDate={setToDate}
/>

// Clear programmatically
<button onClick={() => { setFromDate(""); setToDate(""); }}>
  Clear Dates
</button>
```

### Visual States

```
Default:  bg-white border-gray-200 text-gray-400  (shows placeholder)
Active:   bg-indigo-50 border-indigo-200 text-indigo-700 font-medium
Open:     focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
```

### Calendar Styles

```
Selected day:   bg-[#05015A] text-white shadow-md scale-105 rounded-full
Today (ring):   border border-[#05015A] text-[#05015A] font-bold rounded-full
Hover:          hover:bg-indigo-50 hover:text-[#05015A] rounded-full

Month nav:      hover:bg-gray-100 rounded-full text-gray-500
Quick "Today":  text-indigo-600 hover:text-indigo-800 font-medium text-xs
Quick "Clear":  text-gray-500 hover:text-red-600 font-medium text-xs
```

### Portal Behavior

- Dropdown: `z-[9999]`, `w-64`, `p-4`
- Opens upward if `spaceBelow < 320px`
- Closes on: outside click, scroll (non-dropdown), resize triggers reposition
- Timezone-safe: adjusts for local timezone offset

---

## 15. PAGINATION SYSTEM

> **Source:** `src/components/common/Pagination.jsx`  
> **Requires:** `TABLE_CONFIG` from `tableConfig.js`

### Props

| Prop             | Type     | Required | Description                     |
| ---------------- | -------- | -------- | ------------------------------- |
| `currentPage`    | number   |          | Current active page (1-indexed) |
| `setCurrentPage` | function |          | `(page: number) => void`        |
| `totalItems`     | number   |          | Total records count             |
| `rowsPerPage`    | number   |          | From `useDynamicRowCount()`     |

### Usage with Pagination Hook

```jsx
import Pagination from "@/components/common/Pagination";
import usePagination from "@/hooks/usePagination";

const MyTablePage = () => {
  const {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    totalItems,
    paginatedData,
  } = usePagination(filteredData); // pass already-filtered data

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={item.id} className={getRowBgClass(index)}>
                ...
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — flex-shrink-0 keeps it always visible */}
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
};
```

### Pagination Visual Styles

```
Wrapper:          flex-shrink-0 border-t border-gray-100 bg-gray-50/50

Nav buttons:      border border-gray-200 text-gray-500
                  hover:bg-gray-50 hover:border-gray-300
                  disabled:opacity-40 disabled:cursor-not-allowed
                  rounded-lg p-1.5

Active page:      bg-[#05015A] text-white shadow-md shadow-indigo-200
                  font-semibold scale-105 rounded-lg

Inactive pages:   text-gray-500 hover:bg-gray-100 hover:text-[#05015A]
                  rounded-lg

Jump (•••):       text-gray-400 hover:text-[#05015A] hover:bg-blue-50

Info text:        "Showing {start}-{end} of {total}"
                  Highlight: text-[#05015A] font-bold
                  Normal: text-gray-900 / text-gray-500
```

### Window & Jump Logic

```
Window size (pages shown): 3
Jump size (••• click):     3 pages at once
First/Last buttons:        ChevronsLeft / ChevronsRight icons
Prev/Next buttons:         ChevronLeft / ChevronRight icons
```

---

## 16. DYNAMIC ROW COUNT

> **Sources:**  
> `src/hooks/useDynamicRowCount.js`  
> `src/hooks/usePagination.js`

### Row Count Breakpoints

| Screen Height | Rows Per Page | Monitor Type            |
| ------------- | ------------- | ----------------------- |
| ≥ 1440px      | 13            | 1440p / 4K / 27"+       |
| ≥ 1080px      | 10            | 1080p Full HD           |
| ≥ 900px       | 9             | 900p / small monitors   |
| ≥ 800px       | 8             | Tablets / small laptops |
| < 800px       | 5             | Mobile / fallback       |

### Usage

```js
// Direct hook — just need the count
import useDynamicRowCount from "@/hooks/useDynamicRowCount";
const rowsPerPage = useDynamicRowCount();

// Full pagination hook — recommended
import usePagination from "@/hooks/usePagination";
const { currentPage, setCurrentPage, rowsPerPage, paginatedData, totalItems } =
  usePagination(data);
```

### usePagination Behavior

- **Auto-resets to page 1** when `data.length` changes (new search/filter results)
- **Adjusts page** when screen resize causes page count to drop
- **Memoized** — `paginatedData` only recalculates when `data`, `currentPage`, or
  `rowsPerPage` changes

### usePagination Return Values

```ts
{
  currentPage:   number,      // Current page (1-indexed)
  setCurrentPage: Function,   // Change page manually
  rowsPerPage:   number,      // Dynamic from screen height
  totalItems:    number,      // data.length
  totalPages:    number,      // Math.ceil(totalItems / rowsPerPage)
  paginatedData: Array,       // Slice of data for current page
  startIndex:    number,      // (currentPage - 1) * rowsPerPage
  endIndex:      number,      // Math.min(currentPage * rowsPerPage, totalItems)
}
```

### Modify Breakpoints

Edit `TABLE_CONFIG.rowBreakpoints` in `src/config/tableConfig.js`:

```js
rowBreakpoints: {
  1440: 13,
  1080: 10,
  900:  9,
  800:  8,
  0:    5,   // fallback / mobile minimum
},
```

---

## 17. DARK BACKGROUND (BANNER/HEADER)

### Full Page Header Recipe

```jsx
<div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-6 rounded-xl">
  {/* Title + subtitle */}
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-xl font-bold text-white">Page Title</h1>
      <p className="text-sm text-white/60 mt-1">Description subtitle</p>
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      <button
        className="px-4 py-2 bg-white/10 text-white/80 text-sm font-medium
                         rounded-lg border border-white/15
                         hover:bg-white/20 hover:text-white transition-colors"
      >
        Export
      </button>
      <button
        className="px-4 py-2 bg-white text-indigo-700 text-sm font-semibold
                         rounded-lg hover:bg-indigo-50 transition-colors"
      >
        + Add Item
      </button>
    </div>
  </div>

  {/* Stats strip */}
  <div className="grid grid-cols-4 gap-3 mt-5">
    <div className="bg-white/8 border border-white/6 rounded-xl px-4 py-3">
      <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wide">
        Total Items
      </p>
      <p className="text-2xl font-bold text-white mt-1">2,847</p>
    </div>
    {/* Low Stock stat */}
    <div className="bg-white/8 border border-white/6 rounded-xl px-4 py-3">
      <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wide">
        Low Stock
      </p>
      <p className="text-2xl font-bold text-amber-400 mt-1">23</p>
    </div>
    {/* Expired stat */}
    <div className="bg-white/8 border border-white/6 rounded-xl px-4 py-3">
      <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wide">
        Expired
      </p>
      <p className="text-2xl font-bold text-red-400 mt-1">7</p>
    </div>
    {/* In Stock stat */}
    <div className="bg-white/8 border border-white/6 rounded-xl px-4 py-3">
      <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wide">
        In Stock
      </p>
      <p className="text-2xl font-bold text-green-400 mt-1">2,817</p>
    </div>
  </div>

  {/* Tab bar */}
  <div className="flex gap-1 mt-5">
    {/* Active tab */}
    <button
      className="px-4 py-2.5 bg-white text-indigo-700 text-sm font-semibold
                       rounded-t-lg"
    >
      All Medicines
    </button>
    {/* Inactive tabs */}
    <button
      className="px-4 py-2.5 text-white/60 text-sm font-medium rounded-t-lg
                       hover:text-white hover:bg-white/10 transition-colors"
    >
      Low Stock
      <span
        className="ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold
                       bg-white/15 text-white/80"
      >
        23
      </span>
    </button>
  </div>
</div>
```

### Dark Background Color Rules

| Element                | Class                                       |
| ---------------------- | ------------------------------------------- |
| Primary text           | `text-white`                                |
| Secondary text         | `text-white/80`                             |
| Subtitle / description | `text-white/60`                             |
| Disabled / hint        | `text-white/40`                             |
| Accent icon            | `text-indigo-300`                           |
| Metric — good (green)  | `text-green-400`                            |
| Metric — warning       | `text-amber-400`                            |
| Metric — danger        | `text-red-400`                              |
| Card bg                | `bg-white/8 border border-white/6`          |
| Divider                | `border-white/10`                           |
| Active tab bg          | `bg-white`                                  |
| Inactive tab           | `text-white/60 hover:bg-white/10`           |
| Badge/count on dark    | `bg-white/15 text-white/80`                 |
| Primary btn on dark    | `bg-white text-indigo-700`                  |
| Glass btn on dark      | `bg-white/10 text-white/80 border-white/15` |

---

## 18. COMPLETE COMPONENT RECIPES

### Pharmacy Row — Full Table Cell

```jsx
// Medicine name + batch cell
<td className="px-3 py-2">
  <div className="font-medium text-gray-900 text-sm">Paracetamol 500mg</div>
  <div className="text-xs text-gray-500 mt-0.5">Batch: PCM-2024-001</div>
</td>

// Quantity cell with inline warning
<td className="px-3 py-2">
  <div className="flex items-center gap-2">
    <span className="font-medium text-gray-900">45</span>
    {quantity < 50 && (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       text-[10px] font-semibold bg-amber-100 text-amber-700">
        <AlertTriangle size={10} />
        Low
      </span>
    )}
  </div>
</td>

// Expiry date cell
<td className="px-3 py-2">
  <span className={`text-sm font-medium ${
    isExpired        ? 'text-red-600' :
    isExpiringSoon   ? 'text-amber-600' :
                       'text-gray-700'
  }`}>
    Dec 14, 2025
  </span>
</td>

// Action buttons cell
<td className="px-3 py-2">
  <div className="flex items-center justify-center gap-0.5">
    <button className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all">
      <Eye size={16} />
    </button>
    <button className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all">
      <Pencil size={16} />
    </button>
    <button className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
      <Trash2 size={16} />
    </button>
  </div>
</td>
```

### Filter Bar Pattern

```jsx
<div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {/* Search */}
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-lg text-sm
                   bg-slate-50 text-slate-700 placeholder:text-slate-400
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                   transition-all"
        placeholder="Search..."
      />
    </div>

    {/* StyledSelect */}
    <StyledSelect
      value={filters.status}
      onChange={(val) => onChange("status", val)}
      options={statusOptions}
      placeholder="All Status"
    />

    {/* StyledDateFilter */}
    <StyledDateFilter
      label=""
      date={filters.date}
      setDate={(val) => onChange("date", val)}
    />

    {/* Action button */}
    <button
      className="h-10 px-4 bg-[#05015A] text-white text-sm font-semibold
                       rounded-lg hover:bg-[#0a0280] transition-colors flex items-center gap-2"
    >
      <Plus size={16} />
      Add Item
    </button>
  </div>
</div>
```

### Toggle Switch

```jsx
// Amber — low stock toggle (matches existing InventoryFilters)
<label className="flex items-center gap-2.5 cursor-pointer group select-none">
  <div className="relative">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
    />
    <div
      className={`w-9 h-5 rounded-full transition-all duration-200
                     ${value ? "bg-amber-500" : "bg-slate-200 group-hover:bg-slate-300"}`}
    />
    <div
      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm
                     transition-all duration-200 ${value ? "translate-x-4" : ""}`}
    />
  </div>
  <span
    className={`text-sm font-medium transition-colors flex items-center gap-1.5
                    ${value ? "text-amber-600" : "text-slate-600 group-hover:text-amber-600"}`}
  >
    <AlertTriangle size={14} />
    Low Stock Only
  </span>
</label>

// Swap colors for other types:
// On/active color → bg-{color}-500 + text-{color}-600
// Examples:
// Green toggle:  bg-green-500  / text-green-600
// Red toggle:    bg-red-500    / text-red-600
// Indigo toggle: bg-indigo-600 / text-indigo-700
```

---

## 19. QUICK REFERENCE CHEAT SHEET

### 🌙 DARK BG (Banner / Header / Table Header)

```
Background:     from-[#05015A] to-[#0a0280]
h1 text:        text-white
p text:         text-white/60
icon:           text-white/70  →  hover: text-white
accent icon:    text-indigo-300
metric green:   text-green-400
metric amber:   text-amber-400
metric red:     text-red-400
card:           bg-white/8 border border-white/6
divider:        border-white/10
badge:          bg-white/15 text-white/80
btn primary:    bg-white text-indigo-700
btn secondary:  bg-white/10 text-white/80 border-white/15
tab active:     bg-white text-indigo-700
tab inactive:   text-white/60 hover:bg-white/10
count badge:    bg-white/15 text-white/80 rounded-full text-[11px] font-bold
sort icon:      active=text-yellow-300  inactive=text-white/50
```

### ☀️ LIGHT BG (Cards / Pages / Forms)

```
Page bg:        bg-slate-50  or  bg-gray-50
Card bg:        bg-white border border-slate-200 rounded-xl
h1:             text-slate-900 font-bold
h3 (card):      text-slate-800 font-semibold
body:           text-slate-700
secondary:      text-slate-500
muted:          text-slate-400
disabled:       text-slate-300
link:           text-indigo-700 hover:text-indigo-800
input default:  bg-white border-gray-200
input active:   bg-indigo-50 border-indigo-200 text-indigo-700
input focus:    ring-2 ring-indigo-500/20 border-indigo-500
btn primary:    bg-indigo-600 text-white hover:bg-indigo-700
btn secondary:  border-indigo-200 text-indigo-700 bg-white
btn ghost:      text-indigo-600 hover:bg-indigo-50
hover row:      hover:bg-indigo-50
selected row:   bg-indigo-50/80
even row:       bg-gray-50
odd row:        bg-white
```

### 🏷️ SEMANTIC BADGE FORMULA

```
{color} = green | amber | red | blue | indigo | violet | teal | orange | rose | cyan

Badge bg:       bg-{color}-100
Badge text:     text-{color}-700
Badge border:   border-{color}-200
Badge dot:      bg-{color}-500
Alert bg:       bg-{color}-50
Alert border:   border-{color}-200
Toast border:   border-l-4 border-{color}-500
```

### 🧩 COMPONENT IMPORTS

```js
import TABLE_CONFIG, {
  getRoleBadgeStyle,
  getStatusBadgeStyle,
  getVerificationStatusConfig,
  getRowBgClass,
  getClickableRowClass,
  formatDate,
} from "@/config/tableConfig";

import StyledSelect from "@/components/common/StyledSelect";
import StyledDateFilter from "@/components/common/StyledDateFilter";
import Pagination from "@/components/common/Pagination";
import usePagination from "@/hooks/usePagination";
import useDynamicRowCount from "@/hooks/useDynamicRowCount";
```

### 📐 SPACING & SHAPE

```
Border radius:
  xs:  rounded-lg   (8px)  — buttons, inputs, badges
  sm:  rounded-xl  (12px)  — cards, dropdowns, panels
  md:  rounded-2xl (16px)  — modals, large cards
  pill: rounded-full       — status dots, avatar, count badges

Shadows:
  card:       shadow-sm
  dropdown:   shadow-xl  (0 10px 40px -5px rgba(0,0,0,0.15))
  active btn: shadow-md shadow-indigo-200
  focus ring: ring-2 ring-indigo-500/20

Transitions:
  default:  transition-all duration-200
  fast:     transition-colors (150ms default)
  slow:     transition-all duration-300  — accordion/expand
```

---

_Cureli Admin Design System — keep this file open when building any UI._  
_When in doubt: indigo for brand, slate for neutral, semantic colors for status._

```

This is a comprehensive `colorGuide.md` covering every system in Cureli. Here's what's included:

| Section | Coverage |
|---|---|
| **1–4** | All color scales with hex + Tailwind + when to use |
| **5–7** | Typography hierarchy, surfaces, borders |
| **8** | Every button variant (light + dark bg + icon actions) |
| **9** | Complete badge map — stock, expiry, user, role, order, count |
| **10–11** | Alerts, toasts, all input states |
| **12** | Full `TABLE_CONFIG` reference — structure, helpers, skeleton, empty |
| **13** | `StyledSelect` — all props, usage patterns, portal behavior |
| **14** | `StyledDateFilter` — props, calendar styles, timezone note |
| **15** | `Pagination` — props, styles, window/jump logic |
| **16** | `useDynamicRowCount` + `usePagination` — breakpoints, return values |
| **17** | Dark header recipes with stats strip + tab bar |
| **18** | Copy-paste recipes for table rows, filter bars, toggles |
| **19** | One-page cheat sheet for everything |
```
