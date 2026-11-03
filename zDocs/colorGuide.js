// zDocs/colorGuide.js (do not remove this comment)

// ═══════════════════════════════════════════════════════════════
// 🎨 BRAND COLOR GUIDE
// Base gradient: from-[#05015A] to-[#0a0280]
// ═══════════════════════════════════════════════════════════════

/*
┌─────────────────────────────────────────────────────────────────┐
│  YOUR BRAND PALETTE                                             │
│                                                                 │
│  Primary Dark:   #05015A  (deep navy)                          │
│  Primary Base:   #0a0280  (royal blue)                         │
│  Primary Mid:    #1a10a0  (medium blue — derived)              │
│  Primary Light:  #3b2fd4  (lighter blue — derived)             │
│  Primary Soft:   #6366f1  (indigo-500 — Tailwind match)        │
│                                                                 │
│  The Tailwind "indigo" scale is your closest friend.           │
│  Use it for everything that needs to "match" the gradient.     │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
  1. BANNER / HEADER (dark background)
═══════════════════════════════════════════════════════════════════

  Background:
     bg-gradient-to-r from-[#05015A] to-[#0a0280]     ← your main gradient
     bg-[#05015A]                                       ← solid fallback

  Text on dark bg:
     text-white                                         ← primary text
     text-white/80                                      ← secondary text
     text-white/60                                      ← muted / subtitle
     text-white/40                                      ← disabled / hint
     text-gray-300                                      ← too washed out
     text-black                                         ← never on dark bg

  Icons on dark bg:
     text-white/70                                      ← default icon
     text-white                                         ← active / hover icon
     text-indigo-300                                    ← accent icon


═══════════════════════════════════════════════════════════════════
  2. BUTTONS
═══════════════════════════════════════════════════════════════════

  ── Primary (solid) ──────────────────────────────────────────────
  Use on WHITE backgrounds (main CTA)

    Default:    bg-indigo-600 text-white
    Hover:      hover:bg-indigo-700
    Active:     active:bg-indigo-800
    Disabled:   disabled:bg-indigo-300 disabled:cursor-not-allowed

    Tailwind:
    className="bg-indigo-600 text-white hover:bg-indigo-700
               active:bg-indigo-800 disabled:bg-indigo-300
               disabled:cursor-not-allowed transition-colors"

  ── Primary (dark solid — matches banner exactly) ────────────────
  Use when you want the button to feel "same as header"

    Default:    bg-[#0a0280] text-white
    Hover:      hover:bg-[#05015A]
    
    OR simpler Tailwind approximation:
    Default:    bg-indigo-900 text-white
    Hover:      hover:bg-indigo-950

    Tailwind:
    className="bg-indigo-900 text-white hover:bg-indigo-950 transition-colors"

  ── Secondary (outline) ─────────────────────────────────────────
  Use for secondary actions on white bg

    Default:    border border-indigo-200 text-indigo-700 bg-white
    Hover:      hover:bg-indigo-50 hover:border-indigo-300

    Tailwind:
    className="border border-indigo-200 text-indigo-700 bg-white
               hover:bg-indigo-50 hover:border-indigo-300 transition-colors"

  ── Ghost (minimal) ─────────────────────────────────────────────
  Use for tertiary actions

    Default:    text-indigo-600 bg-transparent
    Hover:      hover:bg-indigo-50

    Tailwind:
    className="text-indigo-600 hover:bg-indigo-50 transition-colors"

  ── Soft (tinted bg) ────────────────────────────────────────────
  Use for subtle CTAs, tag-like buttons

    Default:    bg-indigo-50 text-indigo-700
    Hover:      hover:bg-indigo-100

    Tailwind:
    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"

  ── Button on DARK background (e.g. inside banner) ──────────────

    Glass style:
    Default:    bg-white/10 text-white/80
    Hover:      hover:bg-white/20 hover:text-white

    Solid white:
    Default:    bg-white text-indigo-700
    Hover:      hover:bg-indigo-50

    Tailwind (glass):
    className="bg-white/10 text-white/80 hover:bg-white/20
               hover:text-white transition-colors"

    Tailwind (solid):
    className="bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"


═══════════════════════════════════════════════════════════════════
  3. TEXT COLORS (on white/light backgrounds)
═══════════════════════════════════════════════════════════════════

    Heading:        text-gray-900          ← page titles, card titles
    Body:           text-gray-700          ← paragraph text
    Secondary:      text-gray-500          ← descriptions, helpers
    Muted:          text-gray-400          ← timestamps, hints
    Disabled:       text-gray-300          ← disabled inputs

    Brand accent:   text-indigo-700        ← links, active states
    Brand light:    text-indigo-500        ← secondary brand text
    Brand muted:    text-indigo-400        ← subtle brand hints


═══════════════════════════════════════════════════════════════════
  4. BACKGROUNDS
═══════════════════════════════════════════════════════════════════

    Page bg:        bg-gray-50  or  bg-slate-50
    Card bg:        bg-white
    Hover row:      hover:bg-indigo-50/40
    Selected row:   bg-indigo-50/80
    Brand tint:     bg-indigo-50           ← light brand wash
    Brand accent:   bg-indigo-100          ← slightly stronger

    Active tab:     bg-white               ← on dark banner
    Hover tab:      bg-white/10            ← on dark banner


═══════════════════════════════════════════════════════════════════
  5. BORDERS
═══════════════════════════════════════════════════════════════════

    Default:        border-gray-200
    Subtle:         border-gray-100
    Focus ring:     ring-2 ring-indigo-500/20 border-indigo-500
    Brand:          border-indigo-200
    Brand strong:   border-indigo-500
    Selected:       ring-2 ring-indigo-200 border-indigo-500


═══════════════════════════════════════════════════════════════════
  6. STATUS BADGES (semantic — pair with brand)
═══════════════════════════════════════════════════════════════════

    Success:    bg-green-100  text-green-700   border-green-200
    Warning:    bg-amber-100  text-amber-700   border-amber-200
    Error:      bg-red-100    text-red-700     border-red-200
    Info:       bg-blue-100   text-blue-700    border-blue-200
    Brand:      bg-indigo-100 text-indigo-700  border-indigo-200
    Neutral:    bg-gray-100   text-gray-600    border-gray-200


═══════════════════════════════════════════════════════════════════
  7. COMPLETE COMPONENT EXAMPLES
═══════════════════════════════════════════════════════════════════
*/

