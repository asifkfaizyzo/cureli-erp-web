// cadmin-web/src/components/common/NoPermission.jsx (do not remove this comment)
// src/components/common/NoPermission.jsx

import { Lock, ShieldOff, Eye, EyeOff } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

const VARIANTS = {
  // Full centered block — for tab content areas, empty states inside modals
  block: {
    wrapper: "flex flex-col items-center justify-center py-14 px-6 text-center",
    iconBox: "w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 shadow-inner",
    iconSize: 26,
    titleClass: "text-base font-semibold text-gray-700 mb-1.5",
    descClass: "text-sm text-gray-400 max-w-xs leading-relaxed",
  },
  // Compact inline banner — for inside cards/sections
  inline: {
    wrapper: "flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl",
    iconBox: "w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0",
    iconSize: 15,
    titleClass: "text-sm font-medium text-slate-600",
    descClass: "text-xs text-slate-400 mt-0.5",
  },
  // Tiny pill — for action buttons that are hidden
  pill: {
    wrapper: "inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg",
    iconBox: "",
    iconSize: 12,
    titleClass: "text-xs font-medium text-slate-500",
    descClass: "",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ICON MAP
// ─────────────────────────────────────────────────────────────────────────────

const ICONS = {
  lock:     Lock,
  shield:   ShieldOff,
  eye:      EyeOff,
  view:     Eye,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NoPermission — reusable "you don't have access" display component.
 *
 * @param {string}  variant      - "block" | "inline" | "pill"  (default: "block")
 * @param {string}  icon         - "lock" | "shield" | "eye" | "view"  (default: "lock")
 * @param {string}  title        - Heading text
 * @param {string}  description  - Supporting text (not shown in "pill" variant)
 * @param {string}  className    - Extra classes on the wrapper
 *
 * @example
 * // Full block for tab content
 * <NoPermission
 *   variant="block"
 *   title="Access Restricted"
 *   description="You don't have permission to view activity logs."
 * />
 *
 * @example
 * // Inline banner inside a card section
 * <NoPermission
 *   variant="inline"
 *   icon="shield"
 *   title="Edit permission required"
 *   description="Contact your super admin to request access."
 * />
 *
 * @example
 * // Pill replacement for a hidden button
 * <NoPermission variant="pill" title="No access" />
 */
const NoPermission = ({
  variant     = "block",
  icon        = "lock",
  title       = "Access Restricted",
  description = "You don't have permission to perform this action.",
  className   = "",
}) => {
  const v    = VARIANTS[variant] ?? VARIANTS.block;
  const Icon = ICONS[icon]       ?? Lock;

  // ── Pill — ultra-compact, no description ─────────────────────────────────
  if (variant === "pill") {
    return (
      <div className={`${v.wrapper} ${className}`}>
        <Icon size={v.iconSize} className="text-slate-400" />
        <span className={v.titleClass}>{title}</span>
      </div>
    );
  }

  // ── Inline ────────────────────────────────────────────────────────────────
  if (variant === "inline") {
    return (
      <div className={`${v.wrapper} ${className}`}>
        <div className={v.iconBox}>
          <Icon size={v.iconSize} className="text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className={v.titleClass}>{title}</p>
          {description && <p className={v.descClass}>{description}</p>}
        </div>
      </div>
    );
  }

  // ── Block (default) ───────────────────────────────────────────────────────
  return (
    <div className={`${v.wrapper} ${className}`}>
      {/* Layered icon box with subtle glow */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200
                        flex items-center justify-center shadow-inner">
          <Icon size={v.iconSize} className="text-slate-400" />
        </div>
        {/* Small lock badge overlay */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300
                        flex items-center justify-center border-2 border-white">
          <Lock size={9} className="text-slate-600" />
        </div>
      </div>

      <h4 className={v.titleClass}>{title}</h4>
      {description && <p className={v.descClass}>{description}</p>}
    </div>
  );
};

export default NoPermission;