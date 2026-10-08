// pharmacy-web/src/pages/marketplace-reports/components/shared/MarketplaceStatCard.jsx (do not remove this comment)
// src/pages/marketplace-reports/components/shared/MarketplaceStatCard.jsx

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const COLOR_MAP = {
  indigo: {
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/[0.03]",
    text: "text-indigo-400",
    glow: "from-indigo-500/10 to-transparent",
  },
  emerald: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.03]",
    text: "text-emerald-400",
    glow: "from-emerald-500/10 to-transparent",
  },
  green: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.03]",
    text: "text-emerald-400",
    glow: "from-emerald-500/10 to-transparent",
  },
  rose: {
    border: "border-rose-500/20",
    bg: "bg-rose-500/[0.03]",
    text: "text-rose-400",
    glow: "from-rose-500/10 to-transparent",
  },
  red: {
    border: "border-rose-500/20",
    bg: "bg-rose-500/[0.03]",
    text: "text-rose-400",
    glow: "from-rose-500/10 to-transparent",
  },
  amber: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.03]",
    text: "text-amber-400",
    glow: "from-amber-500/10 to-transparent",
  },
  blue: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/[0.03]",
    text: "text-blue-400",
    glow: "from-blue-500/10 to-transparent",
  },
  purple: {
    border: "border-purple-500/20",
    bg: "bg-purple-500/[0.03]",
    text: "text-purple-400",
    glow: "from-purple-500/10 to-transparent",
  },
  cyan: {
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/[0.03]",
    text: "text-cyan-400",
    glow: "from-cyan-500/10 to-transparent",
  },
};

const MarketplaceStatCard = ({
  label,
  value,
  subValue,
  color = "indigo",
  prefix = "",
  suffix = "",
  icon: Icon,
  trend, // e.g. "+12.5%" or "-4.2%"
  trendDirection, // "up" | "down" | "neutral"
  isLoading = false,
}) => {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${c.border} ${c.bg} p-4 transition-all duration-200 hover:border-white/[0.15]`}
    >
      {/* Subtle top glow line */}
      <div
        className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${c.glow}`}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 truncate">
          {label}
        </p>
        {Icon && (
          <div className={`p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] ${c.text}`}>
            <Icon size={13} />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        {isLoading ? (
          <div className="h-6 w-24 rounded bg-white/[0.06] animate-pulse" />
        ) : (
          <p className="text-xl font-extrabold text-white tracking-tight">
            {prefix}
            {value !== undefined && value !== null ? value : "—"}
            {suffix}
          </p>
        )}

        {trend && !isLoading && (
          <div
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
              trendDirection === "up"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : trendDirection === "down"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-white/[0.05] text-white/60 border border-white/[0.08]"
            }`}
          >
            {trendDirection === "up" && <TrendingUp size={10} />}
            {trendDirection === "down" && <TrendingDown size={10} />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subValue && !isLoading && (
        <p className="text-[10px] text-white/40 mt-1 truncate">{subValue}</p>
      )}
    </div>
  );
};

export default MarketplaceStatCard;