// ── Example: Page header with actions ──
export const PageHeaderExample = `
<div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-5 rounded-xl">
  <h1 className="text-xl font-bold text-white">Page Title</h1>
  <p className="text-sm text-white/60 mt-1">Subtitle description</p>
  
  <div className="flex gap-2 mt-4">
    {/* Primary CTA on dark bg — solid white */}
    <button className="px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold
                       hover:bg-indigo-50 transition-colors">
      Primary Action
    </button>
    
    {/* Secondary on dark bg — glass */}
    <button className="px-4 py-2 bg-white/10 text-white/80 rounded-lg text-sm font-medium
                       hover:bg-white/20 hover:text-white transition-colors">
      Secondary
    </button>
  </div>
</div>
`;

// ── Example: Card with brand accent ──
export const CardExample = `
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  {/* Brand accent strip */}
  <div className="h-1 bg-gradient-to-r from-[#05015A] to-[#0a0280]" />
  
  <div className="p-5">
    <h3 className="text-base font-semibold text-gray-900">Card Title</h3>
    <p className="text-sm text-gray-500 mt-1">Description text</p>
    
    <div className="flex gap-2 mt-4">
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold
                         hover:bg-indigo-700 transition-colors">
        Save
      </button>
      <button className="px-4 py-2 border border-indigo-200 text-indigo-700 rounded-lg text-sm
                         hover:bg-indigo-50 transition-colors">
        Cancel
      </button>
    </div>
  </div>
</div>
`;

// ── Example: Tab bar on dark bg ──
export const TabBarExample = `
<div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-4 pb-0 pt-4 rounded-t-xl">
  <div className="flex gap-1">
    {/* Active tab */}
    <button className="px-4 py-2.5 bg-white text-indigo-700 text-sm font-medium rounded-t-lg">
      Active Tab
    </button>
    
    {/* Inactive tab */}
    <button className="px-4 py-2.5 text-white/60 text-sm font-medium rounded-t-lg
                       hover:text-white hover:bg-white/10 transition-colors">
      Other Tab
      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold
                       bg-white/15 text-white/80">
        5
      </span>
    </button>
  </div>
</div>
`;

// ── Quick-reference Tailwind class map ──
export const BRAND_COLORS = {
  // Gradient
  gradient: "bg-gradient-to-r from-[#05015A] to-[#0a0280]",
  gradientSubtle: "bg-gradient-to-r from-indigo-600 to-indigo-700",

  // Solid backgrounds
  bgDark: "bg-[#05015A]",
  bgMedium: "bg-indigo-900",
  bgBase: "bg-indigo-600",
  bgLight: "bg-indigo-50",
  bgLighter: "bg-indigo-50/50",

  // Text
  textOnDark: "text-white",
  textOnDarkMuted: "text-white/60",
  textOnDarkDisabled: "text-white/40",
  textBrand: "text-indigo-700",
  textBrandLight: "text-indigo-500",
  textBrandMuted: "text-indigo-400",

  // Buttons
  btnPrimary:
    "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800",
  btnPrimaryDark: "bg-indigo-900 text-white hover:bg-indigo-950",
  btnSecondary:
    "border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50",
  btnGhost: "text-indigo-600 hover:bg-indigo-50",
  btnSoft: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  btnGlass: "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white",
  btnWhite: "bg-white text-indigo-700 hover:bg-indigo-50",

  // Borders
  borderDefault: "border-gray-200",
  borderBrand: "border-indigo-200",
  borderFocus: "ring-2 ring-indigo-500/20 border-indigo-500",

  // Focus ring for inputs
  inputFocus: "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
};

/*
═══════════════════════════════════════════════════════════════════
  CHEAT SHEET — Print this out
═══════════════════════════════════════════════════════════════════

  DARK BG (banner/header):
  ┌──────────────────────────────────────────────────┐
  │  bg: from-[#05015A] to-[#0a0280]                │
  │  h1: text-white                                  │
  │  p:  text-white/60                               │
  │  icon: text-white/70  →  hover: text-white       │
  │  btn primary: bg-white text-indigo-700           │
  │  btn secondary: bg-white/10 text-white/80        │
  │  tab active: bg-white text-indigo-700            │
  │  tab inactive: text-white/60                     │
  │  badge: bg-white/15 text-white/80                │
  │  divider: border-white/10                        │
  └──────────────────────────────────────────────────┘

  LIGHT BG (cards/pages):
  ┌──────────────────────────────────────────────────┐
  │  bg: bg-white  or  bg-gray-50                    │
  │  h1: text-gray-900                               │
  │  p:  text-gray-700                               │
  │  muted: text-gray-500                            │
  │  btn primary: bg-indigo-600 text-white           │
  │  btn secondary: border-indigo-200 text-indigo-700│
  │  btn ghost: text-indigo-600 hover:bg-indigo-50   │
  │  link: text-indigo-600 hover:text-indigo-800     │
  │  badge brand: bg-indigo-100 text-indigo-700      │
  │  selected: bg-indigo-50/80                       │
  │  hover row: hover:bg-indigo-50/40                │
  │  focus: ring-indigo-500/20 border-indigo-500     │
  └──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
*/